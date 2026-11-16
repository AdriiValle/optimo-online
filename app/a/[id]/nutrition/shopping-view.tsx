"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { addDays, dateKey, parseDateLocal, startOfWeekMonday } from "@/lib/dates";
import {
  shoppingRange,
  shoppingRangeLabel,
  shoppingText,
  type ShoppingLine,
  type ShoppingList,
  type ShoppingRangeKind
} from "@/lib/nutrition/shopping";
import type { ShoppingData } from "@/lib/nutrition/shopping-queries";
import { loadNutritionShopping, saveNutritionShoppingCheck } from "./actions";

const KINDS: { id: ShoppingRangeKind; label: string }[] = [
  { id: "week", label: "Semana" },
  { id: "3d", label: "Próximos 3 días" }
];

const SECTION_NOTES: Partial<Record<string, string>> = {
  revisar: "Sin alimento del catálogo: revisa la cantidad en el plato.",
  despensa: "Básicos que suele haber en casa. Márcalos si ya los tienes."
};

type Props = {
  athleteId: string;
  /** Día que se está viendo en Nutrición: la semana de la compra arranca en su lunes. */
  date: string;
  today: string;
};

function legacyCopy(text: string) {
  const active = document.activeElement as HTMLElement | null;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  active?.focus();
  return ok;
}

function withChecked(list: ShoppingList, key: string, checked: boolean): ShoppingList {
  const sections = list.sections.map((s) => ({
    ...s,
    lines: s.lines.map((l) => (l.key === key ? { ...l, checked } : l))
  }));
  return { ...list, sections, checked: sections.flatMap((s) => s.lines).filter((l) => l.checked).length };
}

