import type { Locale } from "@/i18n/locales";

const NBSP = " ";
const NNBSP = " ";

/**
 * Formate un montant selon le handoff : `1 250 000 000 FCFA` avec des espaces
 * insécables (jamais de retour à la ligne au milieu d'un montant).
 * XOF/XAF sont rendus « FCFA » comme dans le design, pas « F CFA ».
 */
export function formatAmount(
  value: number,
  currency: string,
  locale: Locale = "fr",
): string {
  const isCfa = currency === "XOF" || currency === "XAF";

  const number = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: 0,
  })
    .format(value)
    // Intl peut produire des espaces fines/normales : on force l'insécable.
    .replace(/[\s  ]/g, NBSP);

  if (isCfa) return `${number}${NBSP}FCFA`;

  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/[\s ]/g, NBSP);
}

/** Dates longues localisées : « mercredi 16 juillet ». */
export function formatDate(
  date: Date,
  locale: Locale = "fr",
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  },
): string {
  return new Intl.DateTimeFormat(
    locale === "fr" ? "fr-FR" : "en-US",
    options,
  ).format(date);
}

export { NBSP, NNBSP };
