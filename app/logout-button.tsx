import { signOut } from "@/lib/auth";

export function LogoutButton() {
  return (
    <form
      className="top-actions"
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
