import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProject } from '../../api/projects';
import { getTimeline, generateArchitecture } from '../../api/ai';
import { useState } from 'react';

export default function Overview() {
  const { projectId } = useParams<{ projectId: string }>();
  const [arch, setArch] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: project } = useQuery({ queryKey: ['project', projectId], queryFn: () => getProject(projectId!) });
  const { data: timeline } = useQuery({ queryKey: ['timeline', projectId], queryFn: () => getTimeline(projectId!) });

  async function handleGenerateArch() {
    setLoading(true);
    try {
      const r = await generateArchitecture(projectId!);
      setArch(r.explanation);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Overview</h2>
      </div>
      <div className="page-content">
        <div className="card mb-4">
          <div className="card-header">
            <span className="card-title">Project</span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{project?.title}</h3>
          <p className="text-muted mt-1">{project?.description}</p>
          {project?.vision && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: '#eff6ff', borderLeft: '3px solid var(--accent)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>Vision</span>
              <p style={{ fontSize: 13, marginTop: 4 }}>{project.vision}</p>
            </div>
          )}
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <span className="card-title">Architecture</span>
            <button className="btn btn-secondary btn-sm" onClick={handleGenerateArch} disabled={loading}>
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {arch ? (
            <div className="markdown" dangerouslySetInnerHTML={{ __html: arch.replace(/\n/g, '<br/>') }} />
          ) : (
            <p className="text-muted">Click Generate to get an AI-powered architecture explanation.</p>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Recent Activity</span></div>
          {timeline?.slice(0, 5).map((e: { id: string; title: string; description?: string; created_at: string }) => (
            <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</div>
                {e.description && <div className="text-muted mt-1">{e.description}</div>}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(e.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
