import { siteConfig } from "../config/site";
import type { Attribution } from "./analytics";

export type SurveyPayload = {
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
    return response.ok ? { stored: true } : { stored: false, reason: "invalid_response" };
  } catch {
    return { stored: false, reason: "network_error" };
  }
}

