import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { panelCards } from "@/lib/queries";
import { todayKey } from "@/lib/dates";
import { LogoutButton } from "@/app/logout-button";
import { BrandHeader } from "@/app/components/brand-header";
import { CreateAthleteForm } from "./create-form";

export default async function PanelPage() {
  const user = await currentUser();
  if (!user || user.role !== "admin") notFound();
  const today = todayKey();

  const cards = await withRls(rlsFrom(user), (tx) => panelCards(tx, today));

  return (
    <main className="page">
      <BrandHeader meta="Panel" trailing={<LogoutButton />} />
      <section className="stack">
        <h1>Deportistas</h1>
        <div className="athlete-list">
          {cards.map((a) => (
            <Link key={a.id} className="athlete-card card" href={`/a/${a.id}`}>
              <img
                className="avatar"
                src={a.hasPhoto ? `/api/athletes/${a.id}/photo` : "/logo-optimo.png"}
                alt=""
              />
              <div>
                <strong>{a.name}</strong>
                <div className="muted">
                  {a.sport === "football" ? "Fútbol" : a.sport === "running" ? "Running" : "Otro"}
                  {a.team ? ` · ${a.team}` : ""}
                  {a.shirtNumber ? ` #${a.shirtNumber}` : ""}
                </div>
                <div className="muted">
                  Recuperación hoy: {a.recovery === null ? "—" : a.recovery}
                </div>
                <div className="muted">
                  Lesión abierta: {a.injury ? a.injury.zone : "—"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <CreateAthleteForm />
    </main>
  );
}
