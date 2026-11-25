# from-opus-nutri-look-o3

- **Hecho:** sí. Commit `fc5828a` en `dev`: `feat(nutricion): subida de fotos de Amanda con resize y platos iguales`.

## Qué cambió (rutas)

- `lib/image-resize.ts` (nuevo, cliente): canvas → WebP; si el navegador no tiene WebP, JPEG. Lado largo 1200 px y calidad 0.85→0.45 hasta ≤300 KB; si no cabe, encoge un 20 % y repite. JPEG/WebP que ya son pequeños pasan tal cual.
- `app/nutricion/[athleteId]/meal-drawer.tsx`: `PhotoHero` dentro de `MealFicha`. El héroe es zona de soltar («Suelta para poner la foto» / «Subiendo…»), con «Elegir foto» (o «Cambiar foto») y «Quitar foto». Vista previa al momento con la URL `blob:` y casilla «Usar en los N platos iguales» marcada por defecto, que solo sale si N > 0. Nueva prop `onPhotoChanged` y tipo `PhotoChange`.
- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`: `patchMealPhotos` actualiza `hasPhoto`/`updatedAt` de todos los platos tocados, así las miniaturas salen sin recargar la semana. `MealSlotForm` usa el mismo resize (`accept="image/*"`). En la ficha de un plato que ya existe, el input de foto del formulario se oculta porque el héroe ya lo cubre.
- `app/api/meals/[id]/photo/route.ts`: `POST` acepta `applyToSame=1` y devuelve `{ updated: [{id, updatedAt}] }`. `DELETE` nuevo, con los mismos permisos que `POST`. El tope de 400 KB del servidor no cambia.
- `app/api/meals/[id]/photo/same/route.ts` (nuevo): `GET` → `{ count }`, para enseñar la N antes de subir. Mismos permisos.
- `lib/queries.ts`: `sameDishWithoutPhotoCount` y `clearMealPhoto` son nuevas. `setMealPhoto` propaga a los platos del mismo deportista con el mismo `md5(coalesce(nullif(preparation,''), title))` que no tienen foto.
- `app/globals.css`: estilos del héroe como zona de soltar, de los botones (36 px; 44 px en el sheet) y de la casilla.

## Verificación

- **SQL**, como Amanda (rol `nutritionist`) en una transacción revertida, en `.tmp-verify/photo-o3.ts`: 9/9 OK. Comprueba que la N cuenta bien, que no se pisa una foto existente, que sin `applyToSame` solo cambia el plato propio y que quitar la foto solo afecta al propio.
- **Navegador**, con `next start` y 1280×800 como Amanda:
  - Solté un JPEG de 6,7 MB: en la base quedó un WebP de 285 KB, también en los 2 platos iguales.
  - Las 3 miniaturas salieron al momento.
  - «Quitar foto» volvió al placeholder.
  - «Elegir foto» con un archivo solo cambió el plato propio y no pisó los 2 que ya tenían foto.
- **375 px:** sin scroll horizontal; el sheet sale con botones de 44 px; el formulario apilado sube PNG → WebP.
- **Deportista** (`ricardovisus`): `POST`, `DELETE` y `/same` devuelven 404.
- `npm run build` y `tsc` en verde; `verify-meal-drafts.ts` funciona.
- Capturas en `.tmp-verify/look-o3/`.
- La base real no tenía platos repetidos (42 platos, solo comida y cena). Para la prueba creé 2 desayunos duplicados y los borré al terminar. La base vuelve a estar igual: 42 platos, 0 fotos, sin `meal_items` huérfanos. Lo único que cambió es el `updated_at` del almuerzo del 3/11.

## Duda

## Recomendación

Merge a `main` cuando lo decida Adrián: O1–O3 ya están cerradas en `dev`.

- **Bloquea a Adrián:** no. Solo queda el merge a `main`, que el plan ya le reserva.
