import { BrandHeader } from "@/app/components/brand-header";

export default function NotFound() {
  return (
    <>
      <BrandHeader meta="Entrenamientos online" />
      <main className="page">
        <section className="card">
          <h1>No encontrado</h1>
          <p className="muted">Esa página no existe.</p>
        </section>
      </main>
    </>
  );
}
