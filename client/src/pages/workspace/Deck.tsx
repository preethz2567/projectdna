import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { generateDeck } from '../../api/ai';
import MermaidDiagram from '../../components/MermaidDiagram';

interface Slide {
  title: string;
  subtitle?: string | null;
  bullets?: string[];
  content?: string;
  type: 'title' | 'content' | 'code' | 'split' | 'diagram';
  theme: 'navy' | 'purple' | 'teal' | 'dark' | 'light' | 'accent';
  icon?: string | null;
  code_snippet?: string | null;
  code_language?: string | null;
  diagram_code?: string | null;
  notes?: string;
}

const T: Record<string, { bg: string; text: string; accent: string; card: string; border: string; muted: string }> = {
  navy:   { bg: '#0f172a', text: '#f8fafc', accent: '#38bdf8', card: '#1e293b', border: '#334155', muted: '#94a3b8' },
  purple: { bg: '#1e1b4b', text: '#f8fafc', accent: '#a78bfa', card: '#2d2666', border: '#4c1d95', muted: '#c4b5fd' },
  teal:   { bg: '#022c22', text: '#f8fafc', accent: '#34d399', card: '#064e3b', border: '#065f46', muted: '#6ee7b7' },
  dark:   { bg: '#09090b', text: '#fafafa', accent: '#a1a1aa', card: '#18181b', border: '#27272a', muted: '#71717a' },
  light:  { bg: '#ffffff', text: '#09090b', accent: '#2563eb', card: '#f4f4f5', border: '#e4e4e7', muted: '#6b7280' },
  accent: { bg: '#1e40af', text: '#ffffff', accent: '#fbbf24', card: '#1e3a8a', border: '#1d4ed8', muted: '#93c5fd' },
};

const ICONS: Record<string, string> = {
  box:      'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  database: 'M12 2C6.48 2 2 4.24 2 7s4.48 5 10 5 10-2.24 10-5-4.48-5-10-5zM2 12v5c0 2.76 4.48 5 10 5s10-2.24 10-5v-5',
  server:   'M2 2h20v8H2zM2 14h20v8H2zM6 6h.01M6 18h.01',
  code:     'M16 18l6-6-6-6M8 6l-6 6 6 6',
  layout:   'M3 3h18v18H3zM3 9h18M9 21V9',
  users:    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  rocket:   'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
  shield:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  cloud:    'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  globe:    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10z',
};

