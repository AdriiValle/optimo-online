"use client";

import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import type { MealSlot } from "@/lib/types";
import type { MealNutrition } from "@/lib/queries";
import { dishLines, splitCategory } from "@/lib/nutrition/protein-category";
import { resizeImage } from "@/lib/image-resize";
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

/** Plato cuya foto cambió (este y, con «platos iguales», los demás que la recibieron). */
export type PhotoChange = { id: string; hasPhoto: boolean; updatedAt: string };

/**
 * Héroe de la ficha: foto o placeholder, y zona de soltar (desktop) + «Elegir foto» (móvil).
 * La foto se reduce en el navegador (≤300 KB) y la vista previa sale antes de que acabe la subida.
 */
function PhotoHero({ meal, name, onChanged }: { meal: MealSlot; name: string; onChanged: (changes: PhotoChange[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<"up" | "del" | null>(null);
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  /** Platos iguales sin foto (null = sin saber aún). */
  const [same, setSame] = useState<number | null>(null);
  const [applySame, setApplySame] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/meals/${meal.id}/photo/same`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) setSame(json?.data?.count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setSame(0);
      });
    return () => {
      cancelled = true;
    };
  }, [meal.id, meal.title, meal.preparation, meal.hasPhoto]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function upload(raw: File) {
    if (busy) return;
    if (raw.type && !raw.type.startsWith("image/")) {
      setMsg({ ok: false, text: "Eso no es una imagen." });
      return;
    }
    setBusy("up");
    setMsg(null);
    let file: File;
    try {
      file = await resizeImage(raw);
    } catch {
      setBusy(null);
      setMsg({ ok: false, text: "No se pudo leer la foto. Prueba con JPEG o PNG." });
      return;
    }
    setPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.set("photo", file);
    const toSame = applySame && Boolean(same);
    if (toSame) fd.set("applyToSame", "1");
    const res = await fetch(`/api/meals/${meal.id}/photo`, { method: "POST", body: fd }).catch(() => null);
    const json = res?.ok ? await res.json().catch(() => null) : null;
    const updated: { id: string; updatedAt: string }[] | undefined = json?.data?.updated;
    setBusy(null);
    if (!updated) {
      setPreview(null);
      setMsg({ ok: false, text: "No se pudo subir la foto." });
      return;
    }
    onChanged(updated.map((u) => ({ ...u, hasPhoto: true })));
    const others = updated.length - 1;
    if (toSame && others > 0) setMsg({ ok: true, text: `Foto puesta también en ${others === 1 ? "1 plato igual" : `${others} platos iguales`}.` });
  }

  async function remove() {
    if (busy) return;
    setBusy("del");
    setMsg(null);
    const res = await fetch(`/api/meals/${meal.id}/photo`, { method: "DELETE" }).catch(() => null);
    const json = res?.ok ? await res.json().catch(() => null) : null;
    setBusy(null);
    if (!json?.data?.updatedAt) {
      setMsg({ ok: false, text: "No se pudo quitar la foto." });
      return;
    }
    setPreview(null);
    onChanged([{ id: meal.id, hasPhoto: false, updatedAt: json.data.updatedAt }]);
  }

  function onDragOver(e: DragEvent) {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setOver(true);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void upload(file);
  }

  const src = preview ?? (meal.hasPhoto ? `/api/meals/${meal.id}/photo?v=${encodeURIComponent(meal.updatedAt)}` : null);
  return (
    <div className="nut-ficha-photo">
      <figure
        className={`nut-ficha-hero${over ? " is-over" : ""}${busy ? " is-busy" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {src ? <img src={src} alt="" /> : <figcaption aria-hidden="true">{name}</figcaption>}
        {over || busy ? (
          <span className="nut-ficha-drop" aria-hidden="true">
            {busy === "up" ? "Subiendo…" : busy === "del" ? "Quitando…" : "Suelta para poner la foto"}
          </span>
        ) : null}
      </figure>
      <div className="nut-ficha-photo-actions">
        <button type="button" className="btn secondary" disabled={Boolean(busy)} onClick={() => inputRef.current?.click()}>
          {meal.hasPhoto ? "Cambiar foto" : "Elegir foto"}
        </button>
        {meal.hasPhoto ? (
          <button type="button" className="btn secondary" disabled={Boolean(busy)} onClick={() => void remove()}>
            Quitar foto
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
      </div>
      {same ? (
        <label className="nut-ficha-same">
          <input type="checkbox" checked={applySame} disabled={Boolean(busy)} onChange={(e) => setApplySame(e.target.checked)} />
          Usar en {same === 1 ? "el plato igual" : `los ${same} platos iguales`}
        </label>
      ) : null}
      {msg ? (
        <p className={`nut-ficha-photo-msg ${msg.ok ? "ok" : "error"}`} role="status">
          {msg.text}
        </p>
      ) : null}
    </div>
  );
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
  onItemsChanged,
  onPhotoChanged
}: {
  athleteId: string;
  meal: MealSlot | null;
  /** Macros de este plato; null mientras cargan los totales. */
  nutrition: MealNutrition | null;
  editForm: ReactNode;
  onItemsChanged: () => void;
  onPhotoChanged: (changes: PhotoChange[]) => void;
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
      <PhotoHero key={meal.id} meal={meal} name={name} onChanged={onPhotoChanged} />

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
