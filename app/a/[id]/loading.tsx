/** Mientras llegan los datos: esqueleto neutro, para pintar al instante al navegar (la página sustituye esto entera). */
export default function Loading() {
  return (
    <main className="page" aria-busy="true" aria-label="Cargando">
      <span className="skeleton skeleton--title" />
      <span className="skeleton skeleton--line" />
      <span className="skeleton skeleton--line" style={{ width: "80%" }} />
      <span className="skeleton skeleton--line" style={{ width: "65%" }} />
    </main>
  );
}
