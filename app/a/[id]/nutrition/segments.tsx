"use client";

import { type CSSProperties, type KeyboardEvent, useRef } from "react";

export type NutritionView = "today" | "week" | "shop";

export const NUTRITION_VIEWS: { id: NutritionView; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Semana" },
  { id: "shop", label: "Compra" }
];

export const tabId = (v: NutritionView) => `nut-tab-${v}`;
export const panelId = (v: NutritionView) => `nut-panel-${v}`;

/** Navegación interna de la pestaña Nutrición: segmentado con patrón de pestañas (flechas, Inicio/Fin). */
export function NutritionSegmented({ value, onChange }: { value: NutritionView; onChange: (v: NutritionView) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = NUTRITION_VIEWS.findIndex((v) => v.id === value);
  const style = { "--seg-count": NUTRITION_VIEWS.length, "--seg-index": index } as CSSProperties;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const n = NUTRITION_VIEWS.length;
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % n;
    else if (e.key === "ArrowLeft") next = (index - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(NUTRITION_VIEWS[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className="segmented segmented--block nut-seg" role="tablist" aria-label="Nutrición" style={style} onKeyDown={onKeyDown}>
      {NUTRITION_VIEWS.map((v, i) => (
        <button
          key={v.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="tab"
          id={tabId(v.id)}
          aria-controls={panelId(v.id)}
          aria-selected={v.id === value}
          tabIndex={v.id === value ? 0 : -1}
          onClick={() => onChange(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
