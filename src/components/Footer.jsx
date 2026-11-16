import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Instagram,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useApp } from '../context/AppContext';
import { buildWhatsAppUrl } from '../lib/api';

export default function Footer() {
  const { siteData, user } = useApp();
  const settings = siteData.settings || {};

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    'Olá Celina! Vim pelo site da Celina Sousa Turismo e gostaria de falar com o atendimento.'
  );

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <Link to="/">
              <BrandLogo variant="dark" size="md" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              {settings.footer_text ||
                'Celina Sousa Turismo — Caldas Locações. Conheça clubes, parques aquáticos, estruturas de lazer e destinos selecionados.'}
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Navegação Rápida
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-brand-300 transition-colors">
                  Página Inicial
                </Link>
              </li>
              <li>
                <Link to="/clubes" className="hover:text-brand-300 transition-colors">
                  Clubes e Destinos (Saber Mais)
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="hover:text-brand-300 transition-colors">
                  Sobre a Celina Sousa
                </Link>
              </li>
              <li>
                <Link to="/perguntas-frequentes" className="hover:text-brand-300 transition-colors">
                  Perguntas Frequentes
                </Link>
              </li>
              <li>
                <Link to="/contato" className="hover:text-brand-300 transition-colors">
                  Contato e Atendimento
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Account & Access */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Acesso à Plataforma
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/clubes" className="hover:text-brand-300 transition-colors">
                  Explorar Clubes Cadastrados
                </Link>
              </li>
              {!user ? (
                <>
                  <li>
                    <Link to="/entrar?modo=login" className="hover:text-brand-300 transition-colors">
                      Entrar na minha conta
                    </Link>
                  </li>
                  <li>
                    <Link to="/entrar?modo=cadastro" className="hover:text-brand-300 transition-colors">
                      Criar conta gratuita
                    </Link>
                  </li>
                </>
              ) : user.role === 'admin' ? (
                <li>
                  <Link
                    to="/painel-celina"
                    className="inline-flex items-center gap-1.5 text-brand-300 hover:text-white font-bold transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Gerenciar Clubes (Painel ADM)
                  </Link>
                </li>
              ) : (
                <li>
                  <Link to="/minha-conta" className="hover:text-brand-300 transition-colors">
                    Acessar Minha Conta
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Contact Info */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Canais de Atendimento
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-slate-400">WhatsApp e Telefone</span>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:text-brand-300 transition-colors"
                  >
                    {settings.phone_display || '(64) 9 9206-5866'}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Instagram className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-slate-400">Instagram Oficial</span>
                  <a
                    href={settings.instagram_url || 'https://www.instagram.com/celinasousaturismo/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:text-brand-300 transition-colors"
                  >
                    {settings.instagram_handle || '@celinasousaturismo'}
                  </a>
                </div>
              </li>
              {settings.email_contact && (
                <li className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs text-slate-400">E-mail</span>
                    <a
                      href={`mailto:${settings.email_contact}`}
                      className="font-semibold text-white hover:text-brand-300 transition-colors break-all"
                    >
                      {settings.email_contact}
                    </a>
                  </div>
                </li>
              )}
              {settings.address_info && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs text-slate-400">Localização</span>
                    <span className="text-slate-200">{settings.address_info}</span>
                  </div>
                </li>
              )}
              {settings.business_hours && (
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs text-slate-400">Horário de Atendimento</span>
                    <span className="text-slate-200">{settings.business_hours}</span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* LGPD & Copyright */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs text-slate-400">
          <p className="max-w-3xl leading-relaxed">
            <strong className="text-slate-300">Privacidade e LGPD:</strong>{' '}
            {settings.lgpd_notice ||
              'Seus dados pessoais são coletados exclusivamente para acesso à sua conta e atendimento pela Celina Sousa Turismo.'}
          </p>
          <p className="shrink-0 text-slate-400">
            © {new Date().getFullYear()} {settings.company_name || 'Celina Sousa Turismo'} • Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
