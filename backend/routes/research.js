const express = require('express');
const router = express.Router();
const { getPubMedPublications } = require('../services/pubmedService');
const { getOpenAlexPublications } = require('../services/openAlexService');
const { getClinicalTrials } = require('../services/clinicalTrialsService');

/**
 * GET /api/research/publications?query=...&disease=...
 */
router.get('/publications', async (req, res) => {
  const { query, disease, source } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    let results = [];
    const fullQuery = disease ? `${query} ${disease}` : query;

    if (source === 'pubmed') {
      results = await getPubMedPublications(fullQuery, 50);
    } else if (source === 'openalex') {
      results = await getOpenAlexPublications(fullQuery, 50);
    } else {
      const [pm, oa] = await Promise.allSettled([
        getPubMedPublications(fullQuery, 50),
        getOpenAlexPublications(fullQuery, 50)
      ]);
      results = [
        ...(pm.status === 'fulfilled' ? pm.value : []),
        ...(oa.status === 'fulfilled' ? oa.value : [])
      ];
    }

    res.json({ results, total: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/research/trials?disease=...&query=...&location=...
 */
router.get('/trials', async (req, res) => {
  const { disease, query, location, status } = req.query;
  if (!disease) return res.status(400).json({ error: 'disease required' });

  try {
    const trials = await getClinicalTrials(disease, query, location, 50);
    const filtered = status
      ? trials.filter(t => t.status === status.toUpperCase())
      : trials;
    res.json({ results: filtered, total: filtered.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
