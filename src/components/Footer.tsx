export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container footer-inner">
        <div className="footer-left">
          <span className="footer-dot" aria-hidden="true" />
          <span>Saved locally to</span>
          <code>data/products.json</code>
        </div>
        <div className="footer-right">
          <span>© {new Date().getFullYear()} Etsy Description Writer</span>
        </div>
      </div>
    </footer>
  );
};


