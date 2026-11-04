import { isDeepStrictEqual } from "node:util";
import { parseIndexHtml } from "../lib/html-parse";
import { buildDayPlans } from "../lib/plan";
import { planData } from "../lib/plan-data";

// Uso: npm run plan:parity — plan-data (TS/JSON) vs parse del HTML de backup, por fecha.
const fromData = buildDayPlans(planData);
const fromHtml = new Map(buildDayPlans(parseIndexHtml()).map((p) => [p.date, p]));

let same = 0;
let firstDiff: string | null = null;
for (const plan of fromData) {
  const other = fromHtml.get(plan.date);
  if (other && isDeepStrictEqual(plan, other)) same += 1;
  else if (!firstDiff) {
    firstDiff = `${plan.date}\n  plan-data: ${JSON.stringify(plan)}\n  html:      ${JSON.stringify(other)}`;
  }
}
const total = Math.max(fromData.length, fromHtml.size);
if (fromData.length !== fromHtml.size && !firstDiff) {
  firstDiff = `distinto nº de días: plan-data ${fromData.length}, html ${fromHtml.size}`;
}

console.log(`plan-parity: ${same}/${total} iguales`);
if (firstDiff) {
  console.error(`primera diferencia: ${firstDiff}`);
  process.exit(1);
}
