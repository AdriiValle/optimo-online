# from-rd-N5 · Pestañas del deportista + catálogo de alimentos

Hecho: si

## Que cambio (rutas)

**Pestañas**
- `app/nutricion/[athleteId]/athlete-tabs.tsx` (nuevo): Menú · Seguimiento · Perfil · Compra · Plantillas y platos · Informes. Tienen aspecto de segmentado y `aria-current="page"`. En móvil la pista se desliza por dentro y centra la pestaña activa. A la derecha hay un acceso a «Alimentos».
- `app/nutricion/[athleteId]/page.tsx`: monta las pestañas encima del cliente del Menú, que no cambia.
- `app/nutricion/[athleteId]/seguimiento/section-shell.tsx` (nuevo): armazón común de las secciones. Tiene la misma cabecera, barra lateral y pestañas, y un estado vacío con icono y CTA opcional. Vive aquí porque `athlete-tabs.tsx` es de cliente y la lista SI no permite otra carpeta.
- Nuevas: `seguimiento/page.tsx`, `perfil/page.tsx` (CTA «Ir al menú»), `compra/page.tsx` (CTA «Revisar alimentos»), `plantillas/page.tsx` e `informes/page.tsx`. Todas tienen estado vacío.

**Alimentos**
- `app/nutricion/alimentos/page.tsx` y `foods-client.tsx` (nuevos):
  - **Bandeja «Sin alimento»:** agrupa los `raw_text` huérfanos por texto normalizado y muestra contadores.
  - **Acciones por grupo:**
    - «Emparejar con X» cuando hay coincidencia clara.
    - Chips de sugerencia «¿Es alias de…?».
    - Selector «Es alias de…» con el botón «Guardar alias».
    - «Alimento nuevo», que abre un formulario en línea (nombre y pasillo) y crea el alimento y lo empareja.
    - «Emparejar evidentes (N)».
  - **Catálogo editable:** nombre, pasillo, unidad, g/unidad, alias e interruptor «básico». Incluye buscador por nombre o alias y uso por alimento. En móvil se ve en tarjetas y desde 1024 px como tabla.
- `app/api/nutrition/foods/route.ts`:
  - `GET` devuelve `{foods, orphans}`.
  - `POST` crea un alimento; con `matchKey` además re-empareja el grupo.
- `app/api/nutrition/foods/[id]/route.ts`: `PATCH` guarda solo los campos cambiados.
- `app/api/nutrition/foods/match/route.ts`: `POST` acepta `{key, foodId, addAlias}` o `{auto:true}`.
- `app/api/nutrition/foods/shared.ts`: compartido de las rutas anteriores.
- Ambos `POST` responden 409 si el alias ya es de otro alimento o el grupo ya no existe.
- `lib/nutrition/foods-queries.ts` (nuevo): listado, alta y edición de alimentos, alias, grupos huérfanos y re-emparejado por clave.
- Los ítems emparejados quedan `confirmed=false` hasta que se revisen los gramos. Si el ítem era `other`, toma el rol del catálogo.

**Emparejado automático**
- `lib/nutrition/parse-dish.ts`:
  - Normaliza plurales (raíz).
  - Ignora palabras de preparación (plancha, cocido, picado…) y palabras vacías.
  - Busca primero la frase completa y luego la palabra principal.
  - Si hay ambigüedad, sugiere hasta 4 alimentos en vez de asignar uno.

**Estilos**
- `app/styles/nutri.css`: añadido al final un bloque rd-N5 con:
  - las pestañas;
  - la rejilla de escritorio del deportista con pestañas (que respeta `:has(.nut-edit)` de nutri-shared);
  - los estados vacíos;
  - la página Alimentos;
  - las preferencias de movimiento reducido y contraste, al final.

## Números antes / después

| Medida | Antes | Después |
|---|---|---|
| Verificador del menú de ejemplo (`scripts/verify-dish-parse.ts`) | 75/76 (98,7 %) | 75/76 (98,7 %) |
| Re-parseo de los 41 textos de plato de la BD dev: ítems sin alimento | 35 | 33 |
| Ítems sin alimento que ahora reciben sugerencias | 0 | 6 |

- El verificador no empeora. El único que no empareja es «Ensalada de colores», que no tiene equivalente en el catálogo.
- Sugerencias encontradas: queso opcional, vegetales al gusto, Revuelto → Huevo, verduras, Pan integral → Pan sin gluten.

**Bandeja en dev:** 35 ítems en 27 grupos, de los que 2 son evidentes («carne picada» y «Carne picada especiada» → Ternera picada 90/10).

**Prueba en la interfaz** como Amanda en :3001, con clics reales:

| Acción | Ítems | Contador / grupos |
|---|---|---|
| Alias «Pan integral» → Pan sin gluten | 1 emparejado | 35 → 34 |
| «Alimento nuevo» con «Ensalada de colores» | 5 emparejados | 26 → 25 grupos |
| «Emparejar evidentes» | 2 | 23 grupos |

- También edité la fila «Huevo» (pasillo, unidad, 60 g y básico): se guarda en la BD y el botón pasa a «Guardado».
- **Datos dev restaurados** con el script de snapshot:
  - 86 alimentos, 35 sin alimento, 240 ítems y 27 grupos;
  - «Ensalada de colores» borrado;
  - Huevo y Pan sin gluten vuelven a su estado original.

## Comprobaciones

- Probé a 390, 720 y 1440 el Menú, las 5 secciones y Alimentos:
  - Todas las rutas cargan y `scrollWidth` es igual al ancho de la ventana (sin scroll horizontal).
  - El Menú conserva barra lateral, semana y zona de edición.
- **Taps a 390:** pestañas, «Alimentos», CTA, botones y selector de la bandeja, buscador y «Guardar» miden 44 px. El interruptor «Básico» mide 31 px porque es el primitivo `.toggle` compartido; su etiqueta envuelve el control y amplía la zona de toque.
- El foco es visible (contorno sólido de 2 px).
- `npx tsc --noEmit` está limpio.
- Las capturas están en `.tmp-verify/rd-N5/` y el lock está borrado.
- **Consola:**
  - Secciones y Alimentos: sin errores.
  - Menú: aparece el aviso de React «Each child in a list should have a unique key» (HeaderMarkup ← NutricionAthletePage). No es nuevo: sale igual con la versión de HEAD de `page.tsx`.

## Notas

- El índice `/nutricion` no tiene enlace a Alimentos porque ese archivo está fuera de la lista SI. Se entra desde la barra de pestañas de cualquier deportista.
- En dev, Amanda solo tiene asignado a Ricardo Visus (`9d27d850…`).
- No hice commit, no cambié de rama y no ejecuté migraciones.

Duda:

Recomendacion:

Bloquea a Adrian: no
