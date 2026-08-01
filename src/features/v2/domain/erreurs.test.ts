import { describe, expect, it } from "vitest";

import {
  type CodeErreur,
  codeDepuisPostgres,
  echec,
  messageDErreur,
} from "./erreurs";

/**
 * Ces tests gardent une propriété, pas une liste : aucun code ne doit pouvoir
 * exister sans mots, et aucun mot ne doit ressembler à ce que la base écrit.
 * Le jour où un code est ajouté sans son texte, c'est ici que ça casse — pas
 * sous les yeux du fondateur.
 */

// La liste est reconstruite ici volontairement, et l'oubli est rattrapé à la
// compilation par `Manquants` plus bas — `satisfies` seul ne vérifierait que le
// sens facile, celui où chaque entrée est bien un code.
const TOUS = [
  "droits.insuffisants",
  "session.expiree",
  "inattendu",
  "limite.operations_actives",
  "limite.membres_internes",
  "limite.visiteurs_externes",
  "limite.stockage",
  "limite.autre",
  "operation.nom_requis",
  "operation.introuvable",
  "equipe.adresse_invalide",
  "equipe.role_invalide",
  "equipe.dernier_proprietaire",
  "equipe.retrait_de_soi",
  "equipe.nomination_reservee",
  "equipe.membre_introuvable",
  "equipe.deja_membre",
  "equipe.invitation_traitee",
  "equipe.invitation_non_creee",
  "acces.destinataire_requis",
  "acces.adresse_invalide",
  "acces.perimetre_vide",
  "acces.invitation_introuvable",
  "acces.invitation_expiree",
  "acces.invitation_revoquee",
  "acces.invitation_deja_acceptee",
  "acces.autre_adresse",
  "demande.introuvable",
  "demande.deja_traitee",
  "demande.expiree",
  "demande.relance_unique",
  "document.nom_requis",
  "document.introuvable",
  "document.invalide",
  "document.version_invalide",
  "document.envoi_echoue",
  "document.trop_volumineux",
  "document.deja_depose",
  "document.envoi_annule",
  "dossier.nom_requis",
  "dossier.introuvable",
  "dossier.non_vide",
  "dossier.sous_dossiers",
  "dossier.invalide",
  "exigence.intitule_trop_court",
  "exigence.statut_inconnu",
  "exigence.doublon",
  "exigence.introuvable",
  "preuve.introuvable",
  "levee.nom_requis",
  "levee.introuvable",
  "levee.deja_en_cours",
  "levee.aucune_en_cours",
  "investisseur.requis",
  "investisseur.introuvable",
  "engagement.montant_requis",
  "engagement.introuvable",
  "interaction.introuvable",
  "maj.introuvable",
  "maj.deja_publiee",
  "maj.titre_trop_court",
  "maj.vide",
  "abonnement.plan_inconnu",
  "abonnement.aucun",
  "abonnement.aucune_resiliation",
  "abonnement.tarif_illisible",
  "abonnement.expire",
  "securite.action_inconnue",
] as const satisfies readonly CodeErreur[];

/**
 * Le garde-fou qui compte vraiment : tout code absent de `TOUS` apparaît ici,
 * et l'affectation cesse de compiler en nommant le manquant. Sans lui, un code
 * ajouté sans texte passerait tous les tests ci-dessous — ils ne parcourent que
 * `TOUS`.
 */
type Manquants = Exclude<CodeErreur, (typeof TOUS)[number]>;
const _aucunCodeOublie: Manquants extends never ? true : Manquants = true;
void _aucunCodeOublie;

