import fs from "fs";
import { loadLocalEnv } from "../db/env";
import { unpooledSql } from "../lib/db";
import { withRls } from "../lib/rls";
import { importableWeeks, mealsFromImportWeeks, parseWordMenuTables } from "../lib/menu-import/parse-word-menu";
import { upsertMealSlot } from "../lib/queries";
import { startOfWeekMonday, todayKey } from "../lib/dates";

loadLocalEnv();

async function amandaAccountId() {
  const c = unpooledSql();
  const rows = await c.begin(async (tx) => {
    await tx`select set_config('app.current_role', 'admin', true)`;
    return tx<{ id: string }[]>`select id from accounts where email = 'amanda' limit 1`;
  });
  await c.end();
  if (!rows[0]) throw new Error("amanda account missing");
  return rows[0].id;
}

async function visusAthleteId() {
  const c = unpooledSql();
  const rows = await c.begin(async (tx) => {
    await tx`select set_config('app.current_role', 'admin', true)`;
    return tx<{ id: string }[]>`select id from athletes where name = 'Ricardo Visus' limit 1`;
  });
  await c.end();
  if (!rows[0]) throw new Error("Ricardo Visus missing");
  return rows[0].id;
}

async function main() {
  const buf = fs.readFileSync("C:/Users/SISTELIN/Downloads/EJEMPLO DE MENU.docx");
  const weeks = importableWeeks(await parseWordMenuTables(buf));
  const weekStart = startOfWeekMonday(todayKey());
  const rows = mealsFromImportWeeks(weeks, weekStart);
  const accountId = await amandaAccountId();
  const athleteId = await visusAthleteId();

  await withRls({ role: "nutritionist", accountId, athleteId: null }, async (tx) => {
    for (const row of rows) {
      await upsertMealSlot(tx, athleteId, row.date, row.slot, row.title, row.preparation);
    }
  });

  const monday = rows.filter((r) => r.date === weekStart);
  console.log(
    JSON.stringify(
      {
        weekStart,
        weeksImported: weeks.length,
        slotsWritten: rows.length,
        mondayLunch: monday.find((r) => r.slot === "lunch")?.title,
        mondayDinner: monday.find((r) => r.slot === "dinner")?.title
      },
      null,
      2
    )
  );
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
