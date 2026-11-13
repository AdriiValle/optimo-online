"use client";

// Catálogo de primitivos v2 (design-system.md). Solo desarrollo: en producción es 404.
// Los estados hover/press/focus se muestran forzados con .is-hover/.is-pressed/.is-focus
// para poder auditarlos en captura; los controles reales responden además al ratón y al teclado.

import { notFound } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const SEGMENTS = ["Día", "Semana", "Mes"] as const;

const grid: CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-3)" };
const col: CSSProperties = { display: "grid", gap: "var(--space-1)", justifyItems: "start" };

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} style={{ marginBottom: "var(--space-10)" }}>
      <h2 id={id} className="t-title-2" style={{ marginBottom: "var(--space-4)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={col}>
      {children}
      <span className="t-caption t-secondary">{label}</span>
    </div>
  );
}

function AlertIcon() {
  return (
    <svg className="alert-icon" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <rect x="9" y="5" width="2" height="7" rx="1" fill="var(--surface)" />
      <circle cx="10" cy="14.5" r="1.2" fill="var(--surface)" />
    </svg>
  );
}

const BUTTON_VARIANTS: { cls: string; label: string }[] = [
  { cls: "btn", label: "Primario (relleno)" },
  { cls: "btn btn--tinted", label: "Tintado" },
  { cls: "btn secondary", label: "Secundario (gris)" },
  { cls: "btn btn-ghost", label: "Ghost (plain)" },
  { cls: "btn btn--danger", label: "Destructivo" },
  { cls: "btn btn--danger-solid", label: "Destructivo final" }
];

const STATES: { key: string; label: string; extra?: string; disabled?: boolean; busy?: boolean }[] = [
  { key: "rest", label: "Reposo" },
  { key: "hover", label: "Hover", extra: "is-hover" },
  { key: "press", label: "Press", extra: "is-pressed" },
  { key: "focus", label: "Foco", extra: "is-focus" },
  { key: "disabled", label: "Deshabilitado", disabled: true },
  { key: "pending", label: "Pendiente", busy: true }
];

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Catalog />;
}

