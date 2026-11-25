# from-worker: plan-anillos-objetivos

- **Hecho:** sí. Commit `e9d33e5` en `dev`, `feat(nutricion): anillos con objetivos del perfil`.
- **Qué cambió (rutas):**
  - `lib/nutrition/targets.ts` (nuevo)
  - `lib/queries.ts` (`NutritionTotals.profile`)
  - `app/nutricion/[athleteId]/nutrition-summary.ts` (`countedDates`)
  - `app/nutricion/[athleteId]/nutricion-athlete-client.tsx` (`Ring` y `WeekPanel` con objetivos, estado y aviso «Completar perfil»; anillo de Grasa)
  - `app/globals.css` (estados `.nut-ring--*`, marca, `.nut-dash-goal`, animación del relleno)
  - Detalle con fórmulas, supuestos y verificación: `workflow/briefs/from-opus-anillos-objetivos.md`
- **Duda:** los objetivos usan la fórmula de hombre porque no hay campo de sexo. Además, con el menú actual (solo comida y cena) la energía sale como ~28 % del objetivo y casi todos los anillos dicen «Falta».
- **Recomendación:** que la nutricionista revise los factores de actividad y las metas de hidratos por tipo de día, que están en un único bloque de constantes en `targets.ts`. Si hay o va a haber deportistas mujeres, añadir el sexo al perfil más adelante. El resumen sigue oculto en móvil (< 1280), como ya estaba antes.
- **Bloquea a Adrián:** no.
