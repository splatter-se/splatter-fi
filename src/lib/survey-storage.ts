import { siteConfig } from "../config/site";
import type { Attribution } from "./analytics";

export type SurveyPayload = {
  measurementConsent: true;
  answers: {
    subscriptionReason: string;
    viewingFrequency: string;
    genres: string[];
    device?: string;
  };
  submittedAt: string;
  sessionId: string;
  attribution: Attribution;
};

export type SurveyResult =
  | { stored: true }
  | { stored: false; reason: "not_configured" | "invalid_response" | "network_error" };

export async function submitSurvey(payload: SurveyPayload): Promise<SurveyResult> {
  if (!siteConfig.surveyEndpoint) return { stored: false, reason: "not_configured" };

  try {
    const response = await fetch(siteConfig.surveyEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) return { stored: false, reason: 'invalid_response' };
    const result = await response.json();
    return result.stored === true ? { stored: true } : { stored: false, reason: 'invalid_response' };
  } catch {
    return { stored: false, reason: "network_error" };
  }
}
