import { notFound } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { athleteHome, diaryHistory, integrationFor } from "@/lib/queries";
import { polarConfigured } from "@/lib/integrations/config";
import { addDays, dateKey, parseDateLocal, todayKey } from "@/lib/dates";
import { planData } from "@/lib/plan-data";
import { LogoutButton } from "@/app/logout-button";
import { HeaderActions } from "@/app/components/header-actions";
import { BrandHeader } from "@/app/components/brand-header";
import { HeaderBackButton } from "@/app/components/header-back-button";
import { HomeClient } from "./home-client";

export default async function AthleteHome({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const callbackDevice = typeof sp.device === "string" ? sp.device : null;
  const callbackMsg = typeof sp.deviceMsg === "string" ? sp.deviceMsg : null;
  const user = await currentUser();
  if (!user) notFound();
  if (user.role === "nutritionist") notFound();
  if (user.role === "athlete" && user.athleteId !== id) notFound();

  const isAdmin = user.role === "admin";
  const historyTo = todayKey();
  const historyFrom = dateKey(addDays(parseDateLocal(historyTo), -59));

  const data = await withRls(rlsFrom(user), async (tx) => {
    const home = await athleteHome(tx, id, historyTo);
    if (!home) return null;
    const history = isAdmin ? await diaryHistory(tx, id, historyFrom, historyTo) : null;
    const adminIntegration = isAdmin ? await integrationFor(tx, id) : null;
    return { home, history, adminIntegration };
  });
  if (!data) notFound();

  return (
    <>
      <BrandHeader
        leading={isAdmin ? <HeaderBackButton href="/panel" /> : null}
        trailing={isAdmin ? <LogoutButton /> : <HeaderActions settingsHref="/ajustes" />}
      />
      <main className="page">
        <HomeClient
          athlete={data.home.athlete}
          plans={data.home.plans}
          diary={data.home.diary}
          injuries={data.home.injuries}
          crests={planData.crests}
          canEdit={isAdmin || user.athleteId === id}
          isAdmin={isAdmin}
          history={data.history}
          historyFrom={historyFrom}
          historyTo={historyTo}
          polarIntegration={data.home.polarIntegration}
          polarConfigured={polarConfigured()}
          adminIntegration={data.adminIntegration}
          callbackDevice={callbackDevice}
          callbackMsg={callbackMsg}
        />
      </main>
    </>
  );
}
