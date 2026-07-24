import Link from "next/link";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";

/**
 * Gabarit d'onboarding — handoff v2 §5.
 *
 * Remplace la carte isolée au milieu d'une page vide par une GRILLE
 * `288px 1fr` (1040px de large) : à gauche le rail des étapes et un encart
 * contextuel, à droite la carte du formulaire. L'écran remplit sa hauteur.
 *
 * Header sticky blanc 56px : logo, « ÉTAPE n / 2 » en mono, barre de
 * progression 140×4 et « Enregistrer et quitter ».
 */

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

export interface OnboardingStep {
  title: string;
  subtitle: string;
}

/** Pastille d'étape : faite (coche), active (pleine), à venir (bordure). */
function Pastille({ state }: { state: "done" | "active" | "todo" }) {
  if (state === "done") {
    return (
      <span className="grid place-items-center w-6 h-6 rounded-full bg-[#E85C2B] text-white shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="grid place-items-center w-6 h-6 rounded-full bg-[#E85C2B] shrink-0">
        <span className="w-2 h-2 rounded-full bg-white" />
      </span>
    );
  }
  return <span className="w-6 h-6 rounded-full border-[1.5px] border-[#D9D5CB] bg-white shrink-0" />;
}

export function OnboardingShell({
  step,
  total,
  steps,
  aside,
  children,
}: {
  step: number;
  total: number;
  /** Les étapes du rail gauche (la dernière peut être hors inscription). */
  steps: OnboardingStep[];
  /** Encart contextuel sous le rail — dépend de l'étape en cours. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pct = Math.round((step / total) * 100);

  return (
    <main className="min-h-screen bg-[#F4F1EA] flex flex-col">
      <header className="sticky top-0 z-[60] flex items-center justify-between h-[56px] px-6 bg-white border-b border-[#E8E5DC]">
        <SanzaLogo size={20} />
        <div className="flex items-center gap-3.5">
          <span style={mono} className="text-[11px] text-[#8B8FA3] uppercase tracking-[0.06em]">
            Étape {step} / {total}
          </span>
          <span className="block w-[140px] h-1 rounded-full bg-[#E8E5DC] overflow-hidden">
            <span className="block h-full bg-[#E85C2B] transition-all" style={{ width: `${pct}%` }} />
          </span>
          <Link href="/dashboard" className="text-[12.5px] font-[600] text-[#8B8FA3] hover:text-[#4A4E63]">
            Enregistrer et quitter
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[1040px] grid gap-10 md:grid-cols-[288px_1fr]">
          {/* Rail des étapes — masqué sur mobile, où il pousserait le
              formulaire sous la ligne de flottaison. */}
          <aside className="hidden md:flex flex-col gap-6">
            <div>
              <div style={mono} className="text-[10.5px] font-[600] uppercase tracking-[0.1em] text-[#8B8FA3] mb-4">
                Votre inscription
              </div>
              <ol className="relative flex flex-col gap-5">
                {steps.map((s, i) => {
                  const n = i + 1;
                  const state = n < step ? "done" : n === step ? "active" : "todo";
                  return (
                    <li key={s.title} className="relative flex gap-3">
                      {/* Trait vertical 2px reliant les pastilles. */}
                      {i < steps.length - 1 && (
                        <span className="absolute left-[11px] top-6 bottom-[-20px] w-0.5 bg-[#E2DED4]" aria-hidden />
                      )}
                      <Pastille state={state} />
                      <span className="min-w-0 pt-0.5">
                        <span className={"block text-[13px] font-[650] " + (state === "todo" ? "text-[#8B8FA3]" : "text-[#171A2C]")}>
                          {s.title}
                        </span>
                        <span className="block text-[11.5px] text-[#8B8FA3] leading-snug mt-0.5">
                          {s.subtitle}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
            {aside}
          </aside>

          {/* Carte du formulaire */}
          <div className="bg-white border border-[#E8E5DC] rounded-[18px] px-8 py-9 lg:px-11 lg:py-10">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Encart Encre du rail (étape 1) : carte sombre avec arcs réduits, conforme à
 * la ligne « cartes sombres dans une page claire » du §4.
 */
export function AsideEncre({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[14px] bg-[#171A2C] text-white p-5">
      <ResonanceArcs corner="bottom-right" size={230} />
      <div className="relative z-10">
        <div className="text-[12.5px] font-[650] mb-1.5">{title}</div>
        <p className="text-[11.5px] text-white/65 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

/** Encart clair du rail (étape 2). */
export function AsideClair({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] bg-white border border-[#E8E5DC] p-5">
      <div className="text-[12.5px] font-[650] text-[#171A2C] mb-1.5">{title}</div>
      <p className="text-[11.5px] text-[#4A4E63] leading-relaxed">{children}</p>
    </div>
  );
}
