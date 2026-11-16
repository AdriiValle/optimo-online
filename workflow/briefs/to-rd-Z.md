# rd-Z - AuditorÃ­a integral final (Opus piensa, no edita)

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Opus piensa; NO edites cÃ³digo. Haz el recorrido integral de plantillas-rediseno.md secciÃ³n 3 con los tres roles (jugador, admin, Amanda) y las funciones nuevas de nutriciÃ³n (Hoy, Semana, Compra, check de comidas, Alimentos, perfil ampliado, seguimiento, plantillas, informes, perfil editable por admin). Comprueba que no se perdiÃ³ ninguna funciÃ³n, que el estilo Apple es coherente en toda la app, que no hay scroll horizontal ni errores de consola nuevos. Escribe workflow/briefs/arreglos-finales.md: lista numerada y priorizada (solo bloqueantes y incoherencias claras), y para cada arreglo: archivo exacto, quÃ© cambiar con precisiÃ³n (de forma que un modelo mÃ¡s simple pueda ejecutarlo sin decidir), y cÃ³mo verificarlo. Si no hay nada que arreglar, dilo.

## Archivos
- SI (solo estos): `workflow/briefs/arreglos-finales.md`
- NO: todo el cÃ³digo (esta tarea solo escribe la lista de arreglos). Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- arreglos-finales.md existe, estÃ¡ priorizada y cada arreglo es ejecutable sin ambigÃ¼edad.
- El recorrido de funciones se ha hecho con los tres roles y queda resumido en la lista.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-Z/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-Z`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-Z/`.

## Al terminar
Escribe `workflow/briefs/from-rd-Z.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
