import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const font = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rust Plus Web | Tactically Superior Dashboard",
  description: "Accede al mapa, chat y cámaras de tus servidores de Rust desde la web.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={font.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
