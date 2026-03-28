// ── State ────────────────────────────────────────────────────────────────────
let currentUser = null;
let currentPage = 1;
let currentStatus = '';
let totalPages = 1;
let editingTaskId = null;
let taskMap = new Map();

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) loadDashboard();
  else showScreen('auth-screen');

  setupAuthListeners();
  setupDashboardListeners();
  setupModalListeners();
});

// ── Auth ─────────────────────────────────────────────────────────────────────
function setupAuthListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`${btn.dataset.tab}-form`).classList.add('active');
    });
  });

  // Login
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    hideEl('login-error');
    if (!validateEmailField(emailInput, 'login-error')) return;
    setLoading('login-btn', true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('token', res.data.token);
      await loadDashboard();
    } catch (err) {
      showFieldError('login-error', err.message);
    } finally {
      setLoading('login-btn', false);
    }
  });

  // Register
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('reg-email');
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    hideEl('register-error'); hideEl('register-success');
    if (!validateEmailField(emailInput, 'register-error')) return;
    setLoading('register-btn', true);
    try {
      const res = await api.register(email, password);
      localStorage.setItem('token', res.data.token);
      await loadDashboard();
    } catch (err) {
      let msg = err.message;
      if (err.errors) msg = err.errors.map(e => e.message).join(', ');
      showFieldError('register-error', msg);
    } finally {
      setLoading('register-btn', false);
    }
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
async function loadDashboard() {
  showScreen('dashboard-screen');
  try {
    const res = await api.getMe();
    currentUser = res.data.user;
    setActiveNav('nav-tasks');
    showSection('tasks-section');
    document.getElementById('sidebar-user-email').textContent = currentUser.email;
    document.getElementById('sidebar-user-role').textContent = currentUser.role;
    document.getElementById('user-avatar').textContent = currentUser.email[0].toUpperCase();
    document.getElementById('nav-admin').style.display = currentUser.role === 'ADMIN' ? 'flex' : 'none';
    document.getElementById('hero-title').textContent =
      currentUser.role === 'ADMIN' ? 'Mission control for every workflow' : 'Execution overview';
    document.getElementById('hero-role-pill').textContent =
      currentUser.role === 'ADMIN' ? 'Admin access enabled' : 'User workspace';
    await loadTasks();
  } catch {
    logout();
  }
}

function setupDashboardListeners() {
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('new-task-btn').addEventListener('click', openCreateModal);

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatus = btn.dataset.status;
      currentPage = 1;
      loadTasks();
    });
  });

  // Nav
  document.getElementById('nav-tasks').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav('nav-tasks');
    showSection('tasks-section');
  });

  document.getElementById('nav-admin').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav('nav-admin');
    showSection('admin-section');
    loadAdminUsers();
  });
}

async function loadTasks() {
  const grid = document.getElementById('task-grid');
  grid.innerHTML = '<div class="empty-state"><p>⟳ Loading tasks...</p></div>';
  try {
    const res = await api.getTasks(currentStatus, currentPage);
    const { tasks, pagination } = res.data;
    taskMap = new Map(tasks.map((task) => [task.id, task]));
    totalPages = pagination.totalPages;
    updateDashboardStats(tasks);

    const count = pagination.total;
    document.getElementById('tasks-count').textContent =
      `${count} task${count !== 1 ? 's' : ''} total`;

    if (tasks.length === 0) {
      grid.innerHTML = `<div class="empty-state"><p>No tasks yet</p><small>Click "+ New Task" to create your first task</small></div>`;
    } else {
      grid.innerHTML = tasks.map(renderTaskCard).join('');
      attachTaskCardEvents();
    }
    renderPagination();
  } catch (err) {
    updateDashboardStats([]);
    grid.innerHTML = `<div class="empty-state"><p>Failed to load tasks</p><small>${err.message}</small></div>`;
  }
}

function renderTaskCard(task) {
  const date = new Date(task.createdAt).toLocaleDateString();
  const desc = task.description
    ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : '';
  return `
    <div class="task-card" data-id="${task.id}">
      <div class="task-card-header">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        <span class="task-badge badge-${task.status}">${statusLabel(task.status)}</span>
      </div>
      ${desc}
      <p class="task-meta">Created ${date}${task.user ? ` · ${escapeHtml(task.user.email)}` : ''}</p>
      <div class="task-actions">
        <button class="btn btn-ghost edit-task-btn" data-id="${task.id}">Edit</button>
        <button class="btn btn-danger delete-task-btn" data-id="${task.id}">Delete</button>
      </div>
    </div>`;
}

