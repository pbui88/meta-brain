import { HashRouter, Route, Routes } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Architect } from './pages/Architect';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/architect" element={<Architect />} />
        <Route path="/architect/:id" element={<Architect />} />
      </Routes>
    </HashRouter>
  );
}
