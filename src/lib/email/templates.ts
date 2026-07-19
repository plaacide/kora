interface InvitationEmailInput {
  orgName: string;
  dealName: string;
  link: string;
  ndaRequired: boolean;
  locale: "fr" | "en";
}

/**
 * Email d'invitation — HTML autonome, styles inline.
 *
 * Les clients mail ne supportent ni feuilles de style externes ni CSS moderne :
 * pas de Tailwind ici, on réécrit les tokens à la main (indigo Sanza, Instrument
 * Sans avec repli système).
 */
export function invitationEmail(input: InvitationEmailInput): {
  subject: string;
  html: string;
} {
  const fr = input.locale === "fr";

  const subject = fr
    ? `${input.orgName} vous invite à la data room « ${input.dealName} »`
    : `${input.orgName} invites you to the “${input.dealName}” data room`;

  const intro = fr
    ? `${input.orgName} vous donne accès à la data room sécurisée du deal <strong>${escape(input.dealName)}</strong>.`
    : `${input.orgName} is giving you access to the secure data room for the deal <strong>${escape(input.dealName)}</strong>.`;

  const ndaLine = input.ndaRequired
    ? fr
      ? "Un accord de confidentialité vous sera présenté avant tout accès aux documents."
      : "A non-disclosure agreement will be presented before any access to the documents."
    : "";

  const cta = fr ? "Accéder à la data room" : "Access the data room";

  const notice = fr
    ? "Ce lien vous est personnellement destiné : il ne fonctionne qu'avec cette adresse email. Vos consultations sont horodatées et journalisées."
    : "This link is personal to you: it only works with this email address. Your views are timestamped and logged.";

  const html = `<!doctype html>
<html lang="${input.locale}">
<body style="margin:0;padding:0;background:#f7f5f0;font-family:'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e8e5dc;border-radius:12px;padding:32px;">
        <tr><td>
          <div style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:8px;background:#171a2c;color:#ffffff;font-weight:700;font-size:16px;letter-spacing:-0.015em;">a</div>
          <h1 style="margin:20px 0 12px;font-size:20px;font-weight:600;color:#171a2c;letter-spacing:-0.02em;">${escape(subject)}</h1>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4a4e63;">${intro}</p>
          ${ndaLine ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4a4e63;">${escape(ndaLine)}</p>` : ""}
          <a href="${input.link}" style="display:inline-block;background:#e85c2b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">${escape(cta)}</a>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8b8fa3;">${escape(notice)}</p>
          <hr style="border:none;border-top:1px solid #e8e5dc;margin:24px 0 16px;">
          <p style="margin:0;font-size:11px;color:#8b8fa3;">Sanza — ${fr ? "data room sécurisée" : "secure data room"} · ${fr ? "Chiffré" : "Encrypted"} · SOC 2</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

/** Le nom du deal vient de l'utilisateur : on l'échappe avant de l'injecter. */
function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Confirmation d'inscription à la liste d'attente investisseurs.
 *
 * Volontairement sobre et sans lien d'action : il n'y a rien à faire à ce
 * stade, et un bouton laisserait croire qu'un accès est déjà ouvert. Promettre
 * un accès qui n'existe pas est le meilleur moyen de perdre un investisseur
 * avant même de l'avoir.
 */
