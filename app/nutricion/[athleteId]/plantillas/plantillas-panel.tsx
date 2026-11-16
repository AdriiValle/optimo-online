"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MEAL_SLOTS } from "@/lib/types";
import { startOfWeekMonday } from "@/lib/dates";
import type { Dish, FoodOption, FoodSwap, MenuTemplate, TemplateKind } from "@/lib/nutrition/templates-queries";
import { dayDate, fmtNum, shortDate } from "../seguimiento/format";

const MD_TAGS = ["MD-1", "MD", "MD+1", "Libre"] as const;
const slotLabel = (slot: string | null) => MEAL_SLOTS.find((s) => s.slot === slot)?.label ?? null;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  }).catch(() => null);
  if (!res) return { ok: false as const, message: "Sin conexión. Prueba otra vez." };
  const json = await res.json().catch(() => null);
  if (!res.ok) return { ok: false as const, message: (json?.error?.message as string | undefined) ?? "No se ha podido guardar." };
  return { ok: true as const, data: json?.data };
}

/** Mensaje de estado: visible y, a la vez, anunciado por el lector de pantalla. */
function Status({ text, error }: { text: string | null; error?: boolean }) {
  return (
    <>
      <p className="sr-only" role="status">
        {text ?? ""}
      </p>
      {text ? (
        <p className={error ? "field-error nut-tpl-status" : "nut-trk-saved nut-tpl-status"} aria-hidden="true">
          {text}
        </p>
      ) : null}
    </>
  );
}

/* —— Plantillas de menú —— */

function templateMeta(t: MenuTemplate) {
  const items = t.slots.length;
  const days = new Set(t.slots.map((s) => s.dayOffset)).size;
  return [
    t.kind === "week" ? `Semana · ${plural(days, "día", "días")}` : "Día",
    t.mdTag,
    plural(items, "plato", "platos")
  ]
    .filter(Boolean)
    .join(" · ");
}

