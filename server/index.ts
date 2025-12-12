import express from 'express';
import { config } from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { z, ZodError } from 'zod';

config();

const app = express();
app.use(express.json({ limit: '1mb' }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PORT = Number(process.env.API_PORT) || 4000;
const MODEL = 'tngtech/deepseek-r1t2-chimera:free';
const MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS) || 900;

if (!OPENROUTER_API_KEY) {
  console.warn(
    'OPENROUTER_API_KEY is missing. Add it to your .env file to enable description generation.'
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const dataFile = path.join(dataDir, 'products.json');

type ProductRecord = {
  id: string;
  productName: string;
  productDetails: string;
  keywords: string;
  description: string;
  model: string;
  createdAt: string;
};

const productSchema = z.object({
  productName: z.string().min(3, 'Name is required'),
  productDetails: z.string().min(10, 'Details must be at least 10 characters'),
  keywords: z.string().min(3, 'Provide at least one keyword'),
});

const formatKeywords = (value: string) =>
  value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .join(', ');

const ensureDataFile = async () => {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify([], null, 2), 'utf-8');
  }
};

const readProducts = async (): Promise<ProductRecord[]> => {
  await ensureDataFile();
  const file = await fs.readFile(dataFile, 'utf-8');
  return JSON.parse(file) as ProductRecord[];
};

const writeProducts = async (records: ProductRecord[]) => {
  await ensureDataFile();
  await fs.writeFile(dataFile, JSON.stringify(records, null, 2), 'utf-8');
};

const needsContinuation = (text: string) => {
  const trimmed = text.trim();
  if (trimmed.length < 240) return false;
  const last = trimmed.at(-1) ?? '';
  const goodEndings = new Set(['.', '!', '?', '"', '”', ')', ']', '`', '*']);
  if (goodEndings.has(last)) return false;
  // markdown lists often end with punctuation; if we end with a bare dash or colon it's likely cut off
  if (last === '-' || last === ':' || last === ',') return true;
  return true;
};

const openRouterChat = async (payload: unknown) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/example/etsy-description-writer',
      'X-Title': 'Etsy Description Writer',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter error: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('OpenRouter returned an empty description');
  return content;
};

const callOpenRouter = async (productName: string, productDetails: string, keywords: string) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const prompt = `You write Etsy product descriptions that are punchy, conversational, and keyword rich.\n` +
    `The user will provide a product name, optional details, and SEO keywords.\n` +
    `Return a markdown description that:\n` +
    `- Starts with a compelling hook in bold\n` +
    `- Includes 3 short bullet lists (benefits, materials, perfect for)\n` +
    `- Naturally weaves in the provided keywords without stuffing\n` +
    `- Ends with a short CTA inviting the reader to add to cart\n` +
    `Important: Always finish the description and end on a complete sentence.\n` +
    `Only respond with markdown.`;

  const userMessage = `Product Name: ${productName}\n` +
    `Product Details: ${productDetails}\n` +
    `Target Keywords: ${keywords}`;

  const baseMessages = [
    { role: 'system', content: prompt },
    { role: 'user', content: userMessage },
  ] as const;

  let description = await openRouterChat({
    model: MODEL,
    messages: baseMessages,
    temperature: 0.7,
    max_tokens: MAX_TOKENS,
  });

  // If the model got cut off (common with small token limits), ask it to continue.
  for (let i = 0; i < 2; i += 1) {
    if (!needsContinuation(description)) break;
    const continuation = await openRouterChat({
      model: MODEL,
      messages: [
        ...baseMessages,
        { role: 'assistant', content: description },
        {
          role: 'user',
          content: 'Continue exactly where you left off. Do not repeat. Finish the markdown with a short CTA and a complete sentence.',
        },
      ],
      temperature: 0.7,
      max_tokens: Math.max(300, Math.floor(MAX_TOKENS / 2)),
    });
    description = `${description}\n${continuation}`.trim();
  }

  return description;
};

app.get('/api/descriptions', async (_req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to read stored descriptions' });
  }
});

app.post('/api/descriptions', async (req, res) => {
  try {
    const validated = productSchema.parse(req.body);
    const cleaned = {
      productName: validated.productName.trim(),
      productDetails: validated.productDetails.trim(),
      keywords: formatKeywords(validated.keywords),
    };
    const description = await callOpenRouter(
      cleaned.productName,
      cleaned.productDetails,
      cleaned.keywords
    );

    const newRecord: ProductRecord = {
      id: randomUUID(),
      ...cleaned,
      description,
      createdAt: new Date().toISOString(),
      model: MODEL,
    };

    const products = await readProducts();
    products.unshift(newRecord);
    await writeProducts(products.slice(0, 50));

    res.json(newRecord);
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => issue.message).join(', ');
      return res.status(400).json({ message: issues });
    }
    res.status(500).json({ message: (error as Error).message });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

