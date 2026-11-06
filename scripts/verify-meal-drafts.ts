import { loadLocalEnv } from "../db/env";
import { unpooledSql } from "../lib/db";
import { generateMealItemDrafts } from "../lib/nutrition/generate-drafts";
import { mealSlotsForDrafts, upsertMealSlot } from "../lib/queries";
import { dayTypeFromMdTag } from "../lib/nutrition/day-type";

loadLocalEnv();

// Criterio O3 sobre la primera semana con menú, dentro de una transacción que se deshace al final:
// genera borradores; re-generar no duplica; cambiar un plato deja obsoletos sus confirmados y regenera.
const ROLLBACK = new Error("rollback");

async function main() {
  const client = unpooledSql();
  await client
    .begin(async (tx) => {
      await tx`select set_config('app.current_role', 'admin', true)`;
      const [first] = await tx<{ athlete_id: string; d: string }[]>`
        select athlete_id, min(date)::text as d from meal_slots group by athlete_id order by 2 limit 1
      `;
      if (!first) throw new Error("No hay meal_slots");
      const athleteId = first.athlete_id;
      const from = first.d;
      const to = (await tx<{ d: string }[]>`select (${from}::date + 6)::text as d`)[0].d;
      const count = async () =>
        (await tx<{ n: number }[]>`
          select count(*)::int as n from meal_items mi join meal_slots ms on ms.id = mi.meal_slot_id
          where ms.athlete_id = ${athleteId} and ms.date between ${from}::date and ${to}::date`)[0].n;
      const check = (ok: boolean, msg: string) => {
        console.log(`${ok ? "OK " : "FALLO"} ${msg}`);
        if (!ok) process.exitCode = 1;
      };

      const s1 = await generateMealItemDrafts(tx, athleteId, { from, to });
      const n1 = await count();
      console.log("1ª generación", s1);
      check(s1.slotsDrafted > 0 && n1 === s1.itemsCreated, `semana ${from}..${to}: ${n1} borradores`);

      const s2 = await generateMealItemDrafts(tx, athleteId, { from, to });
      check(s2.slotsUnchanged === s2.slotsSeen && (await count()) === n1, "re-generar sin cambios no duplica");

      const slots = await mealSlotsForDrafts(tx, athleteId, { from, to });
      const [a, b] = slots;
      const confirmed = await tx<{ id: string; grams: string | null }[]>`
        update meal_items set confirmed = true where meal_slot_id = ${a.id} returning id, grams::text`;
      await upsertMealSlot(tx, athleteId, a.date, a.slot, `${a.title} · Aguacate`, a.preparation && `${a.preparation} · Aguacate`);
      await upsertMealSlot(tx, athleteId, b.date, b.slot, `${b.title} · Nueces`, b.preparation && `${b.preparation} · Nueces`);
      const s3 = await generateMealItemDrafts(tx, athleteId, { ids: [a.id, b.id] });
      console.log("tras cambiar 2 platos", s3);

      const rows = await tx<{ meal_slot_id: string; id: string; confirmed: boolean; grams: string | null; obsolete: boolean }[]>`
        select mi.meal_slot_id, mi.id, mi.confirmed, mi.grams::text,
          mi.text_hash is distinct from md5(coalesce(nullif(ms.preparation, ''), ms.title)) as obsolete
        from meal_items mi join meal_slots ms on ms.id = mi.meal_slot_id where ms.id in (${a.id}, ${b.id})`;
      const aOld = rows.filter((r) => r.meal_slot_id === a.id && r.confirmed);
      check(
        aOld.length === confirmed.length &&
          aOld.every((r) => r.obsolete && confirmed.some((c) => c.id === r.id && c.grams === r.grams)),
        `plato cambiado: ${aOld.length} confirmados intactos y obsoletos`
      );
      check(rows.some((r) => r.meal_slot_id === a.id && !r.confirmed && !r.obsolete), "plato cambiado: borradores nuevos vigentes");
      check(rows.filter((r) => r.meal_slot_id === b.id).every((r) => !r.confirmed && !r.obsolete), "plato sin confirmar: borradores sustituidos");

      // Muestra de un día.
      const sample = await tx<{ date: string; slot: string; md_tag: string | null; raw_text: string; role: string; food: string | null; grams: string | null }[]>`
        select ms.date::text, ms.slot, dp.md_tag, mi.raw_text, mi.role, f.name_es as food, mi.grams::text
        from meal_items mi join meal_slots ms on ms.id = mi.meal_slot_id left join foods f on f.id = mi.food_id
        left join lateral (select md_tag from day_plans where athlete_id = ms.athlete_id and date = ms.date limit 1) dp on true
        where ms.id = ${slots[2].id} order by mi.position`;
      console.log(`\nMuestra ${sample[0]?.date} ${sample[0]?.slot} (${sample[0]?.md_tag} → ${dayTypeFromMdTag(sample[0]?.md_tag)})`);
      for (const r of sample) console.log(`  ${r.role.padEnd(7)} ${(r.grams ?? "—").padStart(4)} g  ${r.food ?? "(sin casar)"}  ← ${r.raw_text}`);
      const unmatched = await tx<{ n: number; total: number }[]>`
        select count(*) filter (where mi.food_id is null)::int as n, count(*)::int as total
        from meal_items mi join meal_slots ms on ms.id = mi.meal_slot_id
        where ms.athlete_id = ${athleteId} and ms.date between ${from}::date and ${to}::date and not mi.confirmed`;
      console.log(`\nSin casar: ${unmatched[0].n}/${unmatched[0].total}`);
      throw ROLLBACK;
    })
    .catch((e) => {
      if (e !== ROLLBACK) throw e;
    });
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
