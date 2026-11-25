# from-opus-nutri-look-chat

- Hecho: sí (solo comentario, cero código)
- Qué cambió (rutas): solo este archivo, `workflow/briefs/from-opus-nutri-look-chat.md`
- Duda: estética/producto, la decide Adrián con las preguntas de abajo
- Recomendación: A + foto placeholder por categoría ya, subida de Amanda después (detalle abajo)
- Bloquea a Adrián: sí, es decisión de producto (look de la vista Nutrición). No hay nada que ejecutar hasta que elija.

---

## Para Adrián

### Qué hay en cada referencia

**1. Lo de hoy (Semana 2–8 nov).** Rejilla gris de 7×5, todo con el mismo peso visual. Desayuno, Media mañana y Merienda son filas enteras de celdas vacías con un "+", así que el 60 % de la pantalla es hueco gris. Comida y Cena tienen texto, pero la etiqueta `[CARNE]` / `[PESCADO]` es lo primero que lees y se come el nombre del plato, que acaba cortado con "…". No hay ni color, ni imagen, ni kcal. Funciona como hoja de cálculo, no como menú. La cabecera de días (MD-4, MD+1, vs Pogoń) sí está bien y es lo que nos diferencia.

**2. Nutrigo Calendar (mes).** Calendario mensual clásico con eventos como bloques de color por tipo (verde comida, amarillo actividad, naranja citas) y una leyenda con checkboxes para filtrar. A la derecha, un panel de detalle del evento seleccionado. Densidad baja y mucho aire. No lleva fotos: el color hace todo el trabajo.

**3. Nutrigo Meal Plan (semana).** Es la que más se parece a lo que tienes en la cabeza. Está **girado respecto al nuestro**: días en filas, comidas en columnas. Cada columna tiene una cabecera-píldora de color (Breakfast verde, Lunch amarillo, Snack naranja, Dinner gris) y cada celda va tintada suave con ese color. Cada celda es una tarjeta con **foto cuadrada a la izquierda y nombre completo a la derecha** en 2–3 líneas, sin truncar a lo bruto. No hay ninguna celda vacía, y eso es parte de por qué se ve tan bien.

**4. Nutrigo Dashboard (día).** Arriba, KPIs pequeños. En el centro, un anillo grande de kcal restantes y barras de C/P/G. A la derecha, el "menú del día": una mini-tira de semana y debajo cada comida con chip de color, kcal, foto pequeña, nombre y macros en línea. También tiene tarjetas grandes de "Recommended menu" con foto hero.

### Qué duele del nuestro frente a eso

1. **Los huecos mandan.** Tres de las cinco filas están vacías y pintadas de gris, así que el ojo ve vacío antes que comida.
2. **La categoría aparece como texto entre corchetes** cuando debería ser un color o un icono. Eso le roba el espacio al nombre.
3. **Las celdas son demasiado estrechas** para el texto: 7 columnas × 2 líneas no dan para "Ensalada de espinacas baby…".
4. **No hay ningún ancla visual** (ni foto, ni color, ni kcal), y todo pesa lo mismo.

### Qué copiaría (sin Nutrigo y sin el verde lima)

Óptimo es casi monocromo (`--accent: #1D1D1F`, estilo Apple), y el lima chillón chocaría. Me quedaría con la **idea** y no con la paleta:

- **Color por categoría de proteína, no por franja horaria.** Nuestro dato rico es CARNE / PESCADO / HUEVOS / LEGUMBRES, así que el chip `[CARNE]` pasaría a ser un punto o borde de color. Usaría tonos tierra desaturados, por ejemplo: carne terracota, pescado azul pizarra, huevo mostaza suave, legumbre/vegetal salvia. El fondo seguiría blanco o gris muy claro.
- **Tarjeta con foto a la izquierda y nombre limpio a la derecha** (sin el prefijo), con las kcal pequeñas debajo.
- **Ocultar las filas vacías** (Desayuno, Media mañana, Merienda) cuando nadie las usa esa semana. El "+" quedaría en hover o en una sola fila plegada de "Añadir comida".
- **Del dashboard**, el anillo de kcal y las barras de macros para la vista Día. Ya tenemos macros reales desde O4, así que no es humo.

### Cómo encajaría Día / Semana / Mes + rail de Amanda

- **Semana:** la rejilla actual, pero con días en columnas (mantiene la cabecera MD-x, que es lo nuestro), solo las filas con contenido y tarjetas con foto y color. Si no caben 7 columnas con foto, la opción es girarla como Nutrigo (días en filas) y ganar ancho para el nombre. Ver pregunta 1.
- **Día:** al estilo dashboard. Las comidas del día en tarjetas grandes con foto, más el anillo de kcal y los macros. Es donde lucen las fotos.
- **Mes:** al estilo calendario Nutrigo, sin fotos. Cada día lleva 1–2 puntos de color (la categoría de comida y cena) y la marca de partido. Su función es ver de un vistazo la rotación (que no salga carne tres días seguidos).
- **Rail de Amanda:** sigue a la izquierda como ahora. El panel de detalle de la derecha (como el de "Schedule details") podría ser la ficha del plato al pulsar una tarjeta: foto grande, ingredientes con gramos (el editor de O4) y macros. Eso sería una página o drawer nueva, no tocaría el grid.

### Fotos de platos: de dónde

- **Subida de Amanda:** es lo ideal, pero da trabajo. Hacen falta un bucket de Storage, un campo `photo_url` en el plato y un botón para subir o cambiar la foto en la ficha. Si sube una por plato del Word (unos 14 por semana), al principio va a haber huecos.
- **Placeholder por categoría:** una ilustración o foto genérica de carne, pescado, huevo o legumbre según la etiqueta. Sale gratis desde ya y nunca se ve una celda sin imagen.
- **Lo que recomiendo:** las dos, en este orden. Primero el placeholder, para que mañana ya se vea "amable", y la foto real de Amanda lo sustituye cuando la sube. Las fotos generadas por IA o de stock automático las descartaría, porque no serían el plato real del club.

### Para que elijas (4 cortas)

1. **¿Semana con días en columnas (como ahora) o girada con días en filas (como Nutrigo)?** Te recomiendo columnas, para conservar la cabecera MD-x.
2. **¿Color por categoría de proteína (carne, pescado…) o por franja (desayuno, comida…)?** Te recomiendo proteína.
3. **Fotos: ¿empezamos con placeholder por categoría y luego subida de Amanda, o directamente subida?** Te recomiendo placeholder primero.
4. **¿Te vale que la ficha del plato (foto grande, ingredientes, macros) sea una página o drawer nuevo?** ¿Sí o no?
