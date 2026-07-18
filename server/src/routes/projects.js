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
      "INSERT INTO project_members (project_id, user_id, role, status) VALUES ($1, $2, $3, 'accepted')",
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
       WHERE pm.user_id = $1 AND pm.status = 'accepted'
       ORDER BY p.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invitations/pending', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id as project_id, p.title as project_title, pm.role, p.owner_id, u.display_name as inviter_name
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       JOIN users u ON p.owner_id = u.id
       WHERE pm.user_id = $1 AND pm.status = 'pending'`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/invitations/:projectId/accept', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE project_members SET status = 'accepted' WHERE project_id = $1 AND user_id = $2 RETURNING role",
      [req.params.projectId, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Invitation not found.' });
    
    await pool.query(
      'INSERT INTO timeline_events (project_id, event_type, title, created_by) VALUES ($1, $2, $3, $4)',
      [req.params.projectId, 'member_joined', `${req.user.display_name} joined the project as a ${result.rows[0].role}`, req.user.id]
    );

    // Notify project owner
    const project = await pool.query('SELECT owner_id, title FROM projects WHERE id = $1', [req.params.projectId]);
    if (project.rows[0]) {
       await pool.query(
         'INSERT INTO notifications (user_id, type, content, project_id) VALUES ($1, $2, $3, $4)',
         [project.rows[0].owner_id, 'invite_accepted', `${req.user.display_name} accepted your invitation to join ${project.rows[0].title}.`, req.params.projectId]
       );
    }

    res.json({ message: 'Invitation accepted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/invitations/:projectId/decline', authenticate, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 AND status = 'pending'",
      [req.params.projectId, req.user.id]
    );
    const project = await pool.query('SELECT owner_id, title FROM projects WHERE id = $1', [req.params.projectId]);
    if (project.rows[0]) {
       await pool.query(
         'INSERT INTO notifications (user_id, type, content, project_id) VALUES ($1, $2, $3, $4)',
         [project.rows[0].owner_id, 'invite_declined', `${req.user.display_name} declined your invitation to join ${project.rows[0].title}.`, req.params.projectId]
       );
    }
    res.json({ message: 'Invitation declined' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:projectId', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const project = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.projectId]);
    const members = await pool.query(
      `SELECT u.id, u.display_name, u.email, u.role as user_role, pm.role as project_role, pm.status
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
      "INSERT INTO project_members (project_id, user_id, role, status) VALUES ($1, $2, $3, 'pending') ON CONFLICT (project_id, user_id) DO NOTHING",
      [req.params.projectId, user.rows[0].id, dbRole]
    );
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:projectId', authenticate, requireProjectAccess, async (req, res) => {
  try {
    // Only the owner can delete
    const member = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.projectId, req.user.id]
    );
    if (!member.rows[0] || member.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only the project owner can delete this project.' });
    }
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.projectId]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
