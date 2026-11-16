"use client";

/** Abre el diálogo del navegador: «Imprimir» o «Guardar como PDF». La hoja la limpia `@media print` (nutri.css). */
export function PrintButton() {
  return (
    <button type="button" className="btn nut-rep-print" onClick={() => window.print()}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 8V3.5h10V8M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="7" y="13.5" width="10" height="7" rx="1" />
      </svg>
      Imprimir o guardar PDF
    </button>
  );
}
