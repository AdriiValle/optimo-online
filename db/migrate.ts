import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadLocalEnv } from "./env";
import { unpooledSql } from "../lib/db";

loadLocalEnv();

async function main() {
  const client = unpooledSql();
  const schema = readFileSync(resolve(process.cwd(), "db/schema.sql"), "utf8");
  await client.unsafe(schema);
  await client.end();
  console.log("migrate ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
