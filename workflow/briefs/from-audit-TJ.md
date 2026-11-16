- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  - Nutrición Hoy/Semana/Compra (390): los botones del segmentado miden 32 px de alto (pista 36). Coincide con lo que dice el design-system (segmentado 32/36 con tap de fila a 44), pero el área táctil real queda por debajo de 44. Capturas: .tmp-verify/audit-TJ/m390_nutricion.png
  - En la primera pasada, /a/<id> del martes 17 mostró un instante «Día sin sesión»; repetido 6 veces (0,3/1/2 s) no se reprodujo y muestra la sesión con vídeos. Probable dato en edición por otro worker, no código. Captura buena: .tmp-verify/audit-TJ/m390_entreno_17b.png
  - La captura del visor de vídeo a 1280 (.tmp-verify/audit-TJ/d1280_video.png) salió a mitad de transición; el diálogo mide 640 px y está centrado (x=320).

Comprobado (todo en 127.0.0.1:3001, rol jugador ricardovisus):
- `npx tsc --noEmit`: exit 0, sin errores.
- 390x844: Entreno (días 16–22), Nutrición (Hoy/Semana/Compra), Diario y /ajustes con scrollWidth = 390. Tab bar, navbar, calendario, flechas, Hecho/A medias/No, cerrar vídeo y botones del form de Ajustes ≥44; los campos del Diario y Ajustes (36 px) van dentro de filas de 52–58 px que son <label>, así que el tap real es ≥44.
- Foco visible en todos los enlaces/botones (outline 2 px solid #0071e3). Transiciones 0,15–0,22 s; la app no fuerza reduced-motion.
- Funciones: ver vídeo (sheet con cerrar 44x44), check de comida (Hecho marca aria-pressed=true y se desmarca al repetir; sin datos residuales), lista de compra, semana, diario, Ajustes.
- 1280x800: /a/<id> (Entreno, Nutrición, Diario) y /ajustes en columna central de ~576 px, centrada, tab bar a ancho completo con contenido interior centrado; sin scroll horizontal (sw=1280).
- Capturas en .tmp-verify/audit-TJ/ (m390_*.png, d1280_*.png). Lock browse.lock borrado al acabar.
