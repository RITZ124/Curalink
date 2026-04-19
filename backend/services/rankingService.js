/**
 * Query Expansion Service
 * Expands user queries intelligently for deeper retrieval
 */

const DISEASE_SYNONYMS = {
  "parkinson": ["parkinson's disease", "PD", "parkinsonism", "neurodegenerative"],
  "alzheimer": ["alzheimer's disease", "AD", "dementia", "amyloid", "cognitive decline"],
  "diabetes": ["diabetes mellitus", "T2DM", "T1DM", "insulin resistance", "hyperglycemia"],
  "cancer": ["oncology", "tumor", "malignancy", "neoplasm", "carcinoma"],
  "lung cancer": ["NSCLC", "non-small cell lung cancer", "SCLC", "pulmonary carcinoma", "lung adenocarcinoma"],
  "heart disease": ["cardiovascular disease", "coronary artery disease", "CAD", "myocardial infarction"],
  "depression": ["major depressive disorder", "MDD", "clinical depression", "antidepressant"],
  "hypertension": ["high blood pressure", "arterial hypertension", "antihypertensive"],
  "arthritis": ["rheumatoid arthritis", "RA", "osteoarthritis", "joint inflammation"],
  "covid": ["COVID-19", "SARS-CoV-2", "coronavirus", "post-COVID"],
  "hiv": ["HIV", "AIDS", "antiretroviral", "HAART", "immunodeficiency"],
  "stroke": ["cerebrovascular accident", "CVA", "ischemic stroke", "hemorrhagic stroke"],
  "epilepsy": ["seizure disorder", "antiepileptic", "convulsion", "epileptic"],
  "asthma": ["bronchial asthma", "airway inflammation", "bronchodilator"]
};

/**
 * Expand query by combining disease + intent + synonyms
 */
