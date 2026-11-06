import type { Tx } from "@/lib/db";
import {
  deleteUnconfirmedMealItems,
  foodsForDrafts,
  hasConfirmedMealItems,
  insertDraftMealItems,
  mealSlotsForDrafts,
  portionTemplatesFor,
  setMealSlotItemsHash
} from "@/lib/queries";
import { dayTypeFromMdTag } from "./day-type";
import { buildDraftItems, catalogFromFoods, dishText, dishTextHash } from "./drafts";

export type DraftSummary = {
  slotsSeen: number;
  slotsDrafted: number;
  slotsUnchanged: number;
  /** Platos con items confirmados del texto vigente: no se generan borradores encima. */
  slotsConfirmedKept: number;
  itemsCreated: number;
  itemsDeleted: number;
};

/**
 * Borradores para los platos del rango (o de los ids dados). Por plato:
 * hash igual al de la última generación → nada (re-import idéntico no duplica), salvo `force`;
 * si no → borra los no confirmados y genera borradores, salvo que ya haya confirmados del texto vigente.
 * Los confirmados de un texto anterior no se tocan: quedan obsoletos por su `text_hash`.
 */
export async function generateMealItemDrafts(
  tx: Tx,
  athleteId: string,
  range: { from: string; to: string } | { ids: string[] },
  opts: { force?: boolean } = {}
): Promise<DraftSummary> {
  const summary: DraftSummary = {
    slotsSeen: 0,
    slotsDrafted: 0,
    slotsUnchanged: 0,
    slotsConfirmedKept: 0,
    itemsCreated: 0,
    itemsDeleted: 0
  };
  const slots = await mealSlotsForDrafts(tx, athleteId, range);
  summary.slotsSeen = slots.length;
  if (!slots.length) return summary;

  const foodRows = await foodsForDrafts(tx);
  const foods = new Map(foodRows.map((f) => [f.id, f]));
  const catalog = catalogFromFoods(foodRows);
  const templates = await portionTemplatesFor(tx, athleteId);

  for (const slot of slots) {
    const hash = dishTextHash(slot.title, slot.preparation);
    if (!opts.force && slot.itemsTextHash === hash) {
      summary.slotsUnchanged++;
      continue;
    }
    summary.itemsDeleted += await deleteUnconfirmedMealItems(tx, slot.id);
    if (await hasConfirmedMealItems(tx, slot.id, hash)) {
      summary.slotsConfirmedKept++;
    } else {
      const items = buildDraftItems(dishText(slot.title, slot.preparation), {
        catalog,
        foods,
        templates,
        athleteId,
        dayType: dayTypeFromMdTag(slot.mdTag),
        slot: slot.slot
      });
      summary.itemsCreated += await insertDraftMealItems(tx, slot.id, hash, items);
      summary.slotsDrafted++;
    }
    await setMealSlotItemsHash(tx, slot.id, hash);
  }
  return summary;
}
