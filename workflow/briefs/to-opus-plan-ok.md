Revisa y ancla este plan de producto. Reescribe el plan en el mismo archivo si hace falta (más/menos trozos, paralelo solo si no se pisan archivos). No toques código.

Plan: `workflow/briefs/plan-ajustes.md`

Contexto: app Next.js deportistas Óptimo (rama `dev`, local :3055). Auth en `lib/auth.ts` (Credentials + JWT). Login en `app/login/page.tsx`. Jugador en `/a/[id]` con header «Salir»; admin en `/panel` con «Añadir». Foto vía `POST /api/athletes/[id]/photo`. RLS: atleta puede UPDATE su fila en `athletes`; contraseña en `accounts` solo escribible por admin salvo que el plan proponga función/API segura.

Pedido Adrián: **Ajustes** (jugador: contraseña, foto, nombre + sesión persistente PWA) y **Ajustes admin** en panel (gestión accesos/cuentas, reset contraseñas, lo razonable). Cerrar app en este slice sin romper Registro/Molestias/Análisis/Nutrición.

Lee también `workflow/handshake.md`, `workflow/session.md`, y el código auth citado en el plan.

Al terminar: deja el plan listo para oleadas y escribe `workflow/briefs/from-opus-plan-ok.md` con visto bueno, trozos/oleadas, riesgos y recomendación de orden de commits.
