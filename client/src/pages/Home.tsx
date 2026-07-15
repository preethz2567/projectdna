import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

// Custom hook for Scroll Reveal Animations
function useInView(threshold = 0.1) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(false);
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  
  return { ref, inView };
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useStore();

  const pipelineInView = useInView(0.2);
  const capabilitiesInView = useInView(0.1);

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .anim-slide-down {
          animation: slideDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-float {
          animation: float 4s ease-in-out infinite;
        }
        .anim-delay-1 { animation-delay: 0.1s; }
        .anim-delay-2 { animation-delay: 0.2s; }
        .anim-delay-3 { animation-delay: 0.3s; }
        
        .hover-card {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .hover-card-left:hover {
          transform: rotate(0deg) scale(1.05) translateY(-10px) !important;
          box-shadow: 16px 20px 0px #000000 !important;
          z-index: 10 !important;
        }
        .hover-card-center:hover {
          transform: rotate(0deg) scale(1.05) translateY(-30px) !important;
          box-shadow: 16px 20px 0px #000000 !important;
          z-index: 10 !important;
        }
        .hover-card-right:hover {
          transform: rotate(0deg) scale(1.05) translateY(-10px) !important;
          box-shadow: 16px 20px 0px #000000 !important;
          z-index: 10 !important;
        }

        .scroll-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scroll-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
      
      {/* Editorial Navbar (Grey) */}
      <nav className="anim-slide-down" style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 48px', height: 80, background: '#f3f4f6', 
        borderBottom: '1px solid #e5e7eb',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            ProjectDNA
          </span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {user ? (
            <button className="btn" style={{ background: 'var(--text)', color: 'white', borderRadius: 0, padding: '10px 24px', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => navigate('/dashboard')}>Console</button>
          ) : (
            <>
              <button className="btn" style={{ background: 'transparent', color: 'var(--text)', border: 'none', padding: '10px 0', fontSize: 14, fontWeight: 600 }} onClick={() => navigate('/login')}>Sign In</button>
              <button className="btn" style={{ background: 'var(--text)', color: 'white', borderRadius: 0, padding: '10px 24px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => navigate('/register')}>Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* SECTION 1: HERO (White - Sticky for Parallax) */}
      <section style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1, padding: '0 48px' }}>
        <div style={{ maxWidth: 1200, margin: '80px auto 0 auto', display: 'flex', alignItems: 'center', gap: 64, width: '100%' }}>
          <div style={{ flex: 1 }}>
            <div className="anim-fade-in-up" style={{ 
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--accent)', 
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24,
              border: '1px solid var(--border)', padding: '6px 12px', display: 'inline-block',
              background: '#fafafa'
            }}>
              PROJECTDNA REVISION SYSTEM
            </div>
            
            <h1 className="anim-fade-in-up anim-delay-1" style={{ 
              fontFamily: 'var(--font-heading)', fontSize: '84px', color: 'var(--text)', 
              letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 32, fontWeight: 400 
            }}>
              Codebase Mastery,<br/>
              <span style={{ color: 'var(--accent)', fontStyle: 'italic', fontWeight: 700 }}>Automated.</span>
            </h1>
            
            <p className="anim-fade-in-up anim-delay-2" style={{ fontFamily: 'var(--font-sans)', fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 500, marginBottom: 48, fontWeight: 400 }}>
              Stop manually tracing thousands of lines of code before a presentation. Let AI analyze your repository, generate architecture diagrams, and test your knowledge in seconds.
            </p>
            
            <div className="anim-fade-in-up anim-delay-3" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
               <button className="btn" style={{ background: 'var(--accent)', color: 'white', borderRadius: 4, padding: '16px 32px', fontSize: 15, fontWeight: 600, border: 'none' }} onClick={() => navigate('/register')}>
                 Start Free Workspace
               </button>
               <button className="btn" style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 32px', fontSize: 15, fontWeight: 600 }}>
                 Learn More
               </button>
            </div>
            
            <div className="anim-fade-in-up anim-delay-3" style={{ display: 'flex', gap: 32, marginTop: 64, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ color: 'var(--accent)' }}>●</span> NO CREDIT CARD REQUIRED
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ color: 'var(--accent)' }}>●</span> INSTANT GITHUB SYNC
              </div>
            </div>
          </div>
          
          <div className="anim-float" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
            <img 
              src="/hero.webp" 
              alt="Developer Illustration" 
              style={{ width: '100%', maxWidth: 500, height: 'auto', display: 'block' }} 
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: PIPELINE (Navy Blue - Sticky Stacking) */}
      <section ref={pipelineInView.ref} style={{ background: 'var(--accent)', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 2, padding: '80px 48px', overflow: 'hidden', boxShadow: '0 -20px 40px rgba(0,0,0,0.1)' }}>
        
        {/* Dramatic Slanted SVG Divider covering Hero section */}
        <svg viewBox="0 0 1440 120" style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: 'translateY(-99%)', zIndex: -1 }}>
           <path fill="var(--accent)" d="M0,120 L1440,0 L1440,120 Z"></path>
        </svg>

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div className={`scroll-reveal ${pipelineInView.inView ? 'visible' : ''}`} style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
              OPERATIONS PIPELINE
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 48, fontWeight: 400, lineHeight: 1.1 }}>
              High-Speed <span style={{ fontStyle: 'italic', fontWeight: 600 }}>Revision Process</span>
            </h2>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
            
            {/* Card 1: Left */}
            <div className={`hover-card hover-card-left scroll-reveal ${pipelineInView.inView ? 'visible' : ''}`} style={{ 
              width: 320, height: 340, background: '#ffffff', borderRadius: 24, border: '1px solid #e5e5e5',
              boxShadow: '6px 8px 0px #000000', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              transform: pipelineInView.inView ? 'rotate(-5deg)' : 'rotate(-15deg) translateY(60px)', zIndex: 1, marginRight: '-30px', position: 'relative', transitionDelay: '0.1s'
            }}>
              <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                SEAMLESS INTEGRATION
              </div>
              <div style={{ fontSize: 20, color: '#111', fontWeight: 600, textAlign: 'center', lineHeight: 1.3, marginBottom: 24, fontFamily: 'var(--font-heading)' }}>
                Instantly map<br/>any codebase
              </div>
              <svg width="160" height="160" viewBox="0 0 200 200" fill="none" stroke="#222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 'auto' }}>
                <path d="M40 100 Q 20 80 40 60 M160 100 Q 180 80 160 60 M50 140 Q 30 150 50 160 M150 140 Q 170 150 150 160" stroke="#bbb" />
                <circle cx="100" cy="70" r="15" fill="#fff" />
                <path d="M85 70 C 85 50 115 50 115 70" fill="#222" />
                <path d="M100 85 v40" />
                <path d="M100 95 l-20 20 m20 -20 l20 20" />
                <path d="M80 145 l 20 -10 l 20 10" />
                <rect x="80" y="110" width="40" height="25" rx="2" fill="#222" />
                <path d="M70 135 h60" strokeWidth="4" />
              </svg>
            </div>

            {/* Card 2: Center */}
            <div className={`hover-card hover-card-center scroll-reveal ${pipelineInView.inView ? 'visible' : ''}`} style={{ 
              width: 320, height: 340, background: '#ffffff', borderRadius: 24, border: '1px solid #e5e5e5',
              boxShadow: '6px 8px 0px #000000', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              transform: pipelineInView.inView ? 'translateY(-20px)' : 'translateY(80px)', zIndex: 2, position: 'relative', transitionDelay: '0.2s'
            }}>
              <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                ADVANCED INTELLIGENCE
              </div>
              <div style={{ fontSize: 20, color: '#111', fontWeight: 600, textAlign: 'center', lineHeight: 1.3, marginBottom: 24, fontFamily: 'var(--font-heading)' }}>
                Deep structural<br/>code indexing
              </div>
              <svg width="160" height="160" viewBox="0 0 200 200" fill="none" stroke="#222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 'auto' }}>
                <path d="M60 160 h20 v-20 h20 v-20 h20 v-20 h20" stroke="#222" />
                <path d="M50 150 Q 40 130 60 110" stroke="#bbb" strokeDasharray="4 4" />
                <circle cx="90" cy="70" r="12" fill="#fff" />
                <path d="M78 70 C 78 55 102 55 102 70" fill="#222" />
                <path d="M90 82 v30" />
                <path d="M90 112 l-10 28 M90 112 l15 8 v20" />
                <path d="M90 90 l-20 10 l10 10 M90 90 l20 5 l-5 15" />
                <path d="M40 105 h70 l20 5 l-20 5 h-70 z" fill="#fff" />
                <path d="M110 105 v10" />
              </svg>
            </div>

            {/* Card 3: Right */}
            <div className={`hover-card hover-card-right scroll-reveal ${pipelineInView.inView ? 'visible' : ''}`} style={{ 
              width: 320, height: 340, background: '#ffffff', borderRadius: 24, border: '1px solid #e5e5e5',
              boxShadow: '6px 8px 0px #000000', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              transform: pipelineInView.inView ? 'rotate(6deg)' : 'rotate(15deg) translateY(60px)', zIndex: 1, marginLeft: '-30px', position: 'relative', transitionDelay: '0.3s'
            }}>
              <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                INSTANT READINESS
              </div>
              <div style={{ fontSize: 20, color: '#111', fontWeight: 600, textAlign: 'center', lineHeight: 1.3, marginBottom: 24, fontFamily: 'var(--font-heading)' }}>
                Interactive mastery<br/>& export
              </div>
              <svg width="160" height="160" viewBox="0 0 200 200" fill="none" stroke="#222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 'auto' }}>
                <circle cx="70" cy="70" r="12" fill="#fff" />
                <path d="M58 70 C 58 55 82 55 82 70" fill="#222" />
                <path d="M70 82 v40 M70 122 l-15 30 M70 122 l10 30" />
                <path d="M70 95 l-20 15 M70 95 l30 -25" />
                <circle cx="130" cy="70" r="12" fill="#fff" />
                <path d="M118 70 C 118 55 142 55 142 70" fill="#222" />
                <path d="M130 82 v40 M130 122 l-10 30 M130 122 l15 30" />
                <path d="M130 95 l20 15 M130 95 l-30 -25" />
                <path d="M100 60 l0 -10 M90 65 l-8 -8 M110 65 l8 -8" stroke="#bbb" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: CAPABILITIES TABLE (Dark - Sticky Stacking) */}
      <section ref={capabilitiesInView.ref} style={{ background: 'var(--surface-dark)', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 3, padding: '80px 48px', boxShadow: '0 -20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          
          <div className={`scroll-reveal ${capabilitiesInView.inView ? 'visible' : ''}`} style={{ marginBottom: 64 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
              SPECIFICATION SHEETS
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 48, fontWeight: 400, lineHeight: 1.1, color: '#ffffff' }}>
              Intelligence <span style={{ color: '#60a5fa', fontStyle: 'italic', fontWeight: 600 }}>Capabilities</span>
            </h2>
          </div>

          <div className={`scroll-reveal ${capabilitiesInView.inView ? 'visible' : ''}`} style={{ border: '1px solid #333', borderRadius: 8, overflow: 'hidden', background: '#0a0a0a', transitionDelay: '0.2s' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 3fr', padding: '16px 24px', background: '#141414', borderBottom: '1px solid #333', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <div>SYS ID</div>
              <div>INTELLIGENCE MODULE</div>
              <div>TECHNICAL SPECIFICATIONS</div>
            </div>
            
            {[
              { id: 'SYS 01 00', title: 'Topology & Architecture Generation', desc: 'Translates raw codebase folders and dependencies into high-fidelity Mermaid.js flowcharts and system diagrams.' },
              { id: 'SYS 02 00', title: 'Contextual Flashcard Quizzes', desc: 'Parses business logic and database schemas to automatically generate targeted QA flashcards with success-rate tracking.' },
              { id: 'SYS 03 00', title: 'Mock Interview Sandbox', desc: 'Simulates HR, Technical, and Architecture interviews tailored strictly to the technologies and patterns used in your repository.' },
              { id: 'SYS 04 00', title: 'Automated Code Review', desc: 'Scans syntax for security vulnerabilities, performance bottlenecks, and structural anomalies, generating actionable audit reports.' }
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 3fr', padding: '24px', borderBottom: i === 3 ? 'none' : '1px solid #262626', alignItems: 'center', transition: 'background 0.2s', cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : '#111111' }} onMouseOver={e => e.currentTarget.style.background = '#1a1a1a'} onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#111111'}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>{row.id}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f3f4f6' }}>{row.title}</div>
                <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6 }}>{row.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>ion>

      {/* SECTION 4: CTA PORTAL (Navy Blue) */}
      <section style={{ background: 'var(--accent)', color: 'white', padding: '120px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 32, left: 32, fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.5, letterSpacing: '0.1em' }}>GRID: [A-1]</div>
        <div style={{ position: 'absolute', bottom: 32, right: 32, fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.5, letterSpacing: '0.1em' }}>EST_SYS: ACTIVE</div>
        
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24 }}>
            DEPLOYMENT PORTAL
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 56, fontWeight: 400, lineHeight: 1.1, marginBottom: 24 }}>
            Ready to Master Your <span style={{ fontStyle: 'italic', fontWeight: 600 }}>Codebase?</span>
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 48, lineHeight: 1.6, maxWidth: 600, margin: '0 auto 48px auto' }}>
            Optimize your revision bandwidth. Sync your repository, generate documentation, and ace your viva presentations.
          </p>
          <button className="btn" style={{ background: 'white', color: 'var(--accent)', borderRadius: 4, padding: '18px 48px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none' }} onClick={() => navigate('/register')}>
            START FREE REVISION
          </button>
          
          <div style={{ marginTop: 32, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            3 FREE PROJECTS INCLUDED <span style={{ margin: '0 12px' }}>•</span> NO CREDIT CARD REQUIRED
          </div>
        </div>
      </section>
      
      {/* SECTION 5: EDITORIAL FOOTER (Black) */}
      <footer style={{ background: '#050505', color: '#737373', padding: '80px 48px 40px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 64, borderBottom: '1px solid #171717', paddingBottom: 64, marginBottom: 40 }}>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
                <div style={{ width: 24, height: 24, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>P</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', color: 'white' }}>
                  ProjectDNA
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 300 }}>
                B2B machine learning solutions built specifically to map codebases and automate engineering documentation.
              </p>
            </div>

            <div>
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>Systems Engine</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
                <li>Architecture Mapping</li>
                <li>Logic Extraction</li>
                <li>Repo Sync</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>Platform</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
                <li>Security Core</li>
                <li>API Integration</li>
                <li>Pricing</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>Compliance</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
                <li>Data Protection</li>
                <li>Terms of Service</li>
                <li>SOC 2 Audits</li>
              </ul>
            </div>

          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div>© 2026 PROJECTDNA. ALL RIGHTS RESERVED.</div>
            <div>PRODUCT CODE: V3.2-PROD</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
