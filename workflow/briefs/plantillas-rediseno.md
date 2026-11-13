# Plantillas del rediseño Apple

Para `plan-rediseno-apple.md`. El master copia, rellena los `<…>` y borra lo que no aplique.

## 1. Brief de ejecutor → `workflow/briefs/rd-<id>.md`

```md
# rd-<id> · <título corto>

Rama `feat/rediseno-apple`, cwd = repo, localhost:3001 ya levantado (no lo pares). Rol fuerte.
Lee solo: este brief, `workflow/context/design-system.md` (v2), `workflow/context/apple-DESIGN.md` §<secciones>, y los archivos SÍ.

## Objetivo
<1–3 líneas: qué pantalla/pieza, qué patrón Apple (p. ej. «lista agrupada inset de Ajustes de iOS», «sheet con detents»)>.

## Archivos
- SÍ (solo estos): <rutas>. Hoja propia: `app/styles/<hoja>.css`.
- NO: todo lo demás. Componente o hoja de otro dueño → override con selector acotado en tu hoja. API, `lib/`, BD, datos: nunca.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en `a11y.css`.

## Criterio de hecho
- [ ] <pantalla> a <viewports> sigue el patrón Apple dicho; jerarquía por tamaño/peso; todo valor sale de tokens.
- [ ] Estados: <vacío / carga / error / éxito / deshabilitado que tenga esta pantalla>.
- [ ] Funciones intactas: <lista de acciones de esta pantalla que deben seguir funcionando>.
- [ ] Sin scroll horizontal a 390 (`document.documentElement.scrollWidth <= 390`).
- [ ] Táctiles ≥44 en acciones primarias; foco visible con teclado.
- [ ] `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Cómo comprobar
Capturas con `.tmp-verify/look/shots.sh` (cambia `U` a `http://127.0.0.1:3001`), tomando antes `.tmp-verify/browse.lock` (créalo con `rd-<id>`, bórralo al acabar; si existe, haz otra cosa y reintenta). Guarda en `.tmp-verify/rd-<id>/`.

## Al terminar
No hagas commit (lo hace el master por rutas). Escribe `workflow/briefs/from-rd-<id>.md`: Hecho sí/no/parcial · archivos tocados · capturas · duda + recomendación (si hay).
Si vuelves por un NO PASA: corrige solo los bloqueantes de `audit-<id>.md`, nada más.
```

## 2. Brief de auditor → prompt directo (sin brief del ejecutor ni diff)

```md
Eres auditor frío del rediseño. No has visto cómo se hizo; no leas git ni el código salvo para encontrar un selector.
Lee: `workflow/context/design-system.md` (v2) y `workflow/context/apple-DESIGN.md`.

Pantalla(s): <rutas> · Rol(es): <jugador / admin / Amanda> · Viewports: <de la tabla>.
Criterio de hecho:
<pegar la lista del brief del ejecutor tal cual>

Haz: login con el rol, abre cada ruta en cada viewport, captura, mide `scrollWidth`, prueba con ratón/táctil y Tab las acciones de «Funciones intactas».
Bloqueante solo si: función perdida o rota · lógica/datos distintos · pantalla inutilizable o ilegible · incumple Apple o tokens de forma clara (no gustos, no píxeles).

Escribe `workflow/briefs/audit-<id>.md`:
- Veredicto: PASA / NO PASA
- Bloqueantes (máx. 5): ruta · viewport · qué falla · captura
- Notas no bloqueantes (máx. 3, opcional)
```

## 3. Viewports y rutas

| Superficie | Rutas | Viewports (principal en negrita) |
|---|---|---|
| Login y sueltas | `/login` (vacío, error, enviando), `/no-existe` (not-found) | **390×844**, 1440×900 |
| Jugador | `/a/<id>` pestañas Entreno / Nutrición / Diario; vídeo abierto; `/ajustes` | **390×844**, 1280×800 (presentable, centrado) |
| Admin | `/panel` (con y sin deportistas), alta de deportista; `/a/<id>` como admin (Análisis, chip, perfil B4); `/panel/ajustes` | **1440×900**, 768×1024, 390×844 (no se rompe) |
| Amanda | `/nutricion` (lista); `/nutricion/<id>` Día / Semana / Mes, ficha abierta, ingredientes, importar Word, cuenta, perfil | **1440×900**, 1280×800, 768×1024, 390×844 |

Cuentas: las de desarrollo (`npm run db:reset-passwords`; ids en `.tmp-verify/ids.ts`, Amanda en `.tmp-verify/amanda-account.ts`). Nunca datos reales nuevos: lo que se cree para probar se borra en la misma tarea.

**Recorrido de funciones (Oleada 4 y tareas que las toquen):** login/logout por rol y redirecciones de `/`; cambiar usuario y contraseña; alta de deportista; asignar nutricionista; ver sesión y abrir vídeo; guardar diario; conectar/desconectar Polar (o ver su estado); análisis por rango y por día; menú Día/Semana/Mes; ficha, subir foto y «platos iguales»; ingredientes y confirmación; importar Word; perfil del deportista; anillos con objetivos.

## 4. F2 · corte de `app/globals.css` (líneas a fecha de `5c76153`)

Si `globals.css` cambió desde ese commit, corta por los comentarios-cabecera equivalentes. Copiar los rangos tal cual, sin editar reglas.

| Hoja | Líneas originales (en este orden dentro de la hoja) |
|---|---|
| `tokens.css` | 3–52 |
| `base.css` | 1, 53–114, 1854–1864 |
| `components.css` | 115–134, 180–334, 413–419, 699–707, 1633–1639 |
| `shell.css` | 135–179, 709–771 |
| `admin.css` | 335–412, 961–964, 1671–1853 |
| `player.css` | 420–698, 773–855, 1641–1669, 1866–1930 |
| `nutri-shared.css` | 857–960 |
| `nutri.css` | 966–1632 |
| `login.css` | 1932–1951 |
| `a11y.css` | 1953–2037 |

`app/globals.css` final = 10 líneas `@import "./styles/<hoja>.css";` en el orden de la tabla (una sola entrada en `layout.tsx`, el orden lo garantiza css-loader).

Bloques que cambian de posición relativa (revisados, sin choque esperado): reset `*` tras `:root`; cabecera (135–179) tras tipo/campos; `.avatar`, `.form-grid`, `.photo-block`, `.btn-ghost` y `.sr-only` suben a hojas anteriores; `.nut-assign` y Análisis suben antes de jugador/nutrición; `device-card` y sesión suben antes de `nutri-shared`. Si una captura difiere, el primer sospechoso es uno de estos.

Verificación «idéntico»:
1. Antes de tocar nada: `cp app/globals.css .tmp-verify/f2/globals.orig.css` y capturas «antes» de la tabla §3 (viewport principal + 390; Amanda también 1280; esperar 1 s tras cargar por la animación de anillos).
2. Mismo conjunto de reglas: `grep -v '^\s*$' globals.orig.css | sort` == `cat app/styles/{tokens,base,components,shell,admin,player,nutri-shared,nutri,login,a11y}.css | grep -v '^\s*$' | sort` (diff vacío).
3. Capturas «después» con los mismos pasos el mismo día; `sha256sum` por par. Par distinto → abrir ambos: si es dato vivo (hora, animación) se repite; si es estilo, se corrige el orden.
4. `npx tsc --noEmit` limpio y la página recarga sin aviso de CSS en la consola de `next dev`.
