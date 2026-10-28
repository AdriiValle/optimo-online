import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/"
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const q = await searchParams;
  return (
    <main className="page">
      <header className="doc-header">
        <div className="brand-row">
          <img className="brand-logo" src="/logo-optimo.png" width={32} height={32} alt="" />
          <span className="brand-title">Óptimo</span>
          <span className="brand-sep" aria-hidden="true">
            ·
          </span>
          <span className="brand-meta">Entrenamientos online</span>
        </div>
      </header>
      <section className="card">
        <h1>Entrar</h1>
        {q.error ? <p className="error">Email o contraseña incorrectos.</p> : null}
        <form action={login}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" required />
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          <button className="btn" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
