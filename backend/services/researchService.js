const { getPubMedPublications } = require('./pubmedService');
const { getOpenAlexPublications } = require('./openAlexService');
const { getClinicalTrials } = require('./clinicalTrialsService');
const { expandQuery, rankAndFilter } = require('./rankingService');
const NodeCache = require('node-cache');

// Cache for 30 minutes
const cache = new NodeCache({ stdTTL: 1800, checkperiod: 300 });

/**
 * Main research pipeline:
 * 1. Expand query
 * 2. Fetch broad candidate pools from all 3 sources
 * 3. Rank & filter to top results
 */
async function conductResearch(disease, additionalQuery, location, intent = 'general') {
  const cacheKey = `research_${disease}_${additionalQuery}_${location}_${intent}`
    .toLowerCase()
    .replace(/\s+/g, '_');

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('📦 Cache hit for research query');
    return { ...cached, fromCache: true };
  }

  console.log(`🔍 Starting research pipeline for: ${disease} + ${additionalQuery}`);
  const startTime = Date.now();

  // Step 1: Expand queries
  const expandedQueries = expandQuery(disease, additionalQuery, intent);
  console.log('🔀 Expanded queries:', expandedQueries);

  const primaryQuery = expandedQueries[0] || `${disease} ${additionalQuery}`.trim();
  const secondaryQuery = expandedQueries[1] || disease;
  const trialQuery = disease || primaryQuery;

  // Dynamic retrieval sizes based on intent
  // Dynamic retrieval sizes based on intent
  const pubLimit =
  intent === 'research'
    ? 100
    : intent === 'trials'
    ? 40
    : intent === 'treatment'
    ? 60
    : 40;

  const secondaryLimit =
  intent === 'research'
    ? 50
    : intent === 'trials'
    ? 20
    : 20;

  const trialLimit =
  intent === 'trials'
    ? 40
    : intent === 'treatment'
    ? 20
    : 10;

  // Step 2: Parallel fetch from all sources
  const [pubmedResults, openAlexResults, trialsResults] = await Promise.allSettled([
    fetchPubMedBroad(primaryQuery, secondaryQuery, pubLimit, secondaryLimit),
    fetchOpenAlexBroad(primaryQuery, secondaryQuery, pubLimit, secondaryLimit),
    getClinicalTrials(trialQuery, additionalQuery, location, trialLimit)
  ]);

  const publications = [
    ...(pubmedResults.status === 'fulfilled' ? pubmedResults.value : []),
    ...(openAlexResults.status === 'fulfilled' ? openAlexResults.value : [])
  ];

  const clinicalTrials =
    trialsResults.status === 'fulfilled' ? trialsResults.value : [];

  console.log(
    `📊 Raw retrieved: ${publications.length} publications, ${clinicalTrials.length} trials`
  );

  // Step 3: Rank and filter
  const ranked = rankAndFilter(
    publications,
    clinicalTrials,
    disease,
    additionalQuery,
    location
  );

  const result = {
    publications: ranked.publications,
    clinicalTrials: ranked.clinicalTrials,
    expandedQueries,
    retrievalStats: {
      totalPublicationsRetrieved: ranked.totalPublicationsRetrieved,
      totalTrialsRetrieved: ranked.totalTrialsRetrieved,
      pubmedCount:
        pubmedResults.status === 'fulfilled'
          ? pubmedResults.value.length
          : 0,
      openAlexCount:
        openAlexResults.status === 'fulfilled'
          ? openAlexResults.value.length
          : 0,
      processingTimeMs: Date.now() - startTime
    },
    fromCache: false
  };

  // Cache the result
  cache.set(cacheKey, result);

  console.log(
    `✅ Research complete: ${ranked.publications.length} pubs, ${ranked.clinicalTrials.length} trials in ${result.retrievalStats.processingTimeMs}ms`
  );

  return result;
}

async function fetchPubMedBroad(
  primaryQuery,
  secondaryQuery,
  primaryLimit = 50,
  secondaryLimit = 25
) {
  const [r1, r2] = await Promise.allSettled([
    getPubMedPublications(primaryQuery, primaryLimit),
    getPubMedPublications(secondaryQuery, secondaryLimit)
  ]);

  return [
    ...(r1.status === 'fulfilled' ? r1.value : []),
    ...(r2.status === 'fulfilled' ? r2.value : [])
  ];
}

async function fetchOpenAlexBroad(
  primaryQuery,
  secondaryQuery,
  primaryLimit = 50,
  secondaryLimit = 25
) {
  const [r1, r2] = await Promise.allSettled([
    getOpenAlexPublications(primaryQuery, primaryLimit),
    getOpenAlexPublications(secondaryQuery, secondaryLimit)
  ]);

  return [
    ...(r1.status === 'fulfilled' ? r1.value : []),
    ...(r2.status === 'fulfilled' ? r2.value : [])
  ];
}

module.exports = { conductResearch };