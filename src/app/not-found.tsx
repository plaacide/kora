import Link from "next/link";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { EchoMotif } from "@/components/brand/EchoMotif";
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";

/**
 * 404 de marque. Volontairement sobre : la page d'erreur n'est pas un endroit
 * pour vendre, mais pour remettre le visiteur sur un chemin.
 */
export default function NotFound() {
  return (
    <main className="relative overflow-hidden min-h-screen bg-bg grid place-items-center px-6">
      {/* Écran vide : 1 jeu d'arcs, bas-droit, 480 (handoff v2 §4). */}
      <ResonanceArcs corner="bottom-right" size={480} tone="light" />
      <div className="relative z-10 flex flex-col items-center gap-5 text-center max-w-md">
        <SanzaLogo size={30} />
        <EchoMotif />
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
            Cette page n&apos;existe pas.
          </h1>
          <p className="text-[13px] text-ink-secondary leading-relaxed">
            Le lien est peut-être périmé, ou la page a été déplacée.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link href="/" className="sz-cta text-[13.5px]">
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-[9px] border border-line px-4 py-2.5 text-[13.5px] font-[550] text-ink-secondary hover:text-ink hover:border-line-strong transition-colors min-h-[44px]"
          >
            Aller au dealroom
          </Link>
        </div>
      </div>
    </main>
  );
}
