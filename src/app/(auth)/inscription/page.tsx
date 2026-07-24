import { AuthSplit } from "@/components/auth/AuthSplit";
import { SignupForm } from "@/components/auth/SignupForm";
import { Mono } from "@/components/ui/Table";

/**
 * Ligne-feature en CARTE DE VERRE (handoff v2 §3) : icône dans un carré
 * arrondi orange 34px, titre, description.
 */
function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3.5 rounded-[14px] border border-white/10 bg-white/[0.055] p-3.5">
      <span className="grid place-items-center w-[34px] h-[34px] rounded-[10px] bg-[rgba(232,92,43,0.16)] text-[#f08a5e] flex-none">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-[650] text-white">{title}</span>
        <span className="block text-[12px] text-white/60 leading-snug mt-0.5">{text}</span>
      </span>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <AuthSplit
      arcsCorner="top-left"
      formWidth={452}
      footer={<Mono className="text-[12px] text-white/50">sanza.africa</Mono>}
      panel={
        <div>
          <h2 className="text-[36px] font-[700] leading-[1.1] tracking-[-0.025em]">
            Faites résonner vos deals.
          </h2>
          <div className="mt-6 flex flex-col gap-3">
            <Feature
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>}
              title="Documents protégés"
              text="Filigrane au nom du lecteur, téléchargement bloqué, preuve de signature."
            />
            <Feature
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></svg>}
              title="Data room structurée"
              text="Arborescence OHADA/UEMOA et suivi des pièces à fournir."
            />
            <Feature
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 7-7" /><path d="M21 8v4h-4" /></svg>}
              title="Qui a lu quoi"
              text="Pages consultées, temps de lecture, journal d'audit inaltérable."
            />
          </div>
        </div>
      }
    >
      <SignupForm />
    </AuthSplit>
  );
}
