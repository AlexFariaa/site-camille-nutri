"use client";

import { motion } from "framer-motion";
import {
  WhatsappLogo, ArrowRight, Check, Leaf, Heartbeat,
  Barbell, Brain, Target, CaretDown, InstagramLogo,
  MapPin, Phone, ArrowUpRight
} from "@phosphor-icons/react";
import { Footer } from "./Footer";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LandingClient() {
  const WHATSAPP_LINK = "https://wa.me/5511956831515?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20gostaria%20de%20saber%20como%20funciona%20sua%20consulta%21";
  const WHATSAPP_BRONZE = "https://wa.me/5511956831515?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20tenho%20interesse%20no%20plano%20Bronze";
  const WHATSAPP_PRATA = "https://wa.me/5511956831515?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20tenho%20interesse%20no%20plano%20Prata";
  const WHATSAPP_OURO = "https://wa.me/5511956831515?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20tenho%20interesse%20no%20plano%20Ouro";

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 20,
      },
    }),
  };

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "A dieta é passada na mesma hora?",
      a: "Sim! Na Metodologia Ao Vivo, seu plano é construído e entregue durante a consulta. Você sai do consultório ou do online sabendo exatamente o que vai comer, sem surpresas."
    },
    {
      q: "Você prescreve manipulados e suplementos?",
      a: "Apenas quando existe real necessidade com base em exames laboratoriais ou objetivos de performance muito específicos. Meu foco principal é sempre ajustar a alimentação básica primeiro."
    },
    {
      q: "Preciso comer alimentos caros?",
      a: "De forma alguma. O plano será construído com alimentos práticos e acessíveis, viáveis para a sua rotina e orçamento. Focamos no básico bem feito."
    },
    {
      q: "Como funciona o suporte via WhatsApp?",
      a: "Durante o período do seu plano, você tem contato direto comigo. Pode tirar dúvidas, pedir substituições em eventos ou viagens e relatar como está se sentindo."
    }
  ];

  return (
    <div className="relative w-full overflow-hidden text-primary selection:bg-accent selection:text-background-offwhite">
      {/* Navbar Minimalista */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 backdrop-blur-md bg-background-offwhite/80 border-b border-primary/5">
        <div className="w-40 md:w-48 relative h-12 md:h-14">
          <Image
            src="/images/logo.png"
            alt="Camille Barbosa Logo"
            title="Camille Barbosa"
            fill
            sizes="(max-width: 768px) 160px, 192px"
            className="object-contain object-left"
            priority
          />
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium">
          <a href="#sobre" className="hover:text-accent transition-colors">Sobre mim</a>
          <a href="#metodologia" className="hover:text-accent transition-colors">Metodologia</a>
          <a href="#planos" className="hover:text-accent transition-colors">Planos</a>
          <Link href="/blog" className="hover:text-accent transition-colors">Blog</Link>
        </div>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-primary text-background-offwhite px-5 py-2.5 rounded-full text-sm hover:bg-secondary transition-colors"
        >
          <WhatsappLogo weight="regular" size={20} />
          Agendar Consulta
        </a>
      </nav>

      {/* Hero Section Assimétrica */}
      <section className="min-h-[100dvh] flex flex-col md:flex-row items-center justify-center pt-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex-1 w-full relative z-10 pt-10 md:pt-0">
          <motion.h1
            custom={1} initial="hidden" animate="visible" variants={fadeIn as any}
            className="text-5xl lg:text-7xl tracking-tighter leading-[1.1] font-medium"
          >
            Sua nutrição,{' '}
            <br className="hidden md:block" />
            <span className="text-secondary italic font-light">ao vivo e real.</span>
          </motion.h1>
          <motion.p
            custom={2} initial="hidden" animate="visible" variants={fadeIn as any}
            className="mt-6 text-lg text-primary/80 max-w-[45ch] font-light leading-relaxed"
          >
            Esqueça as dietas genéricas e o terrorismo alimentar. Construo seu plano junto com você, ajustando cada métrica para caber na sua vida.
          </motion.p>

          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeIn as any} className="mt-10 hidden md:flex flex-col sm:flex-row gap-4">
            <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="group flex items-center justify-between sm:justify-center gap-4 bg-primary text-background-offwhite px-8 py-4 rounded-full text-base font-medium hover:bg-secondary active:scale-[0.98] transition-all">
              <span>Agendar Minha Consulta</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>

        <div className="flex-1 relative w-full h-[50vh] md:h-[80vh] mt-12 md:mt-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md h-full min-h-[400px]"
          >
            <div className="absolute inset-0 bg-secondary/10 rounded-[2.5rem] border border-primary/10 overflow-hidden flex items-center justify-center">
              <div className="w-64 h-64 bg-accent/10 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              <Image
                src="/images/logo.png"
                alt="CB Monogram"
                width={200}
                height={200}
                className="opacity-90 object-contain z-10 drop-shadow-sm"
              />
            </div>
            {/* Floating glassmorphism badge */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="absolute -bottom-6 -left-6 md:-left-12 bg-background-offwhite/80 backdrop-blur-xl border border-white/20 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-5 rounded-2xl flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0">
                <Leaf size={24} weight="fill" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Plano 100% Personalizado</p>
                <p className="text-xs text-primary/60">Feito na hora da consulta</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Mobile Button placed below image */}
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeIn as any} className="w-full mt-16 mb-8 flex md:hidden flex-col sm:flex-row gap-4 z-10">
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="group flex outline-none items-center justify-between sm:justify-center gap-4 bg-primary text-background-offwhite px-8 py-4 rounded-full text-base font-medium hover:bg-secondary active:scale-[0.98] transition-all">
            <span>Agendar Minha Consulta</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </section>

      {/* Sobre Mim */}
      <section id="sobre" className="py-24 px-6 md:px-12 bg-white/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-12 lg:gap-24">

          {/* Mobile Title (visible only on mobile) */}
          <div className="w-full flex md:hidden flex-col justify-center mb-4">
            <span className="text-sm font-medium text-accent tracking-widest uppercase mb-4 block">Sobre Mim</span>
            <h2 className="text-4xl tracking-tight font-medium leading-[1.1] mb-3">
              Prazer, Camille Barbosa.
            </h2>
            <div>
              <span className="inline-block bg-accent text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                CRN - 88629
              </span>
            </div>
          </div>

          {/* Image */}
          <div className="w-full relative">
            <div className="aspect-[4/5] w-full max-w-md mx-auto relative rounded-[2.5rem] overflow-hidden bg-primary/5 border border-primary/10">
              <Image
                src="/images/camille.jpg"
                alt="Camille Barbosa - Nutricionista"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2.5rem]"></div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="absolute -top-12 -right-4 md:-top-8 md:-right-12 bg-accent text-white p-6 rounded-2xl shadow-xl rotate-5"
            >
              <p className="font-serif italic text-lg leading-tight">Nutrição gentil<br />e resolutiva.</p>
            </motion.div>
          </div>

          {/* Text and Desktop Title */}
          <div className="w-full flex flex-col justify-center">
            <span className="hidden md:block text-sm font-medium text-accent tracking-widest uppercase mb-4">Sobre Mim</span>
            <div className="hidden md:flex flex-col items-start gap-4 mb-8">
              <h2 className="text-5xl tracking-tight font-medium leading-[1.1]">
                Prazer, Camille Barbosa.
              </h2>
              <span className="inline-block bg-accent text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
                CRN - 88629
              </span>
            </div>
            <div className="space-y-6 text-primary/70 font-light text-lg leading-relaxed mt-2 md:mt-0">
              <p>
                Acredito que a comida não deve ser fonte de culpa ou punição. Meu propósito na nutrição clínica e esportiva é te ajudar a alcançar seu melhor físico respeitando a fisiologia do seu corpo e a realidade da sua rotina.
              </p>
              <p>
                Para mim, a dieta só funciona se for possível de ser seguida. Por isso, desenvolvi a metodologia da <strong>Dieta ao Vivo</strong>, onde sentamos juntos para definir exatamente o que entra no cardápio, assegurando resultados de ponta sem restrições extremas e desnecessárias.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Público-Alvo: Para quem é? */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl tracking-tight font-medium mb-16 max-w-2xl">A minha metodologia foi desenvolvida para você que busca:</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-background-offwhite border border-primary/10 rounded-[2rem] p-8 hover:bg-white transition-colors group">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
              <Heartbeat size={24} weight="duotone" />
            </div>
            <h3 className="text-xl font-medium mb-3">Emagrecimento Sustentável</h3>
            <p className="text-primary/70 text-sm font-light leading-relaxed">Perda de gordura consistente, sem efeito sanfona e mantendo a massa muscular.</p>
          </div>

          <div className="bg-background-offwhite border border-primary/10 rounded-[2rem] p-8 hover:bg-white transition-colors group">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
              <Barbell size={24} weight="duotone" />
            </div>
            <h3 className="text-xl font-medium mb-3">Ganho de Massa e Força</h3>
            <p className="text-primary/70 text-sm font-light leading-relaxed">Bulking limpo focado em hipertrofia real para mudar significativamente a composição corporal.</p>
          </div>

          <div className="bg-background-offwhite border border-primary/10 rounded-[2rem] p-8 hover:bg-white transition-colors group">
            <div className="w-12 h-12 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary mb-6 group-hover:scale-110 transition-transform">
              <Target size={24} weight="duotone" />
            </div>
            <h3 className="text-xl font-medium mb-3">Performance Esportiva</h3>
            <p className="text-primary/70 text-sm font-light leading-relaxed">Planejamento focado em otimização de energia, recuperação e resultados em treinos ou competições.</p>
          </div>

          <div className="bg-background-offwhite border border-primary/10 rounded-[2rem] p-8 hover:bg-white transition-colors group">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <Brain size={24} weight="duotone" />
            </div>
            <h3 className="text-xl font-medium mb-3">Mudança de Hábitos</h3>
            <p className="text-primary/70 text-sm font-light leading-relaxed">Para quem precisa mudar o estilo de vida, organizar a rotina alimentar de forma prática e fazer as pazes com a comida.</p>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="group flex outline-none items-center justify-center gap-4 bg-primary text-background-offwhite px-8 py-4 rounded-full text-base font-medium hover:bg-secondary active:scale-[0.98] transition-all w-full md:w-auto">
            <WhatsappLogo size={22} weight="regular" />
            <span>Quero agendar agora</span>
          </a>
        </div>
      </section>

      {/* Como funciona / Jornada do Cliente */}
      <section className="py-24 px-6 md:px-12 bg-primary text-background-offwhite">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
          <div className="lg:w-1/3">
            <h2 className="text-3xl md:text-5xl tracking-tight font-medium mb-6 leading-[1.1]">A jornada ao seu resultado.</h2>
            <p className="text-white/60 font-light leading-relaxed">O passo a passo transparente e organizado, desenhado para tirar você do ponto A ao B com total suporte.</p>
          </div>

          <div className="lg:w-2/3 flex flex-col gap-6 relative">
            {/* Timeline vertical line */}
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute left-[27px] top-6 bottom-32 w-px bg-white/30 origin-top z-0"
            ></motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0 }} className="flex gap-6 items-start relative z-10">
              <div className="w-14 h-14 shrink-0 rounded-full bg-primary relative overflow-hidden flex items-center justify-center font-serif text-2xl border border-white/20">
                <div className="absolute inset-0 bg-secondary/30"></div>
                <span className="relative z-10">1</span>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-medium mb-2">Agendamento Simplificado</h3>
                <p className="text-white/60 font-light leading-relaxed">Você escolhe a melhor data e horário através do nosso canal de atendimento de forma rápida.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="flex gap-6 items-start relative z-10">
              <div className="w-14 h-14 shrink-0 rounded-full bg-primary relative overflow-hidden flex items-center justify-center font-serif text-2xl border border-white/20">
                <div className="absolute inset-0 bg-secondary/30"></div>
                <span className="relative z-10">2</span>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-medium mb-2">Análise Pré-Consulta</h3>
                <p className="text-white/60 font-light leading-relaxed">Você recebe um questionário para mapearmos seus hábitos, gostos alimentares e histórico de saúde antes mesmo do nosso encontro.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex gap-6 items-start relative z-10">
              <div className="w-14 h-14 shrink-0 rounded-full bg-accent text-white relative flex items-center justify-center font-serif text-2xl shadow-[0_0_30px_rgba(162,131,95,0.4)]">
                <span className="relative z-10">3</span>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-medium mb-2 text-accent">A Consulta (Dieta ao Vivo)</h3>
                <p className="text-white/70 font-light leading-relaxed">Onde a mágica acontece. Analisamos seu histórico e montamos todo o plano e estratégia na sua frente. Cada refeição discutida com você.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="flex gap-6 items-start relative z-10">
              <div className="w-14 h-14 shrink-0 rounded-full bg-primary relative overflow-hidden flex items-center justify-center font-serif text-2xl border border-white/20">
                <div className="absolute inset-0 bg-secondary/30"></div>
                <span className="relative z-10">4</span>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-medium mb-2">Evolução & Acompanhamento</h3>
                <p className="text-white/60 font-light leading-relaxed">Iniciamos a sua adaptação diária no WhatsApp e você envia fotos corporais confidenciais para que eu avalie resultados que a balança não consegue quantificar.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="flex md:pl-20 mt-6 relative z-10">
              <a href={WHATSAPP_LINK} className="inline-flex outline-none items-center justify-center gap-2 bg-accent text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-white hover:text-primary active:scale-[0.98] transition-all w-full sm:w-auto">
                <WhatsappLogo size={20} />
                Iniciar minha jornada
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Metodologia Bento Grid */}
      <section id="metodologia" className="py-24 px-6 md:px-12 bg-white/50 border-t border-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl tracking-tight font-medium mb-4">Diferenciais da Metodologia</h2>
            <p className="text-primary/60 max-w-[50ch]">O atendimento foca em personalização extrema e suporte constante para garantir que os resultados sejam sustentáveis.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-background-offwhite border border-primary/10 rounded-[2.5rem] p-10 md:p-14">
              <h3 className="text-2xl font-medium mb-4">Dieta ao Vivo</h3>
              <p className="text-primary/70 leading-relaxed font-light">O plano alimentar é construído junto com você durante a consulta, ajustando cada detalhe em tempo real para caber nos seus gostos e no seu bolso.</p>
            </div>
            <div className="bg-primary text-background-offwhite border border-primary/10 rounded-[2.5rem] p-10 md:p-14 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-medium mb-4">Sem Prontos</h3>
                <p className="text-white/70 leading-relaxed font-light">Rejeitamos dietas de gaveta. O foco é 100% na sua rotina real.</p>
              </div>
            </div>
            <div className="md:col-span-3 bg-secondary/10 border border-primary/10 rounded-[2.5rem] p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-medium mb-4">Suporte WhatsApp Diário</h3>
                <p className="text-primary/70 leading-relaxed font-light max-w-2xl">Canal direto comigo para tirar dúvidas, fazer ajustes finos e adaptações diárias sempre que imprevistos na sua rotina acontecerem.</p>
              </div>
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="shrink-0 w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg">
                <WhatsappLogo size={32} weight="fill" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Planos (Renamed) */}
      <section id="planos" className="py-32 px-6 md:px-12 max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-6xl tracking-tight font-medium mb-16 text-center">Conheça os planos</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bronze */}
          <div className="bg-background-offwhite border border-primary/10 rounded-[2.5rem] p-10 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-start relative group">
            <span className="text-sm font-medium text-tertiary mb-6 block uppercase tracking-widest bg-tertiary/10 px-4 py-1.5 rounded-full">Ajuste Inicial</span>
            <h3 className="text-3xl font-medium">Bronze</h3>
            <p className="mt-2 text-3xl font-light text-primary/80">R$ 450</p>
            <p className="text-primary/70 my-8 text-sm leading-relaxed">Indicado para iniciantes que precisam de um caminho claro sem engajamento contínuo longo.</p>

            <ul className="space-y-4 mb-10 w-full flex-1">
              <li className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-accent" weight="bold" />
                </div>
                2 meses de suporte
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-accent" weight="bold" />
                </div>
                Consultas a cada 30 dias
              </li>
            </ul>
            <a href={WHATSAPP_BRONZE} target="_blank" rel="noreferrer" className="w-full text-center bg-primary text-background-offwhite px-6 py-4 rounded-full text-sm font-medium hover:bg-secondary transition-colors mt-auto">Agendar Bronze</a>
          </div>

          {/* Prata */}
          <div className="bg-background-offwhite border border-primary/10 rounded-[2.5rem] p-10 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-start relative group">
            <span className="text-sm font-medium text-tertiary mb-6 block uppercase tracking-widest bg-tertiary/10 px-4 py-1.5 rounded-full">Estratégico</span>
            <h3 className="text-3xl font-medium">Prata</h3>
            <p className="mt-2 text-3xl font-light text-primary/80">R$ 850</p>
            <p className="text-primary/70 my-8 text-sm leading-relaxed">Para quem busca além da alimentação, unindo dieta e plano de treino para impulsionar a evolução e performance.</p>

            <ul className="space-y-4 mb-10 w-full flex-1">
              <li className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-accent" weight="bold" />
                </div>
                4 meses de suporte
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-accent" weight="bold" />
                </div>
                Consultas a cada 30 dias
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-primary">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-accent" weight="bold" />
                </div>
                Inclui 1 treino personalizado
              </li>
            </ul>
            <a href={WHATSAPP_PRATA} target="_blank" rel="noreferrer" className="w-full text-center bg-primary text-background-offwhite px-6 py-4 rounded-full text-sm font-medium hover:bg-secondary transition-colors mt-auto">Agendar Prata</a>
          </div>

          {/* Ouro */}
          <div className="bg-primary text-background-offwhite border border-primary/10 rounded-[2.5rem] p-10 hover:shadow-2xl hover:-translate-y-2 shadow-xl shadow-primary/20 transition-all duration-300 flex flex-col items-start relative group scale-100 lg:scale-[1.02] z-10">
            {/* Tag popular/destaque */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-medium uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg text-center whitespace-nowrap">Mais Escolhido</div>

            <span className="text-sm font-medium text-accent mb-6 block uppercase tracking-widest bg-accent/20 px-4 py-1.5 rounded-full">Transformação</span>
            <h3 className="text-3xl font-medium">Ouro</h3>
            <p className="mt-2 text-3xl font-light text-white/80">R$ 1.119</p>
            <p className="text-white/70 my-8 text-sm leading-relaxed">O melhor nível de entrega. Foco total em resultados sustentáveis a longo prazo, com prioridade de atendimento.</p>

            <ul className="space-y-4 mb-10 w-full flex-1">
              <li className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-accent" weight="bold" />
                </div>
                6 meses de suporte prioritário
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-accent" weight="bold" />
                </div>
                Consultas a cada 30 dias
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-white">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-accent" weight="bold" />
                </div>
                Inclui 2 treinos personalizados
              </li>
            </ul>
            <a href={WHATSAPP_OURO} target="_blank" rel="noreferrer" className="w-full text-center bg-accent text-white px-6 py-4 rounded-full text-sm font-medium hover:bg-white hover:text-primary transition-colors mt-auto">Agendar Ouro</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 md:px-12 bg-white/40 border-t border-primary/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl tracking-tight font-medium mb-4">Dúvidas Frequentes</h2>
            <p className="text-primary/60">Ainda incerto(a)? Eis o que as pessoas costumam perguntar.</p>
          </div>

          <div className="flex flex-col border-t border-primary/10">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-primary/10 text-left">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full py-6 flex items-center justify-between text-left hover:text-accent transition-colors"
                >
                  <span className="text-lg font-medium">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <CaretDown size={20} />
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === index ? "auto" : 0, opacity: openFaq === index ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 text-primary/70 font-light leading-relaxed">{faq.a}</p>
                </motion.div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-sm text-primary/60 mb-4">Sua dúvida não está aqui?</p>
            <a href={WHATSAPP_LINK} className="inline-flex items-center gap-2 bg-primary text-background-offwhite px-6 py-3 rounded-full text-sm font-medium hover:bg-secondary transition-colors">
              Fale comigo no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating CTA */}
      <motion.a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noreferrer"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 bg-accent text-background-offwhite w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow border border-white/20"
      >
        <WhatsappLogo size={28} weight="fill" />
      </motion.a>
    </div>
  );
}
