const router = require('express').Router({ mergeParams: true });
const jwt = require('jsonwebtoken');
const { addClient, removeClient } = require('../sse');

router.get('/', (req, res) => {
  // Accept token from query param (EventSource can't set headers)
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).end();

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  addClient(req.params.projectId, res);
  req.on('close', () => removeClient(req.params.projectId, res));
});

module.exports = router;
