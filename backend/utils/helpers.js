/**
 * utils/helpers.js
 * Shared utility functions for CuraLink
 */

/**
 * Truncate text to maxLength, adding ellipsis if truncated
 */
function truncate(text, maxLength = 300) {
  if (!text) return '';
  const str = typeof text === 'string' ? text : String(text);
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

/**
 * Normalize a disease/condition string for consistent matching
 */
function normalizeDisease(disease) {
  return (disease || '')
    .toLowerCase()
    .replace(/['''`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract disease mentions from free text
 */
function extractDiseasesFromText(text) {
  const lowerText = (text || '').toLowerCase();
  const knownDiseases = [
    'lung cancer', 'breast cancer', 'prostate cancer', 'colon cancer',
    'colorectal cancer', 'pancreatic cancer', 'ovarian cancer', 'liver cancer',
    "parkinson's disease", 'parkinson', "alzheimer's disease", 'alzheimer',
    'dementia', 'multiple sclerosis', 'amyotrophic lateral sclerosis', 'als',
    'diabetes mellitus', 'type 2 diabetes', 'type 1 diabetes',
    'heart disease', 'cardiovascular disease', 'coronary artery disease',
    'atrial fibrillation', 'heart failure', 'myocardial infarction',
    'stroke', 'ischemic stroke', 'hemorrhagic stroke',
    'hypertension', 'high blood pressure',
    'depression', 'major depressive disorder', 'bipolar disorder',
    'schizophrenia', 'anxiety disorder', 'ptsd', 'adhd',
    'rheumatoid arthritis', 'osteoarthritis', 'lupus',
    'crohn\'s disease', 'ulcerative colitis', 'ibs',
    'asthma', 'copd', 'emphysema',
    'epilepsy', 'seizure disorder',
    'hiv', 'aids', 'hepatitis b', 'hepatitis c',
    'covid-19', 'covid', 'sars-cov-2',
    'tuberculosis', 'pneumonia',
    'osteoporosis', 'fibromyalgia',
    'psoriasis', 'eczema', 'melanoma'
  ];

  const found = [];
  for (const disease of knownDiseases) {
    if (lowerText.includes(disease)) {
      found.push(disease);
    }
  }
  return found;
}

/**
 * Sanitize user input — strip potential injection attempts
 */
function sanitizeInput(input) {
  if (!input) return '';
  return String(input)
    .replace(/<[^>]*>/g, '')   // strip HTML tags
    .replace(/[^\w\s\-.,':;!?()+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);  // max 500 chars
}

/**
 * Format a date to readable string
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Retry a promise-returning function with exponential backoff
 */
async function withRetry(fn, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = delayMs * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${wait}ms...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

/**
 * Sleep for ms milliseconds
 */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
  truncate,
  normalizeDisease,
  generateSessionId,
  extractDiseasesFromText,
  sanitizeInput,
  formatDate,
  withRetry,
  sleep
};
