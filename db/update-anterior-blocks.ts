import { loadLocalEnv } from "./env";
import { unpooledSql } from "../lib/db";
import { parseIndexHtml } from "../lib/html-parse";
import { buildDayPlans } from "../lib/plan";

loadLocalEnv();

async function main() {
  const parsed = parseIndexHtml();
  const dates = parsed.anteriorFuerzaV2;
  const plans = buildDayPlans(parsed).filter((p) => dates.includes(p.date));
  if (plans.length !== dates.length) {
    throw new Error(`update-anterior: esperaba ${dates.length} días (${dates.join(", ")}), hay ${plans.length}`);
  }

  const client = unpooledSql();
  await client.begin(async (tx) => {
    await tx`select set_config('app.current_role', 'admin', true)`;
    const athleteRows = await tx<{ id: string }[]>`select id from athletes where name = 'Ricardo Visus'`;
    if (athleteRows.length !== 1) throw new Error(`update-anterior: atleta Ricardo Visus: ${athleteRows.length} filas`);
    const athleteId = athleteRows[0].id;

    for (const plan of plans) {
      const res = await tx`
        update day_plans set blocks = ${tx.json(plan.blocks)}
        where athlete_id = ${athleteId} and date = ${plan.date}::date
      `;
      if (res.count !== 1) throw new Error(`update-anterior: ${plan.date} actualizó ${res.count} filas`);
    }
  });

  await client.end();
  console.log(`update-anterior ok · ${plans.map((p) => p.date).join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
