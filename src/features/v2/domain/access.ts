export const INTERNAL_ROLES_V2 = [
  "owner",
  "administrator",
  "contributor",
  "internal_viewer",
] as const;

export type InternalRoleV2 = (typeof INTERNAL_ROLES_V2)[number];

export const EXTERNAL_RECIPIENT_TYPES = [
  "investor",
  "bank",
  "dfi",
  "auditor",
  "advisor",
  "other",
] as const;

export type ExternalRecipientType =
  (typeof EXTERNAL_RECIPIENT_TYPES)[number];

export const ACCESS_STATES = [
  "draft",
  "sent",
  "email_verified",
  "nda_pending",
  "active",
  "expiring_soon",
  "expired",
  "revoked",
] as const;

export type AccessState = (typeof ACCESS_STATES)[number];

export interface ExternalAccessPolicy {
  emailVerificationRequired: boolean;
  ndaRequired: boolean;
  watermarkEnabled: boolean;
  downloadEnabled: boolean;
  expiresAt: string | null;
  passcodeEnabled: boolean;
}

export interface ExternalAccessSummary {
  id: string;
  operationId: string;
  recipientType: ExternalRecipientType;
  state: AccessState;
  visibleFolderIds: string[];
  visibleDocumentIds: string[];
  policy: ExternalAccessPolicy;
}
