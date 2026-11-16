"use client";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page">
      <div className="state state--error" role="alert">
        <p className="state-title">No se pudo cargar</p>
        <p className="state-text">Algo ha fallado al abrir esta pantalla. Tus datos están a salvo.</p>
        <button type="button" className="btn btn--tinted" onClick={reset}>
          Reintentar
        </button>
      </div>
    </main>
  );
}