function attachTaskCardEvents() {
  document.querySelectorAll('.edit-task-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await openEditModal(btn.dataset.id);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
  document.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
  });
}

async function openEditModal(taskId) {
  let task = taskMap.get(taskId);

  if (!task) {
    const res = await api.getTask(taskId);
    task = res.data.task;
  }

  editingTaskId = taskId;
  document.getElementById('modal-title').textContent = 'Edit Task';
  document.getElementById('task-submit-btn').textContent = 'Save Changes';
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-description').value = task.description || '';
  document.getElementById('task-status').value = task.status;
  openModal();
}

async function confirmDelete(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  try {
    await api.deleteTask(taskId);
    showToast('Task deleted', 'success');
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderPagination() {
  const pag = document.getElementById('pagination');
  if (totalPages <= 1) { pag.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
  }
  pag.innerHTML = html;
  pag.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = Number(btn.dataset.page);
      loadTasks();
    });
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────
async function loadAdminUsers() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Loading...</td></tr>';
  try {
    const res = await api.getUsers();
    const users = res.data.users;
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="task-badge badge-${u.role === 'ADMIN' ? 'DONE' : 'TODO'}">${u.role}</span></td>
        <td>${u._count?.tasks ?? 0}</td>
        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-ghost" style="font-size:12px;padding:4px 10px" onclick="toggleRole('${u.id}','${u.role}')">
            ${u.role === 'ADMIN' ? 'Demote' : 'Promote'}
          </button>
        </td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--error)">${err.message}</td></tr>`;
  }
}

async function toggleRole(userId, currentRole) {
  const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
  try {
    await api.updateUserRole(userId, newRole);
    showToast(`User role updated to ${newRole}`, 'success');
    loadAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function setupModalListeners() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('task-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideEl('task-form-error');
    const data = {
      title: document.getElementById('task-title').value.trim(),
      description: document.getElementById('task-description').value.trim() || undefined,
      status: document.getElementById('task-status').value,
    };
    const btn = document.getElementById('task-submit-btn');
    btn.disabled = true;
    try {
      if (editingTaskId) {
        await api.updateTask(editingTaskId, data);
        showToast('Task updated!', 'success');
      } else {
        await api.createTask(data);
        showToast('Task created!', 'success');
      }
      closeModal();
      loadTasks();
    } catch (err) {
      let msg = err.message;
      if (err.errors) msg = err.errors.map(e => e.message).join(', ');
      showFieldError('task-form-error', msg);
    } finally {
      btn.disabled = false;
    }
  });
}

function openCreateModal() {
  editingTaskId = null;
  document.getElementById('modal-title').textContent = 'New Task';
  document.getElementById('task-submit-btn').textContent = 'Create Task';
  document.getElementById('task-form').reset();
  hideEl('task-form-error');
  openModal();
}

function openModal() {
  document.getElementById('task-modal').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('task-modal').classList.add('hidden');
  editingTaskId = null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  currentPage = 1;
  currentStatus = '';
  taskMap = new Map();
  document.getElementById('nav-admin').style.display = 'none';
  document.getElementById('hero-title').textContent = 'Execution overview';
  document.getElementById('hero-role-pill').textContent = 'Secure workspace';
  updateDashboardStats([]);
  showScreen('auth-screen');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showSection(id) {
  document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideEl(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function validateEmailField(input, errorId) {
  const email = input.value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    showFieldError(errorId, 'Email is required.');
    input.focus();
    return false;
  }

  if (!emailPattern.test(email)) {
    showFieldError(errorId, 'Please enter a valid email address.');
    input.focus();
    return false;
  }

  return true;
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.querySelector('.btn-text').classList.toggle('hidden', loading);
  btn.querySelector('.btn-loader').classList.toggle('hidden', !loading);
  btn.disabled = loading;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

function statusLabel(s) {
  return { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }[s] || s;
}

function updateDashboardStats(tasks) {
  const counts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, { TODO: 0, IN_PROGRESS: 0, DONE: 0 });

  document.getElementById('stat-total').textContent = tasks.length;
  document.getElementById('stat-todo').textContent = counts.TODO || 0;
  document.getElementById('stat-progress').textContent = counts.IN_PROGRESS || 0;
  document.getElementById('stat-done').textContent = counts.DONE || 0;
}

let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}
