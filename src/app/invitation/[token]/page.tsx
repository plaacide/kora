import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { NdaGate } from "@/components/invitations/NdaGate";
import { Button } from "@/components/ui/Button";

/** Page publique : l'invité y arrive avant même d'avoir un compte. */
export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("invitations");
  const supabase = await createClient();

  // Fonction publique : n'expose que le strict nécessaire à la porte NDA.
  const { data: rows } = await supabase.rpc("invitation_public", {
    p_token: token,
  });
  const invite = (rows as unknown as Array<{
    email: string;
    deal_name: string;
    org_name: string;
    nda_required: boolean;
    valid: boolean;
  }> | null)?.[0];

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md flex flex-col gap-6">
        <span className="grid place-items-center w-9 h-9 rounded-[10px] bg-gradient-to-br from-primary to-primary-strong text-white font-bold text-[16px]">
          K
        </span>
        {children}
      </div>
    </main>
  );

  if (!invite || !invite.valid) {
    return shell(
      <div className="flex flex-col gap-3">
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("invalidTitle")}
        </h1>
        <p className="text-[12.5px] text-ink-secondary leading-relaxed">
          {t("invalidBody")}
        </p>
      </div>,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pas de compte : l'accès anonyme est exclu — l'audit doit nommer un lecteur.
  if (!user) {
    return shell(
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
            {t("signInTitle")}
          </h1>
          <p className="mt-1.5 text-[12.5px] text-ink-secondary leading-relaxed">
            {t("signInBody", { email: invite.email, deal: invite.deal_name })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/connexion?next=/invitation/${token}`}>
            <Button variant="primary">{t("login")}</Button>
          </Link>
          <Link href={`/inscription?next=/invitation/${token}`}>
            <Button variant="secondary">{t("signup")}</Button>
          </Link>
        </div>
      </div>,
    );
  }

  // Connecté, mais avec un autre compte que le destinataire.
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return shell(
      <div className="flex flex-col gap-3">
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("wrongAccountTitle")}
        </h1>
        <p className="text-[12.5px] text-ink-secondary leading-relaxed">
          {t("wrongAccountBody", {
            invited: invite.email,
            current: user.email ?? "",
          })}
        </p>
      </div>,
    );
  }

  return shell(
    <NdaGate
      token={token}
      dealName={invite.deal_name}
      orgName={invite.org_name}
      ndaRequired={invite.nda_required}
    />,
  );
}
