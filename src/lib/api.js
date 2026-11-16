const TOKEN_KEY = 'cst_auth_token';
const SAVED_USER_KEY = 'cst_saved_user';
const REMEMBER_DEVICE_KEY = 'cst_remember_device';

export function isAdminPortalApp() {
  if (import.meta.env.VITE_APP_MODE === 'admin') {
    return true;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (host.startsWith('admin.') || host.startsWith('5174-')) {
      return true;
    }
  }
  return false;
}

export function getCustomerSiteUrl(path = '/') {
  if (typeof window === 'undefined') return path;
  const { protocol, hostname, port } = window.location;
  if (hostname.startsWith('5174-')) {
    const customerHost = hostname.replace(/^5174-/, '5173-');
    return `${protocol}//${customerHost}${path}`;
  }
  if (port === '5174') {
    return `${protocol}//${hostname}:5173${path}`;
  }
  return path;
}

export function getAdminPortalUrl(path = '/painel-celina') {
  return path;
}

export function getRememberDevicePreference() {
  try {
    const val = localStorage.getItem(REMEMBER_DEVICE_KEY);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

export function setRememberDevicePreference(remember = true) {
  try {
    localStorage.setItem(REMEMBER_DEVICE_KEY, remember ? 'true' : 'false');
  } catch {}
}

export function getStoredToken() {
  try {
    return (
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem('cst_admin_auth_token') ||
      localStorage.getItem('cst_customer_auth_token') ||
      null
    );
  } catch {
    return null;
  }
}

export function setStoredToken(token, rememberDevice = true) {
  try {
    if (token) {
      if (rememberDevice) {
        localStorage.setItem(TOKEN_KEY, token);
        sessionStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
        localStorage.removeItem(TOKEN_KEY);
      }
      localStorage.setItem('cst_admin_auth_token', token);
      localStorage.setItem('cst_customer_auth_token', token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('cst_admin_auth_token');
      localStorage.removeItem('cst_customer_auth_token');
      localStorage.removeItem(SAVED_USER_KEY);
      sessionStorage.removeItem(SAVED_USER_KEY);
    }
  } catch {}
}

export function getSavedUser() {
  try {
    const raw =
      localStorage.getItem(SAVED_USER_KEY) || sessionStorage.getItem(SAVED_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSavedUser(user, rememberDevice = true) {
  try {
    if (user) {
      const serialized = JSON.stringify(user);
      if (rememberDevice) {
        localStorage.setItem(SAVED_USER_KEY, serialized);
        sessionStorage.setItem(SAVED_USER_KEY, serialized);
      } else {
        sessionStorage.setItem(SAVED_USER_KEY, serialized);
        localStorage.removeItem(SAVED_USER_KEY);
      }
    } else {
      localStorage.removeItem(SAVED_USER_KEY);
      sessionStorage.removeItem(SAVED_USER_KEY);
    }
  } catch {}
}

export async function apiFetch(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Ocorreu um erro na solicitação.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function uploadImages(fileList) {
  const formData = new FormData();
  Array.from(fileList).forEach((file) => {
    formData.append('images', file);
  });

  return apiFetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });
}

export function buildWhatsAppUrl(phoneNumber, customMessage = '') {
  const cleanDigits = String(phoneNumber || '64992065866').replace(/\D/g, '');
  const fullPhone = cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`;
  const defaultMsg =
    'Olá Celina! Vim pelo site da Celina Sousa Turismo e gostaria de mais informações.';
  const text = encodeURIComponent(customMessage || defaultMsg);
  return `https://wa.me/${fullPhone}?text=${text}`;
}

export function formatDateBR(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function formatDateTimeBR(dateStr) {
  if (!dateStr) return '';
  try {
    const normalized = dateStr.includes('T') ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
    return new Date(normalized).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatCurrencyBR(value) {
  if (value === null || value === undefined || value === '' || Number(value) <= 0) {
    return null;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

export const formatPriceBR = formatCurrencyBR;

