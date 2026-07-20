import "./globals.css";

export const metadata = {
  title: "Mi Ficha — Control de finanzas",
  description: "Llevá el control de tus ingresos y gastos, quincena a quincena.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
