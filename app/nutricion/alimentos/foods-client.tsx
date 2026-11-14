"use client";

import { useId, useMemo, useState } from "react";
import type { FoodRef, FoodRow, OrphanGroup } from "@/lib/nutrition/foods-queries";

/** Pasillos de la lista de la compra (lo no clasificado va a «Otros»). Se puede escribir otro. */
const AISLES = [
  "Fruta y verdura",
  "Carne",
  "Pescado",
  "Huevos y lácteos",
  "Panadería y cereales",
  "Legumbres y despensa",
  "Aceites y salsas",
  "Congelados",
  "Otros"
];

type State = { foods: FoodRow[]; orphans: OrphanGroup[] };
type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function api<T>(url: string, method: "GET" | "POST" | "PATCH", body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, message: json?.error?.message ?? "No se pudo guardar. Inténtalo de nuevo." };
    return { ok: true, data: json.data as T };
  } catch {
    return { ok: false, message: "Sin conexión. Inténtalo de nuevo." };
  }
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Nombre propuesto para un alimento nuevo a partir del texto del menú: sin paréntesis, con mayúscula inicial. */
function nameFromText(text: string) {
  const plain = text.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  return plain ? plain[0].toUpperCase() + plain.slice(1) : "";
}

export function FoodsClient({ initialFoods, initialOrphans }: { initialFoods: FoodRow[]; initialOrphans: OrphanGroup[] }) {
  const [state, setState] = useState<State>({ foods: initialFoods, orphans: initialOrphans });
  const [notice, setNotice] = useState("");
  const aisleListId = useId();

  const aisles = useMemo(() => {
    const own = state.foods.map((f) => f.aisle).filter((a): a is string => !!a);
    return [...new Set([...AISLES, ...own])];
  }, [state.foods]);

  async function refresh() {
    const r = await api<State>("/api/nutrition/foods", "GET");
    if (r.ok) setState(r.data);
  }

  return (
    <div className="nut-foods">
      <header className="nut-foods-intro">
        <h1 className="nut-foods-title">Alimentos</h1>
        <p className="nut-foods-lead">
          El catálogo que usan todos los menús. El pasillo y la unidad ordenan y suman la lista de la compra.
        </p>
      </header>

      <datalist id={aisleListId}>
        {aisles.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      <p className="sr-only" role="status" aria-live="polite">
        {notice}
      </p>

      <OrphanTray
        state={state}
        aisleListId={aisleListId}
        onState={(next, message) => {
          setState(next);
          setNotice(message);
        }}
      />

      <FoodCatalog
        foods={state.foods}
        aisleListId={aisleListId}
        onSaved={(food) => {
          setState((s) => ({ ...s, foods: s.foods.map((f) => (f.id === food.id ? food : f)) }));
          setNotice(`«${food.name}» guardado`);
          // Un alias o nombre nuevo cambia lo que la bandeja sugiere.
          void refresh();
        }}
      />
    </div>
  );
}

/* —— Bandeja «Sin alimento» —— */

function OrphanTray({
  state,
  aisleListId,
  onState
}: {
  state: State;
  aisleListId: string;
  onState: (next: State, message: string) => void;
}) {
  const { orphans, foods } = state;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [done, setDone] = useState("");
  const total = orphans.reduce((n, g) => n + g.count, 0);
  const evident = orphans.filter((g) => g.match);
  const evidentItems = evident.reduce((n, g) => n + g.count, 0);

  async function run(key: string, call: () => Promise<ApiResult<State & { matched: number }>>, label: (n: number) => string) {
    setBusy(key);
    setError(null);
    const r = await call();
    setBusy(null);
    if (!r.ok) {
      setError({ key, message: r.message });
      return;
    }
    const message = `${label(r.data.matched)}. Quedan sin confirmar hasta revisar los gramos en cada plato.`;
    setDone(message);
    onState({ foods: r.data.foods, orphans: r.data.orphans }, message);
  }

  const match = (g: OrphanGroup, food: FoodRef, addAlias: boolean) =>
    run(
      g.key,
      () => api("/api/nutrition/foods/match", "POST", { key: g.key, foodId: food.id, addAlias }),
      (n) => `«${g.text}» → ${food.name} (${plural(n, "ingrediente", "ingredientes")})`
    );

  return (
    <section className="nut-tray" aria-labelledby="nut-tray-title">
      <header className="nut-foods-section-head">
        <div>
          <h2 id="nut-tray-title">
            Sin alimento
            {total ? <span className="nut-count">{total}</span> : null}
          </h2>
          <p className="nut-foods-section-sub">
            Ingredientes de los menús que no casan con ningún alimento. Al emparejar un texto se corrigen todos los que lo usan.
          </p>
        </div>
        {evident.length ? (
          <button
            type="button"
            className="btn btn--tinted"
            disabled={busy !== null}
            onClick={() =>
              run("*", () => api("/api/nutrition/foods/match", "POST", { auto: true }), (n) =>
                `${plural(n, "ingrediente emparejado", "ingredientes emparejados")}`
              )
            }
          >
            {busy === "*" ? "Emparejando…" : `Emparejar evidentes (${evidentItems})`}
          </button>
        ) : null}
      </header>

      {done ? (
        <div className="alert alert--ok nut-tray-done">
          <p>{done}</p>
        </div>
      ) : null}
      {error?.key === "*" ? (
        <p className="field-error" role="alert">
          {error.message}
        </p>
      ) : null}

      {orphans.length === 0 ? (
        <div className="state nut-tray-empty">
          <svg className="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="m8.5 12.2 2.4 2.4 4.6-5" />
          </svg>
          <p className="state-title">Todo emparejado</p>
          <p className="state-text">Cada ingrediente de los menús tiene su alimento.</p>
        </div>
      ) : (
        <ul className="nut-tray-list">
          {orphans.map((g) => (
            <OrphanCard
              key={g.key}
              group={g}
              foods={foods}
              aisleListId={aisleListId}
              busy={busy === g.key}
              locked={busy !== null}
              error={error?.key === g.key ? error.message : null}
              onMatch={(food, addAlias) => match(g, food, addAlias)}
              onCreate={(fields) =>
                run(
                  g.key,
                  () => api("/api/nutrition/foods", "POST", { ...fields, aliases: [], staple: false, matchKey: g.key }),
                  (n) => `«${fields.name}» creado y emparejado (${plural(n, "ingrediente", "ingredientes")})`
                )
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function OrphanCard({
  group,
  foods,
  aisleListId,
  busy,
  locked,
  error,
  onMatch,
  onCreate
}: {
  group: OrphanGroup;
  foods: FoodRow[];
  aisleListId: string;
  busy: boolean;
  locked: boolean;
  error: string | null;
  onMatch: (food: FoodRef, addAlias: boolean) => void;
  onCreate: (fields: { name: string; aisle: string | null }) => void;
}) {
  const id = useId();
  const [pick, setPick] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(() => nameFromText(group.text));
  const [aisle, setAisle] = useState("");
  const picked = foods.find((f) => f.id === pick);

  return (
    <li className="nut-orphan" aria-busy={busy || undefined}>
      <div className="nut-orphan-head">
        <p className="nut-orphan-text">{group.text}</p>
        <p className="nut-orphan-meta">
          {plural(group.count, "ingrediente", "ingredientes")} · {plural(group.athletes, "deportista", "deportistas")}
        </p>
      </div>

      {group.match ? (
        <button type="button" className="btn nut-orphan-primary" disabled={locked} onClick={() => onMatch(group.match!, false)}>
          Emparejar con {group.match.name}
        </button>
      ) : null}

      {group.suggestions.length ? (
        <div className="nut-orphan-suggest">
          <span className="nut-orphan-label" id={`${id}-sug`}>
            ¿Es alias de…?
          </span>
          <div className="chips" role="group" aria-labelledby={`${id}-sug`}>
            {group.suggestions.map((s) => (
              <button key={s.id} type="button" className="chip nut-orphan-chip" disabled={locked} onClick={() => onMatch(s, true)}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="nut-orphan-row">
        <label className="sr-only" htmlFor={`${id}-pick`}>
          Es alias de otro alimento
        </label>
        <select id={`${id}-pick`} value={pick} disabled={locked} onChange={(e) => setPick(e.target.value)}>
          <option value="">Es alias de…</option>
          {foods.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn--gray"
          disabled={locked || !picked}
          onClick={() => picked && onMatch({ id: picked.id, name: picked.name }, true)}
        >
          Guardar alias
        </button>
        {!creating ? (
          <button type="button" className="btn btn--plain" disabled={locked} onClick={() => setCreating(true)}>
            Alimento nuevo
          </button>
        ) : null}
      </div>

      {creating ? (
        <form
          className="nut-orphan-new"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            onCreate({ name: name.trim(), aisle: aisle.trim() || null });
          }}
        >
          <label className="nut-food-field">
            <span className="nut-food-label">Nombre</span>
            <input value={name} maxLength={80} required autoFocus onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="nut-food-field">
            <span className="nut-food-label">Pasillo</span>
            <input value={aisle} maxLength={40} list={aisleListId} placeholder="Otros" onChange={(e) => setAisle(e.target.value)} />
          </label>
          <div className="nut-orphan-new-actions">
            <button type="button" className="btn btn--gray" disabled={locked} onClick={() => setCreating(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={locked || !name.trim()}>
              {busy ? "Guardando…" : "Crear y emparejar"}
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}

/* —— Catálogo editable —— */

function FoodCatalog({
  foods,
  aisleListId,
  onSaved
}: {
  foods: FoodRow[];
  aisleListId: string;
  onSaved: (food: FoodRow) => void;
}) {
  const [query, setQuery] = useState("");
  const q = norm(query);
  const shown = q ? foods.filter((f) => [f.name, ...f.aliases].some((a) => norm(a).includes(q))) : foods;

  return (
    <section className="nut-catalog" aria-labelledby="nut-catalog-title">
      <header className="nut-foods-section-head">
        <div>
          <h2 id="nut-catalog-title">
            Catálogo
            <span className="nut-count">{foods.length}</span>
          </h2>
          <p className="nut-foods-section-sub">Los alias son otras formas de escribirlo en un menú («pechuga», «pollo»).</p>
        </div>
        <div className="nut-catalog-search">
          <label className="sr-only" htmlFor="nut-catalog-q">
            Buscar alimento o alias
          </label>
          <input id="nut-catalog-q" type="search" placeholder="Buscar alimento o alias" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </header>

      <div className="nut-catalog-head" aria-hidden="true">
        <span>Nombre</span>
        <span>Pasillo</span>
        <span>Unidad</span>
        <span>g/unidad</span>
        <span>Alias</span>
        <span>Básico</span>
        <span>Uso</span>
        <span />
      </div>
      {shown.length ? (
        <ul className="nut-catalog-list">
          {shown.map((f) => (
            <FoodEditor key={f.id} food={f} aisleListId={aisleListId} onSaved={onSaved} />
          ))}
        </ul>
      ) : (
        <div className="state">
          <p className="state-title">Sin resultados</p>
          <p className="state-text">Ningún alimento ni alias contiene «{query.trim()}».</p>
        </div>
      )}
    </section>
  );
}

type Draft = { name: string; aisle: string; unitName: string; unitG: string; aliases: string; staple: boolean };

const draftOf = (f: FoodRow): Draft => ({
  name: f.name,
  aisle: f.aisle ?? "",
  unitName: f.unitName ?? "",
  unitG: f.unitG == null ? "" : String(f.unitG).replace(".", ","),
  aliases: f.aliases.join(", "),
  staple: f.staple
});

const gramsOf = (s: string) => {
  const t = s.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : NaN;
};

const aliasList = (s: string) => s.split(",").map((a) => a.trim()).filter(Boolean);

function FoodEditor({ food, aisleListId, onSaved }: { food: FoodRow; aisleListId: string; onSaved: (food: FoodRow) => void }) {
  const id = useId();
  const [base, setBase] = useState(() => draftOf(food));
  const [draft, setDraft] = useState(base);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const grams = gramsOf(draft.unitG);
  const gramsBad = Number.isNaN(grams);
  const nameBad = !draft.name.trim();
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== base[k]);

  // La bandeja puede añadir un alias a este alimento: la fila toma el dato nuevo (sin pisar lo que se esté editando).
  const incoming = draftOf(food);
  const incomingKey = JSON.stringify(incoming);
  const [seen, setSeen] = useState(incomingKey);
  if (incomingKey !== seen) {
    setSeen(incomingKey);
    setBase(incoming);
    if (!dirty) setDraft(incoming);
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  };

  async function save() {
    if (!dirty || gramsBad || nameBad) return;
    const patch: Record<string, unknown> = {};
    if (draft.name !== base.name) patch.name = draft.name.trim();
    if (draft.aisle !== base.aisle) patch.aisle = draft.aisle.trim() || null;
    if (draft.unitName !== base.unitName) patch.unitName = draft.unitName.trim() || null;
    if (draft.unitG !== base.unitG) patch.unitG = grams;
    if (draft.aliases !== base.aliases) patch.aliases = aliasList(draft.aliases);
    if (draft.staple !== base.staple) patch.staple = draft.staple;
    setSaving(true);
    setError("");
    const r = await api<FoodRow>(`/api/nutrition/foods/${food.id}`, "PATCH", patch);
    setSaving(false);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    const next = draftOf(r.data);
    setBase(next);
    setDraft(next);
    setSaved(true);
    onSaved(r.data);
  }

  return (
    <li className="nut-food" aria-labelledby={`${id}-name-l`}>
      <form
        className="nut-food-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <label className="nut-food-field nut-food-name">
          <span className="nut-food-label" id={`${id}-name-l`}>
            Nombre
          </span>
          <input value={draft.name} maxLength={80} aria-invalid={nameBad || undefined} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="nut-food-field">
          <span className="nut-food-label">Pasillo</span>
          <input value={draft.aisle} maxLength={40} list={aisleListId} placeholder="Otros" onChange={(e) => set("aisle", e.target.value)} />
        </label>
        <label className="nut-food-field">
          <span className="nut-food-label">Unidad</span>
          <input value={draft.unitName} maxLength={24} placeholder="unidad" onChange={(e) => set("unitName", e.target.value)} />
        </label>
        <label className="nut-food-field">
          <span className="nut-food-label">g/unidad</span>
          <input
            value={draft.unitG}
            inputMode="decimal"
            placeholder="—"
            aria-invalid={gramsBad || undefined}
            onChange={(e) => set("unitG", e.target.value)}
          />
        </label>
        <label className="nut-food-field nut-food-aliases">
          <span className="nut-food-label">Alias</span>
          <input value={draft.aliases} placeholder="Separados por comas" onChange={(e) => set("aliases", e.target.value)} />
        </label>
        <label className="nut-food-field nut-food-staple">
          <span className="nut-food-label">Básico</span>
          <input
            type="checkbox"
            role="switch"
            className="toggle"
            checked={draft.staple}
            aria-describedby={`${id}-staple-h`}
            onChange={(e) => set("staple", e.target.checked)}
          />
          <span className="sr-only" id={`${id}-staple-h`}>
            Básico de despensa: va aparte en la lista de la compra
          </span>
        </label>
        <div className="nut-food-end">
          <span className="nut-food-meta">
            {food.itemCount ? plural(food.itemCount, "ingrediente", "ingredientes") : "Sin usar"}
          </span>
          <button type="submit" className="btn nut-food-save" disabled={!dirty || saving || gramsBad || nameBad}>
            {saving ? "Guardando…" : saved && !dirty ? "Guardado" : "Guardar"}
          </button>
        </div>
      </form>
      {gramsBad ? (
        <p className="field-error" role="alert">
          Los gramos por unidad tienen que ser un número mayor que 0.
        </p>
      ) : null}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}
