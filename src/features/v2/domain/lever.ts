export type RelationshipStage =
  | "À cibler"
  | "Contacté"
  | "Premier échange"
  | "Intéressé"
  | "Diligence"
  | "Comité ou offre"
  | "Engagé"
  | "Refusé";

export type DocumentAccessState =
  | "Non invité"
  | "Invitation envoyée"
  | "NDA signé"
  | "Accès actif"
  | "Révoqué";

export type CommitmentLevel =
  | "Aucun"
  | "Intérêt indicatif"
  | "Soft-commit"
  | "Confirmé"
  | "Retiré";

export type InstrumentType = "Capital" | "Dette" | "DFI ou impact";
export type FunderType = "VC ou fonds" | "Banque ou prêteur" | "DFI ou impact";
export type VerificationStatus = "Déclaré" | "Vérifié en interne" | "Audité";

export type InvestorRecord = {
  initials: string;
  organisation: string;
  contact: string;
  category: string;
  stage: RelationshipStage;
  lastInteraction: string;
  nextAction: string;
  owner: string;
  access: DocumentAccessState;
  commitment: CommitmentLevel;
  amount?: number;
};

export type UpdateIndicator = {
  id: string;
  name: string;
  definition: string;
  period: string;
  value: string;
  comparison?: string;
  status: VerificationStatus;
  family: "Performance" | "Remboursement" | "Impact" | "ESG";
  recommendedFor: readonly `${InstrumentType}:${FunderType}`[];
};

export const investorPipeline: readonly InvestorRecord[] = [
  {
    initials: "SG",
    organisation: "Sahel Growth Fund",
    contact: "Amina Diallo",
    category: "VC",
    stage: "Diligence",
    lastInteraction: "Réunion — 24-07",
    nextAction: "Q&A · 5 août",
    owner: "Amara",
    access: "Accès actif",
    commitment: "Confirmé",
    amount: 120_000_000,
  },
  {
    initials: "HV",
    organisation: "Horizon Ventures",
    contact: "Kwame Mensah",
    category: "VC",
    stage: "Intéressé",
    lastInteraction: "NDA signé — hier",
    nextAction: "Cap table · aujourd’hui",
    owner: "Ibrahima",
    access: "NDA signé",
    commitment: "Soft-commit",
    amount: 80_000_000,
  },
  {
    initials: "IC",
    organisation: "Impact Capital Africa",
    contact: "Clara Morel",
    category: "Fonds à impact",
    stage: "Premier échange",
    lastInteraction: "Call — 18-07",
    nextAction: "Call · 26 juil. · en retard",
    owner: "Amara",
    access: "Invitation envoyée",
    commitment: "Aucun",
  },
  {
    initials: "BV",
    organisation: "Baobab Ventures",
    contact: "David Mensima",
    category: "VC",
    stage: "Contacté",
    lastInteraction: "E-mail — 22-07",
    nextAction: "Relancer · demain",
    owner: "Amara",
    access: "Non invité",
    commitment: "Aucun",
  },
] as const;

const debtDfi = "Dette:DFI ou impact" as const;

export const updateIndicators: readonly UpdateIndicator[] = [
  {
    id: "operating-cash-flow",
    name: "Flux de trésorerie opérationnel",
    definition: "Encaissements − décaissements d’exploitation",
    period: "T2 2026",
    value: "36 000 000 XOF",
    comparison: "+9 % vs T1",
    status: "Vérifié en interne",
    family: "Remboursement",
    recommendedFor: [debtDfi, "Dette:Banque ou prêteur"],
  },
  {
    id: "dscr",
    name: "DSCR — couverture du service de la dette",
    definition: "Flux opérationnel / service de la dette",
    period: "T2 2026",
    value: "1,6x",
    comparison: "stable",
    status: "Vérifié en interne",
    family: "Remboursement",
    recommendedFor: [debtDfi, "Dette:Banque ou prêteur"],
  },
  {
    id: "cash",
    name: "Trésorerie disponible",
    definition: "Soldes bancaires consolidés",
    period: "30-06-2026",
    value: "145 000 000 XOF",
    status: "Déclaré",
    family: "Remboursement",
    recommendedFor: [debtDfi, "Dette:Banque ou prêteur", "Capital:VC ou fonds"],
  },
  {
    id: "covenants",
    name: "Covenants",
    definition: "Ratio d’endettement",
    period: "T2 2026",
    value: "Respectés",
    status: "Déclaré",
    family: "Remboursement",
    recommendedFor: [debtDfi, "Dette:Banque ou prêteur"],
  },
  {
    id: "jobs",
    name: "Emplois directs",
    definition: "CDI + CDD > 6 mois, au dernier jour de la période",
    period: "T2 2026",
    value: "68 · dont 57 % de femmes",
    comparison: "+6",
    status: "Vérifié en interne",
    family: "Impact",
    recommendedFor: [debtDfi, "DFI ou impact:DFI ou impact"],
  },
  {
    id: "households",
    name: "Ménages nouvellement desservis",
    definition: "Nouveaux raccordements actifs",
    period: "T2 2026",
    value: "12 400 · 64 % ruraux",
    comparison: "+2 100",
    status: "Déclaré",
    family: "Impact",
    recommendedFor: [debtDfi, "DFI ou impact:DFI ou impact"],
  },
  {
    id: "emissions",
    name: "Émissions évitées",
    definition: "Méthodologie GOGLA, déclarée",
    period: "T2 2026",
    value: "1 850 tCO₂e",
    comparison: "+240",
    status: "Déclaré",
    family: "Impact",
    recommendedFor: [debtDfi, "DFI ou impact:DFI ou impact"],
  },
  {
    id: "es-incidents",
    name: "Incidents E&S majeurs",
    definition: "Incidents graves + mesures correctives",
    period: "T2 2026",
    value: "0",
    comparison: "=",
    status: "Vérifié en interne",
    family: "ESG",
    recommendedFor: [debtDfi, "DFI ou impact:DFI ou impact"],
  },
  {
    id: "dso",
    name: "Délai moyen de paiement clients",
    definition: "DSO — créances / CA × jours",
    period: "T2 2026",
    value: "48 jours",
    status: "Déclaré",
    family: "Performance",
    recommendedFor: [],
  },
  {
    id: "total-debt",
    name: "Dette totale",
    definition: "Encours consolidé",
    period: "30-06-2026",
    value: "90 000 000 XOF",
    status: "Déclaré",
    family: "Remboursement",
    recommendedFor: [],
  },
] as const;

export function updateProfile(
  instrument: InstrumentType,
  funder: FunderType,
): readonly UpdateIndicator[] {
  const key = `${instrument}:${funder}` as const;
  return updateIndicators.filter((indicator) =>
    indicator.recommendedFor.includes(key),
  );
}

export function securedAmount(records: readonly InvestorRecord[]): number {
  return records
    .filter(
      (record) =>
        record.commitment === "Confirmé" || record.commitment === "Soft-commit",
    )
    .reduce((total, record) => total + (record.amount ?? 0), 0);
}
