/**
 * E-mails d'authentification — composés PAR NOUS, plus par Supabase.
 *
 * Supabase appelle `/api/auth/email-hook` au lieu d'envoyer lui-même (cf. la
 * route). On récupère ainsi trois choses que ses gabarits de tableau de bord ne
 * savent pas faire :
 *   - la langue de l'utilisateur (ses gabarits sont monolingues) ;
 *   - un lien au format `token_hash` que `/auth/confirm` sait vérifier côté
 *     serveur (cf. AGENTS.md : `{{ .ConfirmationURL }}` ne convient pas) ;
 *   - du HTML versionné et relu, plutôt que collé dans une interface web.
 *
 * Design repris des maquettes `emails/auth/*.html`. Styles entièrement en ligne
 * et mise en page en tableaux : Gmail supprime les feuilles de style et Outlook
 * ignore flex/grid.
 */

export type AuthEmailKind =
  | "signup"
  | "recovery"
  | "magiclink"
  | "invite"
  | "email_change"
  | "reauthentication";

export type Locale = "fr" | "en";

const INK = "#171A2C";
const ACCENT = "#E85C2B";
const ACCENT_DARK = "#C64B1E";
const BODY = "#4A4E63";
const MUTED = "#8B8FA3";
const SAND = "#F4EFE6";
const LINE = "#E8E5DC";

const SUPPORT = "securite@sanza.africa";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Coquille de marque commune aux six e-mails. */
function shell(input: {
  preheader: string;
  title: string;
  subtitle: string;
  body: string;
  locale: Locale;
}): string {
  const fr = input.locale === "fr";
  const doubt = fr
    ? `Un doute&nbsp;? Écrivez à <a href="mailto:${SUPPORT}" style="color:${ACCENT_DARK};text-decoration:underline;">${SUPPORT}</a> — une vraie personne vous répond.`
    : `Any doubt? Write to <a href="mailto:${SUPPORT}" style="color:${ACCENT_DARK};text-decoration:underline;">${SUPPORT}</a> — a real person will answer.`;
  const legal = fr
    ? "Sanza — Plateforme de dealflow panafricaine<br>Cocody, Riviera Golf, Abidjan, Côte d'Ivoire<br>E-mail transactionnel lié à la sécurité de votre compte — il ne peut pas être désactivé."
    : "Sanza — Pan-African dealflow platform<br>Cocody, Riviera Golf, Abidjan, Côte d'Ivoire<br>Transactional email tied to your account security — it cannot be turned off.";

  return `<!DOCTYPE html>
<html lang="${input.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#EFEDE6;">
<span style="display:none;font-size:1px;color:#EFEDE6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(input.preheader)}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#EFEDE6;">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
  <tr><td bgcolor="${INK}" style="background-color:${INK};border-radius:14px 14px 0 0;padding:28px 36px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:bold;letter-spacing:-0.5px;color:#FFFFFF;mso-line-height-rule:exactly;line-height:26px;">sanz<span style="color:${ACCENT};">a</span></td>
        <td align="right">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="6" height="26" bgcolor="#4A3530" style="background-color:#4A3530;border-radius:3px;font-size:1px;line-height:1px;">&nbsp;</td>
              <td width="4" style="font-size:1px;line-height:1px;">&nbsp;</td>
              <td width="6" height="26" bgcolor="#8A4A32" style="background-color:#8A4A32;border-radius:3px;font-size:1px;line-height:1px;">&nbsp;</td>
              <td width="4" style="font-size:1px;line-height:1px;">&nbsp;</td>
              <td width="6" height="26" bgcolor="${ACCENT}" style="background-color:${ACCENT};border-radius:3px;font-size:1px;line-height:1px;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td bgcolor="${INK}" style="background-color:${INK};padding:8px 36px 34px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:bold;color:#FFFFFF;mso-line-height-rule:exactly;line-height:34px;">${escapeHtml(input.title)}</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#B9BCC9;mso-line-height-rule:exactly;line-height:24px;padding-top:10px;">${escapeHtml(input.subtitle)}</div>
  </td></tr>
  <tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:32px 36px 30px;">${input.body}</td></tr>
  <tr><td bgcolor="${SAND}" style="background-color:${SAND};padding:18px 36px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${BODY};mso-line-height-rule:exactly;line-height:20px;">${doubt}</div>
  </td></tr>
  <tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border-radius:0 0 14px 14px;border-top:1px solid ${LINE};padding:22px 36px 26px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:${INK};">sanz<span style="color:${ACCENT};">a</span></div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:${MUTED};mso-line-height-rule:exactly;line-height:18px;padding-top:8px;">${legal}</div>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function paragraph(html: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14.5px;color:${BODY};mso-line-height-rule:exactly;line-height:23px;padding-bottom:18px;">${html}</div>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 18px;">
      <tr><td bgcolor="${ACCENT}" style="background-color:${ACCENT};border-radius:9px;">
        <a href="${href}" style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;padding:14px 34px;mso-line-height-rule:exactly;line-height:18px;">${label}</a>
      </td></tr>
    </table>`;
}

