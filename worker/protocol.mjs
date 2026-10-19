export const EVENTS = new Set([
  'finland_landing_view', 'finland_signup_start', 'finland_signup_submit',
  'finland_signup_return', 'finland_signup_error', 'finland_survey_start',
  'finland_survey_complete', 'finland_offer_view',
]);
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export const isId = (value) => typeof value === 'string' && UUID.test(value);

// Only planned campaign values are accepted. Never persist arbitrary query strings.
export function attribution(input = {}) {
  const oneOf = (key, values, fallback) => values.includes(input?.[key]) ? input[key] : fallback;
  return {
    source: oneOf('utm_source', ['meta', 'community', 'interview', 'qa'], 'unattributed'),
    medium: oneOf('utm_medium', ['paid_social', 'organic_social', 'research', 'qa'], 'unattributed'),
    campaign: oneOf('utm_campaign', ['fi-demand-2026-01'], 'unattributed'),
    content: oneOf('utm_content', ['discovery', 'community', 'interview', 'qa'], 'unattributed'),
  };
}

export function offerReady(offer) {
  return offer.approved === true && Number.isInteger(offer.monthlyPriceCents) &&
    offer.monthlyPriceCents > 0 && offer.currency === 'EUR' &&
    offer.films.every(film => film.rightsApproved === true &&
      typeof film.title === 'string' && film.title.length > 0 &&
      typeof film.poster === 'string' && film.poster.startsWith('/'));
}

export function validSurvey(answers) {
  if (!answers || typeof answers !== 'object') return false;
  return ['exclusive', 'finnish-subtitles', 'cult-classics', 'new-international'].includes(answers.subscriptionReason) &&
    ['several-weekly', 'few-monthly', 'less-often'].includes(answers.viewingFrequency) &&
    Array.isArray(answers.genres) && answers.genres.length >= 1 && answers.genres.length <= 3 &&
    new Set(answers.genres).size === answers.genres.length &&
    answers.genres.every(value => ['slasher', 'giallo', 'body-horror', 'folk-horror', 'supernatural', 'psychological', 'cult', 'classics', 'extreme', 'new-indie'].includes(value)) &&
    (answers.device === undefined || ['smart-tv', 'chromecast', 'apple-tv', 'android-tv', 'computer', 'mobile-tablet', 'other'].includes(answers.device));
}

export function cleanSurvey(answers) {
  return { subscriptionReason: answers.subscriptionReason, viewingFrequency: answers.viewingFrequency,
    genres: answers.genres, ...(answers.device ? { device: answers.device } : {}) };
}
