import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser, rlsFrom } from "@/lib/auth";
import { withRls } from "@/lib/rls";
import { assignedAthletesForNutritionist } from "@/lib/queries";
import { BrandHeader } from "@/app/components/brand-header";
import { LogoutButton } from "@/app/logout-button";
import { athletePhoto, NutAthleteNav, sportLine } from "./athlete-nav";

export default async function NutricionPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "nutritionist") notFound();

  const athletes = await withRls(rlsFrom(user), (tx) => assignedAthletesForNutritionist(tx, user.id));

  return (
    <>
      <BrandHeader meta="Nutrición" trailing={<LogoutButton />} />
      <main className="page nut-page">
        <div className="nut-desktop nut-desktop-index">
          <NutAthleteNav athletes={athletes} />
          <div className="nut-ws-index">
            <section className="card">
              <h1>Deportistas</h1>
              <p className="muted">Elige un deportista para ver su calendario y preparar su menú.</p>
            </section>
            {athletes.length === 0 ? (
              <p className="muted">Aún no tienes deportistas asignados.</p>
            ) : (
              <div className="athlete-list">
                {athletes.map((a) => (
                  <Link key={a.id} className="athlete-card card" href={`/nutricion/${a.id}`}>
                    <img className="avatar" src={athletePhoto(a)} alt="" />
                    <div>
                      <strong>{a.name}</strong>
                      <div className="muted">{sportLine(a)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
