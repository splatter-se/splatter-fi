-- Per measured first-touch session. These are not all site visitors or unique people.
-- Baseline (offer_version NULL) is never mixed with the priced demand experiment.
WITH sessions AS (
  SELECT session_id, offer_version, source, medium, campaign, content, received_at
  FROM events
  WHERE event = 'finland_landing_view' AND country = 'FI'
    AND source != 'qa' AND medium != 'qa' AND content != 'qa'
), counts AS (
  SELECT s.offer_version, s.source, s.medium, s.campaign, s.content,
    COUNT(DISTINCT s.session_id) AS measured_fi_sessions,
    COUNT(DISTINCT CASE WHEN l.verified_at IS NOT NULL THEN l.member_hash END) AS verified_leads,
    COUNT(DISTINCT CASE WHEN l.verified_at IS NOT NULL AND l.intent='yes'
      AND l.offer_version=s.offer_version THEN l.member_hash END) AS qualified_leads
  FROM sessions s LEFT JOIN leads l ON l.session_id=s.session_id AND l.country='FI'
    AND l.experiment_id='fi-demand-2026-01'
  GROUP BY s.offer_version, s.source, s.medium, s.campaign, s.content
)
SELECT *, ROUND(100.0 * verified_leads / NULLIF(measured_fi_sessions, 0), 2) AS verified_lead_percent
FROM counts ORDER BY offer_version, source, content;

-- Outside the measured cohort: valid leads who declined measurement must stay separate.
SELECT COUNT(*) AS confirmed_without_session_measurement
FROM leads WHERE verified_at IS NOT NULL AND session_id IS NULL;

SELECT country, COUNT(DISTINCT session_id) AS measured_sessions
FROM events WHERE event='finland_landing_view' AND source!='qa' AND medium!='qa' AND content!='qa'
GROUP BY country;
