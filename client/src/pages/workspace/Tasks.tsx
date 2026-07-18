import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask, deleteTask } from '../../api/projects';
import { useStore } from '../../store/useStore';
import { useEffect, useState } from 'react';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];


interface Task {
  id: string; title: string; description?: string;
  status: string; priority: string; assigned_to_name?: string; created_at: string; due_date?: string;
}

export default function Tasks() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const { token } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' });
  const [creating, setCreating] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => getTasks(projectId!)
  });

  // SSE — live board updates
  useEffect(() => {
    if (!projectId || !token) return;
    const es = new EventSource(`/api/projects/${projectId}/events?token=${token}`);
    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (['task_created', 'task_updated', 'task_deleted'].includes(event.type)) {
        qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      }
    };
    return () => es.close();
  }, [projectId, token, qc]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createTask(projectId!, form);
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      setShowForm(false);
      setForm({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' });
    } finally {
      setCreating(false);
    }
  }

  async function moveTask(task: Task, newStatus: string) {
    await updateTask(projectId!, task.id, { status: newStatus });
    qc.invalidateQueries({ queryKey: ['tasks', projectId] });
  }

  async function handleDelete(taskId: string) {
    await deleteTask(projectId!, taskId);
    qc.invalidateQueries({ queryKey: ['tasks', projectId] });
  }

  const byStatus = (status: string) => tasks.filter((t: Task) => t.status === status);



  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Tasks</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm(f => ({ ...f, status: 'todo' })); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New task
        </button>
      </div>

      <div className="kanban">
        {COLUMNS.map(col => (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span className="kanban-col-title" style={{ fontWeight: 600 }}>{col.label}</span>
                <span className="kanban-count" style={{ marginLeft: 8, background: '#e2e8f0', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{byStatus(col.key).length}</span>
              </div>
              <button 
                onClick={() => { setForm(f => ({ ...f, status: col.key })); setShowForm(true); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                title={`Add task to ${col.label}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>
            {byStatus(col.key).map((task: Task) => (
              <div key={task.id} className="task-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="task-title" style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{task.title}</div>
                {task.description && <div className="task-meta mt-1" style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{task.description}</div>}
                {task.due_date && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {new Date(task.due_date).toLocaleDateString()}
                </div>}
                <div className="flex-between mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`priority-badge priority-${task.priority}`} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: task.priority === 'high' ? '#fee2e2' : task.priority === 'medium' ? '#fef3c7' : '#f1f5f9', color: task.priority === 'high' ? '#b91c1c' : task.priority === 'medium' ? '#b45309' : '#475569' }}>{task.priority.toUpperCase()}</span>
                  {task.assigned_to_name && <span className="task-meta" style={{ fontSize: 12, color: '#64748b' }}>{task.assigned_to_name}</span>}
                </div>
                <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                  {COLUMNS.filter(c => c.key !== col.key).map(c => (
                    <button key={c.key} className="btn btn-secondary btn-sm"
                      onClick={() => moveTask(task, c.key)}
                      style={{ fontSize: 10 }}>
                      → {c.label}
                    </button>
                  ))}
                  {col.key !== 'backlog' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => moveTask(task, 'backlog')} style={{ fontSize: 10 }}>
                      → Backlog
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}
                    style={{ fontSize: 10, background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '4px 8px', borderRadius: 4 }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 48 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>Backlog</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {byStatus('backlog').map((task: Task) => (
            <div key={task.id} className="task-card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: 16 }}>
              <div className="task-title" style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{task.title}</div>
              {task.description && <div className="task-meta mt-1" style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{task.description}</div>}
              {task.due_date && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {new Date(task.due_date).toLocaleDateString()}
              </div>}
              <div className="flex-between mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`priority-badge priority-${task.priority}`} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: task.priority === 'high' ? '#fee2e2' : task.priority === 'medium' ? '#fef3c7' : '#f1f5f9', color: task.priority === 'high' ? '#b91c1c' : task.priority === 'medium' ? '#b45309' : '#475569' }}>{task.priority.toUpperCase()}</span>
                {task.assigned_to_name && <span className="task-meta" style={{ fontSize: 12, color: '#64748b' }}>{task.assigned_to_name}</span>}
              </div>
              <div className="flex gap-2 mt-3" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLUMNS.map(c => (
                  <button key={c.key} onClick={() => moveTask(task, c.key)} style={{ fontSize: 10, background: '#e2e8f0', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>
                    → {c.label}
                  </button>
                ))}
                <button onClick={() => handleDelete(task.id)} style={{ fontSize: 10, background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
          <div 
            onClick={() => { setForm(f => ({ ...f, status: 'backlog' })); setShowForm(true); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: 16, cursor: 'pointer', color: '#64748b', fontWeight: 600 }}
          >
            + Add Backlog Task
          </div>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500, padding: 32, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>New task</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Title</label>
                <input style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 15 }} value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Task title..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Description</label>
                <textarea style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 15, minHeight: 80 }} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="More details..." />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Priority</label>
                  <select style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 15 }} value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Due Date</label>
                  <input type="date" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 15 }} value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 6, color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={creating} style={{ padding: '10px 16px', background: '#2563eb', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  {creating ? 'Creating...' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
