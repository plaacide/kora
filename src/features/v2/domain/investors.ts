export const RELATION_STAGES = [
  "to_target",
  "contacted",
  "meeting_scheduled",
  "interested",
  "diligence",
  "offer_or_committee",
  "committed",
  "declined",
] as const;

export type RelationStage = (typeof RELATION_STAGES)[number];

export const INVESTOR_ACCESS_STATES = [
  "not_invited",
  "invitation_sent",
  "active",
  "revoked",
] as const;

export type InvestorAccessState = (typeof INVESTOR_ACCESS_STATES)[number];

export const COMMITMENT_STATES = [
  "none",
  "indicative_interest",
  "declared_soft_commitment",
  "confirmed_commitment",
] as const;

export type CommitmentState = (typeof COMMITMENT_STATES)[number];

export interface InvestorRelationSummary {
  id: string;
  operationId: string;
  organizationName: string;
  primaryContactName: string | null;
  relationStage: RelationStage;
  accessState: InvestorAccessState;
  commitmentState: CommitmentState;
  declaredAmountMinor: number | null;
  currency: string | null;
  nextActionAt: string | null;
}
