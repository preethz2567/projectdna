import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { generateDeck } from '../../api/ai';

interface Slide {
  title: string;
  content: string;
  notes: string;
  type: string;
}

export default function Deck() {
  const { projectId } = useParams<{ projectId: string }>();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [deckType, setDeckType] = useState('technical');
  const [loading, setLoading] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setCurrentSlide(0);
    try {
      const r = await generateDeck(projectId!, deckType);
      setSlides(r.slides || []);
    } finally {
      setLoading(false);
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!presenting) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') setCurrentSlide(s => Math.min(s + 1, slides.length - 1));
      if (e.key === 'ArrowLeft') setCurrentSlide(s => Math.max(s - 1, 0));
      if (e.key === 'Escape') setPresenting(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [presenting, slides.length]);

  if (presenting && slides.length > 0) {
    const slide = slides[currentSlide];
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0a0a0a', color: 'white',
        display: 'flex', flexDirection: 'column', zIndex: 1000,
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Slide content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 6rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem', lineHeight: 1.2 }}>
            {slide.title}
          </h1>
          <div style={{ fontSize: '1.15rem', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
            {slide.content?.split('\n').map((line, i) => (
              <div key={i} style={{ marginBottom: 4, paddingLeft: line.startsWith('•') ? 8 : 0 }}>
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Speaker notes */}
        {showNotes && slide.notes && (
          <div style={{ background: '#1a1a2e', padding: '1rem 6rem', borderTop: '1px solid #333', fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#60a5fa' }}>Notes: </strong>{slide.notes}
          </div>
        )}

        {/* Controls */}
        <div style={{ padding: '1rem 6rem', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setCurrentSlide(s => Math.max(s - 1, 0))}
              style={{ background: '#222', color: 'white', border: 'none', padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
              ← Prev
            </button>
            <button onClick={() => setCurrentSlide(s => Math.min(s + 1, slides.length - 1))}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
              Next →
            </button>
          </div>
          <div style={{ color: '#666', fontSize: 13 }}>
            {currentSlide + 1} / {slides.length}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowNotes(!showNotes)}
              style={{ background: '#222', color: 'white', border: 'none', padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
              {showNotes ? 'Hide notes' : 'Show notes'}
            </button>
            <button onClick={() => setPresenting(false)}
              style={{ background: '#333', color: 'white', border: 'none', padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
              Exit (Esc)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Presentation Deck</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="form-input" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
            value={deckType} onChange={e => setDeckType(e.target.value)}>
            <option value="technical">Technical (for engineers)</option>
            <option value="demo">Demo (for judges/clients)</option>
            <option value="interview">Interview/Viva</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : '⚡ Generate deck'}
          </button>
          {slides.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => setPresenting(true)}>
              ▶ Present
            </button>
          )}
        </div>
      </div>
      <div className="page-content">
        {loading && <div className="loading">Generating your presentation deck...</div>}

        {slides.length > 0 && !loading && (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
              {slides.length} slides · Click ▶ Present for full-screen mode · Use arrow keys to navigate
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {slides.map((slide, i) => (
                <div key={i}
                  onClick={() => { setCurrentSlide(i); setPresenting(true); }}
                  className="card"
                  style={{ cursor: 'pointer', minHeight: 140 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>SLIDE {i + 1}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{slide.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {slide.content?.slice(0, 80)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {slides.length === 0 && !loading && (
          <div className="empty-state">
            <p>Generate a presentation deck from your project</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>Choose the type based on your audience, then present in full-screen mode</p>
          </div>
        )}
      </div>
    </div>
  );
}
