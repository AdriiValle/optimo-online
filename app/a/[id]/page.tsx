import { notFound } from "next/navigation";
import { currentUser, rlsFrom, validAthleteId } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { athleteHome, athleteProfile, diaryHistory, integrationFor } from "@/lib/queries";
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
  if (!validAthleteId(id)) notFound();
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

  // Lecturas independientes en paralelo, cada una en su tx (dentro de una misma tx se serializan).
  const ctx = rlsFrom(user);
  const [home, history, adminIntegration, profile] = await Promise.all([
    withRls(ctx, (tx) => athleteHome(tx, id, historyTo)),
    isAdmin ? withRls(ctx, (tx) => diaryHistory(tx, id, historyFrom, historyTo)) : null,
    isAdmin ? withRls(ctx, (tx) => integrationFor(tx, id)) : null,
    isAdmin ? withRls(ctx, (tx) => athleteProfile(tx, id)) : null
  ]);
  if (!home) notFound();
  const data = { home, history, adminIntegration, profile };

  return (
    <>
      <BrandHeader
        leading={isAdmin ? <HeaderBackButton href="/panel" /> : null}
        trailing={isAdmin ? <LogoutButton /> : <HeaderActions settingsHref="/ajustes" />}
      />
      <main className={isAdmin ? "page" : "page page--tabbar"}>
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
          adminProfile={
            data.profile
              ? {
                  birthDate: data.profile.birthDate,
                  heightCm: data.profile.heightCm,
                  weightKg: data.profile.weightKg,
                  allergies: data.profile.allergies,
                  intolerances: data.profile.intolerances
                }
              : null
          }
          callbackDevice={callbackDevice}
          callbackMsg={callbackMsg}
        />
      </main>
    </>
  );
}
