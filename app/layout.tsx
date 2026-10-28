import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Óptimo — Entrenamientos online",
  description: "Recuperación y plan del día"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