/** Vista «Compra»: lo que hay que comprar para el menú de la semana o de los próximos 3 días, por pasillo. */
export function ShoppingView({ athleteId, date, today }: Props) {
  const [kind, setKind] = useState<ShoppingRangeKind>("week");
  const [anchor, setAnchor] = useState(date);
  const [data, setData] = useState<ShoppingData | null>(null);
  const [failed, setFailed] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [canShare, setCanShare] = useState(false);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const range = shoppingRange(kind, anchor);
  const label = shoppingRangeLabel(range.from, range.to);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => {
      if (msgTimer.current) clearTimeout(msgTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    loadNutritionShopping(athleteId, kind, anchor)
      .catch(() => null)
      .then((d) => {
        if (cancelled) return;
        setFailed(!d);
        setData(d);
      });
    return () => {
      cancelled = true;
    };
  }, [athleteId, kind, anchor]);

  function flash(text: string, error = false) {
    setMsg({ text, error });
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 4000);
  }

  function changeKind(next: ShoppingRangeKind) {
    if (next === kind) return;
    // «Próximos 3 días» desde hoy si la semana que se ve es la actual; si no, desde el lunes de esa semana.
    if (next === "3d") setAnchor(startOfWeekMonday(anchor) === startOfWeekMonday(today) ? today : startOfWeekMonday(anchor));
    setKind(next);
  }

  function move(dir: 1 | -1) {
    setAnchor(dateKey(addDays(parseDateLocal(range.from), dir * (kind === "week" ? 7 : 3))));
  }

  const isCurrent = kind === "week" ? range.from === startOfWeekMonday(today) : range.from === today;
  const loading = !failed && (!data || data.range.from !== range.from || data.range.to !== range.to);
  const list = data?.list ?? null;

  async function toggle(line: ShoppingLine, checked: boolean) {
    if (!data) return;
    const weekStart = data.range.weekStart;
    setData((d) => (d ? { ...d, list: withChecked(d.list, line.key, checked) } : d));
    const saved = await saveNutritionShoppingCheck(athleteId, weekStart, line.key, checked).catch(() => null);
    if (saved === null) {
      setData((d) => (d && d.range.weekStart === weekStart ? { ...d, list: withChecked(d.list, line.key, !checked) } : d));
      flash("No se pudo guardar. Inténtalo otra vez.", true);
    }
  }

  async function copy(text: string) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Sin API de portapapeles (http en la red local, permiso denegado): copia clásica con un textarea oculto.
      ok = legacyCopy(text);
    }
    if (ok) flash("Lista copiada. Pégala en WhatsApp o en tus notas.");
    else flash("No se pudo copiar la lista.", true);
  }

  async function share() {
    if (!list) return;
    const text = shoppingText(list, label);
    if (canShare) {
      try {
        await navigator.share({ title: `Lista de la compra · ${label}`, text });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    await copy(text);
  }

  const seg = { "--seg-count": KINDS.length, "--seg-index": KINDS.findIndex((k) => k.id === kind) } as CSSProperties;
  const pendingCount = list ? list.total - list.checked : 0;

  return (
    <section className="nut-shop" aria-labelledby="nut-shop-title" aria-busy={loading || undefined}>
      <div className="segmented segmented--block nut-shop-kind" role="radiogroup" aria-label="Rango de la compra" style={seg}>
        {KINDS.map((k) => (
          <label key={k.id}>
            <input type="radio" name="nut-shop-kind" value={k.id} checked={kind === k.id} onChange={() => changeKind(k.id)} />
            {k.label}
          </label>
        ))}
      </div>

      <div className="nut-wk-nav nut-shop-nav">
        <button type="button" className="icon-btn nut-wk-arrow" aria-label={kind === "week" ? "Semana anterior" : "3 días antes"} onClick={() => move(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14.5 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="nut-wk-head">
          <h2 id="nut-shop-title" className="nut-wk-title">
            <span className="nut-shop-print-only">Lista de la compra · </span>
            {label}
          </h2>
          {isCurrent ? (
            <span className="nut-wk-rel">{kind === "week" ? "Esta semana" : "Desde hoy"}</span>
          ) : (
            <span className="nut-wk-sub">
              <button
                type="button"
                className="nut-wk-today"
                onClick={() => setAnchor(today)}
              >
                Ir a hoy
              </button>
            </span>
          )}
        </div>
        <button type="button" className="icon-btn nut-wk-arrow" aria-label={kind === "week" ? "Semana siguiente" : "3 días después"} onClick={() => move(1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9.5 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {failed ? (
        <div className="nut-empty nut-empty--error" role="alert">
          <strong>No se pudo cargar la compra</strong>
          <span>Comprueba la conexión y vuelve a abrir la pestaña.</span>
        </div>
      ) : loading ? (
        <>
          <span className="sr-only" role="status">
            Cargando la lista…
          </span>
          <div className="nut-shop-skel" aria-hidden="true">
            {[5, 3].map((n, g) => (
              <div key={g}>
                <span className="skeleton skeleton--line nut-shop-skel-title" />
                <ul className="nut-shop-lines">
                  {Array.from({ length: n }, (_, i) => (
                    <li key={i} className="nut-shop-line">
                      <span className="skeleton skeleton--circle nut-shop-skel-box" />
                      <span className="skeleton skeleton--line nut-shop-skel-name" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      ) : data && list ? (
        data.meals === 0 ? (
          <div className="card nut-empty" role="status">
            <CartIcon />
            <strong>Sin menú en estos días</strong>
            <span>Cuando Amanda cargue los platos, aquí tendrás la compra ordenada por secciones.</span>
          </div>
        ) : list.total === 0 ? (
          <div className="card nut-empty" role="status">
            <CartIcon />
            <strong>Aún no hay ingredientes</strong>
            <span>
              Tienes {data.meals} {data.meals === 1 ? "plato" : "platos"} en el menú, pero Amanda todavía no ha confirmado sus ingredientes.
            </span>
          </div>
        ) : (
          <>
            <div className="nut-shop-summary">
              <p className="nut-shop-count" role="status">
                {pendingCount === 0 ? "Ya tienes todo en casa" : `${pendingCount} ${pendingCount === 1 ? "producto por comprar" : "productos por comprar"}`}
                {list.checked > 0 && pendingCount > 0 ? <span> · {list.checked} ya en casa</span> : null}
              </p>
              {data.mealsPending > 0 ? (
                <p className="nut-shop-pending">
                  {data.mealsPending === 1
                    ? "1 plato aún no tiene ingredientes confirmados y no entra en la lista."
                    : `${data.mealsPending} platos aún no tienen ingredientes confirmados y no entran en la lista.`}
                </p>
              ) : null}
            </div>

            <div className="nut-shop-actions">
              {canShare ? (
                <button type="button" className="btn nut-shop-share" onClick={() => void share()}>
                  <ShareIcon />
                  Compartir
                </button>
              ) : null}
              <button type="button" className={canShare ? "btn btn--gray" : "btn nut-shop-share"} onClick={() => void copy(shoppingText(list, label))}>
                <CopyIcon />
                Copiar
              </button>
              <button type="button" className="btn btn--gray" onClick={() => window.print()}>
                <PrintIcon />
                Imprimir
              </button>
            </div>
            <p className={`nut-shop-msg${msg?.error ? " is-error" : ""}`} role="status" aria-live="polite">
              {msg?.text ?? ""}
            </p>

            {list.sections.map((s) => (
              <section key={s.key} className={`nut-shop-sec nut-shop-sec--${s.key}`} aria-labelledby={`nut-shop-sec-${s.key}`}>
                <h3 id={`nut-shop-sec-${s.key}`} className="nut-shop-sec-title">
                  {s.label}
                </h3>
                <ul className="nut-shop-lines">
                  {s.lines.map((l) => (
                    <li key={l.key} className={`nut-shop-line${l.checked ? " is-checked" : ""}`}>
                      <label className="nut-shop-check">
                        <input type="checkbox" checked={l.checked} onChange={(e) => void toggle(l, e.target.checked)} />
                        <span className="nut-shop-box" aria-hidden="true" />
                        <span className="nut-shop-text">
                          <span className="nut-shop-name">{l.name}</span>
                          {l.packs ? <span className="nut-shop-packs">{l.packs}</span> : null}
                          {l.checked ? <span className="sr-only">, ya lo tengo</span> : null}
                        </span>
                        {l.amount ? <span className="nut-shop-amount">{l.amount}</span> : null}
                      </label>
                    </li>
                  ))}
                </ul>
                {SECTION_NOTES[s.key] ? <p className="nut-shop-sec-note">{SECTION_NOTES[s.key]}</p> : null}
              </section>
            ))}
            <p className="nut-shop-foot">Marca lo que ya tienes en casa: no saldrá al compartir ni al imprimir.</p>
          </>
        )
      ) : null}
    </section>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4h2.2l2.1 10.2a1.6 1.6 0 0 0 1.6 1.3h8.3a1.6 1.6 0 0 0 1.6-1.2L20.5 8H6.1" />
      <circle cx="9.5" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
      <path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 8V3.5h10V8M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="7" y="13.5" width="10" height="7" rx="1" />
    </svg>
  );
}
