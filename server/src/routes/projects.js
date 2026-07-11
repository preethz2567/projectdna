const router = require('express').Router();
const pool = require('../db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, vision } = req.body;
    const project = await pool.query(
      'INSERT INTO projects (owner_id, title, description, vision) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, description, vision]
    );
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.rows[0].id, req.user.id, 'owner']
    );
    await pool.query(
      'INSERT INTO timeline_events (project_id, event_type, title, created_by) VALUES ($1, $2, $3, $4)',
      [project.rows[0].id, 'project_created', 'Project created', req.user.id]
    );
    res.status(201).json(project.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pm.role as member_role
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1
       ORDER BY p.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:projectId', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const project = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.projectId]);
    const members = await pool.query(
      `SELECT u.id, u.display_name, u.email, u.role as user_role, pm.role as project_role
       FROM project_members pm JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [req.params.projectId]
    );
    res.json({ ...project.rows[0], members: members.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:projectId/members', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const lowerEmail = email.toLowerCase().trim();
    // Default to 'member' if the provided role isn't allowed in DB constraint
    const dbRole = ['owner', 'member', 'mentor'].includes(role) ? role : 'member';
    
    const user = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [lowerEmail]);
    if (!user.rows[0]) return res.status(404).json({ error: 'User not found. They must register first.' });
    
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO NOTHING',
      [req.params.projectId, user.rows[0].id, dbRole]
    );
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
