import Link from "next/link";

export default function NotFound() {
  return (
    <main className="login">
      <div className="login-panel">
        <header className="login-head">
          <img className="login-logo" src="/logo-optimo.png" width={80} height={80} alt="Óptimo" />
          <h1 className="login-title">Página no encontrada</h1>
          <p className="login-lede">La dirección no existe o ya no está disponible.</p>
        </header>
        <Link className="btn btn--lg btn--block" href="/">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