function Ico({ name, size = 20, color = 'currentColor' }: { name?: string | null; size?: number; color?: string }) {
  const d = ICONS[name || 'box'] || ICONS.box;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

function getBullets(slide: Slide) {
  if (slide.bullets && slide.bullets.length > 0) return slide.bullets;
  if (slide.content) return slide.content.split('\n').map(s => s.replace(/^[•\-\s]+/, '')).filter(Boolean);
  return [];
}

function SlideView({ slide }: { slide: Slide }) {
  const t = T[slide.theme] || T.navy;
  const bullets = getBullets(slide);
  const base: React.CSSProperties = {
    width: '100%', height: '100%',
    background: t.bg, color: t.text,
    fontFamily: '"Inter","Segoe UI",system-ui,sans-serif',
    position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
  };

  if (slide.type === 'title') return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px' }}>
      <div style={{ position: 'absolute', top: -120, right: -120, width: 440, height: 440, borderRadius: '50%', background: t.accent, opacity: 0.06, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -40, width: 260, height: 260, borderRadius: '50%', background: t.accent, opacity: 0.06, pointerEvents: 'none' }} />
      <div style={{ marginBottom: 24, opacity: 0.8 }}><Ico name={slide.icon} size={42} color={t.accent} /></div>
      <div style={{ width: 64, height: 4, background: t.accent, marginBottom: 28 }} />
      <h1 style={{ fontSize: 50, fontWeight: 800, margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-0.025em', maxWidth: 700 }}>{slide.title}</h1>
      {slide.subtitle && <p style={{ fontSize: 20, color: t.accent, margin: '0 0 32px', fontWeight: 400 }}>{slide.subtitle}</p>}
      {bullets.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 17, color: t.muted }}>
              <span style={{ color: t.accent, fontWeight: 700, marginTop: 2 }}>→</span><span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: t.accent }} />
    </div>
  );

  if (slide.type === 'code') return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', padding: '36px 50px' }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: t.accent, opacity: 0.04, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 4, height: 30, background: t.accent }} />
        <Ico name="code" size={20} color={t.accent} />
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{slide.title}</h2>
      </div>
      {bullets[0] && <p style={{ fontSize: 14, color: t.muted, margin: '0 0 14px 16px' }}>{bullets[0]}</p>}
      <div style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#161b22', borderBottom: '1px solid #21262d' }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
          <span style={{ color: '#8b949e', fontSize: 11, marginLeft: 8, fontFamily: 'monospace' }}>{slide.code_language || 'code'}</span>
        </div>
        <pre style={{ margin: 0, padding: '18px 22px', fontSize: 13.5, lineHeight: 1.65, color: '#e6edf3', fontFamily: '"JetBrains Mono","Fira Code",monospace', overflow: 'auto', flex: 1 }}>
          {(slide.code_snippet || '').trim()}
        </pre>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: t.accent }} />
    </div>
  );

  if (slide.type === 'diagram') return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', padding: '32px 44px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 4, height: 30, background: t.accent }} />
        <Ico name="layout" size={20} color={t.accent} />
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{slide.title}</h2>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 20, minHeight: 0 }}>
        <div style={{ flex: 2, background: '#fff', border: `1px solid ${t.border}`, overflow: 'auto', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {slide.diagram_code
            ? <div style={{ width: '100%' }}><MermaidDiagram code={slide.diagram_code} /></div>
            : <div style={{ color: '#94a3b8', textAlign: 'center', fontSize: 14 }}><Ico name="layout" size={28} color="#94a3b8" /><br />No diagram</div>}
        </div>
        {bullets.length > 0 && (
          <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Key Points</div>
            {bullets.map((b, i) => (
              <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, padding: '10px 12px', fontSize: 12, lineHeight: 1.5 }}>
                <span style={{ color: t.accent, fontWeight: 800, marginRight: 6 }}>{String(i+1).padStart(2,'0')}</span>{b}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: t.accent }} />
    </div>
  );

  return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', padding: '36px 50px' }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: t.accent, opacity: 0.05, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 26 }}>
        <div style={{ width: 4, height: 30, background: t.accent }} />
        <Ico name={slide.icon} size={20} color={t.accent} />
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>{slide.title}</h2>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
        {bullets.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: t.card, border: `1px solid ${t.border}`, padding: '13px 16px' }}>
            <div style={{ minWidth: 26, height: 26, background: t.accent, color: slide.theme === 'light' ? '#fff' : t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
              {String(i+1).padStart(2,'0')}
            </div>
            <span style={{ fontSize: 15.5, lineHeight: 1.55, flex: 1 }}>{b}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: t.accent }} />
    </div>
  );
}