/** Repli texte : certains clients (et certaines passerelles) neutralisent les boutons. */
function fallback(href: string, locale: Locale): string {
  const label =
    locale === "fr"
      ? "Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:"
      : "If the button does not work, copy this link into your browser:";
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};mso-line-height-rule:exactly;line-height:19px;padding-bottom:6px;">${label}<br><a href="${href}" style="color:${ACCENT_DARK};text-decoration:underline;word-break:break-all;">${href}</a></div>`;
}

function code(token: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 18px;">
      <tr><td align="center" bgcolor="${SAND}" style="background-color:${SAND};border:1px dashed #D8D3C6;border-radius:10px;padding:18px;">
        <div style="font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:bold;letter-spacing:8px;color:${INK};">${escapeHtml(token)}</div>
      </td></tr>
    </table>`;
}

function footnote(html: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;color:${MUTED};mso-line-height-rule:exactly;line-height:19px;border-top:1px solid ${LINE};padding-top:16px;">${html}</div>`;
}

export interface AuthEmailInput {
  kind: AuthEmailKind;
  locale: Locale;
  /** Adresse du destinataire, affichée pour lever toute ambiguïté de compte. */
  email: string;
  /** Lien déjà construit (absent pour la ré-authentification). */
  link?: string;
  /** Code à usage unique, quand Supabase en fournit un. */
  token?: string;
  /** Nouvelle adresse, pour un changement d'e-mail. */
  newEmail?: string;
}

/**
 * Rend l'e-mail correspondant à l'action Supabase.
 *
 * Le sujet fait partie du gabarit : c'est la première chose lue, et le laisser
 * à Supabase le ramènerait en anglais (le défaut constaté en production).
 */
