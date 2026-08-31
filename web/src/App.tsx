import { HashRouter, Route, Routes } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Architect } from './pages/Architect';
import { Research } from './pages/Research';
import { Benchmarks } from './pages/Benchmarks';
import { BulkGenerate } from './pages/BulkGenerate';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/architect" element={<Architect />} />
        <Route path="/architect/:id" element={<Architect />} />
        <Route path="/research" element={<Research />} />
        <Route path="/benchmarks" element={<Benchmarks />} />
        <Route path="/bulk-generate" element={<BulkGenerate />} />
      </Routes>
    </HashRouter>
  );
}
