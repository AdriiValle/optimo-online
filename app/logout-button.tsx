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
      <button className="btn secondary" type="submit">
        Salir
      </button>
    </form>
  );
}