function Thumb({ slide, index, active, onClick }: { slide: Slide; index: number; active: boolean; onClick: () => void }) {
  const t = T[slide.theme] || T.navy;
  const bullets = getBullets(slide);
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', border: `2px solid ${active ? t.accent : 'var(--border)'}`, transition: 'border-color 0.15s', overflow: 'hidden', background: 'var(--surface)' }}>
      <div style={{ background: t.bg, padding: '10px 12px', height: 94, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
          <div style={{ width: 3, height: 12, background: t.accent, flexShrink: 0 }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '88%' }}>{slide.title}</div>
        </div>
        {slide.type === 'diagram' && (
          <div style={{ display: 'flex', gap: 5, height: 52 }}>
            <div style={{ flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            </div>
            <div style={{ width: 50, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[80,60,70].map((w,i) => <div key={i} style={{ height: 12, width: `${w}%`, background: t.card, border: `1px solid ${t.border}` }} />)}
            </div>
          </div>
        )}
        {slide.type === 'code' && (
          <div style={{ background: '#0d1117', border: `1px solid ${t.border}`, padding: '5px 7px', height: 52, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>{['#ff5f57','#febc2e','#28c840'].map(c=><div key={c} style={{width:5,height:5,borderRadius:'50%',background:c}}/>)}</div>
            {[75,55,65,45].map((w,i)=><div key={i} style={{height:4,width:`${w}%`,background:'#30363d',marginBottom:3}}/>)}
          </div>
        )}
        {(slide.type==='content'||slide.type==='split') && bullets.slice(0,4).map((_b,i)=>(
          <div key={i} style={{display:'flex',gap:4,alignItems:'center',marginBottom:4}}>
            <div style={{width:14,height:11,background:t.accent,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:6,color:t.bg,fontWeight:800}}>{i+1}</div>
            <div style={{height:7,flex:1,background:t.card,border:`1px solid ${t.border}`}}/>
          </div>
        ))}
        {slide.type==='title' && <>
          <div style={{width:24,height:2,background:t.accent,marginBottom:5}}/>
          <div style={{height:8,width:'65%',background:t.card,marginBottom:4}}/>
          <div style={{height:5,width:'45%',background:t.muted,opacity:0.4}}/>
        </>}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:t.accent}}/>
      </div>
      <div style={{padding:'7px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:8,color:'var(--text-muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:2}}>SLIDE {index+1}</div>
          <div style={{fontSize:10,fontWeight:600,color:active?'var(--accent)':'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:148}}>{slide.title}</div>
        </div>
        <div style={{background:t.accent,color:slide.theme==='light'?'#fff':'#000',padding:'1px 5px',fontSize:7,fontWeight:800,textTransform:'uppercase'}}>{slide.type}</div>
      </div>
    </div>
  );
}

export default function Deck() {
  const { projectId } = useParams<{ projectId: string }>();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [deckType, setDeckType] = useState('technical');
  const [loading, setLoading] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [exporting, setExporting] = useState<'pdf'|'pptx'|null>(null);
  const slideRefs = useRef<(HTMLDivElement|null)[]>([]);

  async function generate() {
    setLoading(true); setCurrent(0);
    try { const r = await generateDeck(projectId!, deckType); setSlides(r.slides || []); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!presenting) return;
    const h = (e: KeyboardEvent) => {
      if (e.key==='ArrowRight'||e.key===' ') setCurrent(s=>Math.min(s+1,slides.length-1));
      if (e.key==='ArrowLeft') setCurrent(s=>Math.max(s-1,0));
      if (e.key==='Escape') setPresenting(false);
    };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  }, [presenting, slides.length]);

  async function downloadPDF() {
    setExporting('pdf');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation:'landscape', unit:'px', format:[960,540] });
      for (let i=0;i<slides.length;i++) {
        const el = slideRefs.current[i]; if (!el) continue;
        const canvas = await html2canvas(el,{scale:1.5,useCORS:true,backgroundColor:null});
        if (i>0) pdf.addPage([960,540],'landscape');
        pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',0,0,960,540);
      }
      pdf.save('presentation.pdf');
    } finally { setExporting(null); }
  }

  async function downloadPPTX() {
    setExporting('pptx');
    try {
      const { default: pptxgen } = await import('pptxgenjs');
      const prs = new pptxgen(); prs.layout = 'LAYOUT_WIDE';
      const BG: Record<string,string> = { navy:'0f172a',purple:'1e1b4b',teal:'022c22',dark:'09090b',light:'ffffff',accent:'1e40af' };
      const AC: Record<string,string> = { navy:'38bdf8',purple:'a78bfa',teal:'34d399',dark:'a1a1aa',light:'2563eb',accent:'fbbf24' };
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const s = prs.addSlide();
        const bg=BG[slide.theme]||'0f172a', ac=AC[slide.theme]||'38bdf8';
        const isL=slide.theme==='light', tc=isL?'09090b':'f8fafc', mc=isL?'6b7280':'94a3b8';
        s.background={color:bg};
        
        if (slide.type==='diagram') {
          // Capture the exact DOM render of the diagram slide as an image
          const { default: html2canvas } = await import('html2canvas');
          const el = slideRefs.current[i];
          if (el) {
            const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: null });
            const imgData = canvas.toDataURL('image/png');
            s.addImage({ data: imgData, x: 0, y: 0, w: 13.33, h: 7.5 });
          } else {
            s.addText('[Architecture Diagram — please view in web app]',{x:0.5,y:2,w:12.3,h:4,fontSize:17,fontFace:'Calibri',color:mc,align:'center',valign:'middle',fill:{color:isL?'f4f4f5':'1e293b'}});
          }
        } else {
          // Standard text-based slide render
          s.addShape('rect',{x:0,y:7.44,w:13.33,h:0.06,fill:{color:ac}});
          if (slide.type==='title') {
            s.addShape('rect',{x:1.0,y:1.55,w:0.7,h:0.05,fill:{color:ac}});
            s.addText(slide.title,{x:1.0,y:1.75,w:10,h:2,fontSize:40,bold:true,color:tc,fontFace:'Calibri',wrap:true});
            if (slide.subtitle) s.addText(slide.subtitle,{x:1.0,y:3.9,w:9,h:0.7,fontSize:19,color:ac,fontFace:'Calibri'});
          } else {
            s.addShape('rect',{x:0.5,y:0.28,w:0.05,h:0.55,fill:{color:ac}});
            s.addText(slide.title,{x:0.7,y:0.28,w:12,h:0.7,fontSize:24,bold:true,color:tc,fontFace:'Calibri'});
            const bl=(slide.bullets&&slide.bullets.length>0)?slide.bullets:[];
            if (slide.type==='code'&&slide.code_snippet) {
              if (bl[0]) s.addText(bl[0],{x:0.7,y:1.1,w:12,h:0.35,fontSize:13,color:mc,fontFace:'Calibri'});
              s.addText((slide.code_snippet||'').trim(),{x:0.5,y:1.55,w:12.3,h:4.8,fontSize:11,fontFace:'Courier New',color:'e6edf3',fill:{color:'0d1117'},valign:'top',wrap:true});
            } else {
              const txt=bl.map((b,idx)=>`${String(idx+1).padStart(2,'0')}  ${b}`).join('\n\n');
              if (txt) s.addText(txt,{x:0.7,y:1.2,w:12,h:5.8,fontSize:14,color:tc,fontFace:'Calibri',valign:'top',lineSpacingMultiple:1.65,wrap:true});
            }
          }
        }
      }
      prs.writeFile({fileName:'presentation.pptx'});
    } finally { setExporting(null); }
  }

  const slide = slides[current];
  const t = slide ? (T[slide.theme]||T.navy) : T.navy;
  const pct = slides.length>0 ? ((current+1)/slides.length)*100 : 0;

  if (presenting && slides.length>0) {
    return (
      <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',flexDirection:'column',background:'#000'}}>
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:28,overflow:'hidden'}}>
          <div style={{width:'100%',maxWidth:1100,aspectRatio:'16/9',boxShadow:'0 24px 80px rgba(0,0,0,0.7)',overflow:'hidden'}}>
            <SlideView slide={slide}/>
          </div>
        </div>
        {showNotes&&slide.notes&&(
          <div style={{background:'#1e293b',borderTop:'1px solid #334155',padding:'10px 48px',fontSize:13,color:'#94a3b8',maxHeight:88,overflow:'auto'}}>
            <span style={{color:'#60a5fa',fontWeight:600,marginRight:8}}>Notes:</span>{slide.notes}
          </div>
        )}
        <div style={{background:'#09090b',borderTop:'1px solid #1e293b',padding:'10px 32px',display:'flex',alignItems:'center',gap:14}}>
          <button onClick={()=>setCurrent(s=>Math.max(s-1,0))} style={{background:'#1e293b',color:'#f8fafc',border:'none',padding:'7px 18px',cursor:'pointer',fontSize:13,fontWeight:600}}>← Prev</button>
          <button onClick={()=>setCurrent(s=>Math.min(s+1,slides.length-1))} style={{background:t.accent,color:'#000',border:'none',padding:'7px 18px',cursor:'pointer',fontSize:13,fontWeight:700}}>Next →</button>
          <div style={{flex:1,display:'flex',alignItems:'center',gap:10}}>
            <div style={{flex:1,height:3,background:'#1e293b'}}>
              <div style={{width:`${pct}%`,height:'100%',background:t.accent,transition:'width 0.3s'}}/>
            </div>
            <span style={{color:'#64748b',fontSize:11,whiteSpace:'nowrap'}}>{current+1} / {slides.length}</span>
          </div>
          <button onClick={()=>setShowNotes(n=>!n)} style={{background:'#1e293b',color:'#94a3b8',border:'none',padding:'7px 14px',cursor:'pointer',fontSize:11}}>{showNotes?'Hide Notes':'Notes'}</button>
          <button onClick={()=>setPresenting(false)} style={{background:'#ef4444',color:'#fff',border:'none',padding:'7px 14px',cursor:'pointer',fontSize:11,fontWeight:700}}>✕ Exit</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="page-header">
        <h2>Presentation Deck</h2>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <select className="form-input" style={{width:'auto',padding:'6px 10px',fontSize:13}} value={deckType} onChange={e=>setDeckType(e.target.value)}>
            <option value="technical">Technical — For Engineers</option>
            <option value="demo">Demo — For Judges / Clients</option>
            <option value="interview">Interview / Viva Prep</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={generate} disabled={loading} style={{display:'flex',alignItems:'center',gap:6}}>
            {loading
              ? <><span style={{width:13,height:13,border:'2px solid white',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/> Generating…</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate Deck</>}
          </button>
          {slides.length>0&&!loading&&<>
            <button className="btn btn-secondary btn-sm" onClick={()=>{setCurrent(0);setPresenting(true);}} style={{display:'flex',alignItems:'center',gap:5}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Present
            </button>
            <button className="btn btn-secondary btn-sm" onClick={downloadPDF} disabled={!!exporting} style={{display:'flex',alignItems:'center',gap:4}}>
              {exporting==='pdf'?<span style={{width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>} PDF
            </button>
            <button className="btn btn-secondary btn-sm" onClick={downloadPPTX} disabled={!!exporting} style={{display:'flex',alignItems:'center',gap:4}}>
              {exporting==='pptx'?<span style={{width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>} PPTX
            </button>
          </>}
        </div>
      </div>

      {loading&&(
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flex:1,gap:24,padding:'60px 0'}}>
          <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
            <rect x="8" y="12" width="64" height="44" rx="3" stroke="var(--accent)" strokeWidth="2.5" fill="none"/>
            <line x1="40" y1="56" x2="40" y2="68" stroke="var(--accent)" strokeWidth="2.5"/>
            <line x1="28" y1="68" x2="52" y2="68" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
            {[0,1,2,3].map(i=>(
              <rect key={i} x="18" y={22+i*8} width={[44,32,38,24][i]} height="4" rx="2" fill="var(--accent)" opacity="0.25">
                <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.5s" begin={`${i*0.2}s`} repeatCount="indefinite"/>
              </rect>
            ))}
          </svg>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:16,fontWeight:600,marginBottom:6}}>Generating your presentation...</div>
            <div style={{fontSize:13,color:'var(--text-muted)'}}>AI is analyzing your project and writing slides. This takes ~30 seconds.</div>
          </div>
          <div style={{display:'flex',gap:6}}>
            {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:'var(--accent)',animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
          </div>
        </div>
      )}

      {slides.length===0&&!loading&&(
        <div className="empty-state" style={{flex:1}}>
          <svg width="64" height="64" viewBox="0 0 72 72" fill="none" style={{marginBottom:20,opacity:0.4}}>
            <rect x="6" y="10" width="60" height="42" rx="3" stroke="var(--text-muted)" strokeWidth="2.5" fill="none"/>
            <line x1="36" y1="52" x2="36" y2="62" stroke="var(--text-muted)" strokeWidth="2.5"/>
            <line x1="24" y1="62" x2="48" y2="62" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="14" y="19" width="44" height="5" rx="2.5" fill="var(--text-muted)" opacity="0.4"/>
            <rect x="14" y="29" width="30" height="3" rx="1.5" fill="var(--text-muted)" opacity="0.25"/>
            <rect x="14" y="36" width="36" height="3" rx="1.5" fill="var(--text-muted)" opacity="0.25"/>
          </svg>
          <p style={{fontSize:16,fontWeight:600,marginBottom:6}}>Generate a Professional Presentation</p>
          <p style={{fontSize:13,color:'var(--text-muted)'}}>Choose the deck type above, then click Generate Deck. The AI will build 10-12 rich slides including architecture diagrams and real code snippets from your repository.</p>
        </div>
      )}

      {slides.length>0&&!loading&&(
        <div style={{display:'flex',flex:1,minHeight:0,overflow:'hidden'}}>
          <div style={{position:'fixed',left:-9999,top:0,pointerEvents:'none',zIndex:-1}}>
            {slides.map((s,i)=>(
              <div key={i} ref={el=>{slideRefs.current[i]=el;}} style={{width:960,height:540}}>
                <SlideView slide={s}/>
              </div>
            ))}
          </div>
          <div style={{width:218,flexShrink:0,overflowY:'auto',borderRight:'1px solid var(--border)',background:'var(--surface-dark)',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'9px 12px',fontSize:9,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:'1px solid var(--border)',flexShrink:0}}>
              {slides.length} slides
            </div>
            {slides.map((s,i)=>(
              <Thumb key={i} slide={s} index={i} active={i===current} onClick={()=>setCurrent(i)}/>
            ))}
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column',minHeight:0,overflow:'hidden'}}>
            <div style={{flex:1,background:'#111',display:'flex',alignItems:'center',justifyContent:'center',padding:32,overflow:'hidden'}}>
              <div style={{width:'100%',maxWidth:900,aspectRatio:'16/9',boxShadow:'0 20px 60px rgba(0,0,0,0.5)',overflow:'hidden'}}>
                {slide&&<SlideView slide={slide}/>}
              </div>
            </div>
            <div style={{background:'var(--surface)',borderTop:'1px solid var(--border)',padding:'9px 22px',display:'flex',alignItems:'center',gap:14}}>
              <button onClick={()=>setCurrent(s=>Math.max(s-1,0))} disabled={current===0} style={{background:'var(--surface-dark)',color:'var(--text)',border:'1px solid var(--border)',padding:'5px 14px',cursor:'pointer',fontSize:12,fontWeight:600,opacity:current===0?0.4:1}}>← Prev</button>
              <button onClick={()=>setCurrent(s=>Math.min(s+1,slides.length-1))} disabled={current===slides.length-1} style={{background:'var(--accent)',color:'#fff',border:'none',padding:'5px 14px',cursor:'pointer',fontSize:12,fontWeight:700,opacity:current===slides.length-1?0.4:1}}>Next →</button>
              <div style={{flex:1,display:'flex',alignItems:'center',gap:10}}>
                <div style={{flex:1,height:3,background:'var(--border)'}}>
                  <div style={{width:`${pct}%`,height:'100%',background:'var(--accent)',transition:'width 0.3s'}}/>
                </div>
                <span style={{color:'var(--text-muted)',fontSize:11,whiteSpace:'nowrap'}}>{current+1} / {slides.length}</span>
              </div>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>
                <span style={{fontWeight:700,color:'var(--text)'}}>{slide?.type?.toUpperCase()}</span>
                {slide?.notes&&<> · <span style={{color:'var(--accent)',cursor:'pointer'}} onClick={()=>setShowNotes(n=>!n)}>{showNotes?'Hide':'Notes'}</span></>}
              </span>
            </div>
            {showNotes&&slide?.notes&&(
              <div style={{background:'#1e293b',borderTop:'1px solid #334155',padding:'9px 22px',fontSize:13,color:'#94a3b8'}}>
                <span style={{color:'#60a5fa',fontWeight:600,marginRight:8}}>Notes:</span>{slide.notes}
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity:0.4; } 40% { transform: translateY(-8px); opacity:1; } }
      `}</style>
    </div>
  );
}
