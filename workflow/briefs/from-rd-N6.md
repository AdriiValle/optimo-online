# from-rd-N6 · Amanda: pestaña Perfil

- Hecho: sí
- Rama: `feat/rediseno-apple`, sin commit (el brief lo deja al maestro). No toqué main/dev, db/ ni migraciones; :3001 sin reiniciar.

## Qué cambió (rutas)

- `app/nutricion/[athleteId]/perfil/page.tsx`: página servidor (auth de nutricionista + chrome como section-shell). Sustituye el placeholder de N5.
- `app/nutricion/[athleteId]/perfil/profile-panel.tsx` (nuevo): `AthleteProfileForm extended` + `router.refresh()` al guardar.
- `app/nutricion/[athleteId]/perfil/profile-extras.tsx` (nuevo): listas editables (chips + sugerencias, añade lo escrito al salir del campo), objetivo de dieta, overrides de objetivos por tipo de día con «restablecer».
- `app/nutricion/[athleteId]/perfil/allergy-match.ts` (nuevo): matcher por food_id o alias, con grupos de alérgenos UE.
- `app/nutricion/[athleteId]/perfil/allergy-client.ts` (nuevo): carga del perfil de alergias con caché.
- `app/nutricion/[athleteId]/perfil/allergy-alert.tsx` (nuevo): aviso en la ficha del plato. Mira los meal_items por foodId/rawText y, si el plato no tiene items, el título y la preparación.
- `app/nutricion/[athleteId]/athlete-profile-form.tsx`: modo `extended` con alergias, intolerancias, objetivo, interruptor «Mostrar números al jugador» y overrides. Si la carga falla se muestra un error en vez de un formulario vacío, así no se pueden machacar datos.
- `app/nutricion/[athleteId]/meal-drawer.tsx`: monta `<AllergyAlert>` bajo el título de la ficha.
- `app/api/athletes/[id]/profile/route.ts`: GET devuelve los campos de dieta + `allergenFoods`. El PATCH es parcial y se valida con Zod: cuerpo completo o nada, overrides con rango y claves conocidas. Va en una sola transacción y vale para admin y nutricionista.
- `lib/queries.ts` (solo funciones de perfil): `athleteProfile` con los campos de dieta y `updateAthleteProfile(tx, id, patch, asNutritionist)`. La dieta pasa por `nutritionist_set_athlete_diet_profile`, mezclada con lo actual. `targetOverrides` se lee en `nutritionTotals`.
- `lib/nutrition/targets.ts`: `TargetOverrides`, `parseTargetOverrides`, `OVERRIDE_MAX`. `dailyTargets` da prioridad al override y escala las bandas min/max en la misma proporción.
- `app/styles/nutri.css`: bloque de Perfil + aviso de alergia. Las reglas de preferencias (reduced-motion/transparency, contrast) van al final de la hoja.

## Bug encontrado y arreglado

postgres.js mandaba `JSON.stringify(...)::jsonb` como string JSON. Así `jsonb_typeof` daba `'string'` y la función devolvía false, con lo que el PATCH con overrides daba 404. Ahora se usa `tx.json(...)`.

## Verificación (lock `.tmp-verify/browse.lock` creado y borrado; capturas en `.tmp-verify/rd-N6/`)

- `npx tsc --noEmit`: limpio.
- Guardar y recargar como Amanda a 390: alergias (escrita, sugerida y añadida al salir del campo), objetivo, interruptor, kcal 3.500 e hierro 15. Todo persiste y no hay errores de consola.
- Aviso en la ficha a 390 (martes 10, comida): «Alergia Pescado: Pescado blanco · Intolerancia Lactosa: queso opcional». Con Lácteos sale también «queso opcional».
- Anillos: la energía con override es 3.000 y sin él 3.408; la proteína con override de g/kg cambia como se espera.
- Admin (adriivalle): GET 200 y PATCH completo 200. Los duplicados se deduplican. Mandar solo una parte del cuerpo da 422, y un valor fuera de rango o una clave desconocida también dan 422.
- No hay scroll horizontal a 390 (scrollWidth 390 en Perfil y en la ficha). Las dianas son ≥44: quitar chip 28px + área ::after hasta 44, «restablecer» 44×44. El foco es visible.
- Datos de desarrollo restaurados a los originales (Ricardo 2001-06-21/191/85, campos de dieta vacíos; Adrián y Francisco intactos).

## Duda

(vacío)

Nota menor, decidida sin bloquear: si Amanda fija las kcal a mano, la grasa no se recalcula y sigue con el valor calculado. Lo dejé así porque cada objetivo propio es independiente y la grasa también se puede fijar a mano.

- Bloquea a Adrián: no
