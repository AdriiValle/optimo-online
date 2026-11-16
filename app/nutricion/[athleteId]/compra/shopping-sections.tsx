import type { ShoppingList } from "@/lib/nutrition/shopping";

const SECTION_NOTES: Partial<Record<string, string>> = {
  revisar: "Sin alimento del catálogo: la cantidad no se suma. Enlázalos en Alimentos.",
  despensa: "Básicos que suele haber en casa: van sin cantidad."
};

/**
 * Lista de la compra en solo lectura (la misma que ve el jugador, sin casillas: «ya lo tengo» es suyo).
 * La reutilizan Compra e Informes; `compact` = informe: sin notas de sección ni «ya lo tiene en casa».
 */
export function ShoppingSections({ list, idPrefix, compact = false }: { list: ShoppingList; idPrefix: string; compact?: boolean }) {
  return (
    <div className="nut-buy-sections">
      {list.sections.map((s) => (
        <section key={s.key} className={`nut-buy-sec nut-buy-sec--${s.key}`} aria-labelledby={`${idPrefix}-${s.key}`}>
          <h3 id={`${idPrefix}-${s.key}`} className="nut-buy-sec-title">
            {s.label}
            <span className="nut-buy-sec-count"> · {s.lines.length}</span>
          </h3>
          <ul className="nut-buy-lines">
            {s.lines.map((line) => {
              // En el informe no se arrastra el «ya lo tengo» del jugador: la hoja es la lista entera.
              const l = compact ? { ...line, checked: false } : line;
              return (
                <li key={l.key} className={`nut-buy-line${l.checked ? " is-checked" : ""}`}>
                  <span className="nut-buy-box" aria-hidden="true" />
                  <span className="nut-buy-text">
                    <span className="nut-buy-name">{l.name}</span>
                    {l.packs || l.checked ? (
                      <span className="nut-buy-meta">
                        {[l.packs, l.checked ? "Ya lo tiene en casa" : null].filter(Boolean).join(" · ")}
                      </span>
                    ) : null}
                  </span>
                  {l.amount ? <span className="nut-buy-amount">{l.amount}</span> : null}
                </li>
              );
            })}
          </ul>
          {!compact && SECTION_NOTES[s.key] ? <p className="nut-buy-sec-note">{SECTION_NOTES[s.key]}</p> : null}
        </section>
      ))}
    </div>
  );
}
