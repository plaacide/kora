export const PREPARATION_DOMAINS = [
  "company_registration",
  "governance_and_ownership",
  "finance_and_accounting",
  "tax",
  "commercial_and_market",
  "team_and_people",
  "technology_and_ip",
  "impact_environment_and_social",
] as const;

export type PreparationDomain = (typeof PREPARATION_DOMAINS)[number];

export const REQUIREMENT_LEVELS = [
  "required",
  "recommended",
  "optional",
] as const;

export type RequirementLevel = (typeof REQUIREMENT_LEVELS)[number];

export const REQUIREMENT_STATUSES = [
  "to_prepare",
  "document_to_confirm",
  "under_review",
  "ready",
  "to_update",
  "not_applicable",
] as const;

export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

export interface PreparationRequirement {
  id: string;
  operationId: string;
  domain: PreparationDomain;
  level: RequirementLevel;
  status: RequirementStatus;
  title: string;
  rationale: string;
  sourceLabels: string[];
  expectedPeriod: string | null;
  linkedDocumentIds: string[];
}