function expandQuery(disease, additionalQuery, intent) {
  const queries = new Set();

  const cleanDisease = (disease || '').trim();
  const cleanQuery = (additionalQuery || '').trim().toLowerCase();

  // Always keep disease-only queries
  if (cleanDisease) {
    queries.add(`${cleanDisease} treatment`);
    queries.add(`${cleanDisease} therapy`);
    queries.add(`${cleanDisease} overview`);
    queries.add(`${cleanDisease} clinical trial`);
  }

  // Add specific user query only if it is meaningful
  if (
    cleanDisease &&
    cleanQuery &&
    !cleanQuery.includes('what is') &&
    !cleanQuery.includes(cleanDisease.toLowerCase())
  ) {
    queries.add(`${cleanDisease} ${cleanQuery}`);
  }

  // Add synonyms
  const lowerDisease = cleanDisease.toLowerCase();

  for (const [key, synonyms] of Object.entries(DISEASE_SYNONYMS)) {
    if (lowerDisease.includes(key)) {
      synonyms.slice(0, 3).forEach(syn => {
        queries.add(`${syn} treatment`);
        queries.add(`${syn} therapy`);
        queries.add(`${syn} clinical trial`);

        if (
          cleanQuery &&
          !cleanQuery.includes('what is') &&
          !cleanQuery.includes(cleanDisease.toLowerCase())
        ) {
          queries.add(`${syn} ${cleanQuery}`);
        }
      });
    }
  }

  // Treatment intent
  if (intent === 'treatment') {
    queries.add(`${cleanDisease} latest treatment`);
    queries.add(`${cleanDisease} targeted therapy`);
    queries.add(`${cleanDisease} immunotherapy`);
    queries.add(`${cleanDisease} standard of care`);
  }

  // Research intent
  if (intent === 'research') {
    queries.add(`${cleanDisease} latest research`);
    queries.add(`${cleanDisease} systematic review`);
    queries.add(`${cleanDisease} meta analysis`);
    queries.add(`${cleanDisease} recent advances`);
  }

  // Trial intent
  if (intent === 'trials') {
    queries.add(`${cleanDisease} recruiting trial`);
    queries.add(`${cleanDisease} phase 3 clinical trial`);
    queries.add(`${cleanDisease} ongoing study`);
  }

  // Definition / overview intent
  if (
    cleanQuery.includes('what is') ||
    cleanQuery.includes('overview') ||
    cleanQuery.includes('symptoms')
  ) {
    queries.add(`${cleanDisease} overview`);
    queries.add(`${cleanDisease} symptoms`);
    queries.add(`${cleanDisease} causes`);
    queries.add(`${cleanDisease} diagnosis`);
  }

  // Diagnosis / detection intent
  if (
    cleanQuery.includes('detect') ||
    cleanQuery.includes('diagnosis') ||
    cleanQuery.includes('screening')
  ) {
    queries.add(`${cleanDisease} diagnosis`);
    queries.add(`${cleanDisease} detection`);
    queries.add(`${cleanDisease} screening`);
    queries.add(`${cleanDisease} early detection`);
  }
  if (intent === 'diagnosis') {
    queries.add(`${cleanDisease} biopsy`);
    queries.add(`${cleanDisease} diagnosis`);
    queries.add(`${cleanDisease} screening`);
    queries.add(`${cleanDisease} early detection`);
    queries.add(`${cleanDisease} biomarkers`);
  }
  
  if (intent === 'symptoms') {
    queries.add(`${cleanDisease} symptoms`);
    queries.add(`${cleanDisease} warning signs`);
    queries.add(`${cleanDisease} early symptoms`);
  }
  
  if (intent === 'causes') {
    queries.add(`${cleanDisease} causes`);
    queries.add(`${cleanDisease} risk factors`);
    queries.add(`${cleanDisease} prevention`);
  }
  
  if (intent === 'lifestyle') {
    queries.add(`${cleanDisease} diet`);
    queries.add(`${cleanDisease} nutrition`);
    queries.add(`${cleanDisease} vitamin supplementation`);
    queries.add(`${cleanDisease} lifestyle management`);
  }
  if (intent === 'prognosis') {
    queries.add(`${cleanDisease} prognosis`);
    queries.add(`${cleanDisease} survival rate`);
    queries.add(`${cleanDisease} life expectancy`);
    queries.add(`${cleanDisease} long term outcomes`);
  }
  
  if (intent === 'sideEffects') {
    queries.add(`${cleanDisease} treatment side effects`);
    queries.add(`${cleanDisease} complications`);
    queries.add(`${cleanDisease} adverse effects`);
    queries.add(`${cleanDisease} treatment toxicity`);
  }
  
  if (intent === 'researcher') {
    queries.add(`${cleanDisease} top researchers`);
    queries.add(`${cleanDisease} leading scientists`);
    queries.add(`${cleanDisease} key opinion leaders`);
    queries.add(`${cleanDisease} major institutions`);
  }
  return [...queries].filter(Boolean).slice(0, 12);
}

/**
 * Calculate relevance score for ranking
 */
function scorePublication(pub, disease, query, currentYear = new Date().getFullYear()) {
  let score = 0;
  const searchTerms = [disease, query].filter(Boolean).map(t => t.toLowerCase());
  const title = (pub.title || '').toLowerCase();
  const abstract = (pub.abstract || '').toLowerCase();

  // Title match (high weight)
  for (const term of searchTerms) {
    if (title.includes(term)) score += 30;
    const words = term.split(' ');
    const partialMatches = words.filter(w => w.length > 3 && title.includes(w)).length;
    score += partialMatches * 10;
  }

  // Abstract match (medium weight)
  for (const term of searchTerms) {
    if (abstract.includes(term)) score += 15;
  }

  // Recency (higher for recent publications)
  if (pub.year) {
    const age = currentYear - pub.year;
    if (age <= 1) score += 25;
    else if (age <= 2) score += 20;
    else if (age <= 3) score += 15;
    else if (age <= 5) score += 10;
    else if (age <= 10) score += 5;
  }

  // Citation count (for OpenAlex)
  if (pub.citationCount) {
    if (pub.citationCount > 500) score += 20;
    else if (pub.citationCount > 100) score += 15;
    else if (pub.citationCount > 50) score += 10;
    else if (pub.citationCount > 10) score += 5;
  }

  // Has abstract (quality signal)
  if (pub.abstract && pub.abstract.length > 100) score += 10;

  // Source credibility
  if (pub.source === 'PubMed') score += 8;
  if (pub.source === 'OpenAlex' && pub.isOpenAccess) score += 5;
  // Strong boost for exact disease mention
  if (disease && title.includes(disease.toLowerCase())) {
    score += 25;
  }

  if (disease && abstract.includes(disease.toLowerCase())) {
    score += 15;
  }

  // Boost for intent keywords
  if (query) {
    const queryWords = query.toLowerCase().split(' ');

    queryWords.forEach(word => {
      if (word.length > 3) {
        if (title.includes(word)) score += 8;
        if (abstract.includes(word)) score += 4;
      }
    });
  }

  // Penalize weak/noisy papers
  if (!pub.abstract || pub.abstract.length < 50) {
    score -= 10;
  }

  if (!pub.year) {
    score -= 5;
  }
  return score;
}

