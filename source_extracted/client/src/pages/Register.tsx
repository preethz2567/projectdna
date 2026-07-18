import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { register } from '../api/auth';
import { motion } from 'framer-motion';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const data = await register({ email, password, display_name: email.split('@')[0] });
      setUser(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#ffffff' }}>

      {/* Left Column: 55% Width, Centers the Form */}
      <div style={{ flex: '0 0 55%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ width: '100%', maxWidth: 460 }}
        >
          <div style={{
            background: '#ffffff',
            borderRadius: 16, border: '1px solid #cbd5e1',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 40px rgba(0,0,0,0.08)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Mac-style Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                NEW ACCOUNT
              </div>
            </div>

            <div style={{ padding: '48px 48px' }}>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 400, color: '#0f172a', marginBottom: 8 }}>
                  Join <span style={{ color: 'var(--accent)', fontStyle: 'italic', fontWeight: 600 }}>ProjectDNA</span>
                </h2>
                <p style={{ fontSize: 15, color: '#64748b' }}>Create an account to supercharge your development with AI-driven codebase intelligence.</p>
              </div>

              {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: 4, marginBottom: 24, fontSize: 14, textAlign: 'center', border: '1px solid #fca5a5' }}>{error}</div>}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: 8 }}>EMAIL ADDRESS</label>
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="engineer@company.com"
                      required
                      style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, color: '#0f172a', background: '#ffffff', outline: 'none', transition: 'border 0.2s' }}
                      onFocus={(e) => e.target.style.border = '2px solid var(--accent)'}
                      onBlur={(e) => e.target.style.border = '1px solid #cbd5e1'}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: 8 }}>PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, color: '#0f172a', background: '#ffffff', letterSpacing: '0.05em', outline: 'none', transition: 'border 0.2s' }}
                      onFocus={(e) => e.target.style.border = '2px solid var(--accent)'}
                      onBlur={(e) => e.target.style.border = '1px solid #cbd5e1'}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', marginBottom: 8 }}>CONFIRM PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, color: '#0f172a', background: '#ffffff', letterSpacing: '0.05em', outline: 'none', transition: 'border 0.2s' }}
                      onFocus={(e) => e.target.style.border = '2px solid var(--accent)'}
                      onBlur={(e) => e.target.style.border = '1px solid #cbd5e1'}
                    />
                  </div>
                </div>

                <button type="submit" className="btn" style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '16px', borderRadius: 8, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'transform 0.2s' }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  INITIALIZE ACCOUNT <span style={{ fontSize: 18 }}>→</span>
                </button>
              </form>
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 'auto' }}>
              Already have an account? <span onClick={() => navigate('/login')} style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Sign In</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column: 45% Width, Centers the Image */}
      <div className="hidden-mobile" style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          style={{ width: '100%', maxWidth: 700, position: 'relative', marginLeft: '-90px' }}
        >
          <motion.div
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: '100%', position: 'relative' }}
          >
            {/* Pastel blue watercolor background effect */}
            <div style={{
              position: 'absolute',
              top: '5%',
              left: '10%',
              width: '100%',
              height: '90%',
              background: '#74c0e7ff',
              filter: 'blur(80px)',
              zIndex: -1,
              opacity: 0.3,
              borderRadius: '50%',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '10%',
              right: '15%',
              width: '100%',
              height: '90%',
              background: '#a0c9deff',
              filter: 'blur(80px)',
              zIndex: -1,
              opacity: 0.3,
              borderRadius: '50%',
            }} />

            <img
              src="/login.webp"
              alt="Platform Preview"
              style={{
                width: '100%', height: 'auto',
                border: 'none',
                boxShadow: 'none',
                mixBlendMode: 'multiply'
              }}
            />
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
}
