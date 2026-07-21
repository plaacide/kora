import { type NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Export du portefeuille d'un programme, au format qu'un bailleur manipule
 * vraiment : un classeur Excel, pas un PDF. Un bailleur trie, filtre, agrège —
 * un PDF l'en empêcherait.
 *
 * Aucune dépendance nouvelle : `exceljs` sert déjà à LIRE les tableaux déposés,
 * il sait aussi les écrire. On évite ainsi le piège du `package-lock`
 * (cf. AGENTS.md) qu'un générateur PDF aurait rouvert.
 *
 * La donnée passe par `sae_portfolio()` sous la session de l'appelant : la RLS
 * s'applique, un programme n'exporte donc que SA cohorte. Aucun document n'en
 * sort — la fonction n'en expose aucun, par construction.
 */
export async function GET(_request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "non_authentifie" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("sae_portfolio");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  type Ligne = {
    startup_name: string;
    stage: string | null;
    amount: number | null;
    currency: string | null;
    readiness: number | null;
    items_total: number;
    items_done: number;
    missing: string[] | null;
  };
  const lignes = (data ?? []) as Ligne[];

  const wb = new ExcelJS.Workbook();
  wb.creator = "Sanza";
  const ws = wb.addWorksheet("Portefeuille");

  ws.columns = [
    { header: "Startup", key: "nom", width: 28 },
    { header: "Stade", key: "stade", width: 16 },
    { header: "Montant recherché", key: "montant", width: 20 },
    { header: "Devise", key: "devise", width: 10 },
    { header: "Préparation", key: "readiness", width: 14 },
    { header: "Pièces fournies", key: "faites", width: 16 },
    { header: "Pièces manquantes", key: "manquantes", width: 60 },
  ];

  // En-tête en gras sur fond encre, texte clair : lisible d'un coup d'œil,
  // et c'est la seule mise en forme — un classeur n'est pas une brochure.
  const tete = ws.getRow(1);
  tete.font = { bold: true, color: { argb: "FFFFFFFF" } };
  tete.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF171A2C" },
  };

  for (const l of lignes) {
    ws.addRow({
      nom: l.startup_name,
      stade: l.stage ?? "—",
      montant: l.amount ?? null,
      devise: l.currency ?? "",
      // Fraction plutôt que texte « 40 % » : un bailleur veut pouvoir trier et
      // moyenner cette colonne, pas relire une étiquette.
      readiness: l.readiness !== null ? l.readiness / 100 : null,
      faites: `${l.items_done}/${l.items_total}`,
      manquantes: (l.missing ?? []).join(" · "),
    });
  }

  ws.getColumn("readiness").numFmt = "0 %";
  ws.getColumn("montant").numFmt = "# ##0";

  const buffer = await wb.xlsx.writeBuffer();
  const jour = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="portefeuille-sanza-${jour}.xlsx"`,
    },
  });
}
