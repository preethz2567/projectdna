import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProject, inviteMember } from '../../api/projects';
import { useState } from 'react';

interface Member {
  id: string;
  display_name: string;
  email: string;
  user_role: string;
  project_role: string;
}

export default function Members() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'member' });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!)
  });

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError('');
    try {
      await inviteMember(projectId!, form.email, form.role);
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      setShowForm(false);
      setForm({ email: '', role: 'member' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || 'Failed to invite member. Make sure they are registered.');
    } finally {
      setInviting(false);
    }
  }

  const members = project?.members || [];

  return (
    <div>
      <div className="page-header">
        <h2>Team Members</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Invite Member</button>
      </div>
      <div className="page-content">
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: Member) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{m.display_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.user_role}</div>
                  </td>
                  <td>{m.email}</td>
                  <td>
                    <span className="tag" style={{ textTransform: 'capitalize' }}>{m.project_role}</span>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Invite Member</h3>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Project Role</label>
                <select className="form-input" value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="member">Member</option>
                  <option value="mentor">Mentor</option>
                </select>
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={inviting}>
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
