// P2 dominio/movil: solo GET. Uso: PW_PATH=<ruta a node_modules/playwright> node workflow/load/dominio-movil.cjs workflow/load/k6/tokens.json
// tokens.json lo genera workflow/load/k6/mint-tokens.mjs (gitignored, caduca en 1 h).
const { chromium, devices } = require(process.env.PW_PATH);
const tokens = require(process.argv[2]);
const HOSTS = ["app.optimosport.com", "optimo-online.vercel.app"];
const PROFILES = { desktop: devices["Desktop Chrome"], mobile: devices["iPhone 13"] };

function summarizeCookies(cs) {
  return cs.map((c) => `${c.domain} ${c.name}`).sort();
}

async function run(browser, profile, startHost, path, sessionHost, role) {
  const ctx = await browser.newContext({ ...PROFILES[profile] });
  if (sessionHost) {
    await ctx.addCookies([{ name: "__Secure-authjs.session-token", value: tokens.roles[role].https, domain: sessionHost, path: "/", secure: true, httpOnly: true, sameSite: "Lax" }]);
  }
  const page = await ctx.newPage();
  const chain = [];
  page.on("response", (r) => {
    if (r.request().resourceType() === "document") {
      chain.push(`${r.status()} ${r.url()}${r.headers()["location"] ? " -> " + r.headers()["location"] : ""} [${r.headers()["x-vercel-id"] ?? ""}]`);
    }
  });
  await page.goto(`https://${startHost}${path}`, { waitUntil: "domcontentloaded" });
  const html = await page.content();
  const build = (html.match(/\/_next\/static\/chunks\/(webpack|main-app)-[a-f0-9]+\.js/) || [""])[0];
  const buildId = (html.match(/"buildId":"([^"]+)"|\\"b\\":\\"([^\\"]+)\\"/) || []).slice(1).find(Boolean) || "";
  const manifest = await page.$eval('link[rel="manifest"]', (e) => e.href).catch(() => "(no manifest)");
  const touch = await page.$eval('link[rel="apple-touch-icon"]', (e) => e.href).catch(() => "(no apple-touch-icon)");
  const sw = await page.evaluate(async () => (navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : "n/a"));
  // segunda carga (con caché del navegador)
  const reload = await page.reload({ waitUntil: "domcontentloaded" });
  const out = {
    profile, start: `https://${startHost}${path}`, session: sessionHost ? `${role}@${sessionHost}` : "ninguna",
    chain, finalUrl: page.url(), buildId, chunk: build, manifest, touch, serviceWorkers: sw,
    reload: `${reload.status()} cache-control=${reload.headers()["cache-control"]} x-vercel-cache=${reload.headers()["x-vercel-cache"] ?? "-"}`,
    cookies: summarizeCookies(await ctx.cookies()),
  };
  await ctx.close();
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const profile of Object.keys(PROFILES)) {
    for (const h of HOSTS) results.push(await run(browser, profile, h, "/", null));
    // sesión solo en vercel.app, entra por el dominio
    results.push(await run(browser, profile, "app.optimosport.com", "/", "optimo-online.vercel.app", "athlete"));
    // sesión solo en el dominio, entra por el dominio
    results.push(await run(browser, profile, "app.optimosport.com", "/", "app.optimosport.com", "athlete"));
    // sesión en el dominio, ruta que redirige en middleware (/ajustes admin -> /panel/ajustes)
    results.push(await run(browser, profile, "app.optimosport.com", "/ajustes", "app.optimosport.com", "admin"));
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
