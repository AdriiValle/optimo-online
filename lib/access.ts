import { notFound } from "next/navigation";
import type { SessionUser } from "@/lib/types";

export function canSeeAthlete(user: SessionUser, athleteId: string) {
  if (user.role === "admin") return true;
  return user.athleteId === athleteId;
}

export function assertAthleteAccess(user: SessionUser | null, athleteId: string) {
  if (!user || !canSeeAthlete(user, athleteId)) notFound();
}

export function assertAdmin(user: SessionUser | null) {
  if (!user || user.role !== "admin") notFound();
}
