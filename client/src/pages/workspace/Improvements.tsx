import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { generateImprovements2 as generateImprovements } from '../../api/ai';

interface Suggestions {
  security?: string[];
  performance?: string[];
  code_quality?: string[];
  missing_features?: string[];
  deployment?: string[];
}

const SECTION_COLORS: Record<string, string> = {
  security: '#fef2f2',
  performance: '#f0fdf4',
  code_quality: '#eff6ff',
  missing_features: '#fefce8',
  deployment: '#f8fafc'
};

const SECTION_LABELS: Record<string, string> = {
  security: '🔒 Security',
  performance: '⚡ Performance',
  code_quality: '✦ Code Quality',
  missing_features: '◎ Missing Features',
  deployment: '☁ Deployment'
};

export default function Improvements() {
  const { projectId } = useParams<{ projectId: string }>();
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const r = await generateImprovements(projectId!);
      setSuggestions(r.suggestions);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>AI Improvements</h2>
        <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Analyzing...' : '⚡ Analyze project'}
        </button>
      </div>
      <div className="page-content">
        {!suggestions && !loading && (
          <div className="empty-state">
            <p>Click Analyze to get AI-powered improvement suggestions</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>Covers security, performance, code quality, missing features, and deployment</p>
          </div>
        )}
        {loading && <div className="loading">Analyzing your project... this may take 20-30 seconds</div>}
        {suggestions && Object.entries(suggestions).map(([key, items]) => (
          Array.isArray(items) && items.length > 0 && (
            <div key={key} className="card mb-4" style={{ background: SECTION_COLORS[key] || 'white' }}>
              <div className="card-header">
                <span className="card-title">{SECTION_LABELS[key] || key}</span>
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 10 }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>→</span>
                  <p style={{ fontSize: 13, lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          )
        ))}
      </div>
    </div>
  );
}
