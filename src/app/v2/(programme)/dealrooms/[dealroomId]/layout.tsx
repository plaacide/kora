import { DEALROOMS } from "@/features/v2/fixtures/programme";
import { DealroomShell } from "@/features/v2/ui/Shell";

/** La coque d'une Dealroom publiée — écrans 25 à 28. */
export default async function DealroomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ dealroomId: string }>;
}) {
  const { dealroomId } = await params;
  const dealroom =
    DEALROOMS.find((item) => item.id === dealroomId) ?? DEALROOMS[0];

  return (
    <DealroomShell
      compteurs={{
        entreprises: dealroom.entreprises,
        audience: dealroom.investisseurs ?? undefined,
        demandes: dealroom.demandes ?? undefined,
      }}
      dealroomId={dealroom.id}
      nom={dealroom.nom}
      statut={dealroom.statut}
    >
      {children}
    </DealroomShell>
  );
}
