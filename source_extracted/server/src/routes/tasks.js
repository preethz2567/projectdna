const router = require('express').Router({ mergeParams: true });
const pool = require('../db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');
const { broadcast } = require('../sse');

router.get('/', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.display_name as assigned_to_name, c.display_name as created_by_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users c ON t.created_by = c.id
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [req.params.projectId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const { title, description, priority, assigned_to, due_date } = req.body;
    const result = await pool.query(
      'INSERT INTO tasks (project_id, title, description, priority, assigned_to, due_date, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.params.projectId, title, description, priority || 'medium', assigned_to || null, due_date || null, req.user.id]
    );
    broadcast(req.params.projectId, { type: 'task_created', task: result.rows[0] });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:taskId', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const { status, title, description, priority, assigned_to } = req.body;
    const result = await pool.query(
      `UPDATE tasks SET
        status = COALESCE($1, status),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        priority = COALESCE($4, priority),
        assigned_to = COALESCE($5, assigned_to),
        updated_at = NOW()
       WHERE id = $6 AND project_id = $7 RETURNING *`,
      [status, title, description, priority, assigned_to, req.params.taskId, req.params.projectId]
    );
    broadcast(req.params.projectId, { type: 'task_updated', task: result.rows[0] });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:taskId', authenticate, requireProjectAccess, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1 AND project_id = $2', [req.params.taskId, req.params.projectId]);
    broadcast(req.params.projectId, { type: 'task_deleted', taskId: req.params.taskId });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
