const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

async function requireProjectAccess(req, res, next) {
  const pool = require('../db');
  const { projectId } = req.params;
  const result = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, req.user.id]
  );
  console.log(`[AUTH DEBUG] requireProjectAccess check: projectId=${projectId}, userId=${req.user.id}, rows=${result.rows.length}`);
  if (result.rows.length === 0) return res.status(403).json({ error: 'No project access' });
  req.projectRole = result.rows[0].role;
  next();
}

module.exports = { authenticate, authorize, requireProjectAccess };
