"use client";

import { useRouter } from "next/navigation";
import { AthleteProfileForm } from "../athlete-profile-form";

/** Formulario ampliado de la pestaña Perfil; al guardar refresca lo que dependa del servidor. */
export function ProfilePanel({ athleteId }: { athleteId: string }) {
  const router = useRouter();
  return <AthleteProfileForm athleteId={athleteId} extended onSaved={() => router.refresh()} />;
}
