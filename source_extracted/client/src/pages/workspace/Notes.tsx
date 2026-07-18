import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

interface Note {
  id: string; title: string; content: string; created_at: string; updated_at: string;
}

export default function Notes() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Note | null>(null);

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', projectId],
    queryFn: () => api.get(`/projects/${projectId}/ai/notes`).then(r => r.data)
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/projects/${projectId}/ai/notes`, form);
      qc.invalidateQueries({ queryKey: ['notes', projectId] });
      setShowForm(false);
      setForm({ title: '', content: '' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    await api.delete(`/projects/${projectId}/ai/notes/${noteId}`);
    qc.invalidateQueries({ queryKey: ['notes', projectId] });
    if (selected?.id === noteId) setSelected(null);
  }

  return (
    <div>
      <div className="page-header">
        <h2>Notes</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New note</button>
      </div>
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Notes list */}
        <div style={{ width: 240, borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
          {(notes as Note[]).length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No notes yet
            </div>
          ) : (
            (notes as Note[]).map(note => (
              <div key={note.id}
                style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selected?.id === note.id ? '#eff6ff' : 'transparent', borderLeft: selected?.id === note.id ? '2px solid var(--accent)' : '2px solid transparent' }}
                onClick={() => setSelected(note)}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{note.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(note.updated_at).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>

        {/* Note content */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {selected ? (
            <>
              <div className="flex-between mb-4">
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{selected.title}</h3>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              </div>
              <pre style={{ fontFamily: 'var(--font)', fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {selected.content}
              </pre>
            </>
          ) : (
            <div className="empty-state"><p>Select a note to read it</p></div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <h3>New note</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea className="form-input" rows={8} value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Your notes, observations, decisions, anything..." />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
