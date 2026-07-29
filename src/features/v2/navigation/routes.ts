function segment(value: string): string {
  return encodeURIComponent(value);
}

function folderPath(path: readonly string[]): string {
  return path.length === 0 ? "" : `/${path.map(segment).join("/")}`;
}

export const v2Routes = {
  root: "/v2",
  onboarding: {
    root: "/v2/onboarding",
    company: "/v2/onboarding/company",
    operation: "/v2/onboarding/operation",
    details: "/v2/onboarding/details",
    result: "/v2/onboarding/result",
  },
  operations: {
    list: "/v2/operations",
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
