const express = require('express');
const router = express.Router();
const { conductResearch } = require('../services/researchService');
const { generateMedicalAnalysis, extractIntent, extractDiseaseFromContext } = require('../services/llmService');

// In-memory session store (fallback when MongoDB unavailable)
const memoryStore = new Map();

function getSession(sessionId) {
  try {
    const Session = require('../models/Session');
    return Session.findOne({ sessionId });
  } catch {
    return Promise.resolve(memoryStore.get(sessionId) || null);
  }
}

async function saveSession(sessionId, data) {
  try {
    const Session = require('../models/Session');
    let session = await Session.findOne({ sessionId });
    if (!session) {
      session = new Session({ sessionId, ...data });
    } else {
      Object.assign(session, data);
    }
    await session.save();
    return session;
  } catch {
    // Fallback to memory
    const existing = memoryStore.get(sessionId) || {
      sessionId,
      userContext: {},
      messages: []
    };
    const updated = { ...existing, ...data };
    memoryStore.set(sessionId, updated);
    return updated;
  }
}

/**
 * POST /api/chat
 * Main chat endpoint
 */
router.post('/', async (req, res) => {
  const {
    sessionId,
    message,
    userContext = {}
  } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  try {
    // Get or create session
    let session = await getSession(sessionId);
    const conversationHistory = session?.messages || [];

    // Resolve disease context (from request or conversation history)
    const detectedDisease = extractDiseaseFromContext([
      { role: 'user', content: message }
    ]);
    
    let disease =
      detectedDisease ||
      userContext.disease ||
      session?.userContext?.disease;
    
    if (!disease) {
      disease = extractDiseaseFromContext(conversationHistory);
    }

    const patientName = userContext.patientName || session?.userContext?.patientName || '';
    const location = userContext.location || session?.userContext?.location || '';

    // Extract intent from message
    const intent = extractIntent(message);

    // Build context
    const context = {
      disease: disease || message, // Use the message itself as disease if not found
      patientName,
      location,
      additionalQuery: userContext.additionalQuery || message
    };

    // Conduct research
    console.log(`\n📨 New query: "${message}" | Disease: ${disease} | Intent: ${intent}`);

    const researchData = await conductResearch(
      disease || message,
      message,
      location,
      intent
    );

    // Generate LLM response
    const { response, llmUsed } = await generateMedicalAnalysis(
      message,
      context,
      researchData.publications,
      researchData.clinicalTrials,
      conversationHistory
    );

    // Build new messages
    const userMsg = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    const assistantMsg = {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: {
        publications: researchData.publications,
        clinicalTrials: researchData.clinicalTrials,
        queryExpanded: researchData.expandedQueries?.[0],
        retrievalStats: researchData.retrievalStats,
        llmUsed
      }
    };

    // Save session
    const updatedMessages = [...conversationHistory, userMsg, assistantMsg];
    await saveSession(sessionId, {
      userContext: context,
      messages: updatedMessages.slice(-20) // Keep last 20 messages
    });

    res.json({
      sessionId,
      response,
      publications: researchData.publications,
      clinicalTrials: researchData.clinicalTrials,
      expandedQuery: researchData.expandedQueries?.[0],
      retrievalStats: researchData.retrievalStats,
      llmUsed,
      context
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({
      error: 'Research pipeline failed',
      details: err.message
    });
  }
});

/**
 * GET /api/chat/history/:sessionId
 */
router.get('/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await getSession(sessionId);
    res.json({
      messages: session?.messages || [],
      userContext: session?.userContext || {}
    });
  } catch (err) {
    res.json({ messages: [], userContext: {} });
  }
});

module.exports = router;