describe("le catalogue", () => {
  it("donne un texte à chaque code", () => {
    for (const code of TOUS) {
      expect(messageDErreur(code), code).toBeTruthy();
    }
  });

  it("écrit des phrases, pas des étiquettes", () => {
    for (const code of TOUS) {
      const message = messageDErreur(code);
      expect(message.length, code).toBeGreaterThan(15);
      expect(message.endsWith("."), `${code} : ${message}`).toBe(true);
    }
  });

  it("ne laisse filtrer aucun vocabulaire technique", () => {
    // Ce que le §12 interdit : noms de tables, de colonnes, jargon Postgres.
    const interdits = [
      "null",
      "constraint",
      "violates",
      "duplicate key",
      "relation",
      "supabase",
      "rpc",
      "postgres",
      "deals",
      "checklist_items",
      "raise_investors",
      "undefined",
    ];

    for (const code of TOUS) {
      const message = messageDErreur(code).toLowerCase();
      for (const mot of interdits) {
        expect(message.includes(mot), `${code} contient « ${mot} »`).toBe(false);
      }
    }
  });

  it("évite les formulations que le §5 proscrit", () => {
    const proscrits = [
      "oups",
      "une erreur inattendue",
      "une erreur est survenue",
      "ultérieurement",
      "il suffit",
      "vous pouvez simplement",
      "désolé",
      "intelligent",
      "!",
    ];

    for (const code of TOUS) {
      const message = messageDErreur(code).toLowerCase();
      for (const mot of proscrits) {
        expect(message.includes(mot), `${code} contient « ${mot} »`).toBe(false);
      }
    }
  });
});

describe("la traduction depuis Postgres", () => {
  it("reconnaît les exceptions que les RPC lèvent", () => {
    const cas: Array<[string, CodeErreur]> = [
      ["dernier propriétaire", "equipe.dernier_proprietaire"],
      ["retrait de soi-même", "equipe.retrait_de_soi"],
      ["droits insuffisants", "droits.insuffisants"],
      ["adresse invalide", "equipe.adresse_invalide"],
      ["le dossier contient 3 document(s)", "dossier.non_vide"],
      ["le dossier contient des sous-dossiers", "dossier.sous_dossiers"],
      ["exigence déjà présente", "exigence.doublon"],
      ["plan inconnu", "abonnement.plan_inconnu"],
      ["invitation expirée", "acces.invitation_expiree"],
      ["cette demande a déjà reçu une réponse", "demande.deja_traitee"],
      ["cette data room a déjà une levée en cours", "levee.deja_en_cours"],
    ];

    for (const [brut, attendu] of cas) {
      expect(codeDepuisPostgres(brut), brut).toBe(attendu);
    }
  });

  it("range les refus de limite sur le bon plan", () => {
    expect(codeDepuisPostgres("limite atteinte : active_deals")).toBe(
      "limite.operations_actives",
    );
    expect(codeDepuisPostgres("limite atteinte : storage_gb")).toBe(
      "limite.stockage",
    );
    // Une limite ajoutée en base sans être mise en mots ici reste un refus de
    // plan : mieux vaut un texte générique qu'un « inattendu » trompeur.
    expect(codeDepuisPostgres("limite atteinte : quelque_chose")).toBe(
      "limite.autre",
    );
  });

  it("préfère le message le plus précis quand deux fragments coïncident", () => {
    // « invitation introuvable » est contenu dans le message plus long ; sans
    // l'ordre, l'équipe recevrait le texte des accès.
    expect(codeDepuisPostgres("invitation introuvable ou déjà traitée")).toBe(
      "equipe.invitation_traitee",
    );
    expect(codeDepuisPostgres("invitation introuvable")).toBe(
      "acces.invitation_introuvable",
    );
  });

  it("ne rend JAMAIS le message d'origine", () => {
    const bruts = [
      'duplicate key value violates unique constraint "documents_pkey"',
      "permission denied for relation deals",
      "null value in column \"deal_id\" violates not-null constraint",
      "JWT expired",
      "",
    ];

    for (const brut of bruts) {
      const code = codeDepuisPostgres(brut);
      expect(code, brut).toBe("inattendu");
      // La chaîne vide est écartée : toute chaîne la contient, l'assertion
      // n'apprendrait rien. Elle reste dans la liste pour le code rendu.
      if (brut) expect(messageDErreur(code)).not.toContain(brut.slice(0, 20));
    }
  });

  it("ignore la casse", () => {
    expect(codeDepuisPostgres("Dernier Propriétaire")).toBe(
      "equipe.dernier_proprietaire",
    );
  });
});

describe("echec()", () => {
  it("ne porte que le code", () => {
    expect(echec("dossier.non_vide")).toEqual({
      ok: false,
      code: "dossier.non_vide",
    });
  });
});
