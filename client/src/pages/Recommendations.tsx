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
  beginner: 'var(--success)',
  intermediate: 'var(--in-progress)',
  advanced: 'var(--error)'
};

export default function Recommendations() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const { logout, user } = useStore();
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

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          <span style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }} onClick={() => navigate('/dashboard')}>← Dashboard</span>
          <span style={{ fontWeight: 700, fontSize: 15, marginLeft: 8 }}>Project Recommendations</span>
        </div>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          <span className="text-muted">{user?.display_name}</span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>What to build next</h1>
          <p className="text-muted mt-1">
            Based on your {(projects as unknown[]).length} project{(projects as unknown[]).length !== 1 ? 's' : ''}, the AI suggests these ideas tailored to your skill progression.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || (projects as unknown[]).length === 0}>
          {loading ? 'Analyzing your projects...' : '⚡ Generate recommendations'}
        </button>

        {(projects as unknown[]).length === 0 && (
          <p className="text-muted mt-4">Create at least one project first to get personalized recommendations.</p>
        )}

        {recs.length > 0 && (
          <div style={{ marginTop: 24 }}>
            {recs.map((rec, i) => (
              <div key={i} className="card mb-4">
                <div className="flex-between mb-4">
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>{rec.title}</h3>
                  <span style={{ fontSize: 11, fontWeight: 600, color: difficultyColor[rec.difficulty] || 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {rec.difficulty}
                  </span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{rec.description}</p>
                <div style={{ padding: '8px 12px', background: '#eff6ff', borderLeft: '3px solid var(--accent)', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>Why this for you</span>
                  <p style={{ fontSize: 13, marginTop: 4 }}>{rec.why}</p>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>New concept you'd learn</span>
                  <p style={{ fontSize: 13, marginTop: 4, fontWeight: 500 }}>{rec.new_concept}</p>
                </div>
                {rec.tech_stack?.length > 0 && (
                  <div className="flex" style={{ flexWrap: 'wrap', gap: 6 }}>
                    {rec.tech_stack.map((t: string) => <span key={t} className="tag">{t}</span>)}
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
