# from-rd-C4: Perfil, importar Word y cuenta como sheets Apple

- **Hecho:** sí. Sin commit, en la rama `feat/rediseno-apple`; el commit lo hace el master.

## Corrección tras el NO PASA (from-audit-C4, bloqueante 1)

- **Problema.** Por debajo de 1280 no había forma de abrir Perfil ni Importar menú Word. Sus botones viven en `.nut-toolbar-end`, dentro de `.nut-week`, y `.nut-week` no se muestra por debajo de 1280.
- **Arreglo, solo CSS en `app/styles/nutri.css`.** Bloque nuevo `@media (max-width: 1279.98px)`, justo antes de las preferencias rd-C4:
  - `.nut-week` se muestra sin estilo de tarjeta (sin fondo, borde, sombra ni padding).
  - Dentro de ella se ocultan todos los hijos menos `.nut-toolbar`, y también `.nut-toolbar-start` y `.nut-view-switch`.
  - `.nut-toolbar-end` pasa a ser una rejilla de dos columnas: botones «Perfil» e «Importar menú Word» a todo el ancho, 44 px de alto, texto Subhead semibold.
  - La fila queda entre el calendario y «Menú del día».
  - Por encima de 1280 no cambia nada.
- **Verificación con clic real, sin JS** (`.tmp-verify/rd-C4/fix.sh`, `fix-out.txt`, `fix_*.png`):

  | Ancho | Botones | Perfil al hacer clic |
  |---|---|---|
  | 390 | 175×44, en una línea | bottom sheet de 390×437 |
  | 768 | 292×44 | sheet centrado de 560 px |
  | 1440 | toolbar de antes (32 px con ratón) | sin cambios |

  - En los tres anchos, el clic en «Importar menú Word» abre el selector de archivos. Al subir un .docx a 390 se abre el bottom sheet de opciones (390×596).
  - Escape cierra el sheet y devuelve el foco a «Perfil». Foco visible: contorno sólido de 2 px.
  - `scrollWidth` es 390, 768 y 1440: no hay scroll horizontal.
  - Consola sin errores.
  - `npx tsc --noEmit` termina con exit 0.
  - Archivos de prueba y lock borrados.
- La duda 2 de abajo («Importar y Perfil no se alcanzan por debajo de 1280») queda **resuelta**.

## Qué cambió (rutas)

- `app/nutricion/[athleteId]/athlete-profile-form.tsx`
  - **Perfil.** Lista agrupada «Datos físicos» con cuatro filas: Nacimiento, Edad (calculada), Altura (cm) y Peso (kg).
    - Mientras carga, se ve un esqueleto.
    - La validación aparece en línea (`aria-invalid` y `.field-error`) y el pie de grupo explica los rangos.
    - El botón «Guardar perfil» ocupa todo el ancho y mide 50 px; muestra `aria-busy` mientras guarda.
    - La llamada PATCH y los mensajes son los mismos de antes.
  - **`NutSheet`, componente nuevo y exportado.** Es un sheet sobre los primitivos `.sheet*` de F3:
    - Animación de cierre con `.is-closing` y `onExited`.
    - Escape, trampa de foco y devolución del foco al elemento que lo abrió.
    - Opción `dismissible` y fondo agrupado (`grouped`).
  - `AthleteProfileButton` ahora usa `NutSheet`.
- `app/nutricion/[athleteId]/menu-word-import.tsx`
  - **Flujo completo dentro del sheet.**
    - Grupos: «Archivo» (icono, nombre, tamaño y botón «Cambiar»), «Semana de inicio» (con los textos de ayuda de siempre) y «Macros» (interruptor «Ingredientes en borrador»).
    - Pie del sheet: «Cancelar» e «Importar». Mientras importa, el botón dice «Importando…» y el sheet no se puede cerrar.
    - Si la importación falla, el error del servidor sale en una alerta en línea. Ahora también se avisa si falla la conexión.
  - **Resultado.** Estado «Menú importado» que se cierra solo a los 1,8 s, o antes con «Listo».
  - **Archivo no válido** (PDF u otro que no sea .docx). Ahora abre el sheet en estado de error con «Elegir otro archivo». Antes un PDF no daba ninguna señal.
  - La llamada a la API y el FormData son los mismos de antes.
