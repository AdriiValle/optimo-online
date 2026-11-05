import { loadLocalEnv } from "./env";
import { unpooledSql } from "../lib/db";
import { planData } from "../lib/plan-data";
import { buildDayPlans } from "../lib/plan";

loadLocalEnv();

const FROM = "2026-11-08";
const TO = "2026-11-15";

async function main() {
  const plans = buildDayPlans(planData).filter((p) => p.date >= FROM && p.date <= TO);
  if (plans.length !== 8) throw new Error(`semana-paron: esperaba 8 días, hay ${plans.length}`);

  const all = buildDayPlans(planData);
  const protocolIds = (iso: string) =>
    JSON.stringify(all.find((p) => p.date === iso)?.blocks.flatMap((b) => (b.kind === "protocol" ? [b.protocolId] : [])));
  const same = protocolIds("2026-11-12") === protocolIds("2026-11-03");
  console.log(`ids protocolo 12 == 3: ${same}`);
  if (!same) throw new Error("semana-paron: ids del 12 difieren del 3");

  const client = unpooledSql();
  await client.begin(async (tx) => {
    await tx`select set_config('app.current_role', 'admin', true)`;
    const rows = await tx<{ id: string }[]>`select id from athletes where name = 'Ricardo Visus'`;
    if (rows.length !== 1) throw new Error(`semana-paron: atleta Ricardo Visus: ${rows.length} filas`);
    const athleteId = rows[0].id;

    for (const p of plans) {
      const res = await tx<{ inserted: boolean }[]>`
        insert into day_plans (
          athlete_id, date, md_tag, title, minutes, blocks,
          match_opponent, match_venue, match_time, match_competition
        ) values (
          ${athleteId}, ${p.date}::date, ${p.mdTag}, ${p.title}, ${p.minutes}, ${tx.json(p.blocks)},
          ${p.matchOpponent}, ${p.matchVenue}, ${p.matchTime}, ${p.matchCompetition}
        )
        on conflict (athlete_id, date) do update set
          md_tag = excluded.md_tag, title = excluded.title, minutes = excluded.minutes,
          blocks = excluded.blocks, match_opponent = excluded.match_opponent,
          match_venue = excluded.match_venue, match_time = excluded.match_time,
          match_competition = excluded.match_competition
        returning (xmax = 0) as inserted
      `;
      console.log(`${p.date} ${res[0].inserted ? "insert" : "update"} · ${p.mdTag ?? "-"} · ${p.title}`);
    }
  });
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
