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
  security: '#ef4444',
  performance: '#10b981',
  code_quality: '#2563eb',
  missing_features: '#f59e0b',
  deployment: '#9333ea'
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
      <div className="page-header" style={{ padding: '32px 48px', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
          <span>Workspace</span>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>AI Improvements</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Analyzing...' : '⚡ Analyze project'}
        </button>
      </div>
      <div className="page-content" style={{ paddingTop: 0 }}>
        {!suggestions && !loading && (
          <div className="empty-state">
            <p>Click Analyze to get AI-powered improvement suggestions</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>Covers security, performance, code quality, missing features, and deployment</p>
          </div>
        )}
        {loading && <div className="loading">Analyzing your project... this may take 20-30 seconds</div>}
        {suggestions && Object.entries(suggestions).map(([key, items]) => (
          Array.isArray(items) && items.length > 0 && (
            <div key={key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${SECTION_COLORS[key] || 'var(--border)'}`, padding: '24px', marginBottom: '24px' }}>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{SECTION_LABELS[key] || key}</span>
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 12 }}>
                  <span style={{ color: SECTION_COLORS[key] || 'var(--accent)', flexShrink: 0, marginTop: 2 }}>→</span>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          )
        ))}
      </div>
    </div>
  );
}
