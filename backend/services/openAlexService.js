const axios = require('axios');
async function axiosWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, options);
    } catch (err) {
      console.error(`Retry ${i + 1} failed:`, err.message);

      if (i === retries - 1) {
        throw err;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
const BASE_URL = 'https://api.openalex.org/works';

/**
 * Fetch publications from OpenAlex with pagination for broad candidate pool
 */
async function getOpenAlexPublications(query, maxResults = 100) {
  const allResults = [];
  const perPage = 50;
  const pagesToFetch = Math.ceil(maxResults / perPage);

  for (let page = 1; page <= pagesToFetch; page++) {
    try {
      const params = new URLSearchParams({
        search: query,
        'per-page': perPage.toString(),
        page: page.toString(),
        sort: 'relevance_score:desc',
        'mailto': process.env.PUBMED_EMAIL || 'research@curalink.ai'
      });

      const res = await axiosWithRetry(`${BASE_URL}?${params}`, { timeout: 45000 });
      const works = res.data?.results || [];

      if (works.length === 0) break;

      const mapped = works.map(work => mapOpenAlexWork(work)).filter(Boolean);
      allResults.push(...mapped);

      if (allResults.length >= maxResults) break;
    } catch (err) {
      console.error(`OpenAlex page ${page} error:`, err.message);
      break;
    }
  }

  return allResults.slice(0, maxResults);
}

/**
 * Fetch publications filtered by date range
 */
async function getOpenAlexWithDateFilter(query, fromYear, toYear, maxResults = 100) {
  try {
    const params = new URLSearchParams({
      search: query,
      'per-page': Math.min(maxResults, 200).toString(),
      page: '1',
      sort: 'relevance_score:desc',
      filter: `from_publication_date:${fromYear}-01-01,to_publication_date:${toYear}-12-31`,
      'mailto': process.env.PUBMED_EMAIL || 'research@curalink.ai'
    });

    const res = await axiosWithRetry(`${BASE_URL}?${params}`, { timeout: 45000 });
    const works = res.data?.results || [];
    return works.map(work => mapOpenAlexWork(work)).filter(Boolean);
  } catch (err) {
    console.error('OpenAlex date filter error:', err.message);
    return [];
  }
}

function mapOpenAlexWork(work) {
  if (!work || !work.id) return null;

  const authors = (work.authorships || [])
    .slice(0, 5)
    .map(a => a?.author?.display_name)
    .filter(Boolean);

  const abstract = reconstructAbstract(work.abstract_inverted_index);
  const year = work.publication_year || null;
  const journal = work.primary_location?.source?.display_name || work.host_venue?.display_name || '';
  const url = work.doi ? `https://doi.org/${work.doi}` : work.id;
  const openAccessUrl = work.open_access?.oa_url;

  return {
    id: `openalex_${work.id.replace('https://openalex.org/', '')}`,
    title: work.title || '',
    abstract: abstract,
    authors: authors,
    year: year,
    journal: journal,
    source: 'OpenAlex',
    url: openAccessUrl || url,
    doi: work.doi || null,
    citationCount: work.cited_by_count || 0,
    isOpenAccess: work.open_access?.is_oa || false
  };
}

/**
 * Reconstruct abstract from OpenAlex inverted index format
 */
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';

  try {
    const wordPositions = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const pos of positions) {
        wordPositions.push({ word, pos });
      }
    }
    wordPositions.sort((a, b) => a.pos - b.pos);
    return wordPositions.map(wp => wp.word).join(' ');
  } catch {
    return '';
  }
}

module.exports = { getOpenAlexPublications, getOpenAlexWithDateFilter };
