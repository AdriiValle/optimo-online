import Link from "next/link";
import { LogoutButton } from "@/app/logout-button";

type Props = {
  settingsHref: string;
};

export function HeaderActions({ settingsHref }: Props) {
  return (
    <div className="top-actions">
      <Link className="btn secondary" href={settingsHref}>
        Ajustes
      </Link>
      <LogoutButton inline />
    </div>
  );
}
