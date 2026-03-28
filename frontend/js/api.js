const origin = window.location.origin.startsWith('http')
  ? window.location.origin
  : 'http://localhost:3000';
const API_BASE = `${origin}/api/v1`;

const api = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  async register(email, password) {
    return request('POST', '/auth/register', { email, password }, false);
  },
  async login(email, password) {
    return request('POST', '/auth/login', { email, password }, false);
  },
  async getMe() {
    return request('GET', '/auth/me');
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  async getTasks(status = '', page = 1) {
    const params = new URLSearchParams({ page, limit: 9, ...(status && { status }) });
    return request('GET', `/tasks?${params}`);
  },
  async createTask(data) {
    return request('POST', '/tasks', data);
  },
  async updateTask(id, data) {
    return request('PUT', `/tasks/${id}`, data);
  },
  async getTask(id) {
    return request('GET', `/tasks/${id}`);
  },
  async deleteTask(id) {
    return request('DELETE', `/tasks/${id}`);
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  async getUsers() {
    return request('GET', '/admin/users');
  },
  async updateUserRole(id, role) {
    return request('PATCH', `/admin/users/${id}/role`, { role });
  },
};

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });

  const raw = await res.text();
  let data = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }

  if (!res.ok) {
    const err = new Error(data?.message || 'Request failed');
    err.errors = data?.errors;
    err.status = res.status;
    throw err;
  }

  return data;
}
