import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';

type DescriptionRecord = {
  id: string;
  productName: string;
  productDetails: string;
  keywords: string;
  description: string;
  createdAt: string;
  model: string;
};

const apiBase = import.meta.env.VITE_API_BASE ?? '';

export const Home = () => {
  const [formData, setFormData] = useState({
    productName: '',
    productDetails: '',
    keywords: '',
  });
  const [history, setHistory] = useState<DescriptionRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const [historySelectedId, setHistorySelectedId] = useState<string | null>(null);

  const isReadyToSubmit = useMemo(() => {
    return (
      formData.productName.trim().length >= 3 &&
      formData.productDetails.trim().length >= 10 &&
      formData.keywords.trim().length >= 3
    );
  }, [formData]);

  const selected = useMemo(() => {
    if (selectedId) return history.find((item) => item.id === selectedId) ?? null;
    return history[0] ?? null;
  }, [history, selectedId]);

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter((item) => {
      const haystack = `${item.productName} ${item.keywords}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [history, historyQuery]);

  const historySelected = useMemo(() => {
    const id = historySelectedId ?? selected?.id ?? null;
    if (!id) return null;
    return history.find((item) => item.id === id) ?? null;
  }, [history, historySelectedId, selected]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`${apiBase}/api/descriptions`);
        if (!response.ok) throw new Error('Unable to fetch history');
        const payload = (await response.json()) as DescriptionRecord[];
        setHistory(payload);
        setSelectedId(payload[0]?.id ?? null);
        setHistorySelectedId(payload[0]?.id ?? null);
      } catch (error) {
        console.warn((error as Error).message);
      } finally {
        setHistoryLoaded(true);
      }
    };

    loadHistory();
  }, []);

  const handleChange =
    (field: keyof typeof formData) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [field]: event.target.value }));
      };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isReadyToSubmit) {
      setStatus({ loading: false, error: 'Please fill all fields.' });
      return;
    }

    setStatus({ loading: true, error: null });

    try {
      const response = await fetch(`${apiBase}/api/descriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        const message = typeof detail.message === 'string' ? detail.message : 'Unable to generate description';
        throw new Error(message);
      }

      const payload = (await response.json()) as DescriptionRecord;
      setHistory((prev) => [payload, ...prev]);
      setSelectedId(payload.id);
    } catch (error) {
      setStatus({ loading: false, error: (error as Error).message });
      return;
    }

    setStatus({ loading: false, error: null });
  };

  const copyMarkdown = async () => {
    if (!selected?.description) return;
    try {
      await navigator.clipboard.writeText(selected.description);
      setStatus({ loading: false, error: null });
    } catch {
      setStatus({ loading: false, error: 'Copy failed. Select text manually.' });
    }
  };

  const copyHistoryMarkdown = async () => {
    if (!historySelected?.description) return;
    try {
      await navigator.clipboard.writeText(historySelected.description);
      setStatus({ loading: false, error: null });
    } catch {
      setStatus({ loading: false, error: 'Copy failed. Select text manually.' });
    }
  };

  const openHistory = () => {
    setHistoryOpen(true);
    if (!historySelectedId && selected?.id) setHistorySelectedId(selected.id);
  };

  const closeHistory = () => {
    setHistoryOpen(false);
  };

  return (
    <div className="generator">
      <div className="hero-compact">
        <div>
          <h1>Product description generator</h1>
          <p className="muted">Clean markdown, subtle SEO, saved to JSON.</p>
        </div>
        <div className="hero-pills">
          <span className="pill">
            <span className="pill-label">Saved</span>
            <strong>{history.length}</strong>
          </span>
          <span className="pill">
            <span className="pill-label">Model</span>
            <strong>{selected?.model?.includes('/') ? selected.model.split('/')[1] : selected?.model ?? 'openrouter'}</strong>
          </span>
        </div>
      </div>

      <div className="content-grid">
        <section className="surface form-card">
          <div className="section-head">
            <h2>Inputs</h2>
            <span className={`chip ${status.error ? 'chip-error' : ''}`}>
              {status.loading ? 'Generating…' : status.error ? status.error : 'Ready'}
            </span>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="productName">Product name</label>
              <input
                id="productName"
                name="productName"
                placeholder="Custom boat tote bag"
                value={formData.productName}
                onChange={handleChange('productName')}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="productDetails">Details</label>
              <textarea
                id="productDetails"
                name="productDetails"
                placeholder="Materials, size, personalization, shipping notes…"
                value={formData.productDetails}
                onChange={handleChange('productDetails')}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="keywords">SEO keywords</label>
              <input
                id="keywords"
                name="keywords"
                placeholder="personalized tote, embroidered bag, beach gift"
                value={formData.keywords}
                onChange={handleChange('keywords')}
                required
              />
              <small>Comma-separated keywords work best.</small>
            </div>

            <div className="actions sticky-actions">
              <button type="submit" disabled={!isReadyToSubmit || status.loading}>
                {status.loading ? 'Generating…' : 'Generate'}
              </button>
              <div className="actions-row">
                <button
                  className="secondary"
                  type="button"
                  disabled={!selected?.description}
                  onClick={copyMarkdown}
                >
                  Copy markdown
                </button>
                <span className="hint">Saved automatically.</span>
              </div>
            </div>
          </form>
        </section>

        <section className="surface preview-card">
          <div className="section-head">
            <h2>Output</h2>
            <div className="section-actions">
              <button type="button" className="secondary small" onClick={openHistory} disabled={!historyLoaded}>
                Browse history
              </button>
              <div className="timestamp">
                {selected?.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}
              </div>
            </div>
          </div>

          <div className="preview-shell">
            {selected ? (
              <div className="markdown">
                <ReactMarkdown>{selected.description}</ReactMarkdown>
              </div>
            ) : (
              <div className="empty-state">
                <p>Generate a description to see the markdown here.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {historyOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Browse history">
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">Saved descriptions</div>
                <div className="muted">Search by product name or keywords</div>
              </div>
              <button type="button" className="secondary small" onClick={closeHistory}>
                Close
              </button>
            </div>

            <div className="modal-toolbar">
              <input
                className="modal-search"
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder="Search…"
                autoFocus
              />
              <span className="muted">{history.length ? `${filteredHistory.length} results` : ''}</span>
            </div>

            <div className="modal-body">
              <div className="modal-list">
                {!historyLoaded && <p className="muted">Loading…</p>}
                {historyLoaded && history.length === 0 && <p className="muted">No saved descriptions yet.</p>}
                {historyLoaded && filteredHistory.length === 0 && history.length > 0 && (
                  <p className="muted">No matches.</p>
                )}
                {filteredHistory.length > 0 && (
                  <ul className="history-list">
                    {filteredHistory.slice(0, 200).map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          className={`history-item ${entry.id === historySelected?.id ? 'active' : ''}`}
                          onClick={() => setHistorySelectedId(entry.id)}
                        >
                          <span className="history-title">{entry.productName}</span>
                          <span className="history-keywords">{entry.keywords}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="modal-preview">
                {historySelected ? (
                  <>
                    <div className="modal-preview-head">
                      <div>
                        <div className="modal-preview-title">{historySelected.productName}</div>
                        <div className="muted">{new Date(historySelected.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="modal-preview-actions">
                        <button
                          type="button"
                          className="secondary small"
                          onClick={() => {
                            setSelectedId(historySelected.id);
                            setHistoryOpen(false);
                          }}
                        >
                          Open in output
                        </button>
                        <button type="button" className="primary small" onClick={copyHistoryMarkdown}>
                          Copy markdown
                        </button>
                      </div>
                    </div>
                    <div className="preview-shell modal-preview-shell">
                      <div className="markdown">
                        <ReactMarkdown>{historySelected.description}</ReactMarkdown>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="muted">Select a saved item to preview.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


