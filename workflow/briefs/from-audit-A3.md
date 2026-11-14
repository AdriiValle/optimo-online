- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  - Estado "error" de integración (`status: error` con `lastError`) no reproducible sin datos en BD (Ricardo está sin dispositivo); solo vi la variante por callback `?device=error&deviceMsg=…` (alerta roja + "Conectar Polar"). El CSS `.device-status--error` y `.device-admin-chip--error` existe en `app/styles/player.css`. Capturas: `.tmp-verify/audit-A3/dev-err.png`.
  - El chip admin (`IntegrationAdminChip`) no se pudo ver: devuelve null con Polar desconectado (correcto) y la vista admin no tiene pestaña Diario (solo Entrenamiento/Nutrición/Análisis). Captura: `.tmp-verify/audit-A3/admin.png`.
  - Los inputs numéricos miden 94x36, pero la fila `<label>` entera es el área táctil (52-58 px alto): cumple ≥44.

Comprobado a 390x844 (jugador ricardovisus, y admin adriivalle):
- scrollWidth = 390 en sin dispositivo, conectado (`?device=ok`) y error (`?device=error`); capturas `.tmp-verify/audit-A3/diario-top.png`, `dev-ok.png`, `dev-err.png`.
- Táctiles: botones/enlaces de device-card 44 px de alto, "Guardar diario" 50 px, pestañas 49 px. Teclado: `sleepHours` con `inputMode=decimal`, el resto `numeric`. Foco visible (outline 2px sólido).
- Guardar diario: relleno sueño 7.5, RPE 6 y molestias, "Guardado." y persiste tras recargar. Datos de prueba borrados de `diaries` después (`.tmp-verify/audit-A3/clean.ts`).
- Con Polar conectado, los campos de dispositivo pasan a "Llega de Polar" (solo lectura) y aparecen "Actualizar datos de la noche" y "Desconectar". No pulsé Desconectar/Conectar para no tocar estado real.
- `npx tsc --noEmit`: limpio (exit 0).
- Cuenta `admin` no entró con la contraseña de desarrollo; usé `adriivalle`.
