import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listProjects } from '../api/projects';
import api from '../api/client';
import { useStore } from '../store/useStore';

interface Recommendation {
  title: string;
  description: string;
  why: string;
  new_concept: string;
  difficulty: string;
  tech_stack: string[];
}

const difficultyColor: Record<string, string> = {
  beginner: '#10b981',     // emerald
  intermediate: '#f59e0b', // amber
  advanced: '#ef4444'      // red
};

export default function Recommendations() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useStore();
  const navigate = useNavigate();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects
  });

  async function handleGenerate() {
    setLoading(true);
    try {
      // Use the first project's ID just to hit the authenticated route
      const firstProject = (projects as { id: string }[])[0];
      if (!firstProject) return;
      const r = await api.post(`/projects/${firstProject.id}/ai/recommendations`, {}).then(res => res.data);
      setRecs(r.recommendations || []);
    } finally {
      setLoading(false);
    }
  }

  const theme = {
    bgApp: '#F8FAFC',
    bgPanel: '#2C3338',
    textMain: 'var(--text)',
    accent: 'var(--accent)',
  };

  const SparkleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
  );

  return (
    <div style={{ minHeight: '100vh', background: theme.bgApp, fontFamily: 'var(--font-sans)', color: theme.textMain }}>
      {/* Top Header */}
      <div style={{ height: 64, background: theme.bgPanel, borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Dashboard
          </button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>AI Recommendations</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>{user?.display_name}</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'white', color: theme.bgPanel, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, overflow: 'hidden' }}>
               {user?.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" /> : (user?.display_name?.charAt(0).toUpperCase() || 'U')}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'var(--pill-bg)', color: theme.accent, borderRadius: '50%', marginBottom: 24 }}>
            <SparkleIcon />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', marginBottom: 16, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            What should you build next?
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Based on the {(projects as unknown[]).length} project{(projects as unknown[]).length !== 1 ? 's' : ''} in your workspace, our AI analyzes your skill progression and suggests personalized projects to level up your abilities.
          </p>
          
          <div style={{ marginTop: 32 }}>
            <button 
              onClick={handleGenerate} 
              disabled={loading || (projects as unknown[]).length === 0}
              style={{ background: theme.accent, color: 'white', border: 'none', padding: '16px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: (loading || (projects as unknown[]).length === 0) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'inline-flex', alignItems: 'center', gap: 12, opacity: (loading || (projects as unknown[]).length === 0) ? 0.7 : 1 }}
              onMouseOver={e => { if(!loading && (projects as unknown[]).length > 0) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
              onMouseOut={e => { if(!loading && (projects as unknown[]).length > 0) e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Analyzing your architecture...
                </>
              ) : (
                <>
                  <SparkleIcon />
                  Generate Ideas
                </>
              )}
            </button>
            {(projects as unknown[]).length === 0 && (
              <p style={{ marginTop: 16, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>Create at least one project first to get personalized recommendations.</p>
            )}
          </div>
        </div>

        {/* Recommendations List */}
        {recs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {recs.map((rec, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                   onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; }}
                   onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: 'var(--font-heading)' }}>{rec.title}</h3>
                  <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: difficultyColor[rec.difficulty] || '#64748b', border: `1px solid ${difficultyColor[rec.difficulty] || '#64748b'}40`, background: `${difficultyColor[rec.difficulty] || '#64748b'}10` }}>
                    {rec.difficulty}
                  </span>
                </div>
                
                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
                  {rec.description}
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: theme.accent }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Why this project?</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6 }}>{rec.why}</p>
                  </div>
                  
                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#8b5cf6' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Core Learning Concept</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{rec.new_concept}</p>
                  </div>
                </div>

                {rec.tech_stack?.length > 0 && (
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>Suggested Tech Stack</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {rec.tech_stack.map((t: string) => (
                        <span key={t} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#334155', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
