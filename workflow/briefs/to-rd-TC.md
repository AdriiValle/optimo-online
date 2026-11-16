# rd-TC - Transversal común: motion, accesibilidad y consistencia de hojas base

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Revisión transversal de tokens.css, base.css, components.css, shell.css y a11y.css: movimiento coherente (springs/duraciones de tokens), reduced-motion/transparency/contrast sin contradicciones entre hojas (revisa las reglas de preferencia al final de cada hoja), foco visible, tamaños en rem para Dynamic Type razonable, elimina CSS muerto en estas hojas y valores sueltos que no salgan de tokens.

## Archivos
- SI (solo estos): `app/styles/tokens.css`, `app/styles/base.css`, `app/styles/components.css`, `app/styles/shell.css`, `app/styles/a11y.css`
- NO: todo lo demas. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Con prefers-reduced-motion/transparency/contrast emulados (CDP o media), las pantallas clave siguen usables y sin movimiento.
- Foco visible con Tab en login, jugador, admin y Amanda.
- No hay valores de color/radio/sombra/duración fuera de tokens en estas hojas.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-TC/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-TC`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-TC/`.

## Al terminar
Escribe `workflow/briefs/from-rd-TC.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