export function waitlistEmail(input: { locale: "fr" | "en" }): {
  subject: string;
  html: string;
} {
  const fr = input.locale === "fr";

  const subject = fr
    ? "Votre place sur la liste Sanza est réservée"
    : "Your spot on the Sanza list is reserved";

  const intro = fr
    ? "Merci de votre intérêt. Sanza ouvre d'abord aux fondateurs, le temps de constituer un flux de startups réellement qualifiées — vous montrer une liste vide n'aurait aucun intérêt."
    : "Thank you for your interest. Sanza is opening to founders first, so we can build a genuinely qualified startup flow — showing you an empty list would serve no one.";

  const next = fr
    ? "Nous vous écrirons dès l'ouverture des accès investisseurs. Pas de newsletter entre-temps."
    : "We'll write to you as soon as investor access opens. No newsletter in the meantime.";

  const html = `<!doctype html>
<html lang="${fr ? "fr" : "en"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e8e5dc;border-radius:12px;padding:32px;">
        <tr><td>
          <div style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:8px;background:#171a2c;color:#ffffff;font-weight:700;font-size:16px;letter-spacing:-0.015em;">a</div>
          <h1 style="margin:20px 0 12px;font-size:20px;font-weight:600;color:#171a2c;letter-spacing:-0.02em;">${escape(subject)}</h1>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4a4e63;">${escape(intro)}</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4a4e63;">${escape(next)}</p>
          <hr style="border:none;border-top:1px solid #e8e5dc;margin:24px 0 16px;">
          <p style="margin:0;font-size:11px;color:#8b8fa3;">Sanza — ${fr ? "le dealflow africain, enfin structuré" : "African dealflow, finally structured"}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

/**
 * Invitation à rejoindre la cohorte d'un programme.
 *
 * Le message dit explicitement ce que le programme verra ET ce qu'il ne verra
 * pas. C'est une demande d'accès à des informations sensibles — montant
 * recherché, degré de préparation — adressée à quelqu'un qui n'a rien demandé.
 * Une invitation vague se refuse par défaut, et à raison.
 */
export function cohortInviteEmail(input: {
  saeName: string;
  link: string;
  locale: "fr" | "en";
}): { subject: string; html: string } {
  const fr = input.locale === "fr";

  const subject = fr
    ? `${input.saeName} souhaite suivre votre préparation sur Sanza`
    : `${input.saeName} would like to follow your progress on Sanza`;

  const intro = fr
    ? `<strong>${escape(input.saeName)}</strong> vous invite à rejoindre sa cohorte sur Sanza. Vous restez propriétaire de votre dossier : rejoindre une cohorte ne donne accès à aucun de vos documents.`
    : `<strong>${escape(input.saeName)}</strong> invites you to join their cohort on Sanza. You remain the owner of your file: joining a cohort grants access to none of your documents.`;

  const voit = fr
    ? "Ce que le programme verra : le nom de votre startup, votre stade, le montant recherché, votre degré de préparation et les pièces qu'il vous reste à fournir."
    : "What the programme will see: your startup name, stage, target amount, readiness level and the documents you still have to provide.";

  const voitPas = fr
    ? "Ce qu'il ne verra pas : vos documents. Ni leur contenu, ni leur nom. Vous seul décidez qui accède à votre data room, et vous pouvez quitter la cohorte à tout moment."
    : "What it will not see: your documents — neither their content nor their names. You alone decide who accesses your data room, and you may leave the cohort at any time.";

  const cta = fr ? "Voir la demande" : "Review the request";

  const html = `<!doctype html>
<html lang="${input.locale}">
<body style="margin:0;padding:0;background:#f7f5f0;font-family:'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e8e5dc;border-radius:12px;padding:32px;">
        <tr><td>
          <div style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:8px;background:#171a2c;color:#ffffff;font-weight:700;font-size:16px;letter-spacing:-0.015em;">a</div>
          <h1 style="margin:20px 0 12px;font-size:20px;font-weight:600;color:#171a2c;letter-spacing:-0.02em;">${escape(subject)}</h1>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4a4e63;">${intro}</p>
          <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#4a4e63;">${escape(voit)}</p>
          <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#4a4e63;">${escape(voitPas)}</p>
          <a href="${input.link}" style="display:inline-block;background:#e85c2b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">${escape(cta)}</a>
          <hr style="border:none;border-top:1px solid #e8e5dc;margin:24px 0 16px;">
          <p style="margin:0;font-size:11px;color:#8b8fa3;">Sanza — ${fr ? "data room sécurisée" : "secure data room"}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
