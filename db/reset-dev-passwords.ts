import bcrypt from "bcryptjs";
import { loadLocalEnv } from "./env";
import { unpooledSql } from "../lib/db";

loadLocalEnv();

const TARGET = "123456789";
const LOGINS = ["adriivalle", "ricardovisus"];

async function main() {
  const hash = await bcrypt.hash(TARGET, 12);
  const client = unpooledSql();
  await client.begin(async (tx) => {
    await tx`select set_config('app.current_role', 'admin', true)`;
    for (const login of LOGINS) {
      const rows = await tx<{ id: string }[]>`
        update accounts set password_hash = ${hash}
        where email = ${login}
        returning id
      `;
      if (!rows[0]) console.warn(`skip: ${login} not found`);
      else console.log(`password reset: ${login}`);
    }
  });
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
