# from-rd-F3 — Primitivas y hojas base v2

**Hecho:** si

## Que cambio (rutas)

- `app/styles/tokens.css`: el `:root` v2 completo de design-system.md, nombrado por rol.
  - Incluye texto, rellenos, separadores, acento Apple, semántica, anillos, tipografía `--t-*`/`--ls-*`, radios, materiales y blur, `--elev-*`, espaciado, movimiento, `--tap-min` y foco.
  - Dos tokens extra de Óptimo: `--dur-spin` y `--dur-pulse`.
  - Alias de transición v1→v2 (`--text`, `--line`, `--glass*`, `--shadow-*`, `--ease`, `--accent-hover`…) para que las hojas de otros dueños sigan pintando. Se borran en la Oleada 4.
  - Se conservan la categoría de proteína y las variables de cabecera.
  - Sin `backdrop-filter`, los materiales pasan a superficie opaca.
- `app/styles/base.css`: lienzo `--bg` liso, sin degradados.
  - `body` usa `--t-body`, `a` va en `--accent-text` y `:focus-visible` lleva el anillo global.
  - `.page` se ajusta a `--gutter` y safe-area; `.brand-*` usa tokens.
- `app/styles/components.css`: las primitivas.
  - Tipografía y utilidades `.t-*`.
  - `.card`.
  - Campos: `.field`, `.field-help` y `.field-error`, con `aria-invalid` y disabled.
  - `.btn`: primario, `secondary`/`--gray`, `--tinted`, `btn-ghost`/`--plain`, `--danger` y `--danger-solid`; tamaños `--lg`, `--sm` y `--block`. Estados hover/press/focus/disabled y pendiente con `aria-busy` + `.spinner`.
  - `.icon-btn` 44×44.
  - `.alert` (error/ok/warn).
  - `.segmented`, con pulgar deslizante mediante `--seg-count`/`--seg-index` o radios nativos.
  - `input.toggle`.
  - Lista agrupada inset: `.list-group*` y `.list-row*`, con disclosure y danger.
  - `.chips`/`.chip`.
  - `.avatar` en tres tamaños.
  - Estados vacío/carga/error: `.state*` y `.skeleton*`.
  - Sheet/modal `.sheet*`: abajo con material en móvil, centrado a partir de 720 px; con scrim, grabber, header, body y footer, y variantes `--opaque`, `--wide` e `.is-closing`.
  - Se conservan con tokens `.stack`, `.section-head-*`, `.settings-*`, `.form-grid` y `.photo-block`.
- `app/styles/a11y.css`: cada preferencia se resuelve en un solo sitio, sobre todo redefiniendo tokens en `:root`.
  - Transparencia reducida: materiales opacos y sin blur.
  - Más contraste: etiquetas más oscuras, separadores fuertes y bordes en primitivas.
  - Movimiento reducido: sin press-scale ni desplazamientos; el sheet entra en fundido y el spinner pasa a pulso.
- `app/layout.tsx`: Inter con `next/font/google` (`--font-inter`) como respaldo de SF; la clase va en `<html>`.
- `app/dev/ui/page.tsx` (nuevo): catálogo con todos los estados de cada primitiva. Los hover/press/focus están forzados con `.is-*`, hay un pendiente real, el sheet es abrible (Esc, scrim o ×, y devuelve el foco) y las variantes son material y opaca. En producción hace `notFound()`.

## Verificacion

- `npx tsc --noEmit`: limpio (exit 0).
- Sin scroll horizontal (scrollWidth = viewport) a 390 en:
  - `/login`
  - `/panel`
  - `/panel/ajustes`
  - `/a/<id>` (admin y deportista)
  - `/ajustes`
  - `/nutricion`
  - `/nutricion/<id>`
  - `/dev/ui`
  
  A 1440 lo he comprobado en las rutas de nutrición y en `/dev/ui`. Todas se leen bien en las capturas, que están en `.tmp-verify/rd-F3/`.
- Sheet: bloquea el scroll de `html` al abrir, se cierra con Esc y el foco vuelve al botón.
- Consola: solo hay el aviso previo de React `key` en HeaderMarkup/NutricionAthletePage. No es de este diff.
- No he creado datos de prueba. Lock borrado. Sin commit y en la rama `feat/rediseno-apple`.

## Notas para el master

- **localhost:3001 estaba caído** al empezar (el 3002 es de otro proyecto). Lo levanté con `npm run dev` (log en `.tmp-verify/rd-F3/dev.log`) y lo dejo corriendo. Al cerrar sigue respondiendo (`/login` → 200). Si se cae, `npm run dev` lo vuelve a levantar.
- `/apple-icon.png` da 500 por un conflicto previo entre `public/` y `app/`. No es de este brief; en el catálogo uso `/logo-optimo.png`.
- `/dev/ui` exige login (cualquier rol) por el middleware existente. No lo he tocado.
- El `notFound()` en producción no lo he verificado con `next build`: no se puede compilar con el dev corriendo en el mismo `.next`. Es la guarda estándar de `NODE_ENV`.
- Cambios visibles en primitivas compartidas:
  - `.btn-ghost` pasa de borde discontinuo a botón plain.
  - `.icon-btn` pasa a 44 px.
  - Los `label` pasan a footnote secundario.
  - Los checkboxes vuelven a su tamaño nativo con `accent-color`.
- Overrides de transición en `components.css` para hojas de otros dueños: `.an-chart` (línea, punto y barra en `--label`) y el hover de `button.session-video` (`--accent-hi`). Se pueden quitar cuando esas hojas pasen a v2.
- Detalles previos en hojas ajenas que no he tocado:
  - En `/panel/ajustes` falta separación entre un `.btn` y el `h3` siguiente.
  - `.btn + .btn` usa `margin-left` y descuadra al hacer wrap.

## Decisiones

- Decidí especificidad `.btn.btn--x` en las variantes porque `button.btn` (0,1,1) ganaba a una sola clase y las variantes no se aplicaban.
- Decidí mantener alias v1→v2 en tokens.css porque las hojas de otros dueños siguen usando los nombres viejos y así no se rompen hasta su fase.
- Decidí el bloqueo de scroll con `html:has(.sheet-scrim:not(.is-closing))` porque no necesita JS en cada consumidor del sheet.

**Duda:**

**Recomendacion:**

**Bloquea a Adrian:** no
