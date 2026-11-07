"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import type { MealSlot } from "@/lib/types";
import type { MealNutrition } from "@/lib/queries";
import { dishLines, splitCategory } from "@/lib/nutrition/protein-category";
import { MealItemsEditor } from "./meal-items-editor";
import { fmt, mealMacros } from "./nutrition-summary";

/** Gramos de cada macro (por día en el resumen, por plato en la ficha). */
export type MacroGrams = { p: number; c: number; f: number };

const KCAL_PER_G: MacroGrams = { p: 4, c: 4, f: 9 };

const MACROS = [
  { key: "p", label: "Proteína" },
  { key: "c", label: "Hidratos" },
  { key: "f", label: "Grasas" }
] as const;

/** Donut de reparto P/HC/G en % de kcal (4/4/9 kcal por g); null = sin cantidades. */
export function MacroDonut({ grams, unit = "g/día", mark = "" }: { grams: MacroGrams | null; unit?: string; mark?: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const kcal = grams ? { p: grams.p * KCAL_PER_G.p, c: grams.c * KCAL_PER_G.c, f: grams.f * KCAL_PER_G.f } : null;
  const total = kcal ? kcal.p + kcal.c + kcal.f : 0;
  let offset = 0;
  return (
    <figure className="nut-macro">
      <svg width={64} height={64} viewBox="0 0 64 64" role="img" aria-label="Reparto de macronutrientes">
        <circle className="nut-ring-track" cx="32" cy="32" r={r} />
        {kcal && total > 0
          ? MACROS.map(({ key }) => {
              const len = (kcal[key] / total) * c;
              const seg = (
                <circle
                  key={key}
                  className={`nut-macro-seg nut-macro-seg--${key}`}
                  cx="32"
                  cy="32"
                  r={r}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 32 32)"
                />
              );
              offset += len;
              return seg;
            })
          : null}
        <text x="32" y="33" textAnchor="middle" dominantBaseline="middle" className="nut-ring-value">
          {kcal && total > 0 ? "P·HC·G" : "—"}
        </text>
      </svg>
      <figcaption>
        <ul className="nut-macro-legend">
          {MACROS.map(({ key, label }) => (
            <li key={key}>
              <i className={`nut-macro-dot nut-macro-dot--${key}`} aria-hidden="true" />
              <strong>{label}</strong>
              <span>
                {grams && kcal && total > 0
                  ? `${mark}${fmt(grams[key])} ${unit} · ${Math.round((kcal[key] / total) * 100)} % kcal`
                  : "— g · — % kcal"}
              </span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

/** «HUEVOS/PESCADO» → «Huevos / pescado»; sin corchete → «Sin categoría». */
function categoryName(label: string | null) {
  if (!label) return "Sin categoría";
  const t = label
    .toLowerCase()
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" / ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Ficha del plato: foto (o placeholder de su proteína), titular, macros de esta comida,
 * ingredientes (O4) y «Editar plato» plegado. Sin plato: solo el formulario para crearlo.
 */
export function MealFicha({
  athleteId,
  meal,
  nutrition,
  editForm,
  onItemsChanged
}: {
  athleteId: string;
  meal: MealSlot | null;
  /** Macros de este plato; null mientras cargan los totales. */
  nutrition: MealNutrition | null;
  editForm: ReactNode;
  onItemsChanged: () => void;
}) {
  if (!meal) return <>{editForm}</>;
  const cat = splitCategory(meal.title);
  const lines = dishLines(cat.body);
  const name = categoryName(cat.label);
  const macros = nutrition ? mealMacros(nutrition) : null;
  const status =
    nutrition === null
      ? "Calculando…"
      : nutrition.missing
        ? `Faltan ${nutrition.missing} por confirmar`
        : nutrition.quantified
          ? "Cuenta en el total del día"
          : "Sin ingredientes";
  return (
    <div className={`nut-ficha nut-cat nut-cat--${cat.key}`}>
      <figure className="nut-ficha-hero">
        {meal.hasPhoto ? (
          <img src={`/api/meals/${meal.id}/photo?v=${encodeURIComponent(meal.updatedAt)}`} alt="" />
        ) : (
          <figcaption aria-hidden="true">{name}</figcaption>
        )}
      </figure>

      <header className="nut-ficha-title">
        <span className="nut-ficha-cat">{name}</span>
        <h3>{lines.headline}</h3>
        {lines.rest ? <p>{lines.rest}</p> : null}
      </header>

      <section className="nut-ficha-macros" aria-label="Macros de esta comida">
        <header className="nut-items-head">
          <h3>Macros</h3>
          <span className={nutrition?.quantified ? "ok" : "muted"}>{status}</span>
        </header>
        <p className="nut-ficha-kcal">
          <strong>{macros ? `${macros.mark}${fmt(macros.kcal)}` : "—"}</strong> kcal
        </p>
        <MacroDonut grams={macros?.grams ?? null} unit="g" mark={macros?.mark} />
      </section>

      <MealItemsEditor athleteId={athleteId} meal={meal} onChanged={onItemsChanged} />

      <details className="nut-details nut-ficha-edit">
        <summary>Editar plato</summary>
        {editForm}
      </details>
    </div>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * Panel de la ficha en desktop: anclado a la derecha de la zona de trabajo, encima de la semana
 * (no la empuja). Tab queda dentro; al cambiar de celda el foco entra en la ficha nueva.
 */
export function MealDrawer({
  title,
  cellKey,
  onClose,
  children
}: {
  title: string;
  /** `fecha:franja`: cambia al pasar a otra celda (foco y scroll vuelven arriba). */
  cellKey: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [cellKey]);

  function trapTab(e: KeyboardEvent) {
    if (e.key !== "Tab" || !ref.current) return;
    const nodes = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.getClientRects().length > 0);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <aside ref={ref} className="nut-drawer" role="dialog" aria-labelledby="nut-drawer-title" tabIndex={-1} onKeyDown={trapTab}>
      <div className="nut-drawer-head">
        <h2 id="nut-drawer-title">{title}</h2>
        <button type="button" className="icon-btn" aria-label="Cerrar ficha" onClick={onClose}>
          ×
        </button>
      </div>
      <div key={cellKey} className="nut-drawer-body">
        {children}
      </div>
    </aside>
  );
}
