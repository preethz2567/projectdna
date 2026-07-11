import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeedback, addFeedback } from '../../api/ai';
import { useState } from 'react';

interface Feedback {
  id: string; category: string; content: string; author_name: string; created_at: string;
}

const CATEGORIES = ['architecture', 'security', 'performance', 'code_quality', 'general'];

export default function Feedback() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'general', content: '' });
  const [saving, setSaving] = useState(false);

  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback', projectId],
    queryFn: () => getFeedback(projectId!)
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addFeedback(projectId!, form);
      qc.invalidateQueries({ queryKey: ['feedback', projectId] });
      setShowForm(false);
      setForm({ category: 'general', content: '' });
    } finally {
      setSaving(false);
    }
  }

  const categoryColor: Record<string, string> = {
    architecture: '#eff6ff', security: '#fef2f2', performance: '#f0fdf4',
    code_quality: '#fefce8', general: '#f8fafc'
  };

  return (
    <div>
      <div className="page-header">
        <h2>Feedback</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add feedback</button>
      </div>
      <div className="page-content">
        {(feedback as Feedback[]).length === 0 ? (
          <div className="empty-state"><p>No feedback yet. Mentors can add structured feedback here.</p></div>
        ) : (
          (feedback as Feedback[]).map(f => (
            <div key={f.id} className="card mb-4" style={{ borderLeft: '3px solid var(--accent)', background: categoryColor[f.category] || 'white' }}>
              <div className="flex-between mb-4">
                <span className="tag" style={{ textTransform: 'capitalize' }}>{f.category}</span>
                <span className="text-muted">{f.author_name} · {new Date(f.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{f.content}</p>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add feedback</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Feedback</label>
                <textarea className="form-input" rows={5} value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required
                  placeholder="Detailed feedback, suggestions, or observations..." />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
