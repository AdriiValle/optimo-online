import bcrypt from "bcryptjs";
import { loadLocalEnv } from "./env";
import { unpooledSql } from "../lib/db";

loadLocalEnv();

// Idempotente: crea/actualiza la cuenta de Amanda y la deja asignada solo a Ricardo Visus.
const LOGIN = "amanda";
const PASSWORD = "123456789";
const ATHLETE_NAME = "Ricardo Visus";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);
  const client = unpooledSql();
  await client.begin(async (tx) => {
    await tx`select set_config('app.current_role', 'admin', true)`;
    const accounts = await tx<{ id: string }[]>`
      insert into accounts (email, password_hash, role)
      values (${LOGIN}, ${hash}, 'nutritionist')
      on conflict (email) do update set password_hash = excluded.password_hash
      where accounts.role::text = 'nutritionist'
      returning id
    `;
    if (!accounts[0]) throw new Error(`seed-nutritionist: ${LOGIN} existe con otro rol`);
    const accountId = accounts[0].id;

    const athletes = await tx<{ id: string }[]>`select id from athletes where name = ${ATHLETE_NAME}`;
    if (athletes.length !== 1) throw new Error(`seed-nutritionist: ${ATHLETE_NAME}: ${athletes.length} filas`);

    await tx`
      insert into nutritionist_athletes (nutritionist_account_id, athlete_id)
      values (${accountId}, ${athletes[0].id})
      on conflict do nothing
    `;
    console.log(`nutritionist ok: ${LOGIN} → ${ATHLETE_NAME}`);
  });
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
