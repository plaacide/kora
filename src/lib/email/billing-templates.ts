/**
 * Les courriers d'abonnement — souscription, renouvellement, résiliation.
 *
 * CE QU'ILS DOIVENT FAIRE, ET QUI DÉCIDE DE LEUR CONTENU. Un e-mail de
 * facturation n'est pas une amabilité : c'est souvent la seule trace écrite
 * qu'un fondateur gardera de ce qu'il a payé, et la pièce qu'il transmettra à
 * son comptable. Il porte donc le montant, la date d'échéance et le numéro de
 * facture — pas seulement un « merci ».
 *
 * TROIS RÈGLES TENUES DANS LES TROIS COURRIERS :
 *
 *   1. Aucun ne dit « automatique ». Genius Pay ne confirme pas que le
 *      renouvellement est un prélèvement, et son tableau de bord n'expose aucun
 *      événement d'abonnement. Promettre un débit qui n'aura pas lieu couperait
 *      l'accès de quelqu'un qui attendait qu'on le débite.
 *   2. Aucun ne culpabilise. Celui de résiliation ne demande pas pourquoi et ne
 *      propose pas de rester — l'écran l'a déjà demandé une fois, et une
 *      seconde relance par courrier se lit comme du harcèlement.
 *   3. Chacun dit ce qui se passe ENSUITE. « Votre plan est ouvert » sans date
 *      d'échéance oblige à revenir chercher l'information dans l'application.
 */

function escape(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Le corps commun : un seul gabarit, pour que les trois se ressemblent. */
function enveloppe(input: {
  titre: string;
  intro: string;
  lignes: Array<[string, string]>;
  note: string;
  lien?: { url: string; label: string };
}): string {
  const rangs = input.lignes
    .map(
      ([cle, valeur]) =>
        `<tr>
          <td style="padding:7px 0;font-size:13px;color:#8b8fa3;">${escape(cle)}</td>
          <td style="padding:7px 0;font-size:13px;color:#171a2c;font-weight:500;text-align:right;">${escape(valeur)}</td>
        </tr>`,
    )
    .join("");

  const bouton = input.lien
    ? `<a href="${input.lien.url}" style="display:inline-block;background:#e85c2b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">${escape(input.lien.label)}</a>`
    : "";

  return `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f7f5f0;font-family:'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e8e5dc;border-radius:12px;padding:32px;">
        <tr><td>
          <div style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:8px;background:#171a2c;color:#ffffff;font-weight:700;font-size:16px;letter-spacing:-0.015em;">a</div>
          <h1 style="margin:20px 0 12px;font-size:20px;font-weight:600;color:#171a2c;letter-spacing:-0.02em;">${escape(input.titre)}</h1>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4a4e63;">${input.intro}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e5dc;border-bottom:1px solid #e8e5dc;margin:0 0 20px;">${rangs}</table>
          ${bouton}
          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8b8fa3;">${escape(input.note)}</p>
          <hr style="border:none;border-top:1px solid #e8e5dc;margin:24px 0 16px;">
          <p style="margin:0;font-size:11px;color:#8b8fa3;">Sanza — data room sécurisée · Chiffré · SOC 2</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface CourrierAbonnement {
  subject: string;
  html: string;
}

/**
 * Souscription — le premier paiement d'un plan.
 *
 * Porte le numéro de facture : c'est ce courrier qu'on retrouvera dans sa boîte
 * six mois plus tard en cherchant « combien je paie Sanza ».
 */
export function souscriptionEmail(input: {
  orgName: string;
  planNom: string;
  montant: string;
  echeance: string | null;
  facture: string | null;
  lien: string;
}): CourrierAbonnement {
  const lignes: Array<[string, string]> = [
    ["Espace", input.orgName],
    ["Plan", input.planNom],
    ["Montant réglé", input.montant],
  ];
  if (input.echeance) lignes.push(["Prochaine échéance", input.echeance]);
  if (input.facture) lignes.push(["Facture", input.facture]);

  return {
    subject: `Votre plan ${input.planNom} est ouvert — Sanza`,
    html: enveloppe({
      titre: `Le plan ${input.planNom} est ouvert`,
      intro:
        `Nous avons bien reçu votre paiement pour <strong>${escape(input.orgName)}</strong>. ` +
        `Les fonctions du plan sont disponibles dès maintenant.`,
      lignes,
      note:
        "Nous vous préviendrons avant la prochaine échéance. Selon votre " +
        "opérateur, le règlement suivant peut demander votre confirmation — " +
        "vous ne serez jamais débité sans le savoir.",
      lien: { url: input.lien, label: "Voir mon abonnement" },
    }),
  };
}

/**
 * Renouvellement — une échéance réglée sur un plan déjà en cours.
 *
 * Distinct de la souscription : on ne redit pas « bienvenue » à quelqu'un qui
 * paie pour la sixième fois. Le ton est celui d'un reçu.
 */
export function renouvellementEmail(input: {
  orgName: string;
  planNom: string;
  montant: string;
  echeance: string | null;
  facture: string | null;
  lien: string;
}): CourrierAbonnement {
  const lignes: Array<[string, string]> = [
    ["Espace", input.orgName],
    ["Plan", input.planNom],
    ["Montant réglé", input.montant],
  ];
  if (input.echeance) lignes.push(["Période couverte jusqu’au", input.echeance]);
  if (input.facture) lignes.push(["Facture", input.facture]);

  return {
    subject: `Reçu — plan ${input.planNom} · ${input.montant}`,
    html: enveloppe({
      titre: "Votre abonnement est reconduit",
      intro:
        `Le règlement de <strong>${escape(input.orgName)}</strong> a bien été reçu. ` +
        `Rien ne change pour vous : votre espace et vos opérations continuent.`,
      lignes,
      note:
        "Cette échéance est réglée. Nous vous préviendrons avant la suivante.",
      lien: { url: input.lien, label: "Voir mes factures" },
    }),
  };
}

/**
 * Résiliation — l'annonce, pas la fin.
 *
 * NE DEMANDE RIEN ET NE RETIENT PERSONNE. L'écran a déjà proposé de garder
 * l'abonnement et demandé le motif ; y revenir par courrier se lirait comme du
 * harcèlement. Ce que ce message doit faire, c'est rassurer sur les données et
 * rappeler qu'on peut encore changer d'avis — sans le réclamer.
 */
export function resiliationEmail(input: {
  orgName: string;
  planNom: string;
  finLe: string | null;
  lien: string;
}): CourrierAbonnement {
  const lignes: Array<[string, string]> = [
    ["Espace", input.orgName],
    ["Plan", input.planNom],
  ];
  if (input.finLe) lignes.push(["Actif jusqu’au", input.finLe]);

  return {
    subject: "Votre résiliation est enregistrée — Sanza",
    html: enveloppe({
      titre: "Votre résiliation est enregistrée",
      intro:
        `Votre plan reste entier${input.finLe ? ` jusqu’au <strong>${escape(input.finLe)}</strong>` : ""} — ` +
        `la période que vous avez réglée vous est due. Rien n’est coupé aujourd’hui.`,
      lignes,
      note:
        "Aucune donnée n’est supprimée, ni maintenant ni après. Vos opérations, " +
        "vos pièces et votre journal restent consultables. Tant que la date " +
        "n’est pas passée, vous pouvez revenir sur cette décision depuis votre " +
        "espace.",
      lien: { url: input.lien, label: "Voir mon abonnement" },
    }),
  };
}
