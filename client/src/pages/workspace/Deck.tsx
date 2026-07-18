import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { generateDeck } from '../../api/ai';

interface Slide {
  title: string;
  subtitle?: string | null;
  bullets: string[];
  type: 'title' | 'content' | 'code' | 'split';
  theme: 'navy' | 'purple' | 'teal' | 'dark' | 'light' | 'accent';
  code_snippet?: string | null;
  code_language?: string | null;
  notes?: string;
}

// ── Theme definitions ────────────────────────────────────────────────────
const THEMES: Record<string, { bg: string; text: string; accent: string; card: string; border: string }> = {
  navy:   { bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', text: '#f8fafc', accent: '#60a5fa', card: 'rgba(255,255,255,0.06)', border: 'rgba(96,165,250,0.3)' },
  purple: { bg: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)', text: '#f8fafc', accent: '#a78bfa', card: 'rgba(255,255,255,0.06)', border: 'rgba(167,139,250,0.3)' },
  teal:   { bg: 'linear-gradient(135deg, #0d2937 0%, #065f46 100%)', text: '#f8fafc', accent: '#34d399', card: 'rgba(255,255,255,0.06)', border: 'rgba(52,211,153,0.3)' },
  dark:   { bg: '#0a0a0a', text: '#e2e8f0', accent: '#38bdf8', card: 'rgba(255,255,255,0.04)', border: 'rgba(56,189,248,0.2)' },
  light:  { bg: '#ffffff', text: '#0f172a', accent: '#2563eb', card: '#f8fafc', border: '#e2e8f0' },
  accent: { bg: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)', text: '#ffffff', accent: '#fbbf24', card: 'rgba(255,255,255,0.12)', border: 'rgba(251,191,36,0.4)' },
};

// ── Bullet icon ──────────────────────────────────────────────────────────
function BulletIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 3 }}>
      <circle cx="8" cy="8" r="6" fill={color} opacity={0.25} />
      <circle cx="8" cy="8" r="3" fill={color} />
    </svg>
  );
}

