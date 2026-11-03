import { loadLocalEnv } from "./env";
import { unpooledSql } from "../lib/db";
import { parseIndexHtml } from "../lib/html-parse";
import type { DayPlanBlock } from "../lib/types";

loadLocalEnv();

async function main() {
  const protocols = parseIndexHtml().protocols;

  const client = unpooledSql();
  let changed = 0;
  let total = 0;
  await client.begin(async (tx) => {
    await tx`select set_config('app.current_role', 'admin', true)`;
    const rows = await tx<{ id: string; blocks: DayPlanBlock[] }[]>`select id, blocks from day_plans`;
    total = rows.length;

    for (const row of rows) {
      let dirty = false;
      const blocks = row.blocks.map((b) => {
        if (b.kind !== "protocol") return b;
        const p = protocols[b.protocolId];
        if (!p) return b;
        const next = {
          ...b,
          label: p.label,
          qty: p.qty ?? null,
          info: p.info ?? null,
          video: p.video ?? null,
          blurb: p.blurb ?? null
        };
        if (
          next.label === b.label &&
          next.qty === (b.qty ?? null) &&
          next.info === (b.info ?? null) &&
          next.video === b.video &&
          next.blurb === (b.blurb ?? null)
        ) {
          return b;
        }
        dirty = true;
        return next;
      });
      if (!dirty) continue;
      const res = await tx`update day_plans set blocks = ${tx.json(blocks)} where id = ${row.id}`;
      if (res.count !== 1) throw new Error(`sync-videos: ${row.id} actualizó ${res.count} filas`);
      changed += 1;
    }
  });

  await client.end();
  console.log(`sync-videos ok · ${changed} de ${total} filas cambiadas`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
