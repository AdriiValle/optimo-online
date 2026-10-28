import { notFound } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { athleteHome } from "@/lib/queries";
import { todayKey } from "@/lib/dates";
import { parseIndexHtml } from "@/lib/html-parse";
import { LogoutButton } from "@/app/logout-button";
import { BrandHeader } from "@/app/components/brand-header";
import { HomeClient } from "./home-client";

export default async function AthleteHome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) notFound();
  if (user.role === "athlete" && user.athleteId !== id) notFound();

  const data = await withRls(rlsFrom(user), (tx) => athleteHome(tx, id, todayKey()));
  if (!data) notFound();

  const parsed = parseIndexHtml();

  return (
    <main className="page">
      <BrandHeader trailing={<LogoutButton />} />
      <HomeClient
        athlete={data.athlete}
        plans={data.plans}
        diary={data.diary}
        injuries={data.injuries}
        crests={parsed.crests}
        canEdit={user.role === "admin" || user.athleteId === id}
      />
    </main>
  );
}
