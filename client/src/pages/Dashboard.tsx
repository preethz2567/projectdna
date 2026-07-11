import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, createProject } from '../api/projects';
import { useStore } from '../store/useStore';

interface Project {
  id: string; title: string; description: string;
  vision: string; status: string; created_at: string; member_role: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', vision: '' });
  const [loading, setLoading] = useState(false);
  const { user, logout } = useStore();
  const navigate = useNavigate();

  useEffect(() => { listProjects().then(setProjects); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const p = await createProject(form);
      setProjects(prev => [p, ...prev]);
      setShowModal(false);
      setForm({ title: '', description: '', vision: '' });
      navigate(`/projects/${p.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top nav */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>ProjectDNA</span>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          <span className="text-muted">{user?.display_name}</span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Projects</h1>
            <p className="text-muted mt-1">Your project workspaces</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New project</button>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            <p>No projects yet. Create your first one.</p>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map(p => (
              <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                <h3>{p.title}</h3>
                <p>{p.description || 'No description'}</p>
                <div className="project-meta">
                  {p.member_role} · {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>New project</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Your vision for this project</label>
                <textarea className="form-input" value={form.vision}
                  onChange={e => setForm(f => ({ ...f, vision: e.target.value }))}
                  placeholder="What problem does it solve? What are you trying to learn?" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
