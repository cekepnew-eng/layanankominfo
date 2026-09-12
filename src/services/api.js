const BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('spbe_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('spbe_token');
      localStorage.removeItem('spbe_user');
      window.location.href = '/login';
    }
    throw new Error(data.message || `HTTP Error ${res.status}`);
  }
  return data;
};

export const api = {
  // USERS
  getUsers: async () => {
    const res = await fetch(`${BASE_URL}/admin/users`, { headers: getHeaders() });
    return handleResponse(res);
  },
  updateUserRole: async (userId, payload) => {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  deleteUser: async (userId) => {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // AUTH
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },
  register: async (payload) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  getMe: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // SERVICES
  getPublicServices: async () => {
    const res = await fetch(`${BASE_URL}/services`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getAdminServices: async () => {
    const res = await fetch(`${BASE_URL}/admin/services`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getAdminServiceCategories: async () => {
    const res = await fetch(`${BASE_URL}/admin/service-categories`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createService: async (payload) => {
    const res = await fetch(`${BASE_URL}/admin/services`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  updateService: async (id, payload) => {
    const res = await fetch(`${BASE_URL}/admin/services/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  deleteService: async (id) => {
    const res = await fetch(`${BASE_URL}/admin/services/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // TICKETS
  createTicket: async (payload) => {
    const res = await fetch(`${BASE_URL}/my/tickets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  getMyTickets: async () => {
    const res = await fetch(`${BASE_URL}/my/tickets`, { headers: getHeaders() });
    return handleResponse(res);
  },
  submitFeedback: async (ticketId, payload) => {
    const res = await fetch(`${BASE_URL}/my/tickets/${ticketId}/feedback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // HELPDESK
  getHelpdeskTickets: async () => {
    const res = await fetch(`${BASE_URL}/helpdesk/tickets`, { headers: getHeaders() });
    return handleResponse(res);
  },
  verifyTicket: async (ticketId) => {
    const res = await fetch(`${BASE_URL}/helpdesk/tickets/${ticketId}/verify`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  assignTicket: async (ticketId, payload) => {
    const res = await fetch(`${BASE_URL}/helpdesk/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // EMPLOYEE
  getEmployeeTickets: async () => {
    const res = await fetch(`${BASE_URL}/employee/tickets`, { headers: getHeaders() });
    return handleResponse(res);
  },
  updateProgress: async (ticketId, payload) => {
    const res = await fetch(`${BASE_URL}/employee/tickets/${ticketId}/progress`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // ADMIN
  getAdminTickets: async () => {
    const res = await fetch(`${BASE_URL}/admin/tickets`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // GENERAL
  getHistory: async (ticketId) => {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/history`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getNotifications: async () => {
    const res = await fetch(`${BASE_URL}/notifications`, { headers: getHeaders() });
    return handleResponse(res);
  },
  readNotification: async (id) => {
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, { method: 'PATCH', headers: getHeaders() });
    return handleResponse(res);
  }
};
