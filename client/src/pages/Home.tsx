import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useStore();

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      
      {/* Editorial Navbar (White) */}
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 48px', height: 80, background: '#ffffff', 
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 24, height: 24, background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>P</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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

      {/* SECTION 1: HERO (White) */}
      <section style={{ background: '#ffffff', padding: '140px 48px', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64 }}>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--accent)', 
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24,
              border: '1px solid var(--border)', padding: '6px 12px', display: 'inline-block',
              background: '#fafafa'
            }}>
              PROJECTDNA REVISION SYSTEM
            </div>
            
            <h1 style={{ 
              fontFamily: 'var(--font-heading)', fontSize: '84px', color: 'var(--text)', 
              letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 32, fontWeight: 400 
            }}>
              Codebase Mastery,<br/>
              <span style={{ color: 'var(--accent)', fontStyle: 'italic', fontWeight: 700 }}>Automated.</span>
            </h1>
            
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 500, marginBottom: 48, fontWeight: 400 }}>
              Stop manually tracing thousands of lines of code before a presentation. Let AI analyze your repository, generate architecture diagrams, and test your knowledge in seconds.
            </p>
            
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
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
          
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
            {/* The user's requested SVG goes here */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '24px', borderRadius: 12, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)' }}>
              <img 
                src="/hero.webp" 
                alt="Developer Illustration" 
                style={{ width: '100%', maxWidth: 500, height: 'auto', display: 'block' }} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PIPELINE (Black) */}
      <section style={{ background: 'var(--surface-dark)', color: 'white', padding: '140px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', gap: 120, marginBottom: 80 }}>
            <div style={{ flex: '0 0 350px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                OPERATIONS
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 48, fontWeight: 400, lineHeight: 1.1, marginBottom: 24 }}>
                High-Speed<br/>
                <span style={{ color: 'var(--accent)', fontStyle: 'italic', fontWeight: 600 }}>Revision Pipeline</span>
              </h2>
              <p style={{ fontSize: 15, color: '#a3a3a3', lineHeight: 1.6 }}>
                Our intelligence engine ingests your entire repository and transforms raw files into structured learning material in three sequential stages.
              </p>
            </div>
            
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
              {[
                { step: '01', title: 'Connect Repository', desc: 'Securely authenticate and point the engine to your codebase. Supports local and remote repos.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> },
                { step: '02', title: 'Automated Analysis', desc: 'Our AI reads schemas, traces data flows, and indexes business logic across all files.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg> },
                { step: '03', title: 'Study & Export', desc: 'Review flashcards, visualize architecture maps, and export interview prep decks.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg> }
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid #262626', paddingBottom: 16 }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: 40, color: '#404040' }}>{s.step}</span>
                    <div style={{ width: 32, height: 32, background: '#171717', border: '1px solid #262626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#737373', borderRadius: 4 }}>
                      {s.icon}
                    </div>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </section>

      {/* SECTION 3: CAPABILITIES TABLE (White) */}
      <section style={{ background: '#ffffff', padding: '140px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
              SPECIFICATION SHEETS
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 48, fontWeight: 400, lineHeight: 1.1 }}>
              Intelligence <span style={{ color: 'var(--accent)', fontStyle: 'italic', fontWeight: 600 }}>Capabilities</span>
            </h2>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 3fr', padding: '16px 24px', background: '#fafafa', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 3fr', padding: '24px', borderBottom: i === 3 ? 'none' : '1px solid var(--border)', alignItems: 'center', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = '#fafafa'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{row.id}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{row.title}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{row.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

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
