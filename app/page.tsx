import { redirect } from "next/navigation";
import { currentUser, validAthleteId } from "@/lib/auth";

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/panel");
  if (user.role === "nutritionist") redirect("/nutricion");
  if (validAthleteId(user.athleteId)) redirect(`/a/${user.athleteId}`);
  redirect("/login");
}
