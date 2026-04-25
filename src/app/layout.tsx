import type { Metadata } from "next";
import { Roboto, Barlow } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "Rust Ops | Tactical War Room",
  description: "Dashboard táctico avanzado para servidores de Rust+. Mapa en tiempo real, alertas de raid y gestión de equipo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${roboto.variable} ${barlow.variable}`}>
      <body className={roboto.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
