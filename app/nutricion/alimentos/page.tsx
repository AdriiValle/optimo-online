import { notFound, redirect } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { listFoods, orphanGroups } from "@/lib/nutrition/foods-queries";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { LogoutButton } from "@/app/logout-button";
import { FoodsClient } from "./foods-client";

/** Catálogo global de alimentos (Amanda): ficha de compra de cada alimento y bandeja de ingredientes sin alimento. */
export default async function AlimentosPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "nutritionist") notFound();

  // Sin parámetros, las dos lecturas se encadenan en la misma tx (un viaje, no dos).
  const [foods, orphans] = await withRls(rlsFrom(user), (tx) => Promise.all([listFoods(tx), orphanGroups(tx)]));

  return (
    <>
      <BrandHeader
        wide
        meta="Alimentos"
        leading={<HeaderBackButton href="/nutricion" label="Nutrición" />}
        trailing={
          <div className="top-actions nut-top-actions">
            <LogoutButton inline />
          </div>
        }
      />
      <main className="page nut-foods-page">
        <FoodsClient initialFoods={foods} initialOrphans={orphans} />
      </main>
    </>
  );
}
