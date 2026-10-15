/**
 * Universal API Client with automatic JSON parsing and credential handling
 * Supports HttpOnly cookie authentication and standardized error formatting
 */
export async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Always send and accept HttpOnly cookies
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(endpoint, config);

  // If response is a CSV download, return text/blob directly
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    if (!response.ok) {
      throw new Error('Failed to download CSV export.');
    }
    return response.blob();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || `HTTP ${response.status}: Request failed`;
    const err = new Error(errorMsg);
    err.code = data?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    err.details = data?.error?.details;
    throw err;
  }

  return data;
}

export const authApi = {
  login: (credentials) => apiRequest('/api/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => apiRequest('/api/auth/register', { method: 'POST', body: userData }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/api/auth/me', { method: 'GET' }),
};

export const eventApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/events${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  getById: (id) => apiRequest(`/api/events/${id}`, { method: 'GET' }),
  create: (data) => apiRequest('/api/events', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/api/events/${id}`, { method: 'PUT', body: data }),
  publish: (id) => apiRequest(`/api/events/${id}/publish`, { method: 'POST' }),
  cancel: (id) => apiRequest(`/api/events/${id}/cancel`, { method: 'POST' }),
};

export const registrationApi = {
  register: (eventId) => apiRequest(`/api/events/${eventId}/registrations`, { method: 'POST' }),
  cancel: (eventId) => apiRequest(`/api/events/${eventId}/registrations/me`, { method: 'DELETE' }),
  getMyRegistrations: () => apiRequest('/api/registrations/me', { method: 'GET' }),
};

export const organizerApi = {
  getEvents: () => apiRequest('/api/organizer/events', { method: 'GET' }),
  getParticipants: (eventId) => apiRequest(`/api/organizer/events/${eventId}/participants`, { method: 'GET' }),
  exportCSV: (eventId) => apiRequest(`/api/organizer/events/${eventId}/participants.csv`, { method: 'GET' }),
};

export const adminApi = {
  getSummary: () => apiRequest('/api/admin/summary', { method: 'GET' }),
  getEvents: () => apiRequest('/api/admin/events', { method: 'GET' }),
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/users${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  updateRole: (userId, role) => apiRequest(`/api/admin/users/${userId}/role`, { method: 'PATCH', body: { role } }),
  updateStatus: (userId, status) => apiRequest(`/api/admin/users/${userId}/status`, { method: 'PATCH', body: { status } }),
};