// ── Single slide renderer ────────────────────────────────────────────────
function SlideView({ slide, isThumb = false }: { slide: Slide; isThumb?: boolean }) {
  const t = THEMES[slide.theme] || THEMES.navy;
  const scale = isThumb ? 0.28 : 1;
  const w = 960, h = 540;

  return (
    <div style={{
      width: w, height: h,
      background: t.bg,
      color: t.text,
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      position: 'relative',
      overflow: 'hidden',
      transform: isThumb ? `scale(${scale})` : undefined,
      transformOrigin: isThumb ? 'top left' : undefined,
      flexShrink: 0,
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: t.accent, opacity: 0.07 }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: t.accent, opacity: 0.06 }} />

      {/* Content */}
      {slide.type === 'title' ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', height: '100%', padding: '60px 80px' }}>
          <div style={{ width: 48, height: 4, background: t.accent, borderRadius: 2, marginBottom: 32 }} />
          <h1 style={{ fontSize: 52, fontWeight: 700, margin: 0, lineHeight: 1.15, letterSpacing: '-0.02em', maxWidth: 700 }}>
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p style={{ fontSize: 22, color: t.accent, margin: '20px 0 0', fontWeight: 400, opacity: 0.9 }}>{slide.subtitle}</p>
          )}
          {slide.bullets && slide.bullets.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '32px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {slide.bullets.map((b, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 18, opacity: 0.85 }}>
                  <BulletIcon color={t.accent} /><span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : slide.type === 'code' ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '40px 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 4, height: 28, background: t.accent, borderRadius: 2 }} />
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{slide.title}</h2>
          </div>
          {slide.bullets && slide.bullets.length > 0 && (
            <p style={{ fontSize: 16, color: t.accent, margin: '0 0 16px', opacity: 0.9 }}>{slide.bullets[0]}</p>
          )}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '20px 24px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
            </div>
            <pre style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#e2e8f0', fontFamily: '"JetBrains Mono", "Fira Code", monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {slide.code_snippet || '// No code snippet'}
            </pre>
          </div>
        </div>
      ) : (
        // content / split
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '40px 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 4, height: 28, background: t.accent, borderRadius: 2 }} />
            <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>{slide.title}</h2>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(slide.bullets || []).map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: '16px 20px' }}>
                <BulletIcon color={t.accent} />
                <span style={{ fontSize: 18, lineHeight: 1.5, flex: 1 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom accent line */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${t.accent}, transparent)` }} />
    </div>
  );
}

// ── Main Deck component ──────────────────────────────────────────────────
export default function Deck() {
  const { projectId } = useParams<{ projectId: string }>();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [deckType, setDeckType] = useState('technical');
  const [loading, setLoading] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'pptx' | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // ── PDF Export ──────────────────────────────────────────────────────────
  async function handleDownloadPDF() {
    setExporting('pdf');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] });

      for (let i = 0; i < slides.length; i++) {
        const el = slideRefs.current[i];
        if (!el) continue;
        const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: null });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage([960, 540], 'landscape');
        pdf.addImage(imgData, 'JPEG', 0, 0, 960, 540);
      }

      pdf.save('presentation.pdf');
    } finally {
      setExporting(null);
    }
  }

  // ── PPTX Export ─────────────────────────────────────────────────────────
  async function handleDownloadPPTX() {
    setExporting('pptx');
    try {
      const { default: pptxgen } = await import('pptxgenjs');
      const prs = new pptxgen();
      prs.layout = 'LAYOUT_WIDE'; // 16:9

      const THEME_COLOR_MAP: Record<string, string> = {
        navy: '0f172a', purple: '1e1b4b', teal: '0d2937',
        dark: '0a0a0a', light: 'ffffff', accent: '1d4ed8',
      };
      const ACCENT_COLOR_MAP: Record<string, string> = {
        navy: '60a5fa', purple: 'a78bfa', teal: '34d399',
        dark: '38bdf8', light: '2563eb', accent: 'fbbf24',
      };

      for (const slide of slides) {
        const s = prs.addSlide();
        const bgColor = THEME_COLOR_MAP[slide.theme] || '0f172a';
        const accentColor = ACCENT_COLOR_MAP[slide.theme] || '60a5fa';
        const isLight = slide.theme === 'light';

        s.background = { color: bgColor };

        if (slide.type === 'title') {
          s.addText(slide.title, {
            x: 0.8, y: 1.8, w: 8, h: 1.5,
            fontSize: 40, bold: true, color: isLight ? '0f172a' : 'f8fafc',
            fontFace: 'Calibri', wrap: true
          });
          if (slide.subtitle) {
            s.addText(slide.subtitle, {
              x: 0.8, y: 3.5, w: 8, h: 0.7,
              fontSize: 20, color: accentColor, fontFace: 'Calibri'
            });
          }
          s.addShape('rect', { x: 0.8, y: 1.5, w: 0.5, h: 0.06, fill: { color: accentColor } });
        } else {
          s.addText(slide.title, {
            x: 0.5, y: 0.3, w: 12, h: 0.8,
            fontSize: 28, bold: true, color: isLight ? '0f172a' : 'f8fafc', fontFace: 'Calibri'
          });
          s.addShape('rect', { x: 0.5, y: 1.15, w: 0.06, h: 0.5, fill: { color: accentColor } });

          const bulletText = (slide.bullets || []).map(b => ({ text: `• ${b}`, options: { breakLine: true } }));
          if (bulletText.length > 0) {
            s.addText(bulletText, {
              x: 0.7, y: 1.35, w: 12, h: 4.5,
              fontSize: 16, color: isLight ? '334155' : 'cbd5e1',
              fontFace: 'Calibri', valign: 'top', lineSpacingMultiple: 1.5
            });
          }

          if (slide.type === 'code' && slide.code_snippet) {
            s.addText(slide.code_snippet, {
              x: 0.5, y: 2.8, w: 12, h: 2.8,
              fontSize: 11, fontFace: 'Courier New',
              color: 'e2e8f0', fill: { color: '1e293b' },
              valign: 'top'
            });
          }
        }

        // Bottom accent line
        s.addShape('rect', { x: 0, y: 6.9, w: 13.33, h: 0.05, fill: { color: accentColor } });
      }

      prs.writeFile({ fileName: 'presentation.pptx' });
    } finally {
      setExporting(null);
    }
  }

  // ── Full-screen presentation mode ────────────────────────────────────────
  if (presenting && slides.length > 0) {
    const slide = slides[currentSlide];
    const t = THEMES[slide.theme] || THEMES.navy;
    const progress = ((currentSlide + 1) / slides.length) * 100;

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: '#000' }}>
        {/* Slide fill area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 20px' }}>
          <div style={{ width: '100%', maxWidth: 960, aspectRatio: '16/9', position: 'relative' }}>
            <SlideView slide={slide} />
          </div>
        </div>

        {/* Speaker notes */}
        {showNotes && slide.notes && (
          <div style={{ background: '#1e293b', borderTop: '1px solid #334155', padding: '12px 60px', fontSize: 14, color: '#94a3b8', maxHeight: 100, overflow: 'auto' }}>
            <span style={{ color: '#60a5fa', fontWeight: 600 }}>Notes: </span>{slide.notes}
          </div>
        )}

        {/* Controls bar */}
        <div style={{ background: '#0a0a0a', borderTop: '1px solid #1e293b', padding: '10px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setCurrentSlide(s => Math.max(s - 1, 0))} style={{ background: '#1e293b', color: '#f8fafc', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>← Prev</button>
            <button onClick={() => setCurrentSlide(s => Math.min(s + 1, slides.length - 1))} style={{ background: t.accent, color: '#0f172a', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Next →</button>
          </div>
          {/* Progress */}
          <div style={{ flex: 1, margin: '0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 3, background: '#1e293b', borderRadius: 2 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: t.accent, borderRadius: 2, transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{currentSlide + 1} / {slides.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowNotes(n => !n)} style={{ background: '#1e293b', color: '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
              {showNotes ? 'Hide Notes' : 'Notes'}
            </button>
            <button onClick={() => setPresenting(false)} style={{ background: '#1e293b', color: '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>✕ Exit</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Editor / preview view ────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <h2>Presentation Deck</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-input" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
            value={deckType} onChange={e => setDeckType(e.target.value)}>
            <option value="technical">🔧 Technical (for engineers)</option>
            <option value="demo">🎯 Demo (for judges / clients)</option>
            <option value="interview">🎓 Interview / Viva</option>
          </select>

          <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading
              ? <><span style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Generating…</>
              : '⚡ Generate Deck'}
          </button>

          {slides.length > 0 && !loading && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => { setCurrentSlide(0); setPresenting(true); }}>▶ Present</button>
              <button className="btn btn-secondary btn-sm" onClick={handleDownloadPDF} disabled={!!exporting} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {exporting === 'pdf' ? '⏳' : '⬇'} PDF
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleDownloadPPTX} disabled={!!exporting} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {exporting === 'pptx' ? '⏳' : '⬇'} PPTX
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page-content">
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Generating your deck…</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>This takes ~30 seconds. AI is crafting your slides.</div>
          </div>
        )}

        {slides.length > 0 && !loading && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              {slides.length} slides · Click any slide to present from that point · Download as PPTX or PDF above
            </div>

            {/* Hidden full-size slides for PDF export */}
            <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', zIndex: -1 }}>
              {slides.map((slide, i) => (
                <div key={i} ref={el => slideRefs.current[i] = el} style={{ width: 960, height: 540 }}>
                  <SlideView slide={slide} />
                </div>
              ))}
            </div>

            {/* Thumbnail grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {slides.map((slide, i) => {
                const t = THEMES[slide.theme] || THEMES.navy;
                return (
                  <div
                    key={i}
                    onClick={() => { setCurrentSlide(i); setPresenting(true); }}
                    style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '2px solid var(--border)', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; e.currentTarget.style.borderColor = t.accent; }}
                    onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    {/* Thumbnail slide — 960×540 scaled to 0.28 = ~269×151 */}
                    <div style={{ width: '100%', height: 151, position: 'relative', overflow: 'hidden', background: (THEMES[slide.theme] || THEMES.navy).bg }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 960, height: 540, transformOrigin: 'top left', transform: 'scale(0.28)' }}>
                        <SlideView slide={slide} />
                      </div>
                    </div>
                    {/* Label */}
                    <div style={{ background: 'var(--surface)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>SLIDE {i + 1}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineClamp: 1 }}>{slide.title}</div>
                      </div>
                      <div style={{ background: t.accent, color: '#000', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>{slide.type}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {slides.length === 0 && !loading && (
          <div className="empty-state">
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎨</div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Generate a Professional Deck</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Choose the deck type based on your audience, then click Generate. Export as PDF or PPTX.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Technical', 'Demo', 'Interview'].map(t => (
                <div key={t} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                  {t === 'Technical' ? '🔧' : t === 'Demo' ? '🎯' : '🎓'} {t}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
