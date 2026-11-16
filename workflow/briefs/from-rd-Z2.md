# from-rd-Z2

- Hecho: si
- Que cambio (rutas):
  - Borrados (`git rm`, sin commit): `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png` (arreglo 1).
  - Nuevo: `app/nutricion/[athleteId]/account-settings-link.tsx` (arreglo 2).
  - Editados: `app/nutricion/[athleteId]/page.tsx` (searchParams + `key`, arreglos 2 y 3), `nutricion-athlete-client.tsx` (`initialSettingsOpen`, limpiar URL al cerrar), y el ⚙ en `compra/page.tsx`, `perfil/page.tsx`, `plantillas/page.tsx`, `seguimiento/page.tsx`, `seguimiento/section-shell.tsx`, `informes/page.tsx` (todos bajo `app/nutricion/[athleteId]/`).
  - Informe: `workflow/briefs/informe-final-rediseno.md`.
  - Capturas en `.tmp-verify/rd-Z2/`. Lock `browse.lock` creado y borrado. Sin datos de prueba, sin commit, sin cambio de rama, sin tocar lib/ ni db/.
- Verificado: `tsc --noEmit` limpio; iconos 200; ⚙ en las 6 pestañas a 1440 y 390; abre «Tu cuenta» con `?ajustes=1` y limpia la URL al cerrar; foco visible (outline 2 px, 44×44); scrollWidth = ancho en 390 y 1440; sin aviso de `key` en consola.
- Duda: el globo «Issues» de Next no se pudo leer desde el script (shadow DOM); solo se comprobó la consola.
- Recomendacion: mirar a ojo el globo en `/nutricion/<id>` al revisar; si persistiera, usar el plan B de la lista (`Fragment key="logout"` en el cliente). Commit único de los 3 arreglos.
- Bloquea a Adrian: no
