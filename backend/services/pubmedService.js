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
const xml2js = require('xml2js');

const BASE_SEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const BASE_FETCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

/**
 * Search PubMed and return top N article IDs
 */
async function searchPubMed(query, retmax = 100) {
  try {
    const params = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmax: retmax.toString(),
      sort: 'pub date',
      retmode: 'json',
      email: process.env.PUBMED_EMAIL || 'research@curalink.ai'
    });

    const res = await axiosWithRetry(`${BASE_SEARCH}?${params}`, { timeout: 45000 });
    const ids = res.data?.esearchresult?.idlist || [];
    return ids;
  } catch (err) {
    console.error('PubMed search error:', err.message);
    return [];
  }
}

/**
 * Fetch full article details by IDs
 */
async function fetchPubMedDetails(ids) {
  if (!ids || ids.length === 0) return [];

  try {
    const idStr = ids.join(',');
    const params = new URLSearchParams({
      db: 'pubmed',
      id: idStr,
      retmode: 'xml',
      email: process.env.PUBMED_EMAIL || 'research@curalink.ai'
    });

    const res = await axiosWithRetry(`${BASE_SEARCH}?${params}`, { timeout: 45000 });
    const articles = await parseXML(res.data);
    return articles;
  } catch (err) {
    console.error('PubMed fetch error:', err.message);
    return [];
  }
}

async function parseXML(xml) {
  try {
    const result = await xml2js.parseStringPromise(xml, { explicitArray: false });
    const articleSet = result?.PubmedArticleSet?.PubmedArticle;
    if (!articleSet) return [];

    const articles = Array.isArray(articleSet) ? articleSet : [articleSet];

    return articles.map(article => {
      const medline = article?.MedlineCitation;
      const articleData = medline?.Article;
      const pmid = medline?.PMID?._ || medline?.PMID;
      const title = articleData?.ArticleTitle?._ || articleData?.ArticleTitle || '';
      const abstract = extractAbstract(articleData?.Abstract?.AbstractText);
      const journal = articleData?.Journal?.Title || articleData?.Journal?.ISOAbbreviation || '';
      const pubYear = extractYear(articleData?.Journal?.JournalIssue?.PubDate);
      const authors = extractAuthors(articleData?.AuthorList?.Author);

      return {
        id: pmid ? `pubmed_${pmid}` : null,
        title: title.toString(),
        abstract: abstract,
        authors: authors,
        year: pubYear,
        journal: journal,
        source: 'PubMed',
        url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null,
        pmid: pmid
      };
    }).filter(a => a.id && a.title);
  } catch (err) {
    console.error('XML parse error:', err.message);
    return [];
  }
}

function extractAbstract(abstractText) {
  if (!abstractText) return '';
  if (typeof abstractText === 'string') return abstractText;
  if (Array.isArray(abstractText)) {
    return abstractText.map(t => (typeof t === 'string' ? t : t._ || '')).join(' ');
  }
  return abstractText._ || abstractText.toString() || '';
}

function extractYear(pubDate) {
  if (!pubDate) return null;
  if (pubDate.Year) return parseInt(pubDate.Year);
  if (pubDate.MedlineDate) {
    const match = pubDate.MedlineDate.match(/\d{4}/);
    return match ? parseInt(match[0]) : null;
  }
  return null;
}

function extractAuthors(authorList) {
  if (!authorList) return [];
  const authors = Array.isArray(authorList) ? authorList : [authorList];
  return authors.slice(0, 5).map(a => {
    if (a.CollectiveName) return a.CollectiveName;
    const last = a.LastName || '';
    const first = a.ForeName || a.Initials || '';
    return `${last}${first ? ', ' + first : ''}`.trim();
  }).filter(Boolean);
}

/**
 * Main function: search + fetch + return structured results
 */
async function getPubMedPublications(query, maxResults = 50) {
  try {
    const ids = await searchPubMed(query, maxResults);

    if (ids.length === 0) return [];

    // Split into smaller batches of 10
    const batches = [];
    for (let i = 0; i < ids.length; i += 10) {
      batches.push(ids.slice(i, i + 10));
    }

    const articles = [];

    // Process sequentially to avoid socket hangups
    for (const batch of batches) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const batchArticles = await fetchPubMedDetails(batch);
        articles.push(...batchArticles);
      } catch (err) {
        console.error('PubMed batch failed:', err.message);
      }
    }

    return articles.slice(0, maxResults);
  } catch (err) {
    console.error('PubMed overall error:', err.message);
    return [];
  }
}

module.exports = { getPubMedPublications };
