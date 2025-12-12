import './App.css';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { HowToUse } from './pages/HowToUse';
import { About } from './pages/About';
import { Terms } from './pages/Terms';

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/how-to-use" element={<HowToUse />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
      </Route>
    </Routes>
  );
};

export default App;
