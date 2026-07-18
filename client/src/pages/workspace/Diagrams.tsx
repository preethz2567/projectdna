import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { generateDiagram, getDiagrams } from '../../api/ai';
import MermaidDiagram from '../../components/MermaidDiagram';

const DIAGRAM_TYPES = [
  { key: 'architecture', label: 'System Architecture', desc: 'How all components connect' },
  { key: 'database', label: 'Database Schema', desc: 'Tables and relationships (ER diagram)' },
  { key: 'flow', label: 'Request Flow', desc: 'How a request moves through the system' },
  { key: 'sequence', label: 'Sequence Diagram', desc: 'API interaction sequence' },
];

export default function Diagrams() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeType, setActiveType] = useState('architecture');
  const [diagrams, setDiagrams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawCode, setRawCode] = useState(false);

  useEffect(() => {
    if (projectId) {
      getDiagrams(projectId).then((data: any[]) => {
        const diagMap: Record<string, string> = {};
        data.forEach(d => { diagMap[d.diagram_type] = d.code; });
        setDiagrams(diagMap);
      });
    }
  }, [projectId]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const r = await generateDiagram(projectId!, activeType);
      setDiagrams(prev => ({ ...prev, [activeType]: r.diagram }));
    } catch (err: any) {
      setError(err.message || 'Sorry! Diagram could not be generated. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function downloadSVG() {
    const svg = document.querySelector('#diagram-container svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeType}-diagram.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function downloadPNG() {
    const svg = document.querySelector('#diagram-container svg') as SVGGraphicsElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const svgSize = svg.getBoundingClientRect();
    // increase resolution for better export
    const scale = 2;
    canvas.width = svgSize.width * scale;
    canvas.height = svgSize.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0, svgSize.width, svgSize.height);
      const pngData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngData;
      link.download = `${activeType}-diagram.png`;
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }

  const currentDiagram = diagrams[activeType];

  return (
    <div>
      <div className="page-header">
        <h2>Diagrams</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {currentDiagram && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setRawCode(!rawCode)}>
                {rawCode ? 'View diagram' : 'View code'}
              </button>
              {!rawCode && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={downloadSVG}>
                    Download SVG
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={downloadPNG}>
                    Download PNG
                  </button>
                </>
              )}
            </>
          )}
          <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : `Generate ${DIAGRAM_TYPES.find(d => d.key === activeType)?.label}`}
          </button>
        </div>
      </div>
      <div className="page-content">
        {/* Diagram type selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
          {DIAGRAM_TYPES.map(dt => (
            <div key={dt.key}
              onClick={() => setActiveType(dt.key)}
              style={{
                padding: '12px', border: `1px solid ${activeType === dt.key ? 'var(--accent)' : 'var(--border)'}`,
                background: activeType === dt.key ? '#eff6ff' : 'white',
                cursor: 'pointer', transition: 'all 0.1s'
              }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: activeType === dt.key ? 'var(--accent)' : 'var(--text)' }}>
                {dt.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{dt.desc}</div>
              {diagrams[dt.key] && <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 4 }}>✓ Generated</div>}
            </div>
          ))}
        </div>

        {loading && <div className="loading">Generating diagram... the AI is analyzing your project structure</div>}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px 20px', borderRadius: 8, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <div>
              <div style={{ fontWeight: 600, color: '#991b1b', fontSize: 15, marginBottom: 4 }}>Sorry! Diagram couldn't be generated</div>
              <div style={{ color: '#b91c1c', fontSize: 14 }}>{error}</div>
            </div>
          </div>
        )}

        {currentDiagram && !loading && (
          <div className="card">
            {rawCode ? (
              <pre style={{ fontFamily: 'var(--mono)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {currentDiagram}
              </pre>
            ) : (
              <MermaidDiagram code={currentDiagram} />
            )}
          </div>
        )}

        {!currentDiagram && !loading && (
          <div className="empty-state">
            <p>No {DIAGRAM_TYPES.find(d => d.key === activeType)?.label} generated yet</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>Click Generate to create it from your repository</p>
          </div>
        )}
      </div>
    </div>
  );
}