export function authEmail(input: AuthEmailInput): {
  subject: string;
  html: string;
} {
  const fr = input.locale === "fr";
  const who = escapeHtml(input.email);
  const link = input.link ?? "";

  switch (input.kind) {
    case "signup": {
      const subject = fr
        ? "Confirmez votre adresse e-mail — Sanza"
        : "Confirm your email address — Sanza";
      return {
        subject,
        html: shell({
          locale: input.locale,
          preheader: fr
            ? "Une dernière étape pour activer votre compte Sanza."
            : "One last step to activate your Sanza account.",
          title: fr ? "Confirmez votre adresse e-mail" : "Confirm your email address",
          subtitle: fr
            ? "Bienvenue sur Sanza. Cliquez ci-dessous pour activer votre compte."
            : "Welcome to Sanza. Click below to activate your account.",
          body:
            paragraph(
              fr
                ? `Vous venez de créer un compte Sanza avec l'adresse <strong>${who}</strong>. Confirmez-la pour continuer.`
                : `You have just created a Sanza account with the address <strong>${who}</strong>. Confirm it to continue.`,
            ) +
            button(link, fr ? "Confirmer mon adresse" : "Confirm my address") +
            fallback(link, input.locale) +
            footnote(
              fr
                ? "Vous n'êtes pas à l'origine de cette inscription ? Ignorez cet e-mail — aucun compte ne sera activé."
                : "Didn't sign up? Ignore this email — no account will be activated.",
            ),
        }),
      };
    }

    case "recovery": {
      const subject = fr
        ? "Réinitialisez votre mot de passe Sanza"
        : "Reset your Sanza password";
      return {
        subject,
        html: shell({
          locale: input.locale,
          preheader: fr
            ? "Choisissez un nouveau mot de passe pour votre compte Sanza."
            : "Choose a new password for your Sanza account.",
          title: fr ? "Réinitialisez votre mot de passe" : "Reset your password",
          subtitle: fr
            ? "Une demande de réinitialisation a été faite pour votre compte."
            : "A reset was requested for your account.",
          body:
            paragraph(
              fr
                ? `Compte concerné&nbsp;: <strong>${who}</strong>. Cliquez ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable une heure et ne peut servir qu'une fois.`
                : `Account: <strong>${who}</strong>. Click below to choose a new password. This link is valid for one hour and can only be used once.`,
            ) +
            button(
              link,
              fr ? "Choisir un nouveau mot de passe" : "Choose a new password",
            ) +
            fallback(link, input.locale) +
            footnote(
              fr
                ? "Vous n'avez rien demandé ? Ignorez cet e-mail — votre mot de passe actuel reste inchangé."
                : "Didn't request this? Ignore this email — your current password stays unchanged.",
            ),
        }),
      };
    }

    case "magiclink": {
      const subject = fr
        ? "Votre lien de connexion Sanza"
        : "Your Sanza sign-in link";
      return {
        subject,
        html: shell({
          locale: input.locale,
          preheader: fr
            ? "Connectez-vous à Sanza en un clic."
            : "Sign in to Sanza in one click.",
          title: fr ? "Votre lien de connexion" : "Your sign-in link",
          subtitle: fr
            ? "Un clic suffit — pas de mot de passe à retenir."
            : "One click is enough — no password to remember.",
          body:
            paragraph(
              fr
                ? `Connectez-vous au compte <strong>${who}</strong> avec ce lien à usage unique&nbsp;:`
                : `Sign in to <strong>${who}</strong> with this single-use link:`,
            ) +
            button(link, fr ? "Me connecter à Sanza" : "Sign in to Sanza") +
            (input.token
              ? paragraph(
                  fr
                    ? "Ou saisissez ce code à usage unique&nbsp;:"
                    : "Or enter this one-time code:",
                ) + code(input.token)
              : "") +
            fallback(link, input.locale) +
            footnote(
              fr
                ? "Vous n'avez pas demandé à vous connecter ? Ignorez cet e-mail — le lien expirera de lui-même."
                : "Didn't ask to sign in? Ignore this email — the link will expire on its own.",
            ),
        }),
      };
    }

    case "invite": {
      const subject = fr
        ? "Vous êtes invité·e à rejoindre Sanza"
        : "You have been invited to join Sanza";
      return {
        subject,
        html: shell({
          locale: input.locale,
          preheader: fr
            ? "Créez votre compte et rejoignez la plateforme de dealflow panafricaine."
            : "Create your account and join the pan-African dealflow platform.",
          title: fr ? "Vous êtes invité·e sur Sanza" : "You're invited to Sanza",
          subtitle: fr
            ? "Sanza connecte investisseurs et fondateurs africains : profils structurés, data rooms sécurisées, mises en relation directes."
            : "Sanza connects African investors and founders: structured profiles, secure data rooms, direct introductions.",
          body:
            paragraph(
              fr
                ? `Une invitation a été envoyée à <strong>${who}</strong>. Acceptez-la pour créer votre compte.`
                : `An invitation was sent to <strong>${who}</strong>. Accept it to create your account.`,
            ) +
            button(link, fr ? "Accepter l'invitation" : "Accept the invitation") +
            fallback(link, input.locale) +
            footnote(
              fr
                ? "Cette invitation ne vous concerne pas ? Ignorez simplement cet e-mail."
                : "Not for you? Simply ignore this email.",
            ),
        }),
      };
    }

    case "email_change": {
      const subject = fr
        ? "Confirmez votre nouvelle adresse e-mail"
        : "Confirm your new email address";
      const target = escapeHtml(input.newEmail ?? input.email);
      return {
        subject,
        html: shell({
          locale: input.locale,
          preheader: fr
            ? "Validez le changement d'adresse e-mail de votre compte Sanza."
            : "Confirm the email change on your Sanza account.",
          title: fr
            ? "Confirmez votre nouvelle adresse"
            : "Confirm your new address",
          subtitle: fr
            ? "Vous avez demandé à changer l'adresse associée à votre compte Sanza."
            : "You asked to change the address linked to your Sanza account.",
          body:
            paragraph(
              fr
                ? `Changement demandé&nbsp;: <strong>${who}</strong> → <strong>${target}</strong>. Confirmez pour l'appliquer.`
                : `Requested change: <strong>${who}</strong> → <strong>${target}</strong>. Confirm to apply it.`,
            ) +
            button(
              link,
              fr ? "Confirmer ma nouvelle adresse" : "Confirm my new address",
            ) +
            fallback(link, input.locale) +
            footnote(
              fr
                ? `Vous n'avez pas demandé ce changement ? Ignorez cet e-mail et écrivez à <a href="mailto:${SUPPORT}" style="color:${ACCENT_DARK};text-decoration:underline;">${SUPPORT}</a>.`
                : `Didn't request this change? Ignore this email and write to <a href="mailto:${SUPPORT}" style="color:${ACCENT_DARK};text-decoration:underline;">${SUPPORT}</a>.`,
            ),
        }),
      };
    }

    case "reauthentication": {
      const subject = fr
        ? "Votre code de vérification Sanza"
        : "Your Sanza verification code";
      return {
        subject,
        html: shell({
          locale: input.locale,
          preheader: fr
            ? "Code de vérification pour une opération sensible sur votre compte."
            : "Verification code for a sensitive operation on your account.",
          title: fr ? "Vérifiez votre identité" : "Verify your identity",
          subtitle: fr
            ? "Une opération sensible sur votre compte nécessite une confirmation."
            : "A sensitive operation on your account needs confirmation.",
          body:
            paragraph(
              fr
                ? "Saisissez ce code dans Sanza pour confirmer qu'il s'agit bien de vous&nbsp;:"
                : "Enter this code in Sanza to confirm it is really you:",
            ) +
            code(input.token ?? "") +
            footnote(
              fr
                ? `Vous n'êtes pas à l'origine de cette demande ? N'utilisez pas ce code, changez votre mot de passe et écrivez à <a href="mailto:${SUPPORT}" style="color:${ACCENT_DARK};text-decoration:underline;">${SUPPORT}</a>.`
                : `Didn't request this? Do not use this code, change your password and write to <a href="mailto:${SUPPORT}" style="color:${ACCENT_DARK};text-decoration:underline;">${SUPPORT}</a>.`,
            ),
        }),
      };
    }
  }
}
