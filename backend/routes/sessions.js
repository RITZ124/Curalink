const express = require('express');
const router = express.Router();

const memoryStore = new Map();

router.post('/', async (req, res) => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { userContext = {} } = req.body;

  try {
    const Session = require('../models/Session');
    const session = new Session({
      sessionId,
      userContext,
      messages: []
    });
    await session.save();
    res.json({ sessionId, userContext });
  } catch {
    memoryStore.set(sessionId, { sessionId, userContext, messages: [] });
    res.json({ sessionId, userContext });
  }
});

router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const Session = require('../models/Session');
    const session = await Session.findOne({ sessionId });
    if (session) return res.json(session);
  } catch {}

  const memSession = memoryStore.get(sessionId);
  if (memSession) return res.json(memSession);
  res.status(404).json({ error: 'Session not found' });
});

module.exports = router;
