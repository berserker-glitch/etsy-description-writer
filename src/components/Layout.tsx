import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export const Layout = () => {
  return (
    <div className="app-frame">
      <Header />
      <div className="app-canvas">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};


