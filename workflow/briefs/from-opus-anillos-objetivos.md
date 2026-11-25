# from-opus-anillos-objetivos

Commit `e9d33e5` en `dev`: `feat(nutricion): anillos con objetivos del perfil`.

## Qué cambió (rutas)
- `lib/nutrition/targets.ts` (nuevo): `dailyTargets(perfil, tipoDía)`, `averageTargets`, `ringStatus`. Funciones puras. Sin perfil completo devuelve `null`.
- `lib/queries.ts`: `NutritionTotals.profile = { weightKg, heightCm, ageYears }`. La edad se calcula en SQL con `age(birth_date)`. Se mantiene `weightKg` arriba del todo para no romper nada.
- `app/nutricion/[athleteId]/nutrition-summary.ts`: `countedDates` (los días con datos), que sirven para el objetivo medio.
- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`: `Ring` nuevo (objetivo, estado, marca y texto) y `WeekPanel` con objetivos. Añadido un anillo de Grasa. `PerKgRing` desaparece porque lo absorbe `Ring`. Sin perfil, «Completar perfil» abre `AthleteProfileForm` en `NutModal`.
- `app/globals.css`: estados `.nut-ring--{low,ok,over,cap-ok,cap-over,partial}`, `.nut-ring-mark`, `.nut-ring-state`, `.nut-ring--sm`, `.nut-dash-goal` y keyframe `nut-ring-fill` (que `prefers-reduced-motion` anula con la regla global que ya había).

## Fórmulas y supuestos
- Energía: Mifflin-St Jeor para hombre (10·kg + 6,25·cm − 5·edad + 5), multiplicado por un factor según el día: 1,5 en descanso, 1,75 en entreno (MD±n) y 1,9 en partido (MD).
- Proteína: 1,6–2,0 g/kg, con meta en 1,8.
- Hidratos: descanso 3–5 g/kg (meta 4), entreno 5–7 (meta 6), partido 6–10 (meta 8).
- Grasa: 25–30 % de las kcal del día (meta 27,5 %).
- Micros: fibra ≥ 30 g, sodio ≤ 2300 mg (es un tope), hierro ≥ 11 mg, calcio ≥ 1000 mg (1300 mg si tiene menos de 19 años), vitamina D ≥ 15 µg.
- Cada anillo compara la **media por día con datos** con el **objetivo diario medio de esos días** (según el tipo de día de cada uno). Si todavía no hay días con datos, se usa el objetivo de todo el periodo.
- Estados: bajo por debajo del 85 %, en rango entre 85 y 110 %, pasado por encima del 110 %. En los «min» (fibra, hierro, calcio, vit D) pasar de la meta cuenta como en rango. El sodio solo tiene dos estados: bajo tope o sobre tope.
- Cuando faltan platos por cuantificar, o algún alimento no trae el dato («≥»), el estado «bajo» o «pasado» se cambia por «Parcial» en gris. El anillo de Energía enseña además «X/Y platos».

## Verificado
- `npx tsc --noEmit` limpio.
- En `localhost:3001` a 1280 px, con la sesión de Amanda (cookie de `.tmp-verify/amanda.jar`, sin escribir ninguna contraseña), revisé las vistas día, semana y mes:
  - Los anillos se rellenan y el estado aparece en texto.
  - En el mes, con 36/42 platos cuantificados, todo sale «Parcial».
- Sin perfil (lo simulé interceptando la respuesta en el navegador, sin tocar la BD): aparece el aviso con el botón, no sale ningún NaN y proteína e hidratos dicen «Falta peso».
- Abrí «Completar perfil» y guardé los mismos valores que ya tenía: el panel recalculó los objetivos sin recargar la página. Escape cierra el modal.
- A 375 px no hay scroll horizontal.

## Dudas / notas
- Con el menú actual (solo comida y cena) la energía sale muy baja (~890 de 3133 kcal/día) y casi todo aparece como «Falta». Es cierto respecto a lo que hay planificado, pero desayuno, media mañana y merienda no están en el menú.
- Los objetivos usan la fórmula de hombre porque el perfil no guarda el sexo.
- En móvil (< 1280 px) el resumen nutricional no se ve: ya era así antes (`.nut-week` va con `display:none`) y no lo he tocado.
- En consola sigue saliendo un aviso de `key` en `HeaderMarkup` desde `page.tsx` que ya estaba antes. No es de este diff.
