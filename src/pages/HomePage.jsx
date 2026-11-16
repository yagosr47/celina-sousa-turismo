import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  Sparkles,
  ArrowRight,
  Building2,
  ShieldCheck,
  Star,
  HelpCircle,
  ChevronDown,
  Image as ImageIcon,
  Maximize2,
  Heart,
  UserCheck,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ClubCard from '../components/ClubCard';
import ImageLightbox from '../components/ImageLightbox';

export default function HomePage() {
  const { siteData, loadingSite, user } = useApp();
  const { settings, clubs, testimonials, faqs, gallery } = siteData;

  const [selectedGalleryCat, setSelectedGalleryCat] = useState('Todas');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [openFaqId, setOpenFaqId] = useState(null);

  const celinaPhotoUrl =
    settings.about_image_url &&
    settings.about_image_url !== '/assets/images/about-tourism.jpg'
      ? settings.about_image_url
      : '/assets/images/celina-sousa.jpeg';

  const galleryCategories = [
    'Todas',
    ...Array.from(new Set((gallery || []).map((g) => g.category).filter(Boolean))),
  ];

  const filteredGallery =
    selectedGalleryCat === 'Todas'
      ? gallery
      : gallery.filter((g) => g.category === selectedGalleryCat);

  const clubsWithPromos = (clubs || []).filter(
    (c) => c.promotions && String(c.promotions).trim() !== ''
  );
  const hasPromoBanner =
    settings.promotions_active === '1' &&
    (settings.promotions_banner_title || settings.promotions_banner_text);

  return (
    <div className="space-y-12 sm:space-y-20 pb-12 sm:pb-20">
      {/* 1. HERO BANNER PRINCIPAL */}
      <section className="relative min-h-[500px] sm:min-h-[580px] lg:min-h-[640px] flex items-center overflow-hidden bg-slate-900">
        <img
          src={settings.hero_banner_url || '/assets/images/hero-resort.jpg'}
          alt={settings.company_name || 'Celina Sousa Turismo'}
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-slate-950/92 via-slate-950/75 to-slate-900/55" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 w-full">
          <div className="max-w-3xl space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/40 backdrop-blur-md text-brand-200 text-xs sm:text-sm font-bold">
              <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-300 shrink-0" />
              <span className="truncate">
                {settings.hero_badge || 'Celina Sousa Turismo • Caldas Locações'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.13]">
              {settings.hero_title ||
                'Conheça os Melhores Clubes, Parques Aquáticos e Locações'}
            </h1>

            <p className="text-sm sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
              {settings.hero_subtitle ||
                'Explore nossa seleção de clubes, parques aquáticos e opções de lazer. Veja fotos, estrutura completa, piscinas e informações detalhadas de cada clube.'}
            </p>

            <div className="pt-1 sm:pt-2 grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-4">
              <Link
                to="/clubes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-sky-400 hover:from-brand-400 hover:to-sky-300 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-brand-500/25 transition-all hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <Building2 className="w-5 h-5" />
                <span>Explorar Clubes e Destinos</span>
              </Link>

              <Link
                to="/sobre"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/12 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-sm sm:text-base border border-white/20 transition-all"
              >
                <span>Conhecer a Celina Sousa</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/painel-celina?tab=clubes"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-brand-300 font-bold text-sm border border-brand-400/40 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Gerenciar Clubes (ADM)</span>
                </Link>
              )}
            </div>

            {/* Trust badges */}
            <div className="pt-3 sm:pt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-2xl text-xs text-slate-200">
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-white/10">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-brand-300 shrink-0" />
                <span>Clubes, Parques e Caldas Locações</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-white/10">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-brand-300 shrink-0" />
                <span>Fotos e detalhes de cada clube</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-white/10">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-brand-300 shrink-0" />
                <span>Atendimento direto e acolhedor</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACCESS STRIP FOR MOBILE & DESKTOP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-14 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <Link
            to="/clubes"
            className="group bg-white hover:bg-brand-50/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-lg shadow-slate-900/5 flex items-center gap-3.5 transition-all hover:-translate-y-0.5"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                Clubes e Parques
              </p>
              <p className="text-[11px] text-slate-500 truncate">Saber mais de cada clube</p>
            </div>
          </Link>

          <a
            href="#galeria"
            className="group bg-white hover:bg-brand-50/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-lg shadow-slate-900/5 flex items-center gap-3.5 transition-all hover:-translate-y-0.5"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                Galeria de Fotos
              </p>
              <p className="text-[11px] text-slate-500 truncate">Piscinas e lazer</p>
            </div>
          </a>

          <Link
            to="/sobre"
            className="group bg-white hover:bg-blue-50/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-lg shadow-slate-900/5 flex items-center gap-3.5 transition-all hover:-translate-y-0.5"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                Sobre a Celina
              </p>
              <p className="text-[11px] text-slate-500 truncate">Nossa história e missão</p>
            </div>
          </Link>

          <Link
            to="/perguntas-frequentes"
            className="group bg-white hover:bg-amber-50/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-lg shadow-slate-900/5 flex items-center gap-3.5 transition-all hover:-translate-y-0.5"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                Dúvidas Frequentes
              </p>
              <p className="text-[11px] text-slate-500 truncate">Saiba como funciona</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 2. ÁREA DE CLUBES E DESTINOS (MODIFICADA PELO ADM) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
              Catálogo de Clubes
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">
              Clubes e Destinos — Saiba Mais de Cada Clube
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Clique em qualquer clube abaixo para ver fotos ampliadas, piscinas, estrutura e
              informações completas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'admin' && (
              <Link
                to="/painel-celina?tab=clubes"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow"
              >
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Adicionar / Editar Clubes (ADM)</span>
              </Link>
            )}
            <Link
              to="/clubes"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              <span>Ver todos os clubes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {loadingSite ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 rounded-3xl bg-slate-200/70 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="max-w-lg mx-auto space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                Vitrine de Clubes e Destinos
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Aqui ficam listados todos os clubes, parques aquáticos e estruturas divulgadas pela
                Celina Sousa Turismo para você conhecer cada detalhe.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {user?.role === 'admin' ? (
                <Link
                  to="/painel-celina?tab=clubes"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cadastrar Primeiro Clube no Painel ADM</span>
                </Link>
              ) : (
                <Link
                  to="/contato"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow"
                >
                  <span>Consultar Informações de Clubes</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {clubs.slice(0, 6).map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
      </section>

      {/* 3. OFERTAS E DESTAQUES DOS CLUBES (QUANDO CADASTRADOS PELO ADM) */}
      {(hasPromoBanner || clubsWithPromos.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white p-8 sm:p-10 shadow-xl border border-brand-700/50 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Destaques e Condições Especiais
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold">
                  {settings.promotions_banner_title || 'Clubes com Condições em Destaque'}
                </h2>
                {settings.promotions_banner_text && (
                  <p className="text-brand-100 text-sm sm:text-base max-w-2xl">
                    {settings.promotions_banner_text}
                  </p>
                )}
              </div>
              <Link
                to="/clubes"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow transition-all"
              >
                <span>Ver Todos os Clubes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {clubsWithPromos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {clubsWithPromos.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-bold text-white">{c.name}</h3>
                      <p className="text-xs text-brand-200 mt-0.5">{c.promotions}</p>
                    </div>
                    <Link
                      to={`/clubes/${c.slug}`}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-brand-50"
                    >
                      Saber Mais
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. APRESENTAÇÃO PESSOAL DA CELINA SOUSA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Foto da Celina com bordas em variação de Azul Claro, Médio e Escuro */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-xs sm:max-w-sm mx-auto">
              <div className="absolute -top-3 -left-3 w-28 h-28 rounded-full bg-sky-300/40 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-3 -right-3 w-32 h-32 rounded-full bg-blue-900/35 blur-2xl pointer-events-none" />

              {/* Camada Externa: Azul Escuro -> Azul Médio -> Azul Claro */}
              <div className="relative p-2 rounded-[2.1rem] bg-gradient-to-tr from-blue-950 via-blue-600 to-sky-300 shadow-2xl shadow-blue-900/20">
                {/* Camada Intermediária: Azul Claro -> Azul Médio -> Azul Escuro */}
                <div className="p-1.5 rounded-[1.75rem] bg-gradient-to-bl from-sky-300 via-sky-500 to-blue-900 border-2 border-sky-200/90">
                  {/* Camada Interna: Azul Escuro */}
                  <div className="relative rounded-[1.35rem] overflow-hidden border-[3px] border-blue-950 bg-slate-900 aspect-[4/5]">
                    <img
                      src={celinaPhotoUrl}
                      alt="Celina Sousa — Celina Sousa Turismo"
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-950/95 via-blue-950/50 to-transparent p-4 text-white">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-400/25 border border-sky-300/40 text-sky-200 text-[10px] font-extrabold uppercase tracking-wider">
                        <Heart className="w-3 h-3 text-sky-300 fill-sky-300" />
                        Celina Sousa Turismo
                      </span>
                      <p className="text-base sm:text-lg font-extrabold mt-0.5">Celina Sousa</p>
                      <p className="text-[11px] text-sky-200">Caldas Locações</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Texto de Apresentação Pessoal */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-blue-700 text-xs font-extrabold uppercase tracking-wider border border-sky-200">
              Apresentação Pessoal
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">
              Olá, sou Celina Sousa!
            </h2>
            <div className="space-y-3.5 text-slate-600 leading-relaxed text-sm sm:text-base">
              <p>
                Minha história com o turismo começou em 2020, em um momento de grandes mudanças na
                minha vida. Após minha separação, assumi a responsabilidade de cuidar dos meus dois
                filhos, que na época tinham 9 e 12 anos. Em busca de uma nova oportunidade de
                renda, comecei a trabalhar com locações de hospedagens em Caldas Novas.
              </p>
              <p>
                Pouco tempo depois, veio a pandemia, trazendo desafios e interrompendo nossas
                atividades por aproximadamente um ano. Foi um período difícil, mas nunca pensei em
                desistir.
              </p>
              <p>
                Sempre fui apaixonada por lidar com pessoas. Sou comunicativa, carismática e
                acredito que pequenos gestos podem transformar experiências. Gosto de ajudar,
                acolher e, principalmente, de participar da realização de sonhos.
              </p>
              <p>
                Foi assim que descobri no turismo muito mais do que uma profissão: encontrei uma
                verdadeira paixão e um propósito que carrego com amor, dedicação e responsabilidade.
              </p>
              <p>
                Hoje, através da{' '}
                <strong className="font-extrabold text-blue-900">Celina Sousa Turismo</strong>, meu
                objetivo é proporcionar muito mais do que hospedagens e viagens: quero ajudar
                pessoas e famílias a viverem momentos especiais, criarem boas lembranças e
                desfrutarem de experiências que ficarão para sempre na memória.
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-l-4 border-blue-600">
              <p className="text-sm sm:text-base font-extrabold text-blue-950">
                Será um prazer fazer parte da sua próxima viagem!
              </p>
            </div>

            <div className="pt-1 grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3">
              <Link
                to="/sobre"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all"
              >
                <span>Ver Mais Sobre a Empresa</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/clubes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-800 text-sm font-bold transition-all"
              >
                <Building2 className="w-4 h-4" />
                <span>Conhecer os Clubes</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GALERIA DE IMAGENS */}
      {gallery && gallery.length > 0 && (
        <section id="galeria" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
                <ImageIcon className="w-3.5 h-3.5" />
                Lazer e Experiências
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">
                Galeria de Imagens
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-1">
                Clique em qualquer foto para visualizar em tamanho ampliado.
              </p>
            </div>

            {galleryCategories.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {galleryCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedGalleryCat(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedGalleryCat === cat
                        ? 'bg-brand-600 text-white shadow'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGallery.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setLightboxIndex(idx)}
                className="group relative h-64 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-sm hover:shadow-xl transition-all"
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-300">
                    {item.category}
                  </span>
                  <h3 className="text-base font-bold mt-0.5">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-slate-200 line-clamp-1 mt-0.5">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {lightboxIndex !== null && (
            <ImageLightbox
              images={filteredGallery}
              currentIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onNavigate={(nextIdx) => setLightboxIndex(nextIdx)}
            />
          )}
        </section>
      )}

      {/* 6. DEPOIMENTOS DE CLIENTES (QUANDO CADASTRADOS) */}
      {testimonials && testimonials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
              Avaliações Reais
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2">
              Depoimentos de Clientes
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Veja a experiência de quem conhece o atendimento da Celina Sousa Turismo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: t.rating || 5 }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 italic leading-relaxed">"{t.content}"</p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{t.customer_name}</p>
                  <p className="text-xs text-slate-500">
                    {[t.city_state, t.item_visited].filter(Boolean).join(' • ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. PERGUNTAS FREQUENTES EM DESTAQUE */}
      {faqs && faqs.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
                <HelpCircle className="w-3.5 h-3.5" />
                Tire suas dúvidas
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Perguntas Frequentes
              </h2>
            </div>
            <Link
              to="/perguntas-frequentes"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              <span>Ver todas as perguntas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {faqs.slice(0, 4).map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-brand-600 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 8. BANNER FINAL DE CLUBES E CONTATO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white p-8 sm:p-12 lg:p-14 shadow-2xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider border border-brand-400/30">
              Celina Sousa Turismo • Caldas Locações
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">
              Conheça os detalhes completos de cada clube e destino!
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Navegue pelo nosso catálogo de clubes para ver fotos, estrutura, piscinas e opções de
              lazer, ou entre em contato diretamente com nossa equipe.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              to="/clubes"
              className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Building2 className="w-5 h-5" />
              <span>Ver Todos os Clubes</span>
            </Link>
            <Link
              to="/contato"
              className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-white/15 transition-all"
            >
              <span>Página de Contato / Dúvidas</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
