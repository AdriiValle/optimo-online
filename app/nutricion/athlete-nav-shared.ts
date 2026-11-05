import type { NutritionistAthleteCard } from "@/lib/queries";

export function sportLine(a: NutritionistAthleteCard) {
  const sport = a.sport === "football" ? "Fútbol" : a.sport === "running" ? "Running" : "Otro";
  return `${sport}${a.team ? ` · ${a.team}` : ""}${a.shirtNumber ? ` #${a.shirtNumber}` : ""}`;
}

export function athletePhoto(a: NutritionistAthleteCard) {
  return a.hasPhoto ? `/api/athletes/${a.id}/photo` : "/logo-optimo.png";
}
