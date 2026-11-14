- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  1. /a/9d27d850-d328-4633-bc33-56198a0e4181 (Entreno, miércoles 11) - 390 y 1280 - si el foco pasa al reproductor de YouTube (tocar el vídeo o Tab desde la X), Escape lo captura el iframe y no cierra el sheet, y el Tab sale del trap. Con el foco en la página (apertura normal, foco en la X) Escape, X y scrim cierran bien. Limitación típica de iframe cross-origin. Captura: .tmp-verify/audit-A2/rv390_sheet_vp.png
  2. Las cuentas de Paco y Adrián no tienen plan esta semana (solo muestran «Día sin sesión»); el vídeo se probó con Ricardo Visus (miércoles 11 de noviembre, 2 vídeos). Capturas: .tmp-verify/audit-A2/paco390_a.png, .tmp-verify/audit-A2/rv390_d11.png
  3. Las capturas full-page con el sheet abierto salen fantasma (body con position:fixed); con --viewport el sheet es opaco y correcto. Capturas válidas: .tmp-verify/audit-A2/rv1280_sheet_vp.png, .tmp-verify/audit-A2/rv390_sheet_vp.png, .tmp-verify/audit-A2/rv1280_list.png

Comprobado (ricardovisus): lista de sesiones clara a 390 (secciones, ejercicio, series, aviso, botón «Vídeo» 90x44); abrir vídeo = sheet inferior a 390 (grabber, título, X 44x44, iframe, blurb) y modal centrado 640 px a 1280; cierra con X, scrim y Escape (foco vuelve al botón «Vídeo»; body se restaura sin saltar de scroll); scrollWidth 390/390 y 1280/1280 con y sin sheet; foco visible = anillo 2px #0071E3 en «Vídeo» y X; `npx tsc --noEmit` sin errores.

- Hecho: si
- Que cambio (rutas): solo capturas y scripts de auditoría en .tmp-verify/audit-A2/ (sin tocar código ni commits)
- Duda:
- Bloquea a Adrian: no
