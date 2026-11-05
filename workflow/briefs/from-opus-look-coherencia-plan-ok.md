# from-opus: visto bueno plan look coherencia

- Hecho: sí
- Qué cambió (rutas):
  - `workflow/briefs/plan-look-coherencia.md` (reescrito, anclado al código)
  - `workflow/briefs/from-opus-look-coherencia-plan-ok.md` (este)
  - Código: nada.
- Duda:
- Recomendación: lanzar Oleada 1 (design-system) ya.
- Bloquea a Adrián: no.

## Visto bueno

Sí. La decisión Óptimo + apple-design se queda; nada de Design.md ajeno. Lo que cambié es el **orden**: todo el estilo de la app vive en un solo `app/globals.css` (1461 líneas; no hay `style={}`, CSS modules ni Tailwind). Cada superficie lo edita, así que **no hay paralelo**: 8 oleadas en serie.

## Oleadas (serie estricta)

1. `docs(look)`: design-system + línea en handshake (opus -Think). Sin `app/`.
2. `style(look)`: shell CSS compartido: `:root` solo añade, press/foco/reduced-motion, se unifican los `prefers-*` duplicados (opus -Think).
3. A shell + login (opus/sonnet).
4. B panel admin + los dos ajustes + username/password-form (sonnet).
5. C casa deportista: home, sesión, vídeo, calendario, device-card (opus -Think).
6. D análisis + molestias (están dentro de `analisis.tsx`; no hay ruta registro) (sonnet).
7. E nutrición deportista + nutricionista, también ≥1280 (opus -Think).
8. Cierre: `decisions.md` (sonnet).

Cada oleada tiene en el plan su lista de TSX y su bloque de `globals.css`.

## Riesgos

- Un solo `globals.css`: dos workers a la vez lo rompen. Por eso van en serie.
- Selectores compartidos (`.card .btn* .btn-ghost .icon-btn .doc-header-viewport* .header-*` inputs, `prefers-*`) solo los toca la Oleada 2. Las superficies usan modificadores con su prefijo.
- Header en portal a `body`: si se toca `position`/`z-index` se rompen todas las rutas.
- Nutricionista desktop recién reordenado (f08a673): no volver a meter el panel lateral.
- `username-form`/`password-form` también los usa Amanda: hay que verificar `/nutricion` tras la Oleada 4.
- Árbol sucio de otros (`.gitignore`, `.tmp-verify/`, `workflow/inbox/`, briefs): solo `git add` de las rutas de la oleada.
