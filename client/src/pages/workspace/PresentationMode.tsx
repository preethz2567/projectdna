import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProject, getRepo } from '../../api/projects';
import { getHealthScore } from '../../api/ai';
import { useState, useEffect } from 'react';

export default function PresentationMode() {
  const { projectId } = useParams<{ projectId: string }>();
  const [fullscreen, setFullscreen] = useState(false);

  const { data: project } = useQuery({ queryKey: ['project', projectId], queryFn: () => getProject(projectId!) });
  const { data: repo } = useQuery({ queryKey: ['repo', projectId], queryFn: () => getRepo(projectId!) });
  const { data: health } = useQuery({ queryKey: ['health', projectId], queryFn: () => getHealthScore(projectId!) });

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFullscreen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const content = (
    <div style={{
      background: fullscreen ? '#0a0a0a' : 'white',
      color: fullscreen ? 'white' : 'var(--text)',
      minHeight: fullscreen ? '100vh' : 'auto',
      padding: fullscreen ? '4rem 6rem' : '1.5rem',
      transition: 'all 0.2s'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ fontSize: fullscreen ? '0.9rem' : '0.75rem', color: '#2563eb', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          ProjectDNA · Project Overview
        </div>
        <h1 style={{ fontSize: fullscreen ? '3rem' : '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {project?.title}
        </h1>
        <p style={{ fontSize: fullscreen ? '1.1rem' : '0.9rem', color: fullscreen ? '#94a3b8' : 'var(--text-muted)', marginTop: 12, maxWidth: 600 }}>
          {project?.description}
        </p>
      </div>

      {/* Vision */}
      {project?.vision && (
        <div style={{ marginBottom: '2rem', padding: '16px 20px', borderLeft: '4px solid #2563eb', background: fullscreen ? '#1e293b' : '#eff6ff' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Vision</div>
          <p style={{ fontSize: fullscreen ? '1rem' : '0.875rem', lineHeight: 1.6 }}>{project.vision}</p>
        </div>
      )}

      {/* Tech stack */}
      {repo?.tech_stack && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: fullscreen ? '#64748b' : 'var(--text-muted)', marginBottom: 12 }}>Tech Stack</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(repo.tech_stack as string[]).map((t: string) => (
              <span key={t} style={{
                padding: '4px 12px', fontSize: 12, fontWeight: 500,
                background: fullscreen ? '#1e293b' : '#eff6ff',
                color: '#2563eb', border: '1px solid #3b82f6'
              }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Health score */}
      {health && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: fullscreen ? '#64748b' : 'var(--text-muted)', marginBottom: 12 }}>
            Project Health Score
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              fontSize: fullscreen ? '3rem' : '2rem', fontWeight: 800,
              color: health.score >= 70 ? '#16a34a' : health.score >= 40 ? '#d97706' : '#dc2626'
            }}>
              {health.score}
            </div>
            <div style={{ flex: 1, height: 8, background: fullscreen ? '#1e293b' : '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${health.score}%`,
                background: health.score >= 70 ? '#16a34a' : health.score >= 40 ? '#d97706' : '#dc2626',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ fontSize: 12, color: fullscreen ? '#64748b' : 'var(--text-muted)' }}>/100</div>
          </div>
        </div>
      )}

      {/* GitHub */}
      {repo?.github_url && (
        <div style={{ fontSize: fullscreen ? '1rem' : '0.875rem', color: fullscreen ? '#64748b' : 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
          {repo.github_url}
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
        {content}
        <button
          onClick={() => setFullscreen(false)}
          style={{ position: 'fixed', top: 20, right: 20, background: '#333', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
          Exit (Esc)
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Presentation Mode</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setFullscreen(true)}>
          ▶ Enter presentation mode
        </button>
      </div>
      {content}
    </div>
  );
}
