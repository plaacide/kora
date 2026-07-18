import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { Mono } from "@/components/ui/Table";

/**
 * Gabarit commun des étapes d'onboarding : header blanc sticky (logo + étape
 * n/total + barre de progression), carte centrée 560px sur fond craie.
 */
export function OnboardingShell({
  step,
  total,
  children,
}: {
  step: number;
  total: number;
  children: React.ReactNode;
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <main className="min-h-screen bg-bg">
      <header className="sticky top-0 z-[60] flex items-center justify-between h-[52px] px-6 bg-surface border-b border-line">
        <SanzaLogo size={19} />
        <div className="flex items-center gap-3">
          <Mono className="text-[11px] text-ink-muted uppercase tracking-[0.05em]">
            Étape {step} / {total}
          </Mono>
          <span className="block w-[120px] h-1 rounded-full bg-line overflow-hidden">
            <span
              className="block h-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </span>
        </div>
      </header>

      <div className="px-6 py-10 grid place-items-center">
        <div className="w-full max-w-[560px] bg-surface border border-line rounded-[16px] p-9 shadow-card">
          {children}
        </div>
      </div>
    </main>
  );
}
