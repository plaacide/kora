import { AuthSplit } from "@/components/auth/AuthSplit";
import { LoginForm } from "@/components/auth/LoginForm";

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] border border-white/10 px-3 py-1.5 text-[12px] text-white/85">
      <span className="text-[#f08a5e]">{icon}</span>
      {label}
    </span>
  );
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <AuthSplit
      arcsCorner="top-left"
      panel={
        <div>
          <h2 className="text-[24px] font-[650] leading-tight tracking-[-0.02em]">
            Le dealflow africain,{" "}
            <span className="text-[#e85c2b]">enfin structuré.</span>
          </h2>
          <p className="mt-3 text-[13px] text-white/70 leading-relaxed">
            240 investisseurs et 1 800 startups se rencontrent sur Sanza.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
              }
              label="KYC vérifié"
            />
            <Badge
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20h-20" /></svg>
              }
              label="Deals suivis"
            />
          </div>
        </div>
      }
    >
      <LoginForm notice={erreur} />
    </AuthSplit>
  );
}
