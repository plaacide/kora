import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

/**
 * Écran de régularisation.
 *
 * Vit HORS du groupe `(app)` : ce groupe redirige ici dès que l'abonnement est
 * échu, donc l'y placer aurait bouclé à l'infini.
 *
 * Le ton compte plus que d'habitude. C'est le seul écran que verra un
 * fondateur coupé de ses propres documents ; il est déjà contrarié. On lui dit
 * ce qui se passe, ce qui est intact, et ce qu'il doit faire — dans cet ordre.
 */
export default async function AbonnementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: membership } = await supabase
    .from("memberships")
    .select("organizations(name, paid_until, plan)")
    .eq("user_id", user.id)
    // Tri déterministe : sans lui, l'organisation retenue est arbitraire
    // dès qu'une personne en a plusieurs — ce que le rôle SAE rend courant.
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const org = membership?.organizations as unknown as {
    name?: string;
    paid_until?: string | null;
    plan?: string;
  } | null;

  // Si l'abonnement est de nouveau à jour, cet écran n'a plus lieu d'être.
  const echu = org?.paid_until ? new Date(org.paid_until) <= new Date() : false;
  if (!echu) redirect("/dashboard");

  const date = org?.paid_until
    ? new Date(org.paid_until).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-[520px]">
        <div className="rounded-[14px] border border-line bg-surface p-7">
          <h1 className="text-[20px] font-[650] tracking-[-0.02em]">
            Votre accès est en pause
          </h1>
          <p className="text-[13px] text-ink-secondary leading-relaxed mt-2">
            L’abonnement de {org?.name ?? "votre organisation"} a pris fin
            {date ? ` le ${date}` : ""}.
          </p>

          {/* Dit en premier, parce que c'est la question qu'il se pose. */}
          <div className="mt-5 rounded-[10px] border border-line bg-surface-2 px-4 py-3.5">
            <p className="text-[12.5px] text-ink leading-relaxed">
              <strong className="font-[650]">Rien n’a été supprimé.</strong> Vos
              documents, vos versions et votre journal d’audit sont intacts et
              vous seront rendus dès la régularisation.
            </p>
          </div>

          <div className="mt-6">
            <div className="text-[10.5px] font-[650] uppercase tracking-[0.05em] text-ink-muted mb-2">
              Régulariser
            </div>
            <p className="text-[13px] text-ink-secondary leading-relaxed">
              Écrivez-nous à{" "}
              <a
                href="mailto:contact@sanza.africa"
                className="text-link hover:text-link-hover"
              >
                contact@sanza.africa
              </a>{" "}
              en précisant le nom de votre organisation. Nous vous transmettons
              les coordonnées de paiement et rouvrons l’accès à réception.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-separator-soft flex items-center justify-between gap-3">
            <span className="text-[11.5px] text-ink-muted">
              {user.email}
            </span>
            {/* Action serveur, comme dans le Topbar : `/deconnexion` n'existe
                pas en tant que route, et y renvoyer aurait fait un lien mort. */}
            <form action={logout}>
              <button
                type="submit"
                className="text-[11.5px] text-ink-muted hover:text-ink"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
