function segment(value: string): string {
  return encodeURIComponent(value);
}

function folderPath(path: readonly string[]): string {
  return path.length === 0 ? "" : `/${path.map(segment).join("/")}`;
}

export const v2Routes = {
  root: "/v2",
  auth: {
    login: "/v2/connexion",
    signup: "/v2/inscription",
    verifyEmail: "/v2/verifier-email",
    twoFactor: "/v2/connexion/2fa",
    forgotPassword: "/v2/mot-de-passe-oublie",
    resetPassword: "/v2/reinitialiser",
  },
  onboarding: {
    root: "/v2/onboarding",
    company: "/v2/onboarding/company",
    operation: "/v2/onboarding/operation",
    details: "/v2/onboarding/details",
    result: "/v2/onboarding/result",
  },
  operations: {
    list: "/v2/operations",
    new: "/v2/operations/nouvelle",
    root: (operationId: string) =>
      `/v2/operations/${segment(operationId)}`,
    overview: (operationId: string) =>
      `/v2/operations/${segment(operationId)}/overview`,
    preparation: (operationId: string) =>
      `/v2/operations/${segment(operationId)}/preparation`,
    documents: (operationId: string, path: readonly string[] = []) =>
      `/v2/operations/${segment(operationId)}/documents${folderPath(path)}`,
    access: (operationId: string) =>
      `/v2/operations/${segment(operationId)}/access`,
    lever: (operationId: string) =>
      `/v2/operations/${segment(operationId)}/lever`,
    investors: (operationId: string) =>
      `/v2/operations/${segment(operationId)}/investors`,
    activity: (operationId: string) =>
      `/v2/operations/${segment(operationId)}/activity`,
  },
  invitations: "/v2/invitations",
  team: "/v2/team",
  security: "/v2/security",
} as const;