function Catalog() {
  const [seg, setSeg] = useState(0);
  const [toggle, setToggle] = useState(true);
  const [chips, setChips] = useState<string[]>(["MD-1"]);
  const [sheet, setSheet] = useState<null | "material" | "opaque">(null);
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const opener = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement | null>(null);

  const nameError = name.length > 0 && name.trim().length < 3 ? "Escribe al menos 3 letras." : "";

  function closeSheet() {
    setClosing(true);
  }

  useEffect(() => {
    if (!sheet) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClosing(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  function onScrimAnimationEnd(e: React.AnimationEvent<HTMLDivElement>) {
    if (!closing || e.target !== e.currentTarget) return;
    setSheet(null);
    setClosing(false);
    opener.current?.focus();
  }

  function fakeSave() {
    setBusy(true);
    window.setTimeout(() => setBusy(false), 1600);
  }

  return (
    <main className="page" style={{ maxWidth: 960 }}>
      <header style={{ marginBottom: "var(--space-8)" }}>
        <h1 className="t-large-title" style={{ margin: 0 }}>
          Primitivos
        </h1>
        <p className="t-subhead t-secondary" style={{ margin: "var(--space-1) 0 0" }}>
          Sistema v2 · Apple como base. Solo desarrollo.
        </p>
      </header>

      <Section id="tipo" title="Tipografía">
        <div className="card" style={{ display: "grid", gap: "var(--space-2)" }}>
          <span className="t-large-title">Large Title 34</span>
          <span className="t-title-1">Title 1 · 28</span>
          <span className="t-title-2">Title 2 · 22</span>
          <span className="t-title-3">Title 3 · 20</span>
          <span className="t-headline">Headline · 17 semibold</span>
          <span className="t-body">Body · 17. El cuerpo de lectura del jugador.</span>
          <span className="t-callout">Callout · 16</span>
          <span className="t-subhead">Subhead · 15 (tablas de escritorio)</span>
          <span className="t-footnote t-secondary">Footnote · 13 secundario</span>
          <span className="t-caption t-secondary">Caption · 12</span>
          <span className="t-caption-2 t-secondary">Caption 2 · 11 (mínimo)</span>
          <span className="t-title-2 tabular">1.234 kcal · 56 g</span>
        </div>
      </Section>

      <Section id="color" title="Color por rol">
        <div className="card" style={grid}>
          {[
            ["--label", "Etiqueta"],
            ["--label-secondary", "Secundario"],
            ["--label-tertiary", "Terciario"],
            ["--accent", "Acento"],
            ["--accent-text", "Enlace"],
            ["--danger", "Peligro"],
            ["--ok", "Correcto"],
            ["--warn", "Aviso"],
            ["--fill-secondary", "Relleno"],
            ["--separator", "Separador"]
          ].map(([v, l]) => (
            <Labeled key={v} label={l}>
              <span
                aria-hidden="true"
                style={{ display: "block", width: 44, height: 44, borderRadius: "var(--radius-sm)", background: `var(${v})` }}
              />
            </Labeled>
          ))}
        </div>
        <p className="t-subhead">
          Texto con <a href="#color">un enlace</a> en el azul de texto.
        </p>
      </Section>

      <Section id="botones" title="Botones">
        <div className="card" style={{ display: "grid", gap: "var(--space-5)" }}>
          {BUTTON_VARIANTS.map((v) => (
            <div key={v.cls}>
              <p className="t-footnote t-secondary" style={{ margin: "0 0 var(--space-2)" }}>
                {v.label}
              </p>
              <div style={grid}>
                {STATES.map((s) => (
                  <Labeled key={s.key} label={s.label}>
                    <button
                      type="button"
                      className={`${v.cls}${s.extra ? ` ${s.extra}` : ""}`}
                      disabled={s.disabled}
                      aria-busy={s.busy || undefined}
                    >
                      {s.busy ? "Guardando" : "Guardar"}
                    </button>
                  </Labeled>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="t-footnote t-secondary" style={{ margin: "0 0 var(--space-2)" }}>
              Tamaños y pendiente real
            </p>
            <div style={grid}>
              <Labeled label="Grande 50">
                <button type="button" className="btn btn--lg">
                  Empezar
                </button>
              </Labeled>
              <Labeled label="Normal 44">
                <button type="button" className="btn">
                  Guardar
                </button>
              </Labeled>
              <Labeled label="Compacto 32 (puntero fino)">
                <button type="button" className="btn secondary btn--sm">
                  Editar
                </button>
              </Labeled>
              <Labeled label="Pulsa: pendiente 1,6 s">
                <button type="button" className="btn" onClick={fakeSave} disabled={busy} aria-busy={busy || undefined}>
                  {busy ? "Guardando" : "Guardar cambios"}
                </button>
              </Labeled>
            </div>
            <div style={{ marginTop: "var(--space-3)" }}>
              <button type="button" className="btn btn--block btn--lg">
                Botón de bloque
              </button>
            </div>
          </div>
          <div>
            <p className="t-footnote t-secondary" style={{ margin: "0 0 var(--space-2)" }}>
              Icono 44×44
            </p>
            <div style={grid}>
              {STATES.slice(0, 5).map((s) => (
                <Labeled key={s.key} label={s.label}>
                  <button
                    type="button"
                    className={`icon-btn${s.extra ? ` ${s.extra}` : ""}`}
                    disabled={s.disabled}
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </Labeled>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="campos" title="Campos y etiquetas">
        <div className="card">
          <div className="field">
            <label htmlFor="ui-name">Nombre</label>
            <input
              id="ui-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Escribe 1–2 letras para ver el error"
              aria-invalid={nameError ? true : undefined}
              aria-describedby="ui-name-msg"
            />
            {nameError ? (
              <p id="ui-name-msg" className="field-error">
                {nameError}
              </p>
            ) : (
              <p id="ui-name-msg" className="field-help">
                Validación en línea, no al enviar.
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="ui-focus">Con foco (forzado)</label>
            <input id="ui-focus" className="is-focus" defaultValue="68 kg" />
          </div>
          <div className="field">
            <label htmlFor="ui-err">Con error</label>
            <input id="ui-err" defaultValue="abc" aria-invalid="true" aria-describedby="ui-err-msg" />
            <p id="ui-err-msg" className="field-error">
              La altura va en centímetros.
            </p>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="ui-sel">Selector</label>
              <select id="ui-sel" defaultValue="md">
                <option value="md">MD</option>
                <option value="md1">MD-1</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="ui-dis">Deshabilitado</label>
              <input id="ui-dis" disabled defaultValue="No editable" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="ui-ta">Notas</label>
            <textarea id="ui-ta" placeholder="Cómo te encuentras hoy" />
          </div>
          <label style={{ display: "flex", alignItems: "center", minHeight: "var(--tap-min)", margin: 0 }}>
            <input type="checkbox" defaultChecked /> Aplicar a platos iguales
          </label>
        </div>
      </Section>

      <Section id="segmentado" title="Selector segmentado">
        <div className="card" style={{ display: "grid", gap: "var(--space-4)" }}>
          <Labeled label="Interactivo, pulgar deslizante">
            <div
              className="segmented"
              role="radiogroup"
              aria-label="Vista"
              style={{ "--seg-count": SEGMENTS.length, "--seg-index": seg } as CSSProperties}
            >
              {SEGMENTS.map((s, i) => (
                <button key={s} type="button" role="radio" aria-checked={seg === i} onClick={() => setSeg(i)}>
                  {s}
                </button>
              ))}
            </div>
          </Labeled>
          <Labeled label="Ancho completo, con radios nativos (teclado: flechas)">
            <div className="segmented segmented--block" role="radiogroup" aria-label="Periodo">
              {["7 días", "30 días", "Todo"].map((s, i) => (
                <label key={s}>
                  <input type="radio" name="ui-period" defaultChecked={i === 0} />
                  {s}
                </label>
              ))}
            </div>
          </Labeled>
          <Labeled label="Opción deshabilitada">
            <div className="segmented" role="radiogroup" aria-label="Demo deshabilitado">
              <button type="button" role="radio" aria-checked="true">
                Uno
              </button>
              <button type="button" role="radio" aria-checked="false" disabled>
                Dos
              </button>
            </div>
          </Labeled>
        </div>
      </Section>

      <Section id="toggle" title="Toggle">
        <div className="card" style={grid}>
          <Labeled label={toggle ? "Encendido (pulsa)" : "Apagado (pulsa)"}>
            <input
              type="checkbox"
              role="switch"
              className="toggle"
              checked={toggle}
              onChange={(e) => setToggle(e.target.checked)}
              aria-label="Mostrar números al jugador"
            />
          </Labeled>
          <Labeled label="Apagado">
            <input type="checkbox" role="switch" className="toggle" defaultChecked={false} aria-label="Apagado" />
          </Labeled>
          <Labeled label="Foco">
            <input type="checkbox" role="switch" className="toggle is-focus" defaultChecked aria-label="Foco" />
          </Labeled>
          <Labeled label="Deshabilitado">
            <input type="checkbox" role="switch" className="toggle" disabled defaultChecked aria-label="Deshabilitado" />
          </Labeled>
        </div>
      </Section>

      <Section id="lista" title="Lista agrupada inset">
        <h3 className="list-group-title">Cuenta</h3>
        <ul className="list-group">
          <li>
            <a className="list-row list-row--disclosure" href="#lista">
              <span className="avatar avatar--sm" aria-hidden="true">
                RV
              </span>
              <span className="list-row-main">
                Ricardo Visus
                <span className="list-row-sub">Deportista · MD-2</span>
              </span>
            </a>
          </li>
          <li>
            <a className="list-row list-row--disclosure is-hover" href="#lista">
              <span className="list-row-main">Fila en hover</span>
              <span className="list-row-detail">3</span>
            </a>
          </li>
          <li>
            <a className="list-row list-row--disclosure is-pressed" href="#lista">
              <span className="list-row-main">Fila pulsada</span>
            </a>
          </li>
          <li>
            <a className="list-row list-row--disclosure is-focus" href="#lista">
              <span className="list-row-main">Fila con foco</span>
            </a>
          </li>
          <li className="list-row">
            <label className="toggle-row" style={{ width: "100%" }}>
              Recordatorios
              <input type="checkbox" role="switch" className="toggle" defaultChecked />
            </label>
          </li>
          <li>
            <button type="button" className="list-row list-row--danger">
              Cerrar sesión
            </button>
          </li>
        </ul>
        <p className="list-group-footer">Pie de grupo en Footnote secundario.</p>
      </Section>

      <Section id="chips" title="Chips">
        <div className="card" style={{ display: "grid", gap: "var(--space-4)" }}>
          <div className="chips" role="group" aria-label="Tipo de día">
            {["MD-1", "MD", "MD+1", "Descanso"].map((c) => {
              const on = chips.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  className="chip"
                  aria-pressed={on}
                  onClick={() => setChips((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div style={grid}>
            <Labeled label="Reposo">
              <button type="button" className="chip">
                Chip
              </button>
            </Labeled>
            <Labeled label="Seleccionado">
              <button type="button" className="chip" aria-pressed="true">
                Chip
              </button>
            </Labeled>
            <Labeled label="Press">
              <button type="button" className="chip is-pressed">
                Chip
              </button>
            </Labeled>
            <Labeled label="Foco">
              <button type="button" className="chip is-focus">
                Chip
              </button>
            </Labeled>
            <Labeled label="Deshabilitado">
              <button type="button" className="chip" disabled>
                Chip
              </button>
            </Labeled>
            <Labeled label="Etiqueta (no tocable)">
              <span className="chip">Semana 46</span>
            </Labeled>
          </div>
        </div>
      </Section>

      <Section id="alertas" title="Alertas y mensajes inline">
        <div className="alert alert--danger" role="alert">
          <AlertIcon />
          <div>
            <strong className="alert-title">No se pudo guardar</strong>
            <p>Revisa la conexión y vuelve a intentarlo.</p>
          </div>
        </div>
        <div className="alert alert--ok" role="status">
          <AlertIcon />
          <div>
            <strong className="alert-title">Guardado</strong>
            <p>El menú de la semana está publicado.</p>
          </div>
        </div>
        <div className="alert alert--warn" role="status">
          <AlertIcon />
          <p>Faltan 2 comidas por completar el jueves.</p>
        </div>
        <div className="alert" role="status">
          <AlertIcon />
          <p>Aviso neutro, sin color semántico.</p>
        </div>
        <p className="error">Mensaje de error corto (.error).</p>
        <p className="ok">Mensaje correcto corto (.ok).</p>
      </Section>

      <Section id="estados" title="Estados vacío, carga y error">
        <div className="card">
          <div className="state">
            <svg className="state-icon" viewBox="0 0 32 32" aria-hidden="true">
              <rect x="5" y="7" width="22" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M5 13h22M11 4v6M21 4v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="state-title">Sin sesión hoy</p>
            <p className="state-text">Cuando tu entrenador publique la semana, aparecerá aquí.</p>
            <button type="button" className="btn btn--tinted">
              Ver semana
            </button>
          </div>
        </div>
        <div className="card" aria-busy="true" aria-label="Cargando">
          <span className="skeleton skeleton--title" />
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line" style={{ width: "80%" }} />
          <div style={{ ...grid, marginTop: "var(--space-3)" }}>
            <span className="skeleton skeleton--circle" style={{ width: 44, height: 44 }} />
            <span className="spinner spinner--lg" role="progressbar" aria-label="Cargando" />
          </div>
        </div>
        <div className="state state--error" role="alert">
          <p className="state-title">No se pudo cargar</p>
          <p className="state-text">El servidor no respondió. Tus datos están a salvo.</p>
          <button type="button" className="btn btn--tinted">
            Reintentar
          </button>
        </div>
      </Section>

      <Section id="avatar" title="Avatar">
        <div className="card" style={grid}>
          <Labeled label="32">
            <span className="avatar avatar--sm" aria-hidden="true">
              AM
            </span>
          </Labeled>
          <Labeled label="56">
            <span className="avatar" aria-hidden="true">
              RV
            </span>
          </Labeled>
          <Labeled label="72 imagen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="avatar avatar--lg" src="/logo-optimo.png" alt="" />
          </Labeled>
        </div>
      </Section>

      <Section id="tarjetas" title="Tarjetas">
        <div className="card">
          <h2>Tarjeta plana</h2>
          <p className="t-subhead t-secondary" style={{ margin: 0 }}>
            Blanca sobre parchment, sin sombra.
          </p>
          <div className="card" style={{ margin: "var(--space-3) 0 0" }}>
            Tarjeta sobre blanco: filete suave.
          </div>
        </div>
        <a className="card" href="#tarjetas" style={{ display: "block" }}>
          <span className="t-headline">Tarjeta tocable</span>
          <span className="t-subhead t-secondary" style={{ display: "block" }}>
            Press 0,985 al pulsar.
          </span>
        </a>
      </Section>

      <Section id="sheet" title="Sheet / modal">
        <div className="card" style={grid}>
          <button
            type="button"
            className="btn"
            onClick={(e) => {
              opener.current = e.currentTarget;
              setSheet("material");
            }}
          >
            Abrir sheet
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={(e) => {
              opener.current = e.currentTarget;
              setSheet("opaque");
            }}
          >
            Abrir sheet opaco
          </button>
        </div>
        <p className="t-footnote t-secondary">
          Móvil: sube desde abajo con material grueso. ≥720: centrado, opaco, escala 0,96→1. Esc o × para cerrar; sale por el mismo camino.
        </p>
      </Section>

      {sheet ? (
        <div
          className={`sheet-scrim${closing ? " is-closing" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheet();
          }}
          onAnimationEnd={onScrimAnimationEnd}
        >
          <div
            className={`sheet${sheet === "opaque" ? " sheet--opaque" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ui-sheet-title"
          >
            <div className="sheet-grabber" aria-hidden="true" />
            <div className="sheet-header">
              <h2 id="ui-sheet-title" className="sheet-title">
                Nuevo deportista
              </h2>
              <button type="button" className="icon-btn sheet-close" aria-label="Cerrar" ref={closeBtn} onClick={closeSheet}>
                ×
              </button>
            </div>
            <div className="sheet-body">
              <div className="field">
                <label htmlFor="ui-sheet-name">Nombre</label>
                <input id="ui-sheet-name" placeholder="Nombre y apellidos" />
              </div>
              <div className="field">
                <label htmlFor="ui-sheet-mail">Email</label>
                <input id="ui-sheet-mail" type="email" placeholder="nombre@club.es" />
              </div>
              <p className="t-footnote t-secondary" style={{ margin: 0 }}>
                El contenido largo hace scroll dentro del sheet; el fondo queda bloqueado.
              </p>
            </div>
            <div className="sheet-footer">
              <button type="button" className="btn secondary" onClick={closeSheet}>
                Cancelar
              </button>
              <button type="button" className="btn" onClick={closeSheet}>
                Crear
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
