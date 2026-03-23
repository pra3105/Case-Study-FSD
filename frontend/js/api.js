const API = '/api';

const Token = {
  get()    { return localStorage.getItem('token'); },
  set(t)   { localStorage.setItem('token', t); },
  remove() { localStorage.removeItem('token'); },
  has()    { return !!localStorage.getItem('token'); }
};

const UserCache = {
  get()    { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } },
  set(u)   { localStorage.setItem('user', JSON.stringify(u)); },
  remove() { localStorage.removeItem('user'); },
  merge(p) { const u = this.get() || {}; this.set(Object.assign(u, p)); }
};

async function call(path, opts) {
  opts = opts || {};
  const headers = { 'Content-Type': 'application/json' };
  const t = Token.get();
  if (t) headers['Authorization'] = 'Bearer ' + t;
  if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify(opts.body);
  try {
    const res  = await fetch(API + path, Object.assign({}, opts, { headers: headers }));
    const data = await res.json();
    if (res.status === 401) {
      const isAuth = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
      if (!isAuth) { Token.remove(); UserCache.remove(); window.location.href = '/'; return; }
    }
    return { ok: res.ok, status: res.status, data: data };
  } catch (err) {
    console.error('Fetch error [' + path + ']:', err);
    return { ok: false, status: 0, data: { success: false, message: 'Cannot connect to server.' } };
  }
}

const AuthAPI = {
  register: function(p)       { return call('/auth/register', { method: 'POST', body: p }); },
  login:    function(e, pw)   { return call('/auth/login',    { method: 'POST', body: { email: e, password: pw } }); },
  me:       function()        { return call('/auth/me'); },
  profile:  function(p)       { return call('/auth/profile',  { method: 'PUT',  body: p }); },
  changePwd:function(cur, nw) { return call('/auth/change-password', { method: 'PUT', body: { currentPassword: cur, newPassword: nw } }); }
};

const CoursesAPI = {
  list: function(params) {
    params = params || {};
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(function(e) { return e[1] !== '' && e[1] != null; }))
    ).toString();
    return call('/courses' + (qs ? '?' + qs : ''));
  },
  get:    function(id) { return call('/courses/' + id); },
  create: function(p)  { return call('/courses', { method: 'POST', body: p }); }
};

const EnrollmentsAPI = {
  list:   function(status) { return call('/enrollments' + (status ? '?status=' + status : '')); },
  stats:  function()       { return call('/enrollments/stats'); },
  enroll: function(cid)    { return call('/enrollments/' + cid, { method: 'POST' }); },
  drop:   function(cid)    { return call('/enrollments/' + cid, { method: 'DELETE' }); }
};

function requireAuth() {
  if (!Token.has()) { window.location.href = '/'; return false; }
  return true;
}
function requireGuest() {
  if (Token.has()) { window.location.href = '/pages/dashboard.html'; return false; }
  return true;
}
function logout() {
  Token.remove();
  UserCache.remove();
  window.location.href = '/';
}

window.Token          = Token;
window.UserCache      = UserCache;
window.AuthAPI        = AuthAPI;
window.CoursesAPI     = CoursesAPI;
window.EnrollmentsAPI = EnrollmentsAPI;
window.requireAuth    = requireAuth;
window.requireGuest   = requireGuest;
window.logout         = logout;