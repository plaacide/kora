"use client";

/** Impression / enregistrement en PDF de la preuve (via le navigateur). */
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-[5px] bg-[#E85C2B] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#D24E1F]"
    >
      Imprimer / Enregistrer en PDF
    </button>
  );
}
