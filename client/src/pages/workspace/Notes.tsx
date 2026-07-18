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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500, padding: 32, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>New note</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Title</label>
                <input style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 15 }} value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Note title..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Content</label>
                <textarea style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 15, minHeight: 120, fontFamily: 'var(--font)' }} value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Your notes, observations, decisions, anything..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 6, color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 16px', background: '#2563eb', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
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
