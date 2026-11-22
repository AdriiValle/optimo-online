# Session

Escrito: 2026-11-22 (calendario MD y semana 23-28 nov, subido a main)

Objetivo: etiquetas MD según el día del partido y rutinas de la semana corta 23-28 nov.
Hecho: day_plans regrabado 23-27 nov (23 MD+1, 24 MD+2, 25-27 MD-3/-2/-1; las 241 fechas coinciden con `MATCHES`); script `db/sync-md-calendario.ts <desde> <hasta> [--apply]`. MD+1 que no cae en domingo = rutina básica (base + 3 activaciones). MD+2 = base + activación aductores (básica + complementaria 2) + bloque «Cadera y glúteo» (6 ejercicios `md2-*`, sin vídeo aún) = 27 min. Sauna 23-25. Mié 25 MD-3 = cadena anterior v2; jue 26 MD-2 = base + tobillo + isquios básica y complementaria 1 + sled push.
Siguiente: rutina habitual de MD-3 (palancas largas en plano frontal, Copenhague y glúteo excéntrico con giros): falta la lista de ejercicios de Adrián. Dudas: «aducción de feedback» (ej. 5 del MD+2) y vídeos de los `md2-*`.

---- (anterior) ----

Escrito: 2026-11-19 18:30 (velocidad k6, cerrado)

Objetivo: velocidad con k6 en 2 rondas (local + Vercel) y arreglar dominio/móvil. Plan: `briefs/plan-velocidad-k6.md`.
Hecho: región fra1 (antes iad1 con Neon en Frankfurt), `set_config` encadenado en `lib/rls.ts`, lecturas en tx paralelas, compra sin consulta extra, `loading.tsx`. En main (b765854) y desplegado. Vercel p95 de documento 1748 → 216 ms (checks 100 %). Informes: `briefs/k6-ronda1.md`, `k6-ronda2.md`.
Dominio: `AUTH_URL` = app.optimosport.com (lo cambió Adrián); el host viejo optimo-online.vercel.app servía el deploy del 5-nov; Adrián dice que quitó sus referencias. El móvil: borrar icono y datos del sitio y volver a entrar por app.optimosport.com.
Carpeta: desde el 19-nov el repo está en `Optimo\Entrenamientos online` (antes `…\Ricardo Visus`).
Siguiente: arranques en frío en Vercel (primera petición 600-780 ms); `prepare: true` descartado (riesgo con migraciones dentro de tx). Lo anterior: perfil de Amanda (`npm run db:migrate`), peso del deportista.

---- (anterior) ----

Escrito: 2026-11-17 13:00

Objetivo: semana 16-22 nov de Ricardo Visus (partido pasa al domingo 22), sauna como tarjeta, jueves de isquios con más carga, paleta sin azul.

Rama: `dev` → `main` (subido tras OK de Adrián el 17-nov)

Local: http://localhost:3001 · Prod: https://optimo-online.vercel.app y https://app.optimosport.com

## Hecho (17-nov)

- Partido Raków → domingo 22 (`MATCHES`); etiquetas: mar MD-5 anterior, mié MD-4 campo, jue MD-3 posterior, vie MD-2 con sled push, sáb MD-1, dom MD. Grabado con `db/upsert-semana-16-nov.ts --apply` (ahora cubre 16-22).
- Sauna: tarjeta propia bajo la cabecera del día (fuera de la lista de sesión); los minutos solo cuentan entreno. Días con sauna: 16, 17, 18 (`SAUNA_DAYS`).
- Jueves 19: hip thrust barra 60 kg, unilateral con mancuernas de 12,5 kg, salidas a cajón 2 series; sin trineo (pasa al viernes).
- Paleta: `--accent*` en `tokens.css` pasa de azul a negro/gris.

## Siguiente

- Perfil deportista de Amanda: falta `npm run db:migrate` (`nutritionist_set_athlete_profile`) y mostrarlo en admin.
- Falta el peso del deportista (g/kg), desayuno/media mañana/merienda sin platos, 23 ingredientes sin alimento del catálogo.
- Acceso Amanda: ver `secrets.local.md`.
