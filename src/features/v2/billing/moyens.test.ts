import { describe, expect, it } from "vitest";

import {
  MOYENS,
  moyen,
  normaliserTelephone,
  phraseEcheance,
  refusDeSaisie,
  telephonePlausible,
} from "./moyens";

describe("MOYENS", () => {
  it("n’accorde l’abonnement récurrent qu’au mobile money", () => {
    // L'API d'abonnement de Genius Pay exige un téléphone et n'offre aucune
    // option carte. Si cette asymétrie disparaissait du code, l'écran
    // promettrait un prélèvement que le prestataire ne sait pas faire.
    expect(moyen("mobile_money")?.porteAbonnement).toBe(true);
    expect(moyen("card")?.porteAbonnement).toBe(false);
  });

  it("ne réclame un numéro que là où il est indispensable", () => {
    expect(moyen("mobile_money")?.exigeTelephone).toBe(true);
    expect(moyen("card")?.exigeTelephone).toBe(false);
  });

  it("laisse Genius Pay proposer le choix de l’opérateur", () => {
    // `payment_method` omis = leur page de sélection. Imposer un opérateur
    // ferait perdre un paiement déjà décidé.
    expect(moyen("mobile_money")?.paymentMethod).toBeNull();
    expect(moyen("card")?.paymentMethod).toBe("card");
  });

  it("rend null sur un moyen inconnu plutôt que de deviner", () => {
    expect(moyen("bitcoin")).toBeNull();
  });

  it("n’expose que des moyens réellement acceptés", () => {
    expect(MOYENS).toHaveLength(2);
  });
});

describe("normaliserTelephone", () => {
  it("accepte les formes réellement écrites par les gens", () => {
    expect(normaliserTelephone("07 12 34 56 78")).toBe("0712345678");
    expect(normaliserTelephone("+225 07-12-34-56-78")).toBe("+2250712345678");
    expect(normaliserTelephone("07.12.34.56.78")).toBe("0712345678");
    expect(normaliserTelephone("(225) 0712345678")).toBe("2250712345678");
  });

  it("garde le plus initial et lui seul", () => {
    expect(normaliserTelephone("+221771234567")).toBe("+221771234567");
    // Un plus au milieu n'a pas de sens : il disparaît.
    expect(normaliserTelephone("0771+234567")).toBe("0771234567");
  });
});

describe("telephonePlausible", () => {
  it("accepte les longueurs d’Afrique de l’Ouest", () => {
    expect(telephonePlausible("0712345678")).toBe(true); // Côte d’Ivoire, 10
    expect(telephonePlausible("771234567")).toBe(true); // Sénégal, 9
    expect(telephonePlausible("+2250712345678")).toBe(true);
  });

  it("refuse ce qui est manifestement incomplet", () => {
    expect(telephonePlausible("")).toBe(false);
    expect(telephonePlausible("0712")).toBe(false);
    expect(telephonePlausible("07123456789012345678")).toBe(false);
  });

  it("reste permissif — un validateur trop précis refuserait un pays entier", () => {
    // La Côte d’Ivoire est passée de 8 à 10 chiffres en 2021. Un test sur la
    // longueur exacte aurait alors bloqué tous ses clients du jour au lendemain.
    expect(telephonePlausible("07123456")).toBe(true);
  });
});

describe("phraseEcheance", () => {
  it("ne promet JAMAIS un prélèvement automatique", () => {
    // Genius Pay ne confirme pas que le renouvellement est un débit réel. Tant
    // que la réponse n'est pas écrite, aucune de ces phrases ne doit l'affirmer.
    for (const code of ["mobile_money", "card"] as const) {
      for (const intervalle of ["month", "year"] as const) {
        const phrase = phraseEcheance(code, intervalle);
        expect(phrase.toLowerCase()).not.toContain("automatique");
        expect(phrase.toLowerCase()).not.toContain("prélevé");
      }
    }
  });

  it("dit que la carte n’est pas conservée", () => {
    expect(phraseEcheance("card", "month")).toContain("n’est pas conservée");
  });

  it("prévient qu’un opérateur peut demander confirmation", () => {
    expect(phraseEcheance("mobile_money", "month")).toContain("confirmation");
  });

  it("distingue l’année du mois", () => {
    expect(phraseEcheance("card", "year")).toContain("un an");
    expect(phraseEcheance("card", "month")).toContain("un mois");
  });
});

describe("refusDeSaisie", () => {
  it("laisse passer une carte sans numéro", () => {
    expect(refusDeSaisie({ moyen: "card", telephone: "" })).toBeNull();
  });

  it("réclame le numéro en mobile money", () => {
    const refus = refusDeSaisie({ moyen: "mobile_money", telephone: "" });
    expect(refus).toContain("numéro");
  });

  it("signale un numéro incomplet plutôt que de griser un bouton", () => {
    const refus = refusDeSaisie({ moyen: "mobile_money", telephone: "0712" });
    expect(refus).toContain("incomplet");
  });

  it("accepte un numéro valide", () => {
    expect(refusDeSaisie({ moyen: "mobile_money", telephone: "07 12 34 56 78" })).toBeNull();
  });

  it("ne se laisse pas berner par des espaces seuls", () => {
    expect(refusDeSaisie({ moyen: "mobile_money", telephone: "   " })).toContain("numéro");
  });
});
