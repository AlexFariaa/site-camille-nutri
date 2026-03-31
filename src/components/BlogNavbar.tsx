"use client";

import Image from "next/image";
import Link from "next/link";
import { WhatsappLogo } from "@phosphor-icons/react";

export function BlogNavbar() {
  const WHATSAPP_LINK = "https://wa.me/5511956831515?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20saber%20como%20funciona%20sua%20consulta%21";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md bg-background-offwhite/80 border-b border-primary/5">
      <div className="w-40 md:w-48 relative h-12 md:h-14">
        <Link href="/" className="relative block w-full h-full">
          <Image
            src="/images/logo.png"
            alt="Camille Barbosa Logo"
            fill
            sizes="(max-width: 768px) 160px, 192px"
            className="object-contain object-left"
            priority
          />
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <Link href="/blog" className="text-accent hover:text-tertiary transition-colors">Todos os Artigos</Link>
        <Link href="/#sobre" className="text-primary hover:text-accent transition-colors">Sobre a Nutri</Link>
        <Link href="/" className="text-primary hover:text-accent transition-colors">Página Inicial</Link>
      </div>
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 bg-primary text-background-offwhite px-5 py-2.5 rounded-full text-sm hover:bg-secondary transition-colors"
      >
        <WhatsappLogo weight="regular" size={20} />
        <span className="hidden md:block">Agendar Consulta</span>
        <span className="md:hidden">Agendar</span>
      </a>
    </nav>
  );
}
