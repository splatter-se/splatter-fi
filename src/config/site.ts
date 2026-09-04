const clean = (value: string | undefined) => value?.trim() || "";

export const siteConfig = {
  origin: "https://splatter.fi",
  contactEmail: clean(import.meta.env.PUBLIC_CONTACT_EMAIL) || "hej@splatter.se",
  analyticsEndpoint: clean(import.meta.env.PUBLIC_ANALYTICS_ENDPOINT),
  surveyEndpoint: clean(import.meta.env.PUBLIC_SURVEY_ENDPOINT),
  landingVariant: clean(import.meta.env.PUBLIC_LANDING_VARIANT) || "default",
} as const;

export const mailchimpConfig = {
  action: clean(import.meta.env.PUBLIC_MAILCHIMP_ACTION),
  consentName: clean(import.meta.env.PUBLIC_MAILCHIMP_CONSENT_NAME),
  consentValue: clean(import.meta.env.PUBLIC_MAILCHIMP_CONSENT_VALUE),
  honeypotName: clean(import.meta.env.PUBLIC_MAILCHIMP_HONEYPOT_NAME),
  tagId: clean(import.meta.env.PUBLIC_MAILCHIMP_TAG_ID),
  attributionFields: {
    utm_source: clean(import.meta.env.PUBLIC_MAILCHIMP_UTM_SOURCE_NAME),
    utm_medium: clean(import.meta.env.PUBLIC_MAILCHIMP_UTM_MEDIUM_NAME),
    utm_campaign: clean(import.meta.env.PUBLIC_MAILCHIMP_UTM_CAMPAIGN_NAME),
    utm_content: clean(import.meta.env.PUBLIC_MAILCHIMP_UTM_CONTENT_NAME),
    landing_variant: clean(import.meta.env.PUBLIC_MAILCHIMP_VARIANT_NAME),
  },
} as const;

export const signupReady = Boolean(
  mailchimpConfig.action &&
    mailchimpConfig.consentName &&
    mailchimpConfig.consentValue &&
    mailchimpConfig.honeypotName &&
    mailchimpConfig.tagId,
);

