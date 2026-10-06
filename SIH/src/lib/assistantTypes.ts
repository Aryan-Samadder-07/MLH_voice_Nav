export type SupportedLang = "en" | "mr" | "bn";

export interface AssistantTelemetry {
  rpm_used?: number;
  rpm_limit?: number;
  rpm_available?: number;
  daily_used?: number;
  daily_limit?: number;
  daily_available?: number;
  total_lifetime_requests?: number;
  last_latency_ms?: number;
  avg_latency_ms?: number;
  rate_limit_status?: string;
  window_reset_seconds?: number;
}

export interface AssistantResponse {
  intent: "NAVIGATE" | "FILL_FORM" | "SUBMIT_FORM" | "CLEAR_FORM" | "CHANGE_LANGUAGE" | "LOGOUT" | "SEND_OTP" | "QUESTION" | "PROBLEM_SOLVING" | "RATE_LIMITED" | "UNKNOWN";
  action: "NAVIGATE" | "FILL_FORM" | "SUBMIT_FORM" | "CLEAR_FORM" | "CHANGE_LANGUAGE" | "LOGOUT" | "SEND_OTP" | "NONE";
  transcript?: string;
  language?: string;
  detected_language?: string;
  target_language?: SupportedLang;
  target_path?: string;
  target_route_id?: string;
  target_tab?: string;
  form_data?: Record<string, any>;
  phone_status?: "complete" | "partial" | "excess_digits" | "none";
  otp?: string;
  confidence?: number;
  latency_ms?: number;
  response_text?: string;
  telemetry?: AssistantTelemetry;
}

export interface RouteCatalogItem {
  route_id: string;
  path: string;
  tab?: string;
  name_en: string;
  name_mr: string;
  name_bn: string;
  utterances_en: string[];
  utterances_mr: string[];
  utterances_bn: string[];
}
