import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { NdaGate } from "@/components/invitations/NdaGate";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { InviteeSignup } from "@/components/invitations/InviteeSignup";

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
    nda_template: string | null;
    valid: boolean;
  }> | null)?.[0];

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md flex flex-col gap-6">
        <SanzaLogo size={24} />
        {children}
      </div>
    </main>
  );

  if (!invite || !invite.valid) {
    return shell(
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
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
  // Mais on ne renvoie PAS vers une inscription générique (qui exigerait un
  // second e-mail de confirmation) : le compte se crée ici, sur place.
  if (!user) {
    return shell(
      <InviteeSignup
        token={token}
        email={invite.email}
        labels={{
          title: t("newTitle"),
          body: t("newBody", { deal: invite.deal_name }),
          fullName: t("newFullName"),
          password: t("newPassword"),
          passwordHint: t("newPasswordHint"),
          submit: t("newSubmit"),
          haveAccount: t("newHaveAccount"),
          login: t("login"),
          exists: t("newExists"),
          weak: t("newWeak"),
          generic: t("newGeneric"),
          incomplete: t("newIncomplete"),
        }}
      />,
    );
  }

  // Connecté, mais avec un autre compte que le destinataire.
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return shell(
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
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
      ndaTemplate={invite.nda_template}
    />,
  );
}