- `app/styles/nutri.css`
  - Quitado el bloque viejo `.nut-modal*` / `.nut-import*` y dos reglas `.nut-modal …` que ya no se usaban. Se mantiene `body.nut-modal-open`.
  - Sección nueva rd-C4 con:
    - fondo agrupado de los sheets;
    - filas de campo (`.nut-field-*`);
    - estilos `.nut-prof*` y `.nut-import*`;
    - `.nut-account-settings`. Los formularios de A6 no se tocan: con CSS cada etiqueta y su campo forman una celda inset, y los dos envíos son botones tintados a todo el ancho.
  - Al final del archivo, un bloque `prefers-contrast: more`. Reducir movimiento y transparencia ya están cubiertos por `a11y.css` y por los sheets opacos.

## Verificación (`.tmp-verify/rd-C4/`: `shots.sh`, `out.txt`, capturas a 1440 y 390)

- **Sheets.**
  - Perfil, importar y cuenta abren como sheet: centrado de 560 px a 1440 y pegado abajo a 390.
  - Fondo agrupado rgb(245,245,247).
  - Los tres cierran con Escape.
- **Scroll horizontal.** `scrollWidth` es 1440 y 390: no hay scroll horizontal.
- **Perfil.**
  - Guardar con los mismos valores da «Perfil guardado.».
  - Escribir «abc» en altura marca `aria-invalid` y muestra el mensaje. No se guardó, así que no cambió ningún dato.
- **Importar.**
  - Al elegir un .docx se ven las opciones.
  - Un .docx falso devuelve 422 «No se pudo leer el Word…». La API valida antes de escribir, así que no se escribió nada en la BD.
  - Un PDF muestra el estado de error.
- **Tamaños táctiles.** Filas de 44 a 52 px; botones del pie y Guardar de 50 px; botones de cuenta de 44 px.
- **Foco con teclado.** Contorno sólido de 2 px en el color de acento.
- **Tipos.** `npx tsc --noEmit` pasa sin errores.
- **Consola.** Solo están los dos 422 esperados del .docx falso.
- **Archivos de prueba y lock.** Los archivos falsos están borrados y `.tmp-verify/browse.lock` también.

## Dudas

1. **`NutSheet` duplica `NutModal`.** `NutModal` está en `nutricion-athlete-client.tsx`, no se exporta y no es mío; ahí ya se pintan los sheets de cuenta y de perfil. Por eso hay dos implementaciones de sheet casi iguales.
2. **Importar y Perfil no se alcanzan por debajo de 1280.** Sus botones solo están en la barra de la vista semana (`.nut-toolbar-end`), que no se muestra por debajo de 1280. A 390 los sheets se verificaron abriéndolos por JS y por subida de archivo. Es cosa de layout, fuera de mis archivos.
3. **Importación con éxito sin probar de punta a punta.** En el repo no hay ningún .docx real.
4. **Aviso previo en el overlay de Next.** Ya salía al cargar la página: falta una `key` en `HeaderMarkup`, a la que se llega desde `app/nutricion/[athleteId]/page.tsx:41`. No es de este cambio.

## Recomendación

1. El dueño del carril C o el master debería unificar los dos sheets: que `NutModal` use `NutSheet`, o mover `NutSheet` a `app/components/`. Así queda un único sheet para Amanda, con la animación de cierre que `NutModal` no tiene.
2. El dueño del layout de Amanda debería llevar «Perfil» e «Importar menú Word» a una zona visible en móvil y tablet, por ejemplo junto a Ajustes en la cabecera.
3. Probar una importación con un menú .docx real de Amanda antes de pasar a main.
4. Añadir la `key` que falta en `HeaderMarkup` en el carril que tenga `page.tsx` o `HeaderMarkup`.

- **Bloquea a Adrián:** no.
