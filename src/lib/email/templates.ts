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
<body style="margin:0;padding:0;background:#f6f6f8;font-family:'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e4e4ea;border-radius:12px;padding:32px;">
        <tr><td>
          <div style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:8px;background:#2f3061;color:#ffffff;font-weight:700;font-size:15px;">K</div>
          <h1 style="margin:20px 0 12px;font-size:20px;font-weight:600;color:#232338;letter-spacing:-0.02em;">${escape(subject)}</h1>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#55556a;">${intro}</p>
          ${ndaLine ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#55556a;">${escape(ndaLine)}</p>` : ""}
          <a href="${input.link}" style="display:inline-block;background:#2f3061;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">${escape(cta)}</a>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8a8a9c;">${escape(notice)}</p>
          <hr style="border:none;border-top:1px solid #eeeef2;margin:24px 0 16px;">
          <p style="margin:0;font-size:11px;color:#a0a0b0;">Sanza — ${fr ? "data room sécurisée" : "secure data room"} · ${fr ? "Chiffré" : "Encrypted"} · SOC 2</p>
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
