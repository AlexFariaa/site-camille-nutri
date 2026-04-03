import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, InstagramLogo, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";

export function Footer() {
  const WHATSAPP_LINK = "https://wa.me/5511956831515?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20saber%20como%20funciona%20sua%20consulta%21";

  return (
    <footer className="bg-primary text-background-offwhite pt-20 pb-12 px-6 md:px-12 border-t border-primary/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20 relative z-10">
        
        {/* Col 1: Brand & Map */}
        <div className="flex flex-col gap-6">
          <Image
            src="/images/marrom_corte.png"
            alt="Camille Barbosa Logo"
            title="Camille Barbosa"
            width={320}
            height={85}
            className="w-full max-w-[280px] md:max-w-[320px] h-auto object-contain object-left mb-2"
            priority
          />
          <p className="text-white/60 font-light text-sm leading-relaxed">
            Transformando sua vida através da nutrição consciente e sem terrorismo alimentar. Seu resultado é construído com você.
          </p>
          
          <div className="w-full h-40 rounded-2xl overflow-hidden border border-white/10 mt-2">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117006.1471775798!2d-46.73695240217594!3d-23.593455112521105!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce448183a461d1%3A0x9ba94b08ff335bae!2sS%C3%A3o%20Paulo%2C%20SP!5e0!3m2!1sen!2sbr!4v1700000000000!5m2!1sen!2sbr" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            ></iframe>
          </div>
        </div>

        {/* Col 2: Contato */}
        <div className="flex flex-col gap-6">
          <h4 className="text-xl font-medium mb-2">Contato</h4>
          <div className="flex items-start gap-4 text-white/70">
            <MapPin size={24} weight="duotone" className="shrink-0 text-accent" />
            <div>
              <p className="font-medium text-white">Atendimento Online</p>
              <p className="text-sm">São Paulo - SP</p>
              <p className="text-xs text-white/50 mt-1">Conectada com você em qualquer lugar do mundo.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-white/70">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <p className="font-medium">Telefone / WhatsApp</p>
              <p className="text-sm">+55 (11) 95683-1515</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-white/70 mt-2">
             <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-primary transition-all">
               <InstagramLogo size={20} />
             </a>
             <span className="text-sm border-b border-transparent hover:border-white transition-all cursor-pointer">@camillebarbosanutri</span>
          </div>
        </div>

        {/* Col 3: Links */}
        <div className="flex flex-col gap-6">
          <h4 className="text-xl font-medium mb-2">Acesso Rápido</h4>
          <nav className="flex flex-col gap-4 text-white/60 text-sm">
            <Link href="/#sobre" className="hover:text-accent transition-colors flex items-center gap-2">
              <ArrowRight size={14} /> Sobre Mim
            </Link>
            <Link href="/#metodologia" className="hover:text-accent transition-colors flex items-center gap-2">
              <ArrowRight size={14} /> Metodologia
            </Link>
            <Link href="/#planos" className="hover:text-accent transition-colors flex items-center gap-2">
              <ArrowRight size={14} /> Planos
            </Link>
          </nav>

          <div className="mt-4 p-6 rounded-2xl bg-secondary/10 border border-secondary/20 hover:border-accent/40 transition-colors group">
            <p className="font-medium mb-2 text-white">Conteúdos Educativos</p>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">Dicas, receitas e muita informação de valor para o seu dia a dia.</p>
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-accent group-hover:text-white transition-colors font-medium">
              Acessar o Blog <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-white/10 mt-16 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-sm">
        <p>© 2026 Camille Barbosa Nutrição. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
