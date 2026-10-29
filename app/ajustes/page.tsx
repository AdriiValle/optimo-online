import { notFound, redirect } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { athleteByAccountId } from "@/lib/queries";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { LogoutButton } from "@/app/logout-button";
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
      <BrandHeader
        meta="Ajustes"
        leading={<HeaderBackButton href={`/a/${athlete.id}`} />}
        trailing={<LogoutButton />}
      />
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
