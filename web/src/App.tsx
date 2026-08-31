import { HashRouter, Route, Routes } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Architect } from './pages/Architect';
import { Research } from './pages/Research';
import { Benchmarks } from './pages/Benchmarks';
import { BulkGenerate } from './pages/BulkGenerate';
import { Competitors } from './pages/Competitors';
import { Compliance } from './pages/Compliance';
import { Reports } from './pages/Reports';
import { PerformanceImports } from './pages/PerformanceImports';
import { Settings } from './pages/Settings';

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
        <Route path="/competitors" element={<Competitors />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/imports" element={<PerformanceImports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
}
