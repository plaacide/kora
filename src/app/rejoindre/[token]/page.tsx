import { redirect } from "next/navigation";
import { after } from "next/server";
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

  // « LIEN OUVERT » se mesure ICI, à la première visite, avant même de savoir
  // qui regarde — c'est justement le cas qu'on veut distinguer : quelqu'un a
  // ouvert et n'est pas allé au bout. Après la réponse (`after`) : le visiteur
  // n'a pas à attendre une écriture qui ne le concerne pas.
  after(async () => {
    const client = await createClient();
    await client.rpc("mark_cohort_link_opened", { p_token: token });
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  // L'invité n'a presque jamais de compte : l'envoyer d'abord vers la
  // connexion lui fait chercher un mot de passe qu'il n'a pas. On l'envoie
  // s'inscrire, avec son adresse — celle-là même que l'acceptation exigera.
  // Le formulaire garde un lien « déjà un compte » pour l'autre cas.
  //
  // L'adresse passe par une RPC : les deux tables d'invitation sont fermées à
  // `anon`, une lecture directe ici renverrait zéro ligne sans rien dire.
  if (!user) {
    const { data: invite } = await supabase.rpc("invitation_email", {
      p_token: token,
    });
    const suivant = encodeURIComponent(`/rejoindre/${token}`);
    const email = invite ? `&email=${encodeURIComponent(invite as string)}` : "";
    redirect(`/inscription?suivant=${suivant}${email}`);
  }

  // PAS de lecture directe de `cohort_links`. Sa politique exige d'être membre
  // du programme ou de l'entreprise déjà rattachée — or l'invité n'est ni l'un
  // ni l'autre AVANT d'avoir accepté. La requête renvoyait zéro ligne, et
  // l'écran annonçait « invitation introuvable » à tous les invités.
  //
  // `invitation_apercu` rend exactement ce qu'un porteur de jeton a le droit de
  // savoir : l'adresse visée, l'état, qui invite.
  const { data: apercuData } = await supabase.rpc("invitation_apercu", {
    p_token: token,
  });
  const lien = (
    (apercuData ?? []) as Array<{
      email: string; statut: string; programme: string; cohorte: string | null;
    }>
  )[0];

  const programme = lien?.programme ?? "Un programme";

  // SANS ORGANISATION, ON NE PEUT PAS ACCEPTER. `accept_cohort_link` rattache
  // la cohorte à l'organisation de l'invité et refuse s'il n'en a pas
  // (« accès refusé »). C'est le cas de tout invité qui vient de s'inscrire :
  // il arriverait ici pour se heurter à un refus qui ne lui apprend rien.
  //
  // On le lui dit AVANT, et on l'envoie créer son espace. L'invitation reste
  // valable — il rouvrira le lien de son e-mail.
  const { data: adhesion } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const sansEspace = !adhesion;

  const introuvable = !lien;
  const dejaFait = lien?.statut === "accepted";
  const revoque = lien?.statut === "revoked";
  // Le jeton peut circuler ; l'adresse, elle, ne ment pas. Même garde-fou que
  // pour les invitations investisseur.
  const mauvaiseAdresse =
    !!lien && (user.email ?? "").toLowerCase() !== lien.email;

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-[520px]">
        <div className="rounded-[14px] border border-line bg-surface p-7">
          {sansEspace && !introuvable && !revoque ? (
            <>
              <h1 className="text-[20px] font-[650] tracking-[-0.02em]">
                Créez d’abord votre espace
              </h1>
              <p className="text-[13px] text-ink-secondary leading-relaxed mt-2">
                {programme} vous invite à rejoindre sa cohorte. Pour accepter,
                il vous faut d’abord votre propre espace Sanza — c’est lui qui
                portera votre dossier, et vous en resterez seul propriétaire.
              </p>
              <p className="text-[12.5px] text-ink-muted leading-relaxed mt-3">
                Votre invitation reste valable&nbsp;: rouvrez ce lien depuis
                votre e-mail une fois votre espace créé.
              </p>
              <a
                href="/onboarding"
                className="sz-cta text-[13px] px-4 py-2.5 inline-flex mt-5"
              >
                Créer mon espace
              </a>
            </>
          ) : introuvable || revoque ? (
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
