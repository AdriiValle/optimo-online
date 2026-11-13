# rd-F1 - Sistema de diseño v2 basado en Apple

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Fijar la base Apple del rediseño. (1) Trae SOLO el DESIGN.md de Apple del catálogo getdesign.md (por raw/gh; busca la URL en https://getdesign.md/) y guárdalo como workflow/context/apple-DESIGN.md; lee la skill apple-design de Emil Kowalski (https://raw.githubusercontent.com/emilkowalski/skills/main/skills/apple-design/SKILL.md) solo para aplicarla; no clones repos ni dejes catálogos. (2) Regenera workflow/context/design-system.md v2: «Apple como base» + tabla Apple -> Óptimo con cada adaptación (qué se toma tal cual, qué cambia y por qué). Tokens nuevos completos: escala tipográfica (Large Title, Title 1-3, Headline, Body, Callout, Subhead, Footnote, Caption), radios, materiales (thin/regular/thick), elevación, color semántico (--danger/--ok/--warn y estados de anillo bajo/en rango/pasado/tope/parcial), espaciado 4/8, movimiento y springs, objetivos táctiles. DECISIONES YA TOMADAS (documéntalas): acento de marca = azul de sistema de Apple para lo interactivo (texto sigue en negro Apple); tipografía = stack SF (-apple-system, SF Pro) con Inter como respaldo servido con next/font para Windows/Android; tab bar inferior para el jugador; admin = toolbar + large title sin sidebar; Amanda conserva su columna de deportistas como sidebar; se conserva la paleta de categorías de proteína (carne/pescado/huevos/legumbres); modo oscuro NO entra ahora (los tokens se nombran por rol para poder añadirlo luego); el sistema nuevo sustituye la regla «paleta intacta»; se conserva el logo. Incluye reglas de prohibido (anti-slop), accesibilidad y layout por dispositivo (jugador móvil, admin escritorio, Amanda escritorio).

## Archivos
- SI (solo estos): `workflow/context/design-system.md`, `workflow/context/apple-DESIGN.md`
- NO: todo el código de la app (esta tarea solo escribe documentos). Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Existen workflow/context/apple-DESIGN.md (de Apple) y design-system.md v2 con tabla Apple -> Óptimo y todos los tokens listados con nombre y valor concretos (copiables a CSS).
- Las decisiones de acento, tipografía, tab bar, shell admin/Amanda, categorías de proteína y oscuro quedan escritas sin ambigüedad.
- Documento corto y operativo (no ensayo): un ejecutor puede pintar leyéndolo.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-F1/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-F1`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-F1/`.

## Al terminar
Escribe `workflow/briefs/from-rd-F1.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
