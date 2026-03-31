"use client";

import { WhatsappLogo, LinkSimple, CheckCircle } from "@phosphor-icons/react";
import { useState, useEffect } from "react";

export function ShareArticle({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.href);
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = `Dá uma olhada nesse artigo da Nutri Camille Barbosa: ${title} - ${url}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="flex items-center gap-4 mt-12 py-6 border-y border-primary/10">
      <span className="text-sm font-medium text-primary/70 uppercase tracking-widest">Compartilhe:</span>
      
      <a 
        href={whatsappUrl} 
        target="_blank" 
        rel="noreferrer"
        className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all"
        title="Compartilhar no WhatsApp"
      >
        <WhatsappLogo size={20} weight="fill" />
      </a>

      <button 
        onClick={handleCopyLink}
        className="w-10 h-10 rounded-full bg-primary/5 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
        title="Copiar Link"
      >
        {copied ? <CheckCircle size={20} weight="fill" className="text-accent" /> : <LinkSimple size={20} weight="bold" />}
      </button>
      
      {copied && <span className="text-xs text-accent font-medium">Link copiado!</span>}
    </div>
  );
}
