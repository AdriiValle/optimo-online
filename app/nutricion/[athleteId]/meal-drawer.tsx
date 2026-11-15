"use client";

import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import type { MealSlot } from "@/lib/types";
import type { MealNutrition } from "@/lib/queries";
import { dishLines, splitCategory } from "@/lib/nutrition/protein-category";
import { resizeImage } from "@/lib/image-resize";
import { MealItemsEditor } from "./meal-items-editor";
import { fmt, mealMacros } from "./nutrition-summary";
import { AllergyAlert } from "./perfil/allergy-alert";

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

/** Aspa de cerrar (mismo trazo que los sheets de la app). */
export function CloseGlyph() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
      <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Héroe de la ficha: foto o placeholder, zona de soltar (desktop) y acciones sobre la foto.
 * La foto se reduce en el navegador (≤300 KB) y la vista previa sale antes de que acabe la subida.
 * «Platos iguales»: interruptor debajo, solo si hay platos con el mismo texto todavía sin foto.
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
        className={`nut-ficha-hero${src ? " has-photo" : ""}${over ? " is-over" : ""}${busy ? " is-busy" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {src ? <img src={src} alt="" /> : <figcaption aria-hidden="true">{name}</figcaption>}
        {over || busy ? (
          <span className="nut-ficha-drop" aria-hidden="true">
            {busy ? <span className="spinner" /> : null}
            {busy === "up" ? "Subiendo…" : busy === "del" ? "Quitando…" : "Suelta para poner la foto"}
          </span>
        ) : null}
        <div className="nut-ficha-photo-actions">
          {meal.hasPhoto ? (
            <button type="button" className="nut-photo-btn" disabled={Boolean(busy)} onClick={() => void remove()}>
              Quitar foto
            </button>
          ) : null}
          <button type="button" className="nut-photo-btn" disabled={Boolean(busy)} onClick={() => inputRef.current?.click()}>
            {meal.hasPhoto ? "Cambiar foto" : "Elegir foto"}
          </button>
        </div>
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
      </figure>
      {same ? (
        <label className="toggle-row nut-ficha-same">
          <span>
            Usar también en {same === 1 ? "el plato igual" : `los ${same} platos iguales`}
            <small>Mismo plato en otros días, todavía sin foto.</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="toggle"
            checked={applySame}
            disabled={Boolean(busy)}
            onChange={(e) => setApplySame(e.target.checked)}
          />
        </label>
      ) : null}
      {msg ? (
        <p className={`nut-ficha-msg ${msg.ok ? "ok" : "error"}`} role="status">
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Ficha del plato: foto (o placeholder de su proteína), titular, aviso de alergias (N6), macros de esta comida,
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
  if (!meal) {
    return (
      <div className="nut-ficha">
        <section className="nut-ficha-card" aria-labelledby="nut-ficha-new">
          <h3 id="nut-ficha-new" className="nut-ficha-card-title">
            Nuevo plato
          </h3>
          {editForm}
        </section>
      </div>
    );
  }
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
  const tone = nutrition?.quantified ? "ok" : nutrition?.missing ? "warn" : "none";
  return (
    <div className={`nut-ficha nut-cat nut-cat--${cat.key}`}>
      <PhotoHero key={meal.id} meal={meal} name={name} onChanged={onPhotoChanged} />

      <header className="nut-ficha-title">
        <span className="nut-ficha-cat">{name}</span>
        <h3>{lines.headline}</h3>
        {lines.rest ? <p>{lines.rest}</p> : null}
      </header>

      <AllergyAlert athleteId={athleteId} meal={meal} revision={nutrition} />

      <section className="nut-ficha-card nut-ficha-macros" aria-labelledby="nut-ficha-macros-title">
        <header className="nut-ficha-card-head">
          <h3 id="nut-ficha-macros-title" className="nut-ficha-card-title">
            Macros de esta comida
          </h3>
          <span className={`nut-badge nut-badge--${tone}`}>{status}</span>
        </header>
        <div className="nut-ficha-macros-body">
          <p className="nut-ficha-kcal">
            <strong>{macros ? `${macros.mark}${fmt(macros.kcal)}` : "—"}</strong>
            <span>kcal</span>
          </p>
          <MacroDonut grams={macros?.grams ?? null} unit="g" mark={macros?.mark} />
        </div>
      </section>

      <MealItemsEditor athleteId={athleteId} meal={meal} onChanged={onItemsChanged} />

      <details className="nut-details nut-ficha-edit">
        <summary>
          <span className="nut-details-label">Editar plato</span>
        </summary>
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
      <div className="sheet-header nut-drawer-head">
        <h2 id="nut-drawer-title" className="sheet-title">
          {title}
        </h2>
        <button type="button" className="icon-btn sheet-close" aria-label="Cerrar ficha" onClick={onClose}>
          <CloseGlyph />
        </button>
      </div>
      <div key={cellKey} className="nut-drawer-body">
        {children}
      </div>
    </aside>
  );
}
