# Arreglos finales (rd-Z, auditoría integral)

Rama `feat/rediseno-apple`, dev en :3001, 16-11-2026. Auditoría con Chromium propio (scripts y capturas en `.tmp-verify/rd-Z/`). No se ha tocado código.

## Resultado del recorrido (§3 de plantillas-rediseno.md)

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | limpio (exit 0) |
| Scroll horizontal (`scrollWidth <= viewport`) | ninguno. anon 390/1440, jugador 390/1280, admin 1440/768/390, Amanda 1440/1280/768/390 |
| Roles y redirecciones | `/` lleva a cada rol a su sitio (jugador `/a/id`, admin `/panel`, Amanda `/nutricion`, anon `/login?from=/`). Jugador en `/panel` y `/nutricion` recibe not-found. Amanda en `/a/id` recibe 404 |
| Foco con teclado | anillo visible en todas las paradas. Login y buscador de Amanda lo llevan en el contenedor (`:focus-within`). Fechas de Análisis llevan outline 2px azul |
| Objetivos táctiles | acciones primarias ≥44. Los segmentados de 32 px y las pestañas de Amanda de 28 px en escritorio siguen la norma Apple para puntero y no son bloqueo |
| Errores de consola | solo los de los arreglos 1 y 3 |

**Jugador.** Funciona todo:
- Entrenamiento.
- Nutrición:
  - Hoy: tarjeta de combustible y check Hecho / A medias / No.
  - Semana.
  - Compra: rangos, pasillos, «ya lo tengo», Compartir / Copiar / Imprimir.
- Diario: Polar «Conectar», Whoop/Amazfit «Próximamente», «Guardar diario».
- Ajustes.

**Admin.** Funciona todo:
- Panel con «Añadir deportista».
- `/a/id` con:
  - Perfil físico editable (B4).
  - Nutrición.
  - Análisis: rangos, fechas y gráficas.
- `/panel/ajustes`: usuario, contraseña, deportistas, nutricionistas.

**Amanda.** Funciona todo:
- Lista de deportistas.
- Menú:
  - Vistas Día / Semana / Mes. En 768 y 390 se muestra el menú del día apilado, que es intencionado.
  - Ficha del plato en drawer: foto, macros, ingredientes.
  - Anillos del resumen.
  - Nota del día, Perfil e Importar Word.
- Seguimiento.
- Perfil.
- Compra.
- Plantillas y platos: plantillas, mis platos, sustituciones.
- Informes.
- Alimentos: sin alimento, emparejar, alias.

No falta ninguna función. El estilo Apple es coherente en las tres vistas, salvo el arreglo 2.

## Arreglos (por prioridad)

### 1. Iconos duplicados: HTTP 500 en `/favicon.ico`, `/icon.png` y `/apple-icon.png` en todas las páginas

- **Causa.** `app/favicon.ico`, `app/icon.png` y `app/apple-icon.png` son byte a byte iguales que los de `public/`. Next responde «conflicting public file and page file» con 500, y eso deja un error de consola en cada página. Es anterior al rediseño (commit 7336e46), pero ensucia el criterio «sin errores de consola».
- **Cambio:**
  - Borrar con git los 3 archivos de `app/`: `git rm app/favicon.ico app/icon.png app/apple-icon.png`.
  - No tocar `public/` ni `app/layout.tsx`. El layout ya enlaza los tres de forma explícita (líneas 11-16 y 33-35).
- **Verificar:**
  - `for f in favicon.ico icon.png apple-icon.png; do curl -s -o /dev/null -w "$f %{http_code}\n" http://127.0.0.1:3001/$f; done` debe dar 200 en los tres. Si sigue en 500, reiniciar el dev de esa rama para que Next olvide las rutas de `app/`.
  - En el navegador, la pestaña sigue mostrando el favicon.

### 2. Amanda: el ⚙ Ajustes («Tu cuenta») solo existe en la pestaña Menú

