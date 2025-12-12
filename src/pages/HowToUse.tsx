export const HowToUse = () => {
  return (
    <div className="page">
      <h1>How to use</h1>
      <ol className="steps">
        <li>
          <strong>Add your product name</strong> — what the buyer would search for.
        </li>
        <li>
          <strong>Paste product details</strong> — materials, size, personalization, shipping notes.
        </li>
        <li>
          <strong>Enter SEO keywords</strong> — comma-separated phrases you want included naturally.
        </li>
        <li>
          <strong>Generate markdown</strong> — copy the output into Etsy and tweak tone/length.
        </li>
      </ol>
      <div className="callout">
        Tip: keep keywords specific (e.g. “personalized canvas tote bag”) rather than single words.
      </div>
    </div>
  );
};


