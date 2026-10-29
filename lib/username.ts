import { z } from "zod";

export const UsernameSchema = z
  .string()
  .trim()
  .min(1, "El nombre de usuario es obligatorio.")
  .max(200)
  .transform((s) => s.toLowerCase());

export function parseUsername(value: unknown) {
  return UsernameSchema.safeParse(value);
}
