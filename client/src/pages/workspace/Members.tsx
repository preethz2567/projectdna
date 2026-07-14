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
  status: string;
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
                <th>Status</th>
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
                  <td>
                    {m.status === 'pending' ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: 12 }}>Pending</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 12 }}>Active</span>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#FFFFFF', border: `1px solid var(--border)`, padding: 48, borderRadius: 0, width: '100%', maxWidth: 500, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 600, color: 'var(--text)', marginBottom: 32 }}>Invite Member</h3>
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required style={{ width: '100%', padding: '12px 16px', border: `1px solid var(--border)`, background: 'white', color: '#000', borderRadius: 0, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Project Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ width: '100%', padding: '12px 16px', border: `1px solid var(--border)`, background: 'white', color: '#000', borderRadius: 0, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                  <option value="member" style={{ background: 'white', color: '#000' }}>Team Mate</option>
                  <option value="mentor" style={{ background: 'white', color: '#000' }}>Mentor</option>
                </select>
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid var(--border)`, borderRadius: 0, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cancel</button>
                <button type="submit" disabled={inviting} style={{ flex: 1, padding: '12px', background: 'var(--accent)', border: 'none', borderRadius: 0, fontWeight: 600, color: 'white', cursor: 'pointer', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
