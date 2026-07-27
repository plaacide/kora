import { SanzaLogo } from "@/components/ui/SanzaLogo";

/**
 * La vitrine vit HORS du groupe `(app)`, et c'est délibéré.
 *
 * Son visiteur est un investisseur invité : il n'a ni data room, ni cohorte,
 * ni levée. Lui servir la barre latérale de l'application lui montrerait sept
 * destinations dont aucune ne lui est ouverte — un menu entièrement grisé est
 * pire qu'un menu absent.
 *
 * D'où une barre supérieure dédiée, qui dit en une ligne où il est et à quel
 * titre. La spec §3 l'exige ; c'est aussi ce qui évite qu'il se croie dans
 * SON espace et cherche ses propres documents.
 */
export default function VitrineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <header className="sticky top-0 z-40 h-[56px] px-6 flex items-center gap-4 bg-white border-b border-[#E8E5DC]">
        <SanzaLogo size={20} />
        <div className="flex-1" />
      </header>
      <main className="px-6 py-8 max-w-[1240px] mx-auto">{children}</main>
    </div>
  );
}
