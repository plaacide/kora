import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Space_Grotesk } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";

// Police de toute l'interface Sanza, conforme au brand handoff.
const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Police de TITRE. Space Grotesk est le cousin libre le plus proche de Sharp
// Grotesk (l'affichage de DocSend) : même caractère « grotesque » anguleux,
// zéro coût de licence. Réservée aux titres — en corps de texte, sa
// personnalité fatiguerait ; Instrument Sans y reste la police de lecture.
const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("title"), description: t("description") };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${plexMono.variable} ${instrument.variable} ${space.variable} h-full`}
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
