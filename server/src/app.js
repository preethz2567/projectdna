const express = require('express');
const cors = require('cors');
const logger = require('./middleware/logger');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const githubRoutes = require('./routes/github');
const taskRoutes = require('./routes/tasks');
const sseRoutes = require('./routes/sse');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');

const app = express();

const crypto = require('crypto');

app.post('/api/webhook/github', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const secret = process.env.GITHUB_WEBHOOK_SECRET || 'projectdna-webhook-secret';
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(req.body).digest('hex');

    if (signature !== expected) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = JSON.parse(req.body.toString());
    const repoUrl = payload.repository?.html_url;

    if (!repoUrl || payload.ref !== `refs/heads/${payload.repository?.default_branch}`) {
      return res.status(200).json({ message: 'Ignored — not a push to default branch' });
    }

    // Find the project connected to this repo URL
    const pool = require('./db');
    const axios = require('axios');
    const repoResult = await pool.query(
      'SELECT r.id, r.project_id, r.readme, r.folder_structure, r.tech_stack, r.dependencies FROM repositories r WHERE r.github_url LIKE $1',
      [`%${repoUrl.replace('https://github.com/', '')}%`]
    );

    if (repoResult.rows.length === 0) {
      return res.status(200).json({ message: 'No project found for this repo' });
    }

    const repo = repoResult.rows[0];

    // Trigger re-index in background (don't await — respond to GitHub immediately)
    axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:5002'}/index`, {
      repository_id: repo.id,
      repo_data: {
        readme: repo.readme,
        folder_structure: repo.folder_structure,
        tech_stack: repo.tech_stack,
        dependencies: repo.dependencies,
      }
    }).then(async () => {
      await pool.query(
        'INSERT INTO timeline_events (project_id, event_type, title, description) VALUES ($1, $2, $3, $4)',
        [repo.project_id, 'auto_indexed', 'Auto-indexed via GitHub webhook',
         `Push to ${payload.repository?.default_branch} by ${payload.pusher?.name}`]
      );
    }).catch(console.error);

    res.status(200).json({ message: 'Webhook received, indexing triggered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(logger);

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/repository', githubRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/projects/:projectId/events', sseRoutes);
app.use('/api/projects/:projectId/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

const path = require('path');

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Serve React frontend
app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
