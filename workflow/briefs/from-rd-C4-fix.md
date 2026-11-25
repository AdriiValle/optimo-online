# from-rd-C4-fix

- **Hecho:** sí. Corregido el único bloqueante de `from-audit-C4.md`: por debajo de 1280 no se podía abrir Perfil ni Importar menú Word. Sin commit, en la rama `feat/rediseno-apple`, como pedía el brief; el commit lo hace el master.

## Qué cambió (rutas)

- **`app/styles/nutri.css`.** Bloque nuevo `@media (max-width: 1279.98px)`, justo antes de las preferencias rd-C4:
  - `.nut-week` se muestra sin estilo de tarjeta.
  - De su contenido solo se ve `.nut-toolbar-end`.
  - Los botones «Perfil» e «Importar menú Word» quedan en una fila de dos, a todo el ancho y con 44 px de alto, entre el calendario y «Menú del día».
  - Por encima de 1280 no cambia nada.
- **`workflow/briefs/from-rd-C4.md`.** Reescrito con una sección de corrección; la duda 2 queda resuelta.
- **Verificación.** Script en `.tmp-verify/rd-C4/fix.sh`, salida en `fix-out.txt` y capturas `fix_*.png`. Comprobado con clic real:
  - A 390, Perfil abre como bottom sheet; a 768, como sheet centrado.
  - «Importar menú Word» abre el selector de archivos, y al subir un .docx a 390 sale el bottom sheet de opciones.
  - No hay scroll horizontal y el foco se ve.
  - Consola limpia y `tsc` termina con exit 0.

## Dudas, recomendación y bloqueo

- **Duda:**
- **Recomendación:**
- **Bloquea a Adrián:** no.
