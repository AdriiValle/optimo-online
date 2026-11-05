import Link from "next/link";

function NutRailLogout() {
  return (
    <form
      className="nut-rail-logout"
      action={async () => {
        "use server";
        const { signOut } = await import("@/lib/auth");
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button className="nut-rail-btn nut-rail-btn--muted" type="submit">
        Salir
      </button>
    </form>
  );
}

export { NutRailLogout };
