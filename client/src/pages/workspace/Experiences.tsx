import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getExperiences, addExperience } from '../../api/ai';
import { useState } from 'react';

interface Experience {
  id: string;
  experience_type: string;
  company_or_event: string;
  date: string;
  questions_asked: string[];
  feedback_received: string;
  what_went_wrong: string;
  created_at: string;
}

const EXP_TYPES = ['interview', 'hackathon', 'presentation'];
const typeColors: Record<string, string> = {
  interview: '#eff6ff',
  hackathon: '#f0fdf4',
  presentation: '#fefce8'
};

export default function Experiences() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    experience_type: 'interview',
    company_or_event: '',
    date: '',
    questions_asked: '',
    feedback_received: '',
    what_went_wrong: ''
  });

  const { data: experiences = [] } = useQuery({
    queryKey: ['experiences', projectId],
    queryFn: () => getExperiences(projectId!)
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addExperience(projectId!, {
        ...form,
        questions_asked: form.questions_asked.split('\n').filter(q => q.trim())
      });
      qc.invalidateQueries({ queryKey: ['experiences', projectId] });
      setShowForm(false);
      setForm({ experience_type: 'interview', company_or_event: '', date: '', questions_asked: '', feedback_received: '', what_went_wrong: '' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Experience Log</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Log experience</button>
      </div>
      <div className="page-content">
        <div style={{ marginBottom: 16, padding: '10px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 13 }}>
          💡 Log every interview, hackathon, and presentation. The AI uses this history to prepare you better next time.
        </div>

        {(experiences as Experience[]).length === 0 ? (
          <div className="empty-state">
            <p>No experiences logged yet.</p>
            <p style={{ marginTop: 8, fontSize: 12 }}>Log your first interview or hackathon to build your memory bank.</p>
          </div>
        ) : (
          (experiences as Experience[]).map(exp => (
            <div key={exp.id} className="card mb-4" style={{ borderLeft: '3px solid var(--accent)', background: typeColors[exp.experience_type] || 'white' }}>
              <div className="flex-between mb-4">
                <div>
                  <span className="tag" style={{ textTransform: 'capitalize', marginRight: 8 }}>{exp.experience_type}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{exp.company_or_event}</span>
                </div>
                <span className="text-muted">{exp.date ? new Date(exp.date).toLocaleDateString() : ''}</span>
              </div>

              {exp.questions_asked?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Questions asked</div>
                  {exp.questions_asked.map((q, i) => (
                    <div key={i} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>• {q}</div>
                  ))}
                </div>
              )}

              {exp.what_went_wrong && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--error)', marginBottom: 4 }}>What went wrong</div>
                  <p style={{ fontSize: 13, color: 'var(--text)' }}>{exp.what_went_wrong}</p>
                </div>
              )}

              {exp.feedback_received && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Feedback received</div>
                  <p style={{ fontSize: 13 }}>{exp.feedback_received}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h3>Log experience</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.experience_type}
                    onChange={e => setForm(f => ({ ...f, experience_type: e.target.value }))}>
                    {EXP_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Company / Event</label>
                  <input className="form-input" value={form.company_or_event}
                    onChange={e => setForm(f => ({ ...f, company_or_event: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Questions asked (one per line)</label>
                <textarea className="form-input" rows={4} value={form.questions_asked}
                  onChange={e => setForm(f => ({ ...f, questions_asked: e.target.value }))}
                  placeholder="Explain your authentication system&#10;Why did you choose PostgreSQL?&#10;How would you scale this?" />
              </div>
              <div className="form-group">
                <label className="form-label">What went wrong / what you couldn't answer</label>
                <textarea className="form-input" rows={3} value={form.what_went_wrong}
                  onChange={e => setForm(f => ({ ...f, what_went_wrong: e.target.value }))}
                  placeholder="I couldn't explain the database indexing strategy clearly..." />
              </div>
              <div className="form-group">
                <label className="form-label">Feedback received</label>
                <textarea className="form-input" rows={3} value={form.feedback_received}
                  onChange={e => setForm(f => ({ ...f, feedback_received: e.target.value }))}
                  placeholder="They liked the Terraform setup but wanted more test coverage..." />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
