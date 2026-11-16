const TOKEN_STORAGE_KEY = 'cst_auth_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
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
  const defaultMsg = 'Olá Celina! Vim pelo site da Celina Sousa Turismo e gostaria de mais informações.';
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
