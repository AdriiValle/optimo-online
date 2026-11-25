# from-opus-plan-nutri-macros

- **Hecho:** sí
- **Qué cambió (rutas):**
  - `workflow/briefs/plan-nutri-macros.md` (nuevo; commit `e5325cf` en `dev`)
  - No se ha tocado `app/nutricion/**` ni `app/globals.css`.
- **Duda:** de dónde salen los gramos. El Word de Amanda no trae cantidades; ella las da aparte, por tipo de día (descanso / entreno / partido) y por parte del plato. Sin esa tabla, O3 solo puede guardar gramos metidos a mano.
- **Recomendación:** pedir a Amanda su tabla de «cantidades por tipo de día» (ya aparece en el PDF de Pablo) antes de lanzar O3. O1 y O2 no dependen de ella y pueden arrancar ya. La fuente de nutrientes empieza con USDA FoodData Central (CC0, sin problema legal). BEDCA (O6, falta revisar la licencia) y el LLM (O5, cuesta API) quedan como opcionales, los decide Adrián cuando toque, y no bloquean nada.
- **Bloquea a Adrián:** no. (Solo O5 y O6, que son opcionales, necesitan su sí: dinero y legal.)

## Para Adrián: resumen del plan

**Qué haríamos primero:** O1 + O2, en paralelo.
- **O1:** las tablas en la base de datos (catálogo de alimentos por 100 g, ingredientes de cada plato con gramos, plantillas de raciones) y unos 80 alimentos sacados de los menús reales.
- **O2:** un lector del texto del plato que lo parte en verdura / proteína / hidrato y reconoce cada alimento. Se comprueba con el menú de ejemplo: al menos el 90 % de las líneas reconocidas.

**Por qué en este orden:** son la base de todo, no tocan la pantalla y no necesitan nada de Amanda.

**Después:**
- **O3:** los gramos, que salen de las raciones de Amanda según el tipo de día (partido / entreno / descanso, tomado del calendario MD). Amanda revisa y confirma.
- **O4:** los números en el resumen.

**Por qué así y no con IA:** un LLM inventaría gramos y cifras que nadie puede comprobar. Con ingredientes + gramos + tabla oficial, cada número se puede revisar y Amanda lo firma.

**Regla de pantalla:** solo cuentan los platos confirmados, y siempre se dice cuántos: «1.840 kcal · 3/5 platos». Sin datos sigue saliendo «pendiente», como ahora. Re-importar el Word no borra lo que Amanda ya confirmó.
