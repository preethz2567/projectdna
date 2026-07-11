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
  status: string; priority: string; assigned_to_name?: string; created_at: string;
}

export default function Tasks() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const { token } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' });
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
      setForm({ title: '', description: '', priority: 'medium' });
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
      <div className="page-header">
        <h2>Tasks</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New task</button>
      </div>

      <div className="kanban">
        {COLUMNS.map(col => (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-header">
              <span className="kanban-col-title">{col.label}</span>
              <span className="kanban-count">{byStatus(col.key).length}</span>
            </div>
            {byStatus(col.key).map((task: Task) => (
              <div key={task.id} className="task-card">
                <div className="task-title">{task.title}</div>
                {task.description && <div className="task-meta mt-1">{task.description}</div>}
                <div className="flex-between mt-2">
                  <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                  {task.assigned_to_name && <span className="task-meta">{task.assigned_to_name}</span>}
                </div>
                <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                  {COLUMNS.filter(c => c.key !== col.key).map(c => (
                    <button key={c.key} className="btn btn-secondary btn-sm"
                      onClick={() => moveTask(task, c.key)}
                      style={{ fontSize: 10 }}>
                      → {c.label}
                    </button>
                  ))}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}
                    style={{ fontSize: 10 }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>New task</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
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