- **Causa.** En `/nutricion/[id]` la barra lleva ⚙ y Salir. En Seguimiento, Perfil, Compra, Plantillas y platos e Informes solo lleva Salir, así que la misma barra cambia de acciones según la pestaña. El modal «Tu cuenta» (usuario y contraseña) vive solo en `nutricion-athlete-client.tsx`.
- **Cambio (enlace al menú con `?ajustes=1`, que abre el modal existente):**
  1. **Archivo nuevo** `app/nutricion/[athleteId]/account-settings-link.tsx`, sin `"use client"`:
     ```tsx
     import Link from "next/link";

     /** ⚙ de la barra en las pestañas del deportista: abre «Tu cuenta» en el menú. */
     export function AccountSettingsLink({ athleteId }: { athleteId: string }) {
       return (
         <Link className="icon-btn" href={`/nutricion/${athleteId}?ajustes=1`} aria-label="Ajustes">
           {/* copiar aquí el <svg> exacto del botón Ajustes de nutricion-athlete-client.tsx (líneas 232-235) */}
         </Link>
       );
     }
     ```
  2. **Usar el enlace en las pestañas.** En estos 6 archivos, dentro de `trailing`, añadir `<AccountSettingsLink athleteId={…} />` justo antes de `<LogoutButton inline />`, e importar `import { AccountSettingsLink } from "<ruta relativa>/account-settings-link";`:
     - `app/nutricion/[athleteId]/compra/page.tsx` → `data.athlete.id`
     - `app/nutricion/[athleteId]/perfil/page.tsx` → `data.athlete.id`
     - `app/nutricion/[athleteId]/plantillas/page.tsx` → `data.athlete.id`
     - `app/nutricion/[athleteId]/seguimiento/page.tsx` → `data.athlete.id`
     - `app/nutricion/[athleteId]/seguimiento/section-shell.tsx` → `data.athlete.id`
     - `app/nutricion/[athleteId]/informes/page.tsx` → `athlete.id`

     La ruta relativa es `../account-settings-link` desde las carpetas `compra`, `perfil`, `plantillas`, `seguimiento` e `informes`.
  3. **`app/nutricion/[athleteId]/page.tsx`:**
     - La firma pasa a ser `({ params, searchParams }: { params: Promise<{ athleteId: string }>; searchParams: Promise<{ ajustes?: string }> })`.
     - Pasar al cliente `initialSettingsOpen={(await searchParams).ajustes === "1"}`.
  4. **`app/nutricion/[athleteId]/nutricion-athlete-client.tsx`:**
     - En `Props`, añadir `initialSettingsOpen?: boolean;`.
     - Desestructurarlo.
     - Cambiar `useState(false)` de `settingsOpen` (línea 61) por `useState(initialSettingsOpen ?? false)`.
     - En `closeSettings` (línea 91), limpiar la URL al cerrar:
       ```ts
       const closeSettings = useCallback(() => {
         setSettingsOpen(false);
         if (window.location.search.includes("ajustes=1")) window.history.replaceState(null, "", window.location.pathname);
       }, []);
       ```
  - **Fuera de alcance.** `/nutricion` (lista) y `/nutricion/alimentos` no tienen deportista y nunca tuvieron ⚙. Se dejan como están.
- **Verificar:**
  - Como Amanda a 1440, en cada pestaña aparece ⚙ junto a Salir, igual que en Menú.
  - Al pulsarlo se abre `/nutricion/<id>?ajustes=1` con el sheet «Tu cuenta» abierto.
  - Al cerrar, la URL queda en `/nutricion/<id>`.
  - Tab llega al ⚙ con anillo visible.
  - A 390, `scrollWidth <= 390`.
  - `npx tsc --noEmit` limpio.

### 3. Aviso de React «Each child in a list should have a unique key… HeaderMarkup… NutricionAthletePage» en `/nutricion/[id]`

- **Causa.** El servidor crea `headerLeading` y `headerLogout` como elementos y los pasa al cliente, que los coloca como hermanos de otros hijos (el ⚙ va junto a `{headerLogout}`). React los marca sin `key`. Solo pasa en Menú y genera el globo «1 Issue» de Next en dev. `LogoutButton` usa una server action en línea, así que no se puede importar en el cliente. La salida es darles `key`.
- **Cambio.** En `app/nutricion/[athleteId]/page.tsx`, líneas 43-44:
  ```tsx
  headerLeading={<HeaderBackButton key="back" href="/nutricion" />}
  headerLogout={<LogoutButton key="logout" inline />}
  ```
- **Verificar:**
  - Cargar `/nutricion/<id>` como Amanda con la consola abierta: no aparece el aviso de `key` y desaparece el globo «Issues» de Next.
  - Si persistiera, envolver en el cliente `{headerLogout}` como `<Fragment key="logout">{headerLogout}</Fragment>` (importar `Fragment` de react) y volver a comprobar.

## Observaciones que no son arreglos

- **Admin en `/a/id`.** Hay dos segmentados a todo el ancho seguidos (Entrenamiento/Nutrición/Análisis y debajo Hoy/Semana/Compra). Se entiende, porque es jerarquía de dos niveles. Es una decisión de diseño, no una incoherencia.
- **Compra.** Algunas entradas «Otros / revisar» son pasos de receta, por ejemplo «Dorar los frutos rojos…», y hay una categoría «Salmon». Viene de los datos del menú importado. Se resuelve en Alimentos (emparejar/alias), no en código del rediseño.
- **Latencia en dev.** `/api/nutrition/totals` tarda unos 6 s, así que algunas vistas salen con esqueleto unos segundos (Perfil de Amanda, ajustes de admin). Con espera cargan bien.

Sin más bloqueos.
