import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const neulis = localFont({
  src: [
    {
      path: "../../public/fonts/Neulis-Thin.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/Neulis-Medium.otf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-neulis",
});

export const metadata: Metadata = {
  title: "Camille Barbosa - Nutrição Personalizada",
  description: "Dieta ao vivo, sem planos prontos. Transformação real com suporte próximo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${neulis.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
