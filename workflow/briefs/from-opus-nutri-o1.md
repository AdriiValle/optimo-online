# from-opus-nutri-o1

- **Hecho:** sí
- **Qué cambió (rutas)** — commit `76e98e2` en `dev`:
  - `db/schema.sql` (+95, aditivo, al final): tablas `foods`, `meal_items`, `portion_templates` y columna `meal_slots.items_text_hash`. Todo idempotente (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`). Tipos de texto con `CHECK` (`source`, `role`, `origin`, `day_type`); `grams >= 0`; los nutrientes de `foods` son `numeric` y aceptan null (null ≠ 0). `portion_templates` lleva `UNIQUE NULLS NOT DISTINCT (athlete_id, day_type, slot, role)`, así que la plantilla general (`athlete_id` null) tampoco admite duplicados. Hace falta PG15 o superior; Neon tiene la 18.6.
  - RLS (ENABLE + FORCE, mismo patrón que el resto):
    - `foods`: cualquier sesión puede leer; solo admin y nutricionista escriben.
    - `meal_items`: se resuelve con `EXISTS` sobre `meal_slots`. El deportista lee los suyos; escriben admin y la nutricionista asignada.
    - `portion_templates`: el deportista lee las suyas; la nutricionista lee y escribe las generales y las de sus deportistas asignados.
  - `db/seed-foods.ts` y `package.json` (`db:seed-foods`): 86 alimentos sacados del Ejemplo y del plan de Pablo. Valores de USDA FDC SR Legacy por 100 g, obtenidos del CSV oficial, con `source_ref = fdc_id` y la descripción FDC como comentario en cada fila. Cereales, pasta y legumbre van en crudo. Upsert por `name_es` que solo actualiza filas `source='fdc'` y solo si algo cambió, para no pisar ediciones manuales de Amanda.
- **Verificado:**
  - `db:migrate` 2 veces: `migrate ok` las dos.
  - `db:seed-foods` 2 veces: «86 insertadas», luego «0 insertadas · 0 actualizadas · 86 en foods».
  - `tsc --noEmit` = 0.
  - RLS probado con un rol temporal sin bypass, dentro de una transacción con rollback que no deja rastro:
    - Deportista: lee foods (86). Insertar en `foods`, `meal_items` y `portion_templates` → 42501.
    - Amanda: inserta en `foods`, en `meal_items` del slot de Visus y en una plantilla general. Duplicar la general → 23505. Insertar para un deportista no asignado → 42501.
    - El deportista ve el item de su slot.
- **Duda:**
  1. La app conecta como `neondb_owner`, que tiene `BYPASSRLS`, así que en runtime **ninguna** política RLS del repo se aplica (tampoco las que ya existían). Es un problema previo, fuera de este brief, y no lo he tocado.
  2. Hay alimentos del menú sin equivalente en FDC que no metí para no inventar: dorada, merluza, melva y jamón serrano. O2 los sacará como no casados.
- **Recomendación:**
  1. Brief aparte: rol de app sin bypass (`NOBYPASSRLS`), con `GRANT` por tabla, en `DATABASE_URL`.
  2. Añadir esos 4 con `source='manual'` (valores que dé Amanda) o en O6 desde BEDCA.
- **Bloquea a Adrián:** no.

## Para Adrián
Ya está la base para calcular macros: la DB tiene las tablas nuevas y un catálogo de 86 alimentos con datos oficiales USDA; todavía no hay cambios visibles en la app.
