# Session

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
