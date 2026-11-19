import { sql, type Tx } from "@/lib/db";
import type { UserRole } from "@/lib/types";

export type RlsContext = {
  role: UserRole;
  accountId: string | null;
  athleteId: string | null;
};

/** Valores de sesión que pueden ir como literal sin riesgo (rol, uuid). */
const SAFE_VALUE = /^[A-Za-z0-9_-]*$/;

/**
 * Transacción con el contexto RLS fijado.
 *
 * Velocidad: con `prepare: false` (pooler de Neon), cada consulta con parámetros cuesta 2 viajes
 * (Parse/Describe y luego Bind/Execute) y no se encadena con la siguiente. Por eso el `set_config`
 * va por el protocolo simple (sin parámetros, valores literales validados): 1 viaje que se envía
 * junto con la primera consulta de `fn`, sin esperar su respuesta. Orden garantizado: postgres.js
 * ejecuta en la conexión de la tx en el orden en que se lanzan; si falla, la tx entera falla
 * (postgres.js recoge el error de la consulta no esperada y lo relanza).
 *
 * Dentro de una misma tx, `Promise.all` NO acelera (las consultas con parámetros se serializan).
 * Para lecturas independientes, usar varias `withRls` en paralelo.
 */
export async function withRls<T>(ctx: RlsContext, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const role = ctx.role;
  const accountId = ctx.accountId ?? "";
  const athleteId = ctx.athleteId ?? "";
  const literal = SAFE_VALUE.test(role) && SAFE_VALUE.test(accountId) && SAFE_VALUE.test(athleteId);
  return sql().begin(async (tx) => {
    if (literal) {
      tx.unsafe(
        `select set_config('app.current_role', '${role}', true), set_config('app.account_id', '${accountId}', true), set_config('app.athlete_id', '${athleteId}', true)`
      ).execute();
    } else {
      await tx`
        select
          set_config('app.current_role', ${role}, true),
          set_config('app.account_id', ${accountId}, true),
          set_config('app.athlete_id', ${athleteId}, true)
      `;
    }
    return fn(tx);
  }) as Promise<T>;
}
