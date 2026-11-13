import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { LoginForm, type LoginState } from "./login-form";

async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  "use server";
  const email = String(formData.get("email") ?? "");
  try {
    // Si las credenciales valen, signIn lanza la redirección a "/" (que reparte por rol).
    await signIn("credentials", {
      email,
      password: String(formData.get("password") ?? ""),
      redirectTo: "/"
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: true, email };
    throw error;
  }
  return { error: false, email };
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const q = await searchParams;
  return (
    <main className="login">
      <div className="login-panel">
        <header className="login-head">
          <img className="login-logo" src="/logo-optimo.png" width={80} height={80} alt="Óptimo" />
          <h1 className="login-title">Entrar en Óptimo</h1>
          <p className="login-lede">Entrenamientos online</p>
        </header>
        <LoginForm action={login} initialError={Boolean(q.error)} />
      </div>
    </main>
  );
}
