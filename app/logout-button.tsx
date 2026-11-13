import { signOut } from "@/lib/auth";

type Props = {
  /** Dentro de `.top-actions` compartido con Ajustes */
  inline?: boolean;
};

export function LogoutButton({ inline }: Props) {
  return (
    <form
      className={inline ? "logout-inline" : "top-actions"}
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button className="header-btn" type="submit">
        Salir
      </button>
    </form>
  );
}
