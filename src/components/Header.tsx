import { NavLink } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="app-header">
      <div className="container header-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div className="brand-copy">
            <div className="brand-title">Etsy Description Writer</div>
            <div className="brand-subtitle">Minimal SEO markdown generator</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/">
            Generator
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/how-to-use">
            How to use
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/about">
            About
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/terms">
            Terms
          </NavLink>
        </nav>
      </div>
    </header>
  );
};


