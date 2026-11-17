import { loadLocalEnv } from "./env";
import { unpooledSql } from "../lib/db";
import { planData } from "../lib/plan-data";
import { buildDayPlans } from "../lib/plan";

loadLocalEnv();

// Semana 16-22 nov (partido domingo 22): lunes libre; anterior MD-5 → martes, MD-4 → miércoles, posterior MD-3 → jueves.
// Uso: tsx db/upsert-semana-16-nov.ts           (simulación)
//      tsx db/upsert-semana-16-nov.ts --apply   (graba)
const FROM = "2026-11-16";
const TO = "2026-11-22";
const apply = process.argv.includes("--apply");

async function main() {
  const plans = buildDayPlans(planData).filter((p) => p.date >= FROM && p.date <= TO);
  if (plans.length !== 7) throw new Error(`semana-16-nov: esperaba 7 días, hay ${plans.length}`);
  for (const p of plans) {
    console.log(`\n${p.date} · ${p.mdTag} · ${p.title} · ${p.minutes ?? "-"} min`);
    for (const b of p.blocks) console.log(`   ${b.kind}: ${"title" in b ? b.title : "label" in b ? b.label : "text" in b ? b.text : ""}`);
  }
  if (!apply) return console.log("\n(simulación: nada grabado; usa --apply)");

  const client = unpooledSql();
  await client.begin(async (tx) => {
    await tx`select set_config('app.current_role', 'admin', true)`;
    const rows = await tx<{ id: string }[]>`select id from athletes where name = 'Ricardo Visus'`;
    if (rows.length !== 1) throw new Error(`semana-16-nov: atleta Ricardo Visus: ${rows.length} filas`);
    const athleteId = rows[0].id;
    for (const p of plans) {
      await tx`
        insert into day_plans (athlete_id, date, md_tag, title, minutes, blocks, match_opponent, match_venue, match_time, match_competition)
        values (${athleteId}, ${p.date}::date, ${p.mdTag}, ${p.title}, ${p.minutes}, ${tx.json(p.blocks)},
                ${p.matchOpponent}, ${p.matchVenue}, ${p.matchTime}, ${p.matchCompetition})
        on conflict (athlete_id, date) do update set
          md_tag = excluded.md_tag, title = excluded.title, minutes = excluded.minutes, blocks = excluded.blocks,
          match_opponent = excluded.match_opponent, match_venue = excluded.match_venue,
          match_time = excluded.match_time, match_competition = excluded.match_competition
      `;
      console.log(`grabado ${p.date}`);
    }
  });
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
