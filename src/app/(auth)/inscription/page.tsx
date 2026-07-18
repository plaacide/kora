import { AuthSplit } from "@/components/auth/AuthSplit";
import { SignupForm } from "@/components/auth/SignupForm";
import { Mono } from "@/components/ui/Table";

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid place-items-center w-[30px] h-[30px] rounded-[8px] bg-[rgba(232,92,43,0.16)] text-[#f08a5e] flex-none">
        {icon}
      </span>
      <span className="text-[13px] text-white/85 leading-snug pt-1">{text}</span>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <AuthSplit
      arcsCorner="top-left"
      footer={<Mono className="text-[12px] text-white/50">sanza.africa</Mono>}
      panel={
        <div>
          <h2 className="text-[24px] font-[650] leading-tight tracking-[-0.02em]">
            Faites résonner vos deals.
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            <Feature
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>}
              text="Deals vérifiés, screening OFAC / UE / ONU"
            />
            <Feature
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></svg>}
              text="Data rooms et syndication intégrées"
            />
            <Feature
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 7-7" /><path d="M21 8v4h-4" /></svg>}
              text="Reporting KPI automatisé post-investissement"
            />
          </div>
        </div>
      }
    >
      <SignupForm />
    </AuthSplit>
  );
}
