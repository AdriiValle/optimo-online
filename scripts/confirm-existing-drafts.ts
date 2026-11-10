import { loadLocalEnv } from "../db/env";
import { unpooledSql } from "../lib/db";

loadLocalEnv();

// Confirma los ingredientes que se quedaron en borrador (no confirmados) y son del texto vigente del plato.
// Por defecto solo cuenta (dry-run). Con --apply escribe. Los obsoletos (otro text_hash) no se tocan.
const apply = process.argv.includes("--apply");

async function main() {
  const client = unpooledSql();
  await client.begin(async (tx) => {
    await tx`select set_config('app.current_role', 'admin', true)`;
    const [{ n }] = await tx<{ n: number }[]>`
      select count(*)::int as n from meal_items mi
      join meal_slots ms on ms.id = mi.meal_slot_id
      where not mi.confirmed and mi.text_hash = ms.items_text_hash
    `;
    console.log(`${n} ingredientes en borrador del texto vigente.`);
    if (!apply) {
      console.log("Dry-run: usa --apply para confirmarlos.");
      return;
    }
    const rows = await tx<{ id: string }[]>`
      update meal_items mi set confirmed = true
      from meal_slots ms
      where ms.id = mi.meal_slot_id and not mi.confirmed and mi.text_hash = ms.items_text_hash
      returning mi.id
    `;
    console.log(`Confirmados: ${rows.length}.`);
  });
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
