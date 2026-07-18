import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  RoadmapList,
  type RoadmapItem,
} from "@/components/roadmap/RoadmapList";
import { Button } from "@/components/ui/Button";

/** Page PUBLIQUE : lisible sans compte, partageable telle quelle. */
export default async function RoadmapPage() {
  const t = await getTranslations("roadmap");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: rows }, { data: myVotes }] = await Promise.all([
    supabase
      .from("roadmap_items")
      .select("id, title, description, status, eta_label, is_official, roadmap_votes(count)")
      .order("created_at"),
    user
      ? supabase.from("roadmap_votes").select("item_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { item_id: string }[] }),
  ]);

  const voted = new Set((myVotes ?? []).map((v) => v.item_id));

  const items: RoadmapItem[] = (rows ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status as RoadmapItem["status"],
    eta_label: r.eta_label,
    is_official: r.is_official,
    votes:
      (r.roadmap_votes as unknown as Array<{ count: number }> | null)?.[0]
        ?.count ?? 0,
    voted: voted.has(r.id),
  }));

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-[60] flex items-center gap-3 h-[52px] px-6 bg-[rgba(255,255,255,0.92)] backdrop-blur-md border-b border-line">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-6 h-6 rounded-[6px] bg-gradient-to-br from-primary to-primary-strong text-white font-bold text-[12px]">
            K
          </span>
          <span className="text-[14px] font-[650] tracking-[-0.01em] text-ink">
            Sanza
          </span>
        </Link>
        <span className="text-[11px] font-[550] text-ink-secondary bg-chip-neutral-bg rounded-chip px-1.5 py-0.5">
          {t("badge")}
        </span>
        <div className="ml-auto">
          <Link href={user ? "/dashboard" : "/connexion"}>
            <Button variant="secondary" size="sm">
              {user ? t("backToApp") : t("login")}
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] font-[650] tracking-[-0.02em]">
            {t("title")}
          </h1>
          <p className="text-[13px] text-ink-secondary leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <RoadmapList items={items} isAuthenticated={Boolean(user)} />

        <p className="text-[11.5px] text-ink-muted leading-relaxed border-t border-separator-soft pt-5">
          {t("disclaimer")}
        </p>
      </div>
    </main>
  );
}
