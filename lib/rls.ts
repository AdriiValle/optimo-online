import { sql, type Tx } from "@/lib/db";
import type { UserRole } from "@/lib/types";

export type RlsContext = {
  role: UserRole;
  accountId: string | null;
  athleteId: string | null;
};

export async function withRls<T>(ctx: RlsContext, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return sql().begin(async (tx) => {
    await tx`select set_config('app.current_role', ${ctx.role}, true)`;
    await tx`select set_config('app.account_id', ${ctx.accountId ?? ""}, true)`;
    await tx`select set_config('app.athlete_id', ${ctx.athleteId ?? ""}, true)`;
    return fn(tx);
  });
}
