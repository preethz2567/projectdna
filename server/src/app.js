const express = require('express');
const cors = require('cors');
const logger = require('./middleware/logger');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const githubRoutes = require('./routes/github');
const taskRoutes = require('./routes/tasks');
const sseRoutes = require('./routes/sse');
const aiRoutes = require('./routes/ai');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(logger);

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/repository', githubRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/projects/:projectId/events', sseRoutes);
app.use('/api/projects/:projectId/ai', aiRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
