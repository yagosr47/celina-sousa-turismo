import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { isAdminPortalApp } from './lib/api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import BookingModal from './components/BookingModal';
import ToastBanner from './components/ToastBanner';

import HomePage from './pages/HomePage';
import ClubsCatalogPage from './pages/ClubsCatalogPage';
import ClubDetailPage from './pages/ClubDetailPage';
import TripsCatalogPage from './pages/TripsCatalogPage';
import TripDetailPage from './pages/TripDetailPage';
import AboutPage from './pages/AboutPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import CustomerAreaPage from './pages/CustomerAreaPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPanelPage from './pages/AdminPanelPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppShell() {
  const location = useLocation();
  const isStandaloneAdmin = isAdminPortalApp();
  const isAdminRoute =
    isStandaloneAdmin ||
    location.pathname.startsWith('/painel-celina') ||
    location.pathname.startsWith('/admin');

  // If running as the Dedicated Admin Site (Port 5174 / VITE_APP_MODE=admin / admin.* subdomain),
  // render exclusively the Admin Login & Admin Panel!
  if (isStandaloneAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
        <ScrollToTop />
        <ToastBanner />
        <Routes>
          <Route path="/login" element={<AdminLoginPage isStandalonePortal />} />
          <Route path="*" element={<AdminPanelPage />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <ScrollToTop />
      <ToastBanner />
      <BookingModal />

      {!isAdminRoute && <Navbar />}

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/clubes" element={<ClubsCatalogPage />} />
          <Route path="/clubes/:slug" element={<ClubDetailPage />} />
          <Route path="/viagens" element={<TripsCatalogPage />} />
          <Route path="/viagens/:slug" element={<TripDetailPage />} />
          <Route path="/sobre" element={<AboutPage />} />
          <Route path="/perguntas-frequentes" element={<FaqPage />} />
          <Route path="/contato" element={<ContactPage />} />
          <Route path="/entrar" element={<AuthPage />} />
          <Route path="/minha-conta" element={<CustomerAreaPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/painel-celina" element={<AdminPanelPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <WhatsAppFloatingButton />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
