import { describe, expect, it } from "vitest";

import {
  renouvellementEmail,
  resiliationEmail,
  souscriptionEmail,
} from "./billing-templates";

const BASE = {
  orgName: "Nimba Solar",
  planNom: "Raise",
  montant: "21 750 XOF",
  echeance: "1er septembre 2026",
  facture: "SANZA-2026-0001",
  lien: "https://v2.sanza.africa/v2/abonnement",
};

describe("les trois courriers", () => {
  const tous = [
    souscriptionEmail(BASE),
    renouvellementEmail(BASE),
    resiliationEmail({
      orgName: BASE.orgName,
      planNom: BASE.planNom,
      finLe: BASE.echeance,
      lien: BASE.lien,
    }),
  ];

  it("ne promettent JAMAIS un prélèvement automatique", () => {
    // Genius Pay ne confirme pas que le renouvellement en est un, et son
    // tableau de bord n'expose aucun événement d'abonnement. Promettre un
    // débit qui n'aura pas lieu couperait l'accès de quelqu'un qui attendait
    // qu'on le débite.
    for (const courrier of tous) {
      const texte = (courrier.subject + courrier.html).toLowerCase();
      expect(texte).not.toContain("automatique");
      expect(texte).not.toContain("prélèvement");
      expect(texte).not.toContain("prelevement");
    }
  });

  it("échappent le nom de l’organisation", () => {
    // Un nom d'espace est saisi par l'utilisateur : il arrive dans un courrier
    // envoyé à quelqu'un d'autre.
    const courrier = souscriptionEmail({
      ...BASE,
      orgName: '<img src=x onerror="alert(1)">',
    });
    expect(courrier.html).not.toContain("<img src=x");
    expect(courrier.html).toContain("&lt;img");
  });

  it("mènent tous à l’écran d’abonnement", () => {
    for (const courrier of tous) {
      expect(courrier.html).toContain(BASE.lien);
    }
  });
});

describe("souscriptionEmail", () => {
  it("porte le numéro de facture et la prochaine échéance", () => {
    // C'est ce courrier qu'on retrouvera six mois plus tard en cherchant
    // « combien je paie Sanza » — il doit se suffire à lui-même.
    const { html } = souscriptionEmail(BASE);
    expect(html).toContain("SANZA-2026-0001");
    expect(html).toContain("1er septembre 2026");
    expect(html).toContain("21 750 XOF");
  });

  it("reste lisible sans facture ni échéance", () => {
    const { html } = souscriptionEmail({ ...BASE, echeance: null, facture: null });
    expect(html).toContain("21 750 XOF");
    expect(html).not.toContain("null");
  });

  it("annonce le plan dans l’objet", () => {
    expect(souscriptionEmail(BASE).subject).toContain("Raise");
  });
});

describe("renouvellementEmail", () => {
  it("ne souhaite pas la bienvenue à qui paie pour la sixième fois", () => {
    const { html, subject } = renouvellementEmail(BASE);
    expect(subject).toContain("Reçu");
    expect(html).not.toContain("Bienvenue");
    expect(html).toContain("reconduit");
  });

  it("porte le montant dans l’objet, pour se retrouver dans une boîte pleine", () => {
    expect(renouvellementEmail(BASE).subject).toContain("21 750 XOF");
  });
});

describe("resiliationEmail", () => {
  const courrier = resiliationEmail({
    orgName: BASE.orgName,
    planNom: BASE.planNom,
    finLe: "1er septembre 2026",
    lien: BASE.lien,
  });

  it("ne retient personne et ne demande pas de motif", () => {
    // L'écran l'a déjà demandé une fois. Y revenir par courrier se lirait
    // comme du harcèlement.
    const texte = courrier.html.toLowerCase();
    expect(texte).not.toContain("pourquoi");
    expect(texte).not.toContain("rester");
    expect(texte).not.toContain("regrett");
  });

  it("dit la date jusqu’à laquelle le service est dû", () => {
    expect(courrier.html).toContain("1er septembre 2026");
  });

  it("promet qu’aucune donnée n’est supprimée", () => {
    expect(courrier.html).toContain("Aucune donnée n’est supprimée");
  });

  it("rappelle qu’on peut revenir en arrière", () => {
    expect(courrier.html).toContain("revenir sur cette décision");
  });

  it("reste juste quand la date de fin est inconnue", () => {
    const sansDate = resiliationEmail({
      orgName: BASE.orgName,
      planNom: BASE.planNom,
      finLe: null,
      lien: BASE.lien,
    });
    expect(sansDate.html).not.toContain("null");
    expect(sansDate.html).toContain("Rien n’est coupé aujourd’hui");
  });
});