/**
 * Score clinical trial relevance
 */
function scoreTrial(trial, disease, query, location) {
  let score = 0;
  const searchTerms = [disease, query].filter(Boolean).map(t => t.toLowerCase());
  const title = (trial.title || '').toLowerCase();
  const summary = (trial.summary || '').toLowerCase();

  // Status priority
  if (trial.status === 'RECRUITING') score += 30;
  else if (trial.status === 'ACTIVE_NOT_RECRUITING') score += 20;
  else if (trial.status === 'COMPLETED') score += 10;

  // Title and summary match
  for (const term of searchTerms) {
    if (title.includes(term)) score += 25;
    if (summary.includes(term)) score += 15;
  }

  // Location match
  if (location) {
    const lowerLoc = location.toLowerCase();
    const locMatch = trial.locations.some(
      l => (l.city || '').toLowerCase().includes(lowerLoc) ||
           (l.country || '').toLowerCase().includes(lowerLoc)
    );
    if (locMatch) score += 20;
  }

  // Has contact info (useful for users)
  if (trial.contacts && trial.contacts.length > 0) score += 5;
  // Strong boost for exact disease match
  if (disease && title.includes(disease.toLowerCase())) {
    score += 20;
  }

  if (disease && summary.includes(disease.toLowerCase())) {
    score += 10;
  }

  // Reward phase 2 / 3 trials more
  if (trial.phase) {
    const phase = trial.phase.toLowerCase();

    if (phase.includes('phase3')) score += 15;
    else if (phase.includes('phase2')) score += 10;
    else if (phase.includes('phase1')) score += 5;
  }
  return score;
}

/**
 * Deduplicate publications by title similarity
 */
function deduplicatePublications(publications) {
  const seen = new Set();
  return publications.filter(pub => {
    if (!pub.title) return false;
    // Normalize title for comparison
    const normalized = pub.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').substring(0, 60);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

/**
 * Main ranking pipeline
 */
function rankAndFilter(publications, clinicalTrials, disease, query, location) {
  // Score publications
  const scoredPubs = publications.map(pub => ({
    ...pub,
    _score: scorePublication(pub, disease, query)
  }));

  // Score trials
  const scoredTrials = clinicalTrials.map(trial => ({
    ...trial,
    _score: scoreTrial(trial, disease, query, location)
  }));

  // Sort by score
  const rankedPubs = scoredPubs.sort((a, b) => b._score - a._score);
  const rankedTrials = scoredTrials.sort((a, b) => b._score - a._score);

  // Deduplicate
  const uniquePubs = deduplicatePublications(rankedPubs);

  return {
    publications: uniquePubs.slice(0, 8),    // Top 8 publications
    clinicalTrials: rankedTrials.slice(0, 8), // Top 8 trials
    totalPublicationsRetrieved: publications.length,
    totalTrialsRetrieved: clinicalTrials.length
  };
}

module.exports = { expandQuery, rankAndFilter, scorePublication, scoreTrial };