function TemplatesBlock({
  athleteId,
  athleteName,
  today,
  thisMonday,
  nextMonday,
  initial
}: {
  athleteId: string;
  athleteName: string;
  today: string;
  thisMonday: string;
  nextMonday: string;
  initial: MenuTemplate[];
}) {
  const router = useRouter();
  const uid = useId();
  const [templates, setTemplates] = useState(initial);
  const [kind, setKind] = useState<TemplateKind>("week");
  const [from, setFrom] = useState(thisMonday);
  const [name, setName] = useState("");
  const [mdTag, setMdTag] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [applyId, setApplyId] = useState<string | null>(null);
  const [applyStart, setApplyStart] = useState(nextMonday);
  const [overwrite, setOverwrite] = useState(false);
  const [applying, setApplying] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [listMsg, setListMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const changeKind = (k: TemplateKind) => {
    setKind(k);
    setFrom(k === "week" ? startOfWeekMonday(from || today) : from === thisMonday ? today : from);
    setSaveMsg(null);
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) return setSaveMsg({ text: "Pon un nombre a la plantilla.", error: true });
    if (!from) return setSaveMsg({ text: "Elige la fecha.", error: true });
    setSaving(true);
    setSaveMsg(null);
    const r = await send("/api/nutrition/templates", "POST", { athleteId, from, kind, name: name.trim(), mdTag });
    setSaving(false);
    if (!r.ok) return setSaveMsg({ text: r.message, error: true });
    setTemplates(r.data.templates);
    setSaveMsg({ text: `Plantilla «${name.trim()}» guardada.` });
    setName("");
  }

  const openApply = (t: MenuTemplate) => {
    setApplyId(t.id);
    setApplyStart(t.kind === "week" ? nextMonday : today);
    setOverwrite(false);
    setConfirmId(null);
    setListMsg(null);
  };

  async function apply(t: MenuTemplate) {
    if (applying || !applyStart) return;
    setApplying(true);
    setListMsg(null);
    const r = await send(`/api/nutrition/templates/${t.id}/apply`, "POST", { athleteId, start: applyStart, overwrite });
    setApplying(false);
    if (!r.ok) return setListMsg({ text: r.message, error: true });
    const { created, replaced, skipped } = r.data as { created: number; replaced: number; skipped: number };
    const parts = [
      created ? plural(created, "plato nuevo", "platos nuevos") : null,
      replaced ? plural(replaced, "sustituido", "sustituidos") : null,
      skipped ? `${plural(skipped, "franja ya tenía", "franjas ya tenían")} plato` : null
    ].filter(Boolean);
    setApplyId(null);
    setListMsg({
      text: `«${t.name}» aplicada a ${athleteName} desde el ${shortDate(applyStart)}: ${parts.join(", ") || "nada que cambiar"}.`
    });
    router.refresh();
  }

  async function remove(t: MenuTemplate) {
    setConfirmId(null);
    const r = await send(`/api/nutrition/templates/${t.id}`, "DELETE");
    if (!r.ok) return setListMsg({ text: r.message, error: true });
    setTemplates(r.data);
    setListMsg({ text: `Plantilla «${t.name}» borrada.` });
  }

  return (
    <section className="nut-trk-block" aria-labelledby={`${uid}-t`}>
      <div className="nut-trk-block-head">
        <h3 id={`${uid}-t`} className="nut-trk-block-title">
          Plantillas de menú
        </h3>
        <p className="nut-trk-block-sub">Copian los platos, sus fotos y sus ingredientes.</p>
      </div>

      <form className="nut-trk-card nut-tpl-form" onSubmit={save} noValidate aria-labelledby={`${uid}-ft`}>
        <h4 id={`${uid}-ft`} className="nut-trk-form-title">
          Guardar el menú de {athleteName} como plantilla
        </h4>
        <div className="segmented segmented--block nut-tpl-seg" role="group" aria-label="Qué guardar">
          <button type="button" aria-pressed={kind === "day"} onClick={() => changeKind("day")}>
            Un día
          </button>
          <button type="button" aria-pressed={kind === "week"} onClick={() => changeKind("week")}>
            Una semana
          </button>
        </div>
        <div className="nut-trk-fields nut-tpl-fields">
          <label className="nut-trk-field">
            <span className="nut-trk-field-label">{kind === "week" ? "Semana del lunes" : "Día"}</span>
            <input
              type="date"
              value={from}
              required
              onChange={(e) => {
                const v = e.target.value;
                setFrom(kind === "week" && v ? startOfWeekMonday(v) : v);
                setSaveMsg(null);
              }}
            />
          </label>
          <label className="nut-trk-field">
            <span className="nut-trk-field-label">Nombre</span>
            <input
              type="text"
              value={name}
              maxLength={120}
              autoComplete="off"
              placeholder={kind === "week" ? "Semana de partido" : "Día de partido"}
              onChange={(e) => {
                setName(e.target.value);
                setSaveMsg(null);
              }}
            />
          </label>
        </div>
        <fieldset className="nut-tpl-md">
          <legend className="nut-trk-field-label">Tipo de día</legend>
          <div className="nut-tpl-chips">
            {MD_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className="nut-tpl-chip"
                aria-pressed={mdTag === tag}
                onClick={() => setMdTag((cur) => (cur === tag ? null : tag))}
              >
                {tag}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="nut-trk-form-actions">
          <button type="submit" className="btn" aria-busy={saving || undefined} disabled={saving}>
            {saving ? "Guardando…" : "Guardar plantilla"}
          </button>
        </div>
        <Status text={saveMsg?.text ?? null} error={saveMsg?.error} />
      </form>

      {templates.length ? (
        <ul className="list-group nut-tpl-list">
          {templates.map((t) => (
            <li key={t.id} className="nut-tpl-row">
              <div className="nut-tpl-row-main">
                <div className="nut-tpl-row-body">
                  <span className="nut-tpl-row-name">{t.name}</span>
                  <span className="nut-trk-meta">{templateMeta(t)}</span>
                </div>
                {confirmId === t.id ? (
                  <div className="nut-trk-record-actions">
                    <button type="button" className="btn btn--plain" onClick={() => setConfirmId(null)}>
                      Cancelar
                    </button>
                    <button type="button" className="btn btn--danger" onClick={() => remove(t)}>
                      Borrar
                    </button>
                  </div>
                ) : (
                  <div className="nut-trk-record-actions">
                    <button
                      type="button"
                      className="btn btn--plain"
                      aria-expanded={applyId === t.id}
                      aria-controls={`${uid}-a-${t.id}`}
                      onClick={() => (applyId === t.id ? setApplyId(null) : openApply(t))}
                    >
                      Aplicar
                    </button>
                    <button
                      type="button"
                      className="btn btn--plain nut-trk-delete"
                      aria-label={`Borrar plantilla ${t.name}`}
                      onClick={() => setConfirmId(t.id)}
                    >
                      Borrar
                    </button>
                  </div>
                )}
              </div>
              {applyId === t.id ? (
                <div id={`${uid}-a-${t.id}`} className="nut-tpl-apply">
                  <label className="nut-trk-field">
                    <span className="nut-trk-field-label">{t.kind === "week" ? "Aplicar a la semana del lunes" : "Aplicar al día"}</span>
                    <input
                      type="date"
                      value={applyStart}
                      onChange={(e) => {
                        const v = e.target.value;
                        setApplyStart(t.kind === "week" && v ? startOfWeekMonday(v) : v);
                      }}
                    />
                  </label>
                  <label className="toggle-row nut-tpl-toggle">
                    <span>
                      Sustituir los platos que ya haya
                      <small>Si no, solo rellena las franjas vacías.</small>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      className="toggle"
                      checked={overwrite}
                      onChange={(e) => setOverwrite(e.target.checked)}
                    />
                  </label>
                  <div className="nut-trk-form-actions">
                    <button type="button" className="btn btn--plain" onClick={() => setApplyId(null)}>
                      Cancelar
                    </button>
                    <button type="button" className="btn" aria-busy={applying || undefined} disabled={applying} onClick={() => apply(t)}>
                      {applying ? "Aplicando…" : t.kind === "week" ? `Aplicar desde el ${dayDate(applyStart)}` : `Aplicar el ${dayDate(applyStart)}`}
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="nut-trk-none">Aún no hay plantillas. Guarda una semana que te guste para repetirla.</p>
      )}
      <Status text={listMsg?.text ?? null} error={listMsg?.error} />
    </section>
  );
}

/* —— Mis platos —— */

function DishesBlock({ initial }: { initial: Dish[] }) {
  const uid = useId();
  const [dishes, setDishes] = useState(initial);
  const [q, setQ] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const shown = useMemo(() => {
    const t = q.trim().toLocaleLowerCase("es");
    if (!t) return dishes;
    return dishes.filter((d) => `${d.name} ${d.preparation ?? ""}`.toLocaleLowerCase("es").includes(t));
  }, [dishes, q]);

  async function remove(d: Dish) {
    setConfirmId(null);
    const r = await send(`/api/nutrition/templates/dishes/${d.id}`, "DELETE");
    if (!r.ok) return setMsg({ text: r.message, error: true });
    setDishes((list) => list.filter((x) => x.id !== d.id));
    setMsg({ text: `«${d.name}» borrado de tus platos.` });
  }

  return (
    <section className="nut-trk-block" aria-labelledby={`${uid}-t`}>
      <div className="nut-trk-block-head">
        <h3 id={`${uid}-t`} className="nut-trk-block-title">
          Mis platos
        </h3>
        <p className="nut-trk-block-sub">
          Se guardan desde el menú con «Guardar en mis platos» y se reutilizan al crear uno nuevo con «Buscar en mis platos».
        </p>
      </div>
      {dishes.length ? (
        <>
          <label className="nut-trk-field nut-tpl-search">
            <span className="sr-only">Buscar en mis platos</span>
            <input type="search" value={q} placeholder="Buscar en mis platos" autoComplete="off" onChange={(e) => setQ(e.target.value)} />
          </label>
          {shown.length ? (
            <ul className="list-group nut-tpl-list">
              {shown.map((d) => (
                <li key={d.id} className="nut-tpl-row">
                  <div className="nut-tpl-row-main">
                    {d.hasPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="nut-tpl-thumb" src={`/api/nutrition/templates/dishes/${d.id}/photo?v=${encodeURIComponent(d.updatedAt)}`} alt="" />
                    ) : (
                      <span className="nut-tpl-thumb nut-tpl-thumb--empty" aria-hidden="true" />
                    )}
                    <div className="nut-tpl-row-body">
                      <span className="nut-tpl-row-name">{d.name}</span>
                      <span className="nut-trk-meta">
                        {[slotLabel(d.slot), d.items.length ? plural(d.items.length, "ingrediente", "ingredientes") : "Sin ingredientes"]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {d.items.length ? (
                        <span className="nut-trk-meta nut-tpl-ingr">
                          {d.items.map((it) => (it.grams != null ? `${it.text} (${fmtNum(it.grams, 0)} g)` : it.text)).join(", ")}
                        </span>
                      ) : null}
                    </div>
                    <div className="nut-trk-record-actions">
                      {confirmId === d.id ? (
                        <>
                          <button type="button" className="btn btn--plain" onClick={() => setConfirmId(null)}>
                            Cancelar
                          </button>
                          <button type="button" className="btn btn--danger" onClick={() => remove(d)}>
                            Borrar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--plain nut-trk-delete"
                          aria-label={`Borrar ${d.name} de mis platos`}
                          onClick={() => setConfirmId(d.id)}
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="nut-trk-none">Ningún plato coincide con «{q.trim()}».</p>
          )}
        </>
      ) : (
        <p className="nut-trk-none">Aún no hay platos guardados. Abre un plato del menú y pulsa «Guardar en mis platos».</p>
      )}
      <Status text={msg?.text ?? null} error={msg?.error} />
    </section>
  );
}

/* —— Sustituciones —— */

function SwapsBlock({ initial, foods }: { initial: FoodSwap[]; foods: FoodOption[] }) {
  const uid = useId();
  const [swaps, setSwaps] = useState(initial);
  const [foodId, setFoodId] = useState("");
  const [swapFoodId, setSwapFoodId] = useState("");
  const [grams, setGrams] = useState("100");
  const [reverse, setReverse] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const nameOf = (id: string) => foods.find((f) => f.id === id)?.name ?? "";

  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const g = Number(grams.trim().replace(",", "."));
    if (!foodId || !swapFoodId) return setMsg({ text: "Elige los dos alimentos.", error: true });
    if (foodId === swapFoodId) return setMsg({ text: "Elige dos alimentos distintos.", error: true });
    if (!Number.isFinite(g) || g <= 0) return setMsg({ text: "Escribe los gramos del sustituto (p. ej. 120).", error: true });
    setSaving(true);
    setMsg(null);
    const r = await send("/api/nutrition/templates/swaps", "POST", { foodId, swapFoodId, ratio: g / 100, reverse });
    setSaving(false);
    if (!r.ok) return setMsg({ text: r.message === "Datos inválidos" ? "La equivalencia está fuera de rango." : r.message, error: true });
    setSwaps(r.data);
    setMsg({ text: `Aprobado: 100 g de ${nameOf(foodId)} = ${fmtNum(g, 0)} g de ${nameOf(swapFoodId)}.` });
    setSwapFoodId("");
    setGrams("100");
  }

  async function remove(s: FoodSwap) {
    setConfirmId(null);
    const r = await send(`/api/nutrition/templates/swaps/${s.id}`, "DELETE");
    if (!r.ok) return setMsg({ text: r.message, error: true });
    setSwaps(r.data);
    setMsg({ text: `Sustitución de ${s.foodName} por ${s.swapFoodName} retirada.` });
  }

  return (
    <section className="nut-trk-block" aria-labelledby={`${uid}-t`}>
      <div className="nut-trk-block-head">
        <h3 id={`${uid}-t`} className="nut-trk-block-title">
          Sustituciones aprobadas
        </h3>
        <p className="nut-trk-block-sub">
          El jugador verá «Cambiar» en ese ingrediente, con los gramos recalculados. Solo las que apruebes aquí.
        </p>
      </div>
      <form className="nut-trk-card nut-tpl-form" onSubmit={save} noValidate aria-labelledby={`${uid}-ft`}>
        <h4 id={`${uid}-ft`} className="nut-trk-form-title">
          Nueva sustitución
        </h4>
        <div className="nut-trk-fields nut-tpl-swap-fields">
          <label className="nut-trk-field">
            <span className="nut-trk-field-label">100 g de</span>
            <select value={foodId} onChange={(e) => (setFoodId(e.target.value), setMsg(null))}>
              <option value="">Elige alimento</option>
              {foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="nut-trk-field">
            <span className="nut-trk-field-label">Equivalen a</span>
            <span className="nut-trk-input-unit">
              <input type="text" inputMode="decimal" value={grams} autoComplete="off" onChange={(e) => (setGrams(e.target.value), setMsg(null))} />
              <span aria-hidden="true">g</span>
            </span>
          </label>
          <label className="nut-trk-field">
            <span className="nut-trk-field-label">De</span>
            <select value={swapFoodId} onChange={(e) => (setSwapFoodId(e.target.value), setMsg(null))}>
              <option value="">Elige sustituto</option>
              {foods
                .filter((f) => f.id !== foodId)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <label className="toggle-row nut-tpl-toggle">
          <span>
            También al revés
            <small>Aprueba a la vez el cambio contrario, con la misma equivalencia.</small>
          </span>
          <input type="checkbox" role="switch" className="toggle" checked={reverse} onChange={(e) => setReverse(e.target.checked)} />
        </label>
        <div className="nut-trk-form-actions">
          <button type="submit" className="btn" aria-busy={saving || undefined} disabled={saving}>
            {saving ? "Guardando…" : "Aprobar sustitución"}
          </button>
        </div>
      </form>
      {swaps.length ? (
        <ul className="list-group nut-tpl-list">
          {swaps.map((s) => (
            <li key={s.id} className="nut-tpl-row">
              <div className="nut-tpl-row-main">
                <div className="nut-tpl-row-body">
                  <span className="nut-tpl-row-name">
                    {s.foodName} → {s.swapFoodName}
                  </span>
                  <span className="nut-trk-meta">100 g = {fmtNum(s.ratio * 100, 0)} g</span>
                </div>
                <div className="nut-trk-record-actions">
                  {confirmId === s.id ? (
                    <>
                      <button type="button" className="btn btn--plain" onClick={() => setConfirmId(null)}>
                        Cancelar
                      </button>
                      <button type="button" className="btn btn--danger" onClick={() => remove(s)}>
                        Retirar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--plain nut-trk-delete"
                      aria-label={`Retirar sustitución de ${s.foodName} por ${s.swapFoodName}`}
                      onClick={() => setConfirmId(s.id)}
                    >
                      Retirar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="nut-trk-none">Aún no hay sustituciones aprobadas.</p>
      )}
      <Status text={msg?.text ?? null} error={msg?.error} />
    </section>
  );
}

export function PlantillasPanel(props: {
  athleteId: string;
  athleteName: string;
  today: string;
  thisMonday: string;
  nextMonday: string;
  initialTemplates: MenuTemplate[];
  initialDishes: Dish[];
  initialSwaps: FoodSwap[];
  foods: FoodOption[];
}) {
  return (
    <>
      <TemplatesBlock
        athleteId={props.athleteId}
        athleteName={props.athleteName}
        today={props.today}
        thisMonday={props.thisMonday}
        nextMonday={props.nextMonday}
        initial={props.initialTemplates}
      />
      <DishesBlock initial={props.initialDishes} />
      <SwapsBlock initial={props.initialSwaps} foods={props.foods} />
    </>
  );
}
