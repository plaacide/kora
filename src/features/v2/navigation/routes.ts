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
  help: "/v2/roadmap",

  /**
   * Le parcours programme — accélérateurs, incubateurs, studios.
   *
   * Les adresses viennent des notes d'écran du paquet `parcours-programme`,
   * préfixées de `/v2` : elles y sont écrites une à une, de « Route /cohortes »
   * à « Route /dealrooms/[id] ». Elles sont déclarées ICI avant d'exister,
   * pour qu'aucun écran ne naisse à une adresse que rien ne propose — l'erreur
   * consignée trois fois dans l'arbre des connexions.
   *
   * Deux entrées du rail ne sont maquettées nulle part : l'accueil du
   * programme et les rapports. Elles mènent à un écran d'attente, et le
   * disent.
   */
  programme: {
    accueil: "/v2/programme",
    onboarding: {
      organisation: "/v2/onboarding/programme/organisation",
      accompagnement: "/v2/onboarding/programme/accompagnement",
      cohorte: "/v2/onboarding/programme/cohorte",
      pret: "/v2/onboarding/programme/pret",
    },
    portefeuille: "/v2/portefeuille",
    demandes: "/v2/demandes",
    rapports: "/v2/rapports",
    cohortes: {
      list: "/v2/cohortes",
      root: (cohorteId: string) => `/v2/cohortes/${segment(cohorteId)}`,
      entreprises: (cohorteId: string) =>
        `/v2/cohortes/${segment(cohorteId)}/entreprises`,
      challenges: (cohorteId: string) =>
        `/v2/cohortes/${segment(cohorteId)}/challenges`,
      challengeNouveau: (cohorteId: string) =>
        `/v2/cohortes/${segment(cohorteId)}/challenges/nouveau`,
      challenge: (cohorteId: string, challengeId: string) =>
        `/v2/cohortes/${segment(cohorteId)}/challenges/${segment(challengeId)}`,
      bibliotheque: (cohorteId: string) =>
        `/v2/cohortes/${segment(cohorteId)}/challenges/bibliotheque`,
      questions: (cohorteId: string) =>
        `/v2/cohortes/${segment(cohorteId)}/questions`,
      dealrooms: (cohorteId: string) =>
        `/v2/cohortes/${segment(cohorteId)}/dealrooms`,
      rapports: (cohorteId: string) =>
        `/v2/cohortes/${segment(cohorteId)}/rapports`,
    },
    dealrooms: {
      list: "/v2/dealrooms",
      nouvelle: "/v2/dealrooms/nouvelle",
      root: (dealroomId: string) => `/v2/dealrooms/${segment(dealroomId)}`,
      entreprises: (dealroomId: string) =>
        `/v2/dealrooms/${segment(dealroomId)}/entreprises`,
      audience: (dealroomId: string) =>
        `/v2/dealrooms/${segment(dealroomId)}/audience`,
      demandes: (dealroomId: string) =>
        `/v2/dealrooms/${segment(dealroomId)}/demandes`,
      branding: (dealroomId: string) =>
        `/v2/dealrooms/${segment(dealroomId)}/branding`,
      activite: (dealroomId: string) =>
        `/v2/dealrooms/${segment(dealroomId)}/activite`,
    },
  },
} as const;
