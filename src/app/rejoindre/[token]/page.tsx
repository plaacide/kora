import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RejoindreForm } from "@/components/cohorte/RejoindreForm";

/**
 * Le fondateur décide s'il rejoint la cohorte d'un programme.
 *
 * Hors du groupe `(app)` — comme `/invitation/[token]` : la personne peut
 * arriver ici sans session, et le shell applicatif n'a aucun sens tant qu'elle
 * n'a pas choisi.
 *
 * L'écran énonce ce que le programme verra ET ce qu'il ne verra pas, avant le
 * bouton. C'est une demande d'accès à des informations sensibles adressée à
 * quelqu'un qui n'a rien demandé : la lui présenter en une ligne vague
 * reviendrait à obtenir un consentement qui n'en est pas un.
 */
export default async function RejoindrePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?suivant=/rejoindre/${token}`);

  const { data: lien } = await supabase
    .from("cohort_links")
    .select("id, email, status, organizations!cohort_links_sae_org_id_fkey(name)")
    .eq("token", token)
    .maybeSingle();

  const programme =
    (lien?.organizations as unknown as { name?: string } | null)?.name ??
    "Un programme";

  const introuvable = !lien;
  const dejaFait = lien?.status === "accepted";
  const revoque = lien?.status === "revoked";
  // Le jeton peut circuler ; l'adresse, elle, ne ment pas. Même garde-fou que
  // pour les invitations investisseur.
  const mauvaiseAdresse =
    !!lien && (user.email ?? "").toLowerCase() !== lien.email;

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-[520px]">
        <div className="rounded-[14px] border border-line bg-surface p-7">
          {introuvable || revoque ? (
            <>
              <h1 className="text-[20px] font-[650] tracking-[-0.02em]">
                Cette invitation n’est plus valable
              </h1>
              <p className="text-[13px] text-ink-secondary leading-relaxed mt-2">
                Le lien a peut-être été retiré par le programme. Demandez-lui de
                vous en envoyer un nouveau.
              </p>
            </>
          ) : dejaFait ? (
            <>
              <h1 className="text-[20px] font-[650] tracking-[-0.02em]">
                Vous faites déjà partie de cette cohorte
              </h1>
              <p className="text-[13px] text-ink-secondary leading-relaxed mt-2">
                {programme} suit votre préparation. Vous pouvez quitter la
                cohorte à tout moment depuis vos paramètres.
              </p>
            </>
          ) : mauvaiseAdresse ? (
            <>
              <h1 className="text-[20px] font-[650] tracking-[-0.02em]">
                Cette invitation ne vous est pas adressée
              </h1>
              <p className="text-[13px] text-ink-secondary leading-relaxed mt-2">
                Elle a été envoyée à <strong>{lien!.email}</strong>, et vous êtes
                connecté avec {user.email}. Connectez-vous avec l’adresse
                invitée.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[20px] font-[650] tracking-[-0.02em]">
                {programme} souhaite suivre votre préparation
              </h1>
              <p className="text-[13px] text-ink-secondary leading-relaxed mt-2">
                Rejoindre une cohorte permet au programme de vous accompagner
                sur ce qu’il vous reste à réunir.
              </p>

              <div className="mt-5 rounded-[10px] border border-line bg-surface-2 px-4 py-3.5">
                <div className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted mb-1.5">
                  Ce que {programme} verra
                </div>
                <p className="text-[12.5px] text-ink leading-relaxed">
                  Le nom de votre startup, votre stade, le montant recherché,
                  votre degré de préparation et les pièces qu’il vous reste à
                  fournir.
                </p>
              </div>

              {/* Dit aussi fort que ce qui précède : c'est ce qui distingue un
                  consentement d'une case cochée. */}
              <div className="mt-2.5 rounded-[10px] border border-line bg-surface-2 px-4 py-3.5">
                <div className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted mb-1.5">
                  Ce qu’il ne verra pas
                </div>
                <p className="text-[12.5px] text-ink leading-relaxed">
                  <strong className="font-[650]">Vos documents.</strong> Ni leur
                  contenu, ni leur nom. Vous seul décidez qui accède à votre
                  data room, et vous pouvez quitter la cohorte à tout moment.
                </p>
              </div>

              <div className="mt-6">
                <RejoindreForm token={token} programme={programme} />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
