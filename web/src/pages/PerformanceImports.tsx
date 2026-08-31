import { TopNav } from '../components/TopNav';
import { card, page, pageTitle } from '../styles';

export function PerformanceImports() {
  return (
    <div>
      <TopNav />
      <div style={page} className="fade-up">
        <h1 style={pageTitle}>Performance Imports</h1>
        <div style={card}>Performance Imports - Upload account export reports (CSV) here. Coming soon.</div>
      </div>
    </div>
  );
}
