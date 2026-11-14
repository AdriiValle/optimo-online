- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno.
  - /a/<id> Nutrición > Semana - 390x844 (jugador ricardovisus): 7 días con nombre, número, MD y miniaturas por comida; scrollWidth = 390 (también en semana siguiente, anterior y vacía). Captura: .tmp-verify/audit-N2/semana-390.png
  - Flechas: «Semana siguiente» → 16–22 nov, «Semana anterior» → 2–8 nov y 26 oct–1 nov; muestra «Cargando la semana…» entre medias. Capturas: .tmp-verify/audit-N2/next-week.png, prev-week.png
  - Tocar un día (jueves 12) abre la pestaña Hoy con «Jueves 12 de noviembre» y su menú. Captura: .tmp-verify/audit-N2/tap-day.png
  - Semana sin menú (19–25 oct): aviso «Sin menú esta semana» + 7 filas «Sin menú» con MD, sin romper. Captura: .tmp-verify/audit-N2/empty-week.png
  - Filas de día 358x112, flechas ≥44; foco por Tab visible (outline 2px azul `--accent`) en flechas y filas. `npx tsc --noEmit` limpio.
- Notas no bloqueantes (maximo 3, opcional):
  1. El segmentado Hoy/Semana/Compra mide 118x32; el design-system pide 36 en táctil con tap de 44 (.tmp-verify/audit-N2/semana-390.png).
  2. «Ir a hoy» en Semana vuelve a la semana actual, pero el día seleccionado de arriba (calendario/título) se queda en el último día al que se navegó; en Hoy aparece «Volver al sábado 24 de octubre». Es coherente, solo puede despistar.
  3. Cabeceras de columna «Media m.» abreviadas a 390; legibles pero justas.
