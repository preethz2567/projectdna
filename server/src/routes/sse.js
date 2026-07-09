const router = require('express').Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const { addClient, removeClient } = require('../sse');

router.get('/', authenticate, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected', projectId: req.params.projectId })}\n\n`);

  addClient(req.params.projectId, res);

  req.on('close', () => removeClient(req.params.projectId, res));
});

module.exports = router;
