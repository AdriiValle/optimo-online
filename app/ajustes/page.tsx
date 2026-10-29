import { notFound, redirect } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { athleteByAccountId } from "@/lib/queries";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderActions } from "@/app/components/header-actions";
import { AjustesClient } from "./ajustes-client";

export default async function AjustesPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/panel/ajustes");
  if (!user.athleteId) notFound();

  const athlete = await withRls(rlsFrom(user), (tx) => athleteByAccountId(tx, user.id));
  if (!athlete) notFound();

  return (
    <>
      <BrandHeader meta="Ajustes" trailing={<HeaderActions settingsHref="/ajustes" />} />
      <main className="page">
        <AjustesClient
          athleteId={athlete.id}
          initialName={athlete.name}
          email={user.email}
          hasPhoto={athlete.hasPhoto}
        />
      </main>
    </>
  );
}
