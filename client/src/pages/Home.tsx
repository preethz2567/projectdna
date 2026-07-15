import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useStore();

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
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
      `}</style>
      
      {/* Editorial Navbar (Grey) */}
      <nav className="anim-slide-down" style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 48px', height: 80, background: '#f3f4f6', 
        borderBottom: '1px solid #e5e7eb'
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

      {/* SECTION 1: HERO (Ivory) */}
      <section style={{ background: '#faf9f6', padding: '140px 48px', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64 }}>
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
            
            <div style={{ display: 'flex', gap: 32, marginTop: 64, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
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

      {/* SECTION 2: PIPELINE (Navy Blue + Black Shadows) */}
      <section style={{ background: 'var(--accent)', color: 'white', padding: '140px 48px', position: 'relative' }}>
        
        {/* Slanted Section Divider (Slopes UP to the right) */}
        <svg viewBox="0 0 1440 120" style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: 'translateY(-99%)', zIndex: 0 }} preserveAspectRatio="none">
           <path fill="var(--accent)" d="M0,120 L1440,0 L1440,120 Z"></path>
        </svg>

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
              OPERATIONS PIPELINE
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 48, fontWeight: 400, lineHeight: 1.1 }}>
              High-Speed <span style={{ fontStyle: 'italic', fontWeight: 600 }}>Revision Process</span>
            </h2>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0' }}>
            
            {/* Card 1: Left */}
            <div className="hover-card hover-card-left" style={{ 
              width: 320, height: 340, background: '#ffffff', borderRadius: 24, border: '1px solid #e5e5e5',
              boxShadow: '6px 8px 0px #000000', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              transform: 'rotate(-5deg)', zIndex: 1, marginRight: '-30px', position: 'relative'
            }}>
              <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                SEAMLESS INTEGRATION
              </div>
              <div style={{ fontSize: 20, color: '#111', fontWeight: 600, textAlign: 'center', lineHeight: 1.3, marginBottom: 24, fontFamily: 'var(--font-heading)' }}>
                Instantly map<br/>any codebase
              </div>
              <svg width="160" height="160" viewBox="0 0 200 200" fill="none" stroke="#222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 'auto' }}>
                <path d="M30 60 h30 M30 60 v60 M30 90 h20 M30 120 h30" />
                <rect x="60" y="50" width="20" height="20" rx="4" fill="#fff" />
                <rect x="50" y="80" width="20" height="20" rx="4" fill="#fff" />
                <rect x="60" y="110" width="20" height="20" rx="4" fill="#fff" />
                
                <path d="M100 90 h20 l-5 -5 M120 90 l-5 5" stroke="#bbb" />
                
                <circle cx="160" cy="60" r="12" fill="#fff" />
                <circle cx="140" cy="110" r="12" fill="#fff" />
                <circle cx="180" cy="110" r="12" fill="#fff" />
                <path d="M160 72 v15 M160 87 h-20 v8 M160 87 h20 v8" />
              </svg>
            </div>

            {/* Card 2: Center */}
            <div className="hover-card hover-card-center" style={{ 
              width: 320, height: 340, background: '#ffffff', borderRadius: 24, border: '1px solid #e5e5e5',
              boxShadow: '6px 8px 0px #000000', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              transform: 'translateY(-20px)', zIndex: 2, position: 'relative'
            }}>
              <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                ADVANCED INTELLIGENCE
              </div>
              <div style={{ fontSize: 20, color: '#111', fontWeight: 600, textAlign: 'center', lineHeight: 1.3, marginBottom: 24, fontFamily: 'var(--font-heading)' }}>
                Deep structural<br/>code indexing
              </div>
              <svg width="160" height="160" viewBox="0 0 200 200" fill="none" stroke="#222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 'auto' }}>
                <rect x="40" y="40" width="80" height="100" rx="8" fill="#fff" />
                <path d="M40 60 h80" />
                <path d="M50 75 h20 M50 90 h40 M50 105 h30 M50 120 h15" strokeWidth="4" />
                
                <path d="M120 90 c 20 0, 20 -20, 40 -20" stroke="#bbb" strokeDasharray="4 4" />
                <path d="M120 90 c 20 0, 20 20, 40 20" stroke="#bbb" strokeDasharray="4 4" />
                
                <rect x="150" y="60" width="30" height="20" rx="4" fill="#222" stroke="none" />
                <rect x="150" y="100" width="30" height="20" rx="4" fill="#fff" />
              </svg>
            </div>

            {/* Card 3: Right */}
            <div className="hover-card hover-card-right" style={{ 
              width: 320, height: 340, background: '#ffffff', borderRadius: 24, border: '1px solid #e5e5e5',
              boxShadow: '6px 8px 0px #000000', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              transform: 'rotate(6deg)', zIndex: 1, marginLeft: '-30px', position: 'relative'
            }}>
              <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                INSTANT READINESS
              </div>
              <div style={{ fontSize: 20, color: '#111', fontWeight: 600, textAlign: 'center', lineHeight: 1.3, marginBottom: 24, fontFamily: 'var(--font-heading)' }}>
                Interactive mastery<br/>& export
              </div>
              <svg width="160" height="160" viewBox="0 0 200 200" fill="none" stroke="#222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 'auto' }}>
                <rect x="60" y="40" width="80" height="100" rx="8" fill="#e5e5e5" transform="rotate(10 100 90)" />
                <rect x="50" y="50" width="80" height="100" rx="8" fill="#ffffff" transform="rotate(-5 90 100)" />
                <rect x="70" y="60" width="80" height="100" rx="8" fill="#ffffff" />
                
                <path d="M85 85 h50" />
                <path d="M85 105 h30" />
                
                <circle cx="150" cy="140" r="16" fill="#222" stroke="none" />
                <path d="M143 140 l 5 5 l 10 -10" stroke="#fff" />
              </svg>
            </div>
          </div>
          
        </div>
      </section>

      {/* SECTION 3: CAPABILITIES TABLE (Dark) */}
      <section style={{ background: 'var(--surface-dark)', color: 'white', padding: '140px 48px', position: 'relative' }}>
        
        {/* Slanted Section Divider (Slopes DOWN to the right) */}
        <svg viewBox="0 0 1440 120" style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: 'translateY(-99%)', zIndex: 0 }} preserveAspectRatio="none">
           <path fill="var(--surface-dark)" d="M0,0 L1440,120 L0,120 Z"></path>
        </svg>

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
              SPECIFICATION SHEETS
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 48, fontWeight: 400, lineHeight: 1.1, color: '#ffffff' }}>
              Intelligence <span style={{ color: '#60a5fa', fontStyle: 'italic', fontWeight: 600 }}>Capabilities</span>
            </h2>
          </div>

          <div style={{ border: '1px solid #333', borderRadius: 8, overflow: 'hidden', background: '#0a0a0a' }}>
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
      </section>

      {/* SECTION 4: CTA PORTAL (Navy Blue) */}
      <section style={{ background: 'var(--accent)', color: 'white', padding: '120px 48px', position: 'relative', overflow: 'hidden' }}>
        
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 56, fontWeight: 400, lineHeight: 1.1, marginBottom: 24 }}>
            Ready to Master Your <span style={{ fontStyle: 'italic', fontWeight: 600 }}>Codebase?</span>
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 48, lineHeight: 1.6, maxWidth: 600, margin: '0 auto 48px auto' }}>
            Optimize your revision bandwidth. Sync your repository, generate documentation, and ace your viva presentations.
          </p>
          <button className="btn" style={{ background: 'white', color: 'var(--accent)', borderRadius: 4, padding: '18px 48px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none' }} onClick={() => navigate('/register')}>
            START FREE REVISION
          </button>
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
        </div>
      </footer>
    </div>
  );
}
