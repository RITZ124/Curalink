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
const BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

/**
 * Fetch clinical trials from ClinicalTrials.gov v2 API
 */
async function getClinicalTrials(disease, query, location, maxResults = 50) {
  const allTrials = [];

  // Fetch recruiting trials first
  const recruitingTrials = await fetchTrials(disease, query, 'RECRUITING', maxResults, location);
  allTrials.push(...recruitingTrials);

  // Also fetch completed/active trials for broader pool
  if (allTrials.length < maxResults) {
    const activeTrials = await fetchTrials(disease, query, 'ACTIVE_NOT_RECRUITING', 20, location);
    allTrials.push(...activeTrials);

    const completedTrials = await fetchTrials(disease, query, 'COMPLETED', 20, location);
    allTrials.push(...completedTrials);
  }

  // Deduplicate by NCT ID
  const seen = new Set();
  const unique = allTrials.filter(t => {
    if (seen.has(t.nctId)) return false;
    seen.add(t.nctId);
    return true;
  });

  return unique.slice(0, maxResults);
}

async function fetchTrials(disease, additionalQuery, status, pageSize = 20, location) {
  try {
    const condQuery = disease;

    const params = new URLSearchParams({
      'query.cond': condQuery,
      'filter.overallStatus': encodeURIComponent(status),
      'pageSize': pageSize.toString(),
      'format': 'json',
    });

    if (location) {
      params.set('query.locn', location);
    }

    const res = await axiosWithRetry(`${BASE_URL}?${params}`, { timeout: 45000 });
    const studies = res.data?.studies || [];

    return studies.map(study => mapTrial(study)).filter(Boolean);
  } catch (err) {
    console.error(`ClinicalTrials fetch error (${status}):`, err.message);
    return [];
  }
}

function mapTrial(study) {
  if (!study) return null;

  const proto = study.protocolSection || {};
  const id = proto.identificationModule || {};
  const status = proto.statusModule || {};
  const desc = proto.descriptionModule || {};
  const eligibility = proto.eligibilityModule || {};
  const contacts = proto.contactsLocationsModule || {};
  const design = proto.designModule || {};
  const sponsor = proto.sponsorCollaboratorsModule || {};
  const interventions = proto.armsInterventionsModule?.interventions || [];

  const locations = (contacts.locations || []).slice(0, 5).map(loc => ({
    city: loc.city,
    country: loc.country,
    facility: loc.facility
  }));

  const centralContacts = (contacts.centralContacts || []).slice(0, 2).map(c => ({
    name: c.name,
    phone: c.phone,
    email: c.email
  }));

  return {
    nctId: id.nctId || '',
    title: id.briefTitle || id.officialTitle || '',
    officialTitle: id.officialTitle || '',
    status: status.overallStatus || '',
    phase: design.phases?.join(', ') || 'N/A',
    studyType: design.studyType || '',
    summary: desc.briefSummary || '',
    eligibilityCriteria: eligibility.eligibilityCriteria || '',
    conditions: proto.conditionsModule?.conditions || [],
    interventions: interventions.slice(0, 3).map(i => i.name).filter(Boolean),
    sponsor: sponsor.leadSponsor?.name || '',
    startDate: status.startDateStruct?.date || '',
    completionDate: status.primaryCompletionDateStruct?.date || '',
    locations: locations,
    contacts: centralContacts,
    url: `https://clinicaltrials.gov/study/${id.nctId}`,
    source: 'ClinicalTrials.gov'
  };
}

module.exports = { getClinicalTrials };
