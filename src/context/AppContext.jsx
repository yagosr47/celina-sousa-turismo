import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiFetch,
  setStoredToken,
  getStoredToken,
  getSavedUser,
  setSavedUser,
  getRememberDevicePreference,
  setRememberDevicePreference,
} from '../lib/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUserState] = useState(() => getSavedUser());
  const [authLoading, setAuthLoading] = useState(() => !getSavedUser());
  const [siteData, setSiteData] = useState({
    settings: {
      company_name: 'Celina Sousa Turismo',
      company_subtitle: 'Caldas Locações',
      logo_url: '/assets/images/logo-profissional.svg',
      whatsapp_number: '64992065866',
      phone_display: '(64) 9 9206-5866',
      instagram_handle: '@celinasousaturismo',
      instagram_url: 'https://www.instagram.com/celinasousaturismo/',
    },
    clubs: [],
    trips: [],
    destinations: [],
    testimonials: [],
    faqs: [],
    gallery: [],
  });
  const [loadingSite, setLoadingSite] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);

  const setUser = useCallback((nextUser) => {
    setUserState(nextUser);
    setSavedUser(nextUser, getRememberDevicePreference());
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshSiteData = useCallback(async () => {
    try {
      const data = await apiFetch('/api/public/bootstrap');
      setSiteData({
        settings: data.settings || {},
        clubs: data.clubs || [],
        trips: data.trips || [],
        destinations: data.destinations || [],
        testimonials: data.testimonials || [],
        faqs: data.faqs || [],
        gallery: data.gallery || [],
      });
    } catch (err) {
      console.error('Erro ao carregar dados do site:', err);
    } finally {
      setLoadingSite(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await apiFetch('/api/public/notifications');
      const list = data.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await apiFetch('/api/auth/me');
      setUserState(data.user);
      setSavedUser(data.user, getRememberDevicePreference());
      setUnreadCount(data.unreadNotifications || 0);
      await refreshNotifications();
    } catch (err) {
      if (err?.status === 401 || err?.status === 403 || !getStoredToken()) {
        setUserState(null);
        setStoredToken(null);
        setSavedUser(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setAuthLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    refreshSiteData();
    refreshAuth();
  }, [refreshSiteData, refreshAuth]);

  const login = async ({ identifier, password, loginMode, rememberDevice = true }) => {
    const shouldRemember = rememberDevice !== false;
    setRememberDevicePreference(shouldRemember);

    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        password,
        loginMode,
        rememberDevice: shouldRemember,
      }),
    });
    if (data.token) {
      setStoredToken(data.token, shouldRemember);
    }
    setUserState(data.user);
    setSavedUser(data.user, shouldRemember);
    await refreshNotifications();
    return data;
  };

  const register = async (payload) => {
    setRememberDevicePreference(true);
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      setStoredToken(data.token, true);
    }
    setUserState(data.user);
    setSavedUser(data.user, true);
    await refreshNotifications();
    return data;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setStoredToken(null);
    setSavedUser(null);
    setUserState(null);
    setNotifications([]);
    setUnreadCount(0);
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const markNotificationRead = async (id) => {
    try {
      await apiFetch(`/api/public/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiFetch('/api/public/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        authLoading,
        login,
        register,
        logout,
        refreshAuth,
        siteData,
        loadingSite,
        refreshSiteData,
        notifications,
        unreadCount,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        toast,
        setToast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
