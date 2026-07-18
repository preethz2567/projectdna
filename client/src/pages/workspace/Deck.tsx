import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { generateDeck } from '../../api/ai';

interface Slide {
  title: string;
  subtitle?: string | null;
  bullets?: string[];
  content?: string;
  type: 'title' | 'content' | 'code' | 'split';
  theme: 'navy' | 'purple' | 'teal' | 'dark' | 'light' | 'accent';
  icon?: string | null;
  code_snippet?: string | null;
  code_language?: string | null;
  notes?: string;
}

// ── Theme definitions ────────────────────────────────────────────────────
const THEMES: Record<string, { bg: string; text: string; accent: string; card: string; border: string }> = {
  navy:   { bg: 'radial-gradient(circle at 100% 0%, #1e3a8a 0%, #0f172a 100%)', text: '#f8fafc', accent: '#38bdf8', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  purple: { bg: 'radial-gradient(circle at 0% 100%, #581c87 0%, #09090b 100%)', text: '#f8fafc', accent: '#c084fc', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  teal:   { bg: 'radial-gradient(circle at 50% 50%, #064e3b 0%, #022c22 100%)', text: '#f8fafc', accent: '#34d399', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  dark:   { bg: 'linear-gradient(180deg, #18181b 0%, #000000 100%)', text: '#e2e8f0', accent: '#a1a1aa', card: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.05)' },
  light:  { bg: 'linear-gradient(160deg, #ffffff 0%, #f1f5f9 100%)', text: '#0f172a', accent: '#2563eb', card: '#f8fafc', border: 'rgba(0,0,0,0.07)' },
  accent: { bg: 'linear-gradient(135deg, #1e40af 0%, #4338ca 100%)', text: '#ffffff', accent: '#fbbf24', card: 'rgba(0,0,0,0.1)', border: 'rgba(255,255,255,0.2)' },
};

// ── Icon Graphic ─────────────────────────────────────────────────────────
function IconGraphic({ icon, color }: { icon?: string | null, color: string }) {
  if (!icon) return null;
  const icons: any = {
    box: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>,
    database: <><path d="M3 9v6M21 9v6M3 15v-6a9 3 0 0 1 18 0v6a9 3 0 0 1-18 0z"></path></>,
    server: <><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></>,
    code: <><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></>,
    layout: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></>,
    rocket: <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>,
    cloud: <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>,
    globe: <><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></>
  };
  return (
    <svg width="240" height="240" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="0.5" style={{ opacity: 0.1, position: 'absolute', right: -40, bottom: -40 }}>
      {icons[icon] || icons.box}
    </svg>
  );
}

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

  // Fallback for older API format that returned 'content' instead of 'bullets'
  const bullets = slide.bullets && slide.bullets.length > 0 
    ? slide.bullets 
    : slide.content ? slide.content.split('\n').map(s => s.replace(/^[•\-\s]+/, '')).filter(Boolean) : [];

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
      {/* Decorative circles / SVGs */}
      <IconGraphic icon={slide.icon} color={t.accent} />
      <div style={{ position: 'absolute', top: -120, right: -80, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${t.accent} 0%, transparent 70%)`, opacity: 0.15 }} />
      <div style={{ position: 'absolute', bottom: -100, left: -60, width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle, ${t.accent} 0%, transparent 70%)`, opacity: 0.1 }} />

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
          {bullets.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '32px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bullets.map((b, i) => (
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
          {bullets.length > 0 && (
            <p style={{ fontSize: 16, color: t.accent, margin: '0 0 16px', opacity: 0.9 }}>{bullets[0]}</p>
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
            {bullets.map((b, i) => (
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

          const bulletsForPPTX = slide.bullets && slide.bullets.length > 0 
            ? slide.bullets 
            : slide.content ? slide.content.split('\n').map(s => s.replace(/^[•\-\s]+/, '')).filter(Boolean) : [];
          
          const bulletText = bulletsForPPTX.join('\n');
          if (bulletText) {
            s.addText(bulletText, {
              x: 0.7, y: 1.35, w: 12, h: 4.5,
              fontSize: 16, color: isLight ? '334155' : 'cbd5e1',
              fontFace: 'Calibri', valign: 'top', lineSpacingMultiple: 1.5, bullet: true
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
            <option value="technical">Technical — For Engineers</option>
            <option value="demo">Demo — For Judges / Clients</option>
            <option value="interview">Interview / Viva Prep</option>
          </select>

          <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading
              ? <><span style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Generating…</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate Deck</>}
          </button>

          {slides.length > 0 && !loading && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => { setCurrentSlide(0); setPresenting(true); }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Present
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleDownloadPDF} disabled={!!exporting} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {exporting === 'pdf'
                  ? <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>} PDF
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleDownloadPPTX} disabled={!!exporting} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {exporting === 'pptx'
                  ? <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>} PPTX
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page-content">
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 24 }}>
            {/* Animated presentation icon */}
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="12" width="64" height="44" rx="4" stroke="var(--accent)" strokeWidth="2.5" fill="none"/>
                <line x1="40" y1="56" x2="40" y2="68" stroke="var(--accent)" strokeWidth="2.5"/>
                <line x1="28" y1="68" x2="52" y2="68" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
                <rect x="18" y="22" width="44" height="4" rx="2" fill="var(--accent)" opacity="0.3">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite"/>
                </rect>
                <rect x="18" y="31" width="32" height="3" rx="1.5" fill="var(--accent)" opacity="0.2">
                  <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" begin="0.2s" repeatCount="indefinite"/>
                </rect>
                <rect x="18" y="38" width="38" height="3" rx="1.5" fill="var(--accent)" opacity="0.2">
                  <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" begin="0.4s" repeatCount="indefinite"/>
                </rect>
                <rect x="18" y="45" width="24" height="3" rx="1.5" fill="var(--accent)" opacity="0.2">
                  <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" begin="0.6s" repeatCount="indefinite"/>
                </rect>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Generating your presentation...</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI is analyzing your project and crafting slides. This takes ~30 seconds.</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
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
                <div key={i} ref={el => { slideRefs.current[i] = el; }} style={{ width: 960, height: 540 }}>
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
            {/* Presentation SVG illustration */}
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 20, opacity: 0.5 }}>
              <rect x="6" y="10" width="60" height="42" rx="4" stroke="var(--text-muted)" strokeWidth="2.5" fill="none"/>
              <line x1="36" y1="52" x2="36" y2="62" stroke="var(--text-muted)" strokeWidth="2.5"/>
              <line x1="24" y1="62" x2="48" y2="62" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"/>
              <rect x="14" y="19" width="44" height="5" rx="2.5" fill="var(--text-muted)" opacity="0.4"/>
              <rect x="14" y="29" width="30" height="3" rx="1.5" fill="var(--text-muted)" opacity="0.25"/>
              <rect x="14" y="36" width="36" height="3" rx="1.5" fill="var(--text-muted)" opacity="0.25"/>
              <rect x="14" y="43" width="22" height="3" rx="1.5" fill="var(--text-muted)" opacity="0.25"/>
            </svg>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Generate a Professional Presentation</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Choose the deck type based on your audience, then click Generate. Export as PDF or PPTX when done.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Technical', desc: 'Architecture & code deep-dive', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
                { label: 'Demo', desc: 'For judges & clients', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg> },
                { label: 'Interview', desc: 'Viva & exam prep', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> }
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{item.label}</div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-8px); opacity: 1; } }
      `}</style>
    </div>
  );
}
