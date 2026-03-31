import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
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
      <head>
        <Script
          id="gtm-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PX4N64Q9');`,
          }}
        />
      </head>
      <body className={`${neulis.variable} font-sans antialiased`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PX4N64Q9"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
