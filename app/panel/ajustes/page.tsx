import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { HeaderActions } from "@/app/components/header-actions";
import { AdminAjustesClient } from "./admin-ajustes-client";

export default async function PanelAjustesPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") notFound();

  return (
    <>
      <BrandHeader
        meta="Ajustes"
        leading={<HeaderBackButton href="/panel" />}
        trailing={<HeaderActions settingsHref="/panel/ajustes" />}
      />
      <main className="page">
        <AdminAjustesClient />
      </main>
    </>
  );
}
