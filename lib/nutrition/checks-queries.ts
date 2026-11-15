import type { Tx } from "@/lib/db";
import type { MealCheck, MealCheckStatus } from "@/lib/types";

/**
 * Check de comidas del deportista (tabla `meal_checks`, uno por franja). El acceso lo decide quien llama;
 * todas las consultas filtran además por deportista y van dentro de withRls.
 */

type CheckRow = {
  meal_slot_id: string;
  status: MealCheckStatus;
  note: string | null;
  has_photo: boolean;
  checked_at: string;
};

function toCheck(r: CheckRow): MealCheck {
  return {
    mealSlotId: r.meal_slot_id,
    status: r.status,
    note: r.note?.trim() || null,
    hasPhoto: r.has_photo,
    checkedAt: r.checked_at
  };
}

/** Checks de las franjas de un deportista en un día. */
export async function mealChecksForDay(tx: Tx, athleteId: string, date: string): Promise<MealCheck[]> {
  const rows = await tx<CheckRow[]>`
    select mc.meal_slot_id, mc.status, mc.note,
      (mc.photo_bytes is not null and octet_length(mc.photo_bytes) > 0) as has_photo,
      mc.checked_at::text
    from meal_checks mc
    join meal_slots ms on ms.id = mc.meal_slot_id
    where ms.athlete_id = ${athleteId} and ms.date = ${date}::date
  `;
  return rows.map(toCheck);
}

/**
 * Franja del deportista que aún se puede marcar: existe, es suya y no es de un día futuro
 * (margen de un día por la zona horaria del navegador). Devuelve su fecha o null.
 */
export async function checkableSlot(tx: Tx, slotId: string, athleteId: string) {
  const rows = await tx<{ date: string }[]>`
    select date::text from meal_slots
    where id = ${slotId} and athlete_id = ${athleteId} and date <= current_date + 1
    limit 1
  `;
  return rows[0]?.date ?? null;
}

/** Marca Hecho / A medias / No. Cambiar de estado conserva el comentario y la foto. */
export async function setMealCheckStatus(tx: Tx, slotId: string, status: MealCheckStatus): Promise<MealCheck | null> {
  const rows = await tx<CheckRow[]>`
    insert into meal_checks (meal_slot_id, status)
    values (${slotId}, ${status})
    on conflict (meal_slot_id) do update set status = excluded.status, checked_at = now()
    returning meal_slot_id, status, note,
      (photo_bytes is not null and octet_length(photo_bytes) > 0) as has_photo,
      checked_at::text
  `;
  return rows[0] ? toCheck(rows[0]) : null;
}

/**
 * Comentario y foto de un check ya marcado. `photo`: undefined = no tocarla, null = quitarla.
 * Devuelve null si la franja aún no tiene check.
 */
export async function setMealCheckDetails(
  tx: Tx,
  slotId: string,
  note: string | null,
  photo: { bytes: Buffer; mime: string } | null | undefined
): Promise<MealCheck | null> {
  const keep = photo === undefined;
  const bytes = photo ? photo.bytes : null;
  const mime = photo ? photo.mime : null;
  const rows = await tx<CheckRow[]>`
    update meal_checks set
      note = ${note},
      photo_bytes = case when ${keep}::boolean then photo_bytes else ${bytes}::bytea end,
      photo_mime = case when ${keep}::boolean then photo_mime else ${mime}::text end,
      checked_at = now()
    where meal_slot_id = ${slotId}
    returning meal_slot_id, status, note,
      (photo_bytes is not null and octet_length(photo_bytes) > 0) as has_photo,
      checked_at::text
  `;
  return rows[0] ? toCheck(rows[0]) : null;
}

/** Quita la marca (con su comentario y su foto). */
export async function clearMealCheck(tx: Tx, slotId: string) {
  await tx`delete from meal_checks where meal_slot_id = ${slotId}`;
}

/** Foto del plato real que subió el deportista, o null. */
export async function mealCheckPhoto(tx: Tx, athleteId: string, slotId: string) {
  const rows = await tx<{ photo_bytes: Buffer | Uint8Array | null; photo_mime: string | null }[]>`
    select mc.photo_bytes, mc.photo_mime
    from meal_checks mc
    join meal_slots ms on ms.id = mc.meal_slot_id
    where mc.meal_slot_id = ${slotId} and ms.athlete_id = ${athleteId}
    limit 1
  `;
  const row = rows[0];
  if (!row?.photo_bytes || !row.photo_bytes.length) return null;
  return { bytes: Buffer.from(row.photo_bytes), mime: row.photo_mime || "image/jpeg" };
}
