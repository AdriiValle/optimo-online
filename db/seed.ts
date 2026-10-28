import bcrypt from "bcryptjs";
import { loadLocalEnv } from "./env";
import { unpooledSql } from "../lib/db";
import { parseIndexHtml } from "../lib/html-parse";
import { buildDayPlans } from "../lib/plan";

loadLocalEnv();

function need(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

async function main() {
  const adminEmail = need("SEED_ADMIN_EMAIL").trim().toLowerCase();
  const athleteEmail = need("SEED_ATHLETE_EMAIL").trim().toLowerCase();
  const adminPassword = need("SEED_ADMIN_PASSWORD");
  const athletePassword = need("SEED_ATHLETE_PASSWORD");
  const parsed = parseIndexHtml();
  const plans = buildDayPlans(parsed);
  if (!plans.length) throw new Error("seed: no day plans from index.html");

  const client = unpooledSql();
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const athleteHash = await bcrypt.hash(athletePassword, 12);

  await client.begin(async (tx) => {
    await tx`select set_config('app.current_role', 'admin', true)`;

    const adminRows = await tx<{ id: string }[]>`
      insert into accounts (email, password_hash, role)
      values (${adminEmail}, ${adminHash}, 'admin')
      on conflict (email) do update set password_hash = excluded.password_hash, role = 'admin'
      returning id
    `;

    const athleteAccountRows = await tx<{ id: string }[]>`
      insert into accounts (email, password_hash, role)
      values (${athleteEmail}, ${athleteHash}, 'athlete')
      on conflict (email) do update set password_hash = excluded.password_hash, role = 'athlete'
      returning id
    `;

    const athleteAccountId = athleteAccountRows[0].id;
    const athleteRows = await tx<{ id: string }[]>`
      insert into athletes (account_id, name, sport, team, shirt_number)
      values (${athleteAccountId}, 'Ricardo Visus', 'football', 'Widzew', '14')
      on conflict (account_id) do update
        set name = excluded.name, sport = excluded.sport, team = excluded.team, shirt_number = excluded.shirt_number
      returning id
    `;
    const athleteId = athleteRows[0].id;

    await tx`
      insert into integrations (athlete_id, provider, status)
      values (${athleteId}, 'whoop', 'disconnected')
      on conflict (athlete_id, provider) do nothing
    `;

    await tx`delete from day_plans where athlete_id = ${athleteId}`;

    for (const plan of plans) {
      await tx`
        insert into day_plans (
          athlete_id, date, md_tag, title, minutes, blocks,
          match_opponent, match_venue, match_time, match_competition
        ) values (
          ${athleteId},
          ${plan.date}::date,
          ${plan.mdTag},
          ${plan.title},
          ${plan.minutes},
          ${tx.json(plan.blocks)},
          ${plan.matchOpponent},
          ${plan.matchVenue},
          ${plan.matchTime},
          ${plan.matchCompetition}
        )
      `;
    }

    void adminRows;
  });

  await client.end();
  console.log(`seed ok · ${plans.length} day plans from index.html`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
