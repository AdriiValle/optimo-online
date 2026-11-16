"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { DayType } from "@/lib/nutrition/day-type";
import {
  DAY_TYPES,
  OVERRIDE_MAX,
  TARGET_KEYS,
  calculatedTargetValues,
  referenceTargetValue,
  type AthleteBody,
  type TargetKey,
  type TargetOverrides
} from "@/lib/nutrition/targets";

/* —— Listas de términos (alergias, intolerancias) —— */

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
const MAX_TERMS = 30;
const MAX_TERM_LEN = 60;

/** Primera letra en mayúscula, resto como lo escribió. */
const tidy = (s: string) => {
  const t = s.trim().replace(/\s+/g, " ").slice(0, MAX_TERM_LEN);
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/**
 * Lista editable como chips: escribir + Intro (o coma) añade, la X quita, las sugerencias añaden de un toque.
 * Sin duplicados (sin distinguir mayúsculas ni acentos).
 */
export function TermListField({
  title,
  footer,
  values,
  onChange,
  suggestions,
  placeholder,
  addLabel,
  tone,
  disabled
}: {
  title: string;
  footer: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder: string;
  /** Texto accesible del botón añadir («Añadir alergia»). */
  addLabel: string;
  tone: "danger" | "warn";
  disabled?: boolean;
}) {
  const uid = useId();
  const [draft, setDraft] = useState("");
  const has = (t: string) => values.some((v) => fold(v) === fold(t));
  const full = values.length >= MAX_TERMS;

  function add(raw: string) {
    const parts = raw.split(/[,;\n]/).map(tidy).filter(Boolean);
    const next = [...values];
    for (const p of parts) if (next.length < MAX_TERMS && !next.some((v) => fold(v) === fold(p))) next.push(p);
    if (next.length !== values.length) onChange(next);
    setDraft("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (draft.trim()) add(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  const free = suggestions.filter((s) => !has(s));
  return (
    <section className="nut-prof-group" aria-labelledby={`${uid}-t`}>
      <h3 className="list-group-title" id={`${uid}-t`}>
        {title}
      </h3>
      <div className="list-group nut-terms">
        {values.length ? (
          <ul className={`nut-terms-list nut-terms-list--${tone}`} aria-label={title}>
            {values.map((v) => (
              <li key={fold(v)} className="nut-term">
                <span>{v}</span>
                <button
                  type="button"
                  className="nut-term-remove"
                  aria-label={`Quitar ${v}`}
                  disabled={disabled}
                  onClick={() => onChange(values.filter((x) => x !== v))}
                >
                  <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
                    <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="nut-terms-empty">Ninguna</p>
        )}
        <div className="nut-terms-add">
          <label className="sr-only" htmlFor={`${uid}-in`}>
            {addLabel}
          </label>
          <input
            id={`${uid}-in`}
            className="nut-terms-input"
            type="text"
            autoComplete="off"
            enterKeyHint="done"
            maxLength={MAX_TERM_LEN}
            value={draft}
            placeholder={full ? "Máximo 30" : placeholder}
            disabled={disabled || full}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            onBlur={() => {
              // Lo escrito sin pulsar Intro no se pierde al pasar a otro campo o a Guardar.
              if (draft.trim()) add(draft);
            }}
          />
          <button
            type="button"
            className="btn btn--tinted nut-terms-btn"
            disabled={disabled || full || !draft.trim()}
            onClick={() => add(draft)}
          >
            Añadir
          </button>
        </div>
        {free.length && !full ? (
          <div className="nut-terms-suggest">
            <span className="nut-terms-suggest-label" id={`${uid}-s`}>
              Sugerencias
            </span>
            <ul className="nut-terms-chips" aria-labelledby={`${uid}-s`}>
              {free.map((s) => (
                <li key={s}>
                  <button type="button" className="chip nut-terms-chip" disabled={disabled} onClick={() => add(s)}>
                    <span aria-hidden="true">+</span> {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <p className="list-group-footer">{footer}</p>
    </section>
  );
}

/* —— Meta de la dieta —— */

export const DIET_GOALS = [
  "Mantener peso",
  "Ganar masa muscular",
  "Perder grasa",
  "Rendimiento y recuperación"
];
const OTHER = "__other__";

export function DietGoalField({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const uid = useId();
  const preset = DIET_GOALS.includes(value);
  const [custom, setCustom] = useState(!preset && value !== "");
  const selectValue = custom ? OTHER : preset ? value : "";
  return (
    <section className="nut-prof-group" aria-labelledby={`${uid}-t`}>
      <h3 className="list-group-title" id={`${uid}-t`}>
        Meta de la dieta
      </h3>
      <ul className="list-group">
        <li>
          <label className="list-row nut-field-row" htmlFor={`${uid}-sel`}>
            <span className="nut-field-label">Meta</span>
            <select
              id={`${uid}-sel`}
              className="nut-field-input nut-field-select"
              value={selectValue}
              disabled={disabled}
              onChange={(e) => {
                const v = e.target.value;
                if (v === OTHER) {
                  setCustom(true);
                  if (preset) onChange("");
                } else {
                  setCustom(false);
                  onChange(v);
                }
              }}
            >
              <option value="">Sin meta</option>
              {DIET_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
              <option value={OTHER}>Otra…</option>
            </select>
          </label>
        </li>
        {custom ? (
          <li>
            <label className="list-row nut-field-row" htmlFor={`${uid}-txt`}>
              <span className="nut-field-label">Cuál</span>
              <input
                id={`${uid}-txt`}
                className="nut-field-input"
                type="text"
                autoComplete="off"
                maxLength={120}
                value={value}
                placeholder="Escríbela"
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
              />
            </label>
          </li>
        ) : null}
      </ul>
      <p className="list-group-footer">Orienta el menú y los informes. No cambia los objetivos por sí sola.</p>
    </section>
  );
}

/* —— Objetivos propios sobre los calculados —— */

/** Texto de cada casilla: «» = usar el calculado. */
export type OverrideDraft = Record<TargetKey, Record<DayType, string>>;

const META: Record<TargetKey, { label: string; unit: string; step: number }> = {
  kcal: { label: "Energía", unit: "kcal", step: 10 },
  protein_g: { label: "Proteína", unit: "g", step: 1 },
  carbs_g: { label: "Hidratos", unit: "g", step: 1 },
  fat_g: { label: "Grasa", unit: "g", step: 1 },
  fiber_g: { label: "Fibra", unit: "g", step: 1 },
  sodium_mg: { label: "Sodio (tope)", unit: "mg", step: 10 },
  iron_mg: { label: "Hierro", unit: "mg", step: 1 },
  calcium_mg: { label: "Calcio", unit: "mg", step: 10 },
  vit_d_ug: { label: "Vitamina D", unit: "µg", step: 1 }
};
const MACRO_KEYS: TargetKey[] = ["kcal", "protein_g", "carbs_g", "fat_g"];
const MICRO_KEYS: TargetKey[] = TARGET_KEYS.filter((k) => !MACRO_KEYS.includes(k));
const DAY_LABEL: Record<DayType, string> = { rest: "Descanso", training: "Entreno", match: "Partido" };

/** Mínimos para descartar erratas («2,8» kcal); los topes salen de `OVERRIDE_MAX`. */
const OVERRIDE_MIN: Record<TargetKey, number> = {
  kcal: 800,
  protein_g: 20,
  carbs_g: 20,
  fat_g: 10,
  fiber_g: 1,
  sodium_mg: 100,
  iron_mg: 1,
  calcium_mg: 100,
  vit_d_ug: 1
};

/** «2.800» = 2800 (punto de miles); «72,5» = 72.5. undefined = no es un número; null = vacío. */
export function parseAmount(v: string): number | null | undefined {
  let t = v.trim().replace(/\s/g, "");
  if (!t) return null;
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  t = t.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return undefined;
  return Number(t);
}

export function overrideError(key: TargetKey, v: string): string | null {
  const n = parseAmount(v);
  if (n === null) return null;
  if (n === undefined) return "solo números";
  if (n < OVERRIDE_MIN[key] || n > OVERRIDE_MAX[key]) return `entre ${OVERRIDE_MIN[key]} y ${OVERRIDE_MAX[key]} ${META[key].unit}`;
  return null;
}

export function draftFromOverrides(o: TargetOverrides | null): OverrideDraft {
  const out = {} as OverrideDraft;
  for (const k of TARGET_KEYS) {
    out[k] = { rest: "", training: "", match: "" };
    for (const d of DAY_TYPES) {
      const v = o?.[k]?.[d];
      if (typeof v === "number") out[k][d] = String(v).replace(".", ",");
    }
  }
  return out;
}

/** Borrador → objetivos. null si hay alguna casilla con error. */
export function overridesFromDraft(draft: OverrideDraft): TargetOverrides | null | undefined {
  const out: TargetOverrides = {};
  for (const k of TARGET_KEYS) {
    for (const d of DAY_TYPES) {
      const raw = draft[k][d];
      if (overrideError(k, raw)) return undefined;
      const n = parseAmount(raw);
      if (typeof n === "number") out[k] = { ...out[k], [d]: n };
    }
  }
  return Object.keys(out).length ? out : null;
}

const fmtCalc = (key: TargetKey, n: number) => {
  const step = META[key].step;
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0, useGrouping: false }).format(Math.round(n / step) * step);
};

function TargetRow({
  k,
  value,
  calc,
  onChange,
  disabled,
  dayLabel
}: {
  k: TargetKey;
  value: string;
  calc: number | null;
  onChange: (v: string) => void;
  disabled?: boolean;
  dayLabel: string;
}) {
  const uid = useId();
  const err = overrideError(k, value);
  const own = value.trim() !== "";
  const m = META[k];
  return (
    <li>
      <div className="nut-target-line">
      <label className={`list-row nut-field-row nut-target-row${own ? " is-own" : ""}`} htmlFor={uid}>
        <span className="nut-field-label nut-target-label">
          {m.label}
          {/* Sin cifra propia, el calculado ya se lee en gris dentro de la casilla: aquí solo el origen. */}
          <small className="nut-target-calc">
            {calc === null ? "Sin cálculo" : own ? `Calculado ${fmtCalc(k, calc)} ${m.unit}` : "Calculado"}
          </small>
        </span>
        <input
          id={uid}
          className="nut-field-input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={calc !== null ? fmtCalc(k, calc) : "—"}
          disabled={disabled}
          aria-label={`${m.label}, ${dayLabel}, en ${m.unit}`}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${uid}-e` : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="nut-field-unit" aria-hidden="true">
          {m.unit}
        </span>
      </label>
      {own ? (
        <button
          type="button"
          className="nut-target-reset"
          disabled={disabled}
          aria-label={`Usar el calculado en ${m.label.toLowerCase()}`}
          title="Usar el calculado"
          onClick={() => onChange("")}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M3.5 8a4.5 4.5 0 1 0 1.4-3.3M3.5 2.5v2.6h2.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
      </div>
      {err ? (
        <p className="field-error nut-target-error" id={`${uid}-e`}>
          {m.label}: {err}.
        </p>
      ) : null}
    </li>
  );
}

/**
 * Objetivos diarios: macros por tipo de día (segmentado) y micros iguales todos los días.
 * Casilla vacía = el calculado (gris, del perfil); escrita = la cifra de Amanda, que manda en los anillos.
 */
export function TargetOverridesField({
  body,
  draft,
  onChange,
  disabled
}: {
  body: AthleteBody;
  draft: OverrideDraft;
  onChange: (next: OverrideDraft) => void;
  disabled?: boolean;
}) {
  const uid = useId();
  const [day, setDay] = useState<DayType>("training");
  const calc = calculatedTargetValues(body, day);
  const set = (k: TargetKey, days: readonly DayType[], v: string) => {
    const row = { ...draft[k] };
    for (const d of days) row[d] = v;
    onChange({ ...draft, [k]: row });
  };
  const anyOwn = TARGET_KEYS.some((k) => DAY_TYPES.some((d) => draft[k][d].trim()));
  const ownDays = (d: DayType) => MACRO_KEYS.filter((k) => draft[k][d].trim()).length;
  /** Micro: una cifra para los tres días (si alguna vez difieren, se muestra la del día elegido). */
  const microValue = (k: TargetKey) => draft[k][day] || draft[k].training || draft[k].rest || draft[k].match;

  return (
    <section className="nut-prof-group nut-targets" aria-labelledby={`${uid}-t`}>
      <div className="nut-targets-head">
        <h3 className="list-group-title" id={`${uid}-t`}>
          Objetivos diarios
        </h3>
        {anyOwn ? (
          <button
            type="button"
            className="nut-targets-clear"
            disabled={disabled}
            onClick={() => onChange(draftFromOverrides(null))}
          >
            Usar todos los calculados
          </button>
        ) : null}
      </div>
      <div className="segmented segmented--block nut-targets-days" role="radiogroup" aria-label="Tipo de día">
        {DAY_TYPES.map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={day === d}
            tabIndex={day === d ? 0 : -1}
            onClick={() => setDay(d)}
            onKeyDown={(e) => {
              const i = DAY_TYPES.indexOf(d);
              const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
              if (!step) return;
              e.preventDefault();
              const next = DAY_TYPES[(i + step + DAY_TYPES.length) % DAY_TYPES.length];
              setDay(next);
              (e.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-day="${next}"]`))?.focus();
            }}
            data-day={d}
          >
            {DAY_LABEL[d]}
            {ownDays(d) ? (
              <>
                <span className="nut-targets-dot" aria-hidden="true" />
                <span className="sr-only">, con cifras propias</span>
              </>
            ) : null}
          </button>
        ))}
      </div>
      <ul className="list-group nut-target-list" aria-label={`Macros en día de ${DAY_LABEL[day].toLowerCase()}`}>
        {MACRO_KEYS.map((k) => (
          <TargetRow
            key={`${k}-${day}`}
            k={k}
            value={draft[k][day]}
            calc={calc?.[k] ?? null}
            disabled={disabled}
            dayLabel={`día de ${DAY_LABEL[day].toLowerCase()}`}
            onChange={(v) => set(k, [day], v)}
          />
        ))}
      </ul>
      <p className="list-group-footer">
        {calc
          ? "En gris, lo calculado del perfil para este tipo de día. Escribe una cifra para fijar la tuya: los anillos del menú la usan en lugar del cálculo."
          : "Sin nacimiento, altura y peso no hay cálculo. Si fijas los cuatro macros de un tipo de día, los anillos usan tus cifras."}
      </p>
      <h3 className="list-group-title">Micronutrientes · todos los días</h3>
      <ul className="list-group nut-target-list">
        {MICRO_KEYS.map((k) => (
          <TargetRow
            key={k}
            k={k}
            value={microValue(k)}
            calc={calc?.[k] ?? referenceTargetValue(k, body.ageYears)}
            disabled={disabled}
            dayLabel="todos los días"
            onChange={(v) => set(k, DAY_TYPES, v)}
          />
        ))}
      </ul>
      <p className="list-group-footer">Referencias de adulto (EFSA). El sodio es un tope: el anillo avisa al pasarlo.</p>
    </section>
  );
}
