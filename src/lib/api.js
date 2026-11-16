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
  // In Arena preview environment: https://5174-{sandboxId}.e2b.app -> https://5173-{sandboxId}.e2b.app
  if (hostname.startsWith('5174-')) {
    const customerHost = hostname.replace(/^5174-/, '5173-');
    return `${protocol}//${customerHost}${path}`;
  }
  if (port === '5174') {
    return `${protocol}//${hostname}:5173${path}`;
  }
  return path;
}

export function getAdminPortalUrl(path = '/') {
  if (typeof window === 'undefined') return '/admin';
  const { protocol, hostname, port } = window.location;
  if (hostname.startsWith('5173-')) {
    const adminHost = hostname.replace(/^5173-/, '5174-');
    return `${protocol}//${adminHost}${path}`;
  }
  if (port === '5173') {
    return `${protocol}//${hostname}:5174${path}`;
  }
  return '/admin';
}

function getTokenStorageKey() {
  if (isAdminPortalApp()) {
    return 'cst_admin_auth_token';
  }
  if (typeof window !== 'undefined') {
    const p = window.location.pathname || '';
    if (p.startsWith('/admin') || p.startsWith('/painel-celina')) {
      return 'cst_admin_auth_token';
    }
  }
  return 'cst_customer_auth_token';
}

export function getStoredToken() {
  try {
    return localStorage.getItem(getTokenStorageKey());
  } catch {
    return null;
  }
}

export function setStoredToken(token, forceMode = null) {
  try {
    const key =
      forceMode === 'admin'
        ? 'cst_admin_auth_token'
        : forceMode === 'customer'
          ? 'cst_customer_auth_token'
          : getTokenStorageKey();
    if (token) {
      localStorage.setItem(key, token);
    } else {
      localStorage.removeItem(key);
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
