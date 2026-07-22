import Link from "next/link";
import { SanzaLogo } from "@/components/ui/SanzaLogo";

/** Pied de page marketing — colonnes Produit / Pour qui / Société (brief §2.8). */
export function MarketingFooter() {
  const col = (title: string, links: { href: string; label: string }[]) => (
    <div className="flex flex-col gap-2.5">
      <div className="text-[12px] font-[650] text-[#C9CBD6]">{title}</div>
      {links.map((l) => (
        <Link
          key={l.href + l.label}
          href={l.href}
          className="text-[13px] text-[#8B8FA3] hover:text-white transition-colors"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );

  return (
    <footer className="bg-[#12141F]">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-12 flex flex-wrap justify-between items-start gap-10">
        <div className="max-w-[280px]">
          <div className="mb-3">
            <SanzaLogo size={22} dark />
          </div>
          <p className="text-[12.5px] text-[#8B8FA3] leading-[1.6]">
            La dealroom pour lever des fonds en Afrique — adaptée à qui vous
            finance.
            <br />
            Abidjan, Côte d&apos;Ivoire ·{" "}
            <a href="https://sanza.africa" className="hover:text-white transition-colors">
              sanza.africa
            </a>
          </p>
        </div>

        <div className="flex gap-10 sm:gap-14 flex-wrap">
          {col("Produit", [
            { href: "/#produit", label: "Fonctionnalités" },
            { href: "/#securite", label: "Sécurité" },
            { href: "/abonnement", label: "Tarifs" },
            { href: "/roadmap", label: "Feuille de route" },
          ])}
          {col("Pour qui", [
            { href: "/institutions", label: "Banques & DFI" },
            { href: "/accelerateurs", label: "Accélérateurs & hubs" },
            { href: "/inscription", label: "Fondateurs" },
          ])}
          {col("Société", [
            { href: "/connexion", label: "Se connecter" },
            { href: "/inscription", label: "Créer ma dealroom" },
            { href: "mailto:securite@sanza.africa", label: "Contact sécurité" },
          ])}
        </div>
      </div>

      <div className="border-t border-white/7">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-[18px] font-mono text-[11.5px] text-white/35">
          © {new Date().getFullYear()} Sanza · Données hébergées dans l&apos;Union
          européenne
        </div>
      </div>
    </footer>
  );
}
