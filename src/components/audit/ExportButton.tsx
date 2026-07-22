"use client";

/**
 * Export du journal d'audit en CSV. Purement client : on télécharge ce qui est
 * affiché (jusqu'à 100 dernières entrées), avec BOM UTF-8 pour Excel.
 */
export interface AuditCsvRow {
  when: string;
  action: string;
  detail: string;
  who: string;
  hash: string;
}

function toCsv(rows: AuditCsvRow[]): string {
  const esc = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const head = ["Date", "Action", "Détail", "Par", "Empreinte"];
  const lines = [head.map(esc).join(",")];
  for (const r of rows) {
    lines.push([r.when, r.action, r.detail, r.who, r.hash].map(esc).join(","));
  }
  return lines.join("\r\n");
}

export function ExportButton({ rows, label }: { rows: AuditCsvRow[]; label: string }) {
  function download() {
    const csv = "﻿" + toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const jour = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `journal-audit-${jour}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="border border-[#E4E2DC] rounded-[5px] px-3.5 py-2 text-[12.5px] font-[600] text-[#33353B] hover:border-[#C9C6BD] hover:bg-[#FAFAF8] cursor-pointer"
    >
      {label}
    </button>
  );
}
