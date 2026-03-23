requireAuth();

var currentUser = UserCache.get();
var activePage  = 'dashboard';

document.addEventListener('DOMContentLoaded', async function() {
  if (currentUser) renderUser(currentUser);
  startClock('tb-time');
  await refreshUser();
  await loadDashboardData();
});

async function refreshUser() {
  var result = await AuthAPI.me();
  if (result.ok && result.data.success) {
    currentUser = result.data.student;
    UserCache.set(result.data.student);
    renderUser(result.data.student);
  }
}

function renderUser(u) {
  if (!u) return;
  var ini = initials(u.fullName);
  setTxt('sb-name',   u.fullName);
  setTxt('sb-id',     u.studentId || '—');
  setTxt('sb-avatar', ini);
  setTxt('tb-avatar', ini);
}

var PAGES = { dashboard: 'Dashboard', courses: 'Browse Courses', enrollments: 'My Enrollments', profile: 'My Profile' };

function showPage(name) {
  activePage = name;
  closeSidebar();
  Object.keys(PAGES).forEach(function(p) {
    var pg  = el('pg-' + p);
    var nav = el('nav-' + p);
    if (pg)  pg.classList.toggle('hidden', p !== name);
    if (nav) nav.classList.toggle('active', p === name);
  });
  setTxt('tb-title', PAGES[name] || name);
  if (name === 'dashboard')   loadDashboardData();
  if (name === 'courses')     loadCourses();
  if (name === 'enrollments') loadEnrollments();
  if (name === 'profile')     loadProfile();
}
window.showPage = showPage;

async function loadDashboardData() {
  var results = await Promise.all([ EnrollmentsAPI.stats(), CoursesAPI.list({ page:1, limit:3 }) ]);
  var statsRes   = results[0];
  var coursesRes = results[1];

  if (statsRes.ok && statsRes.data.success) {
    var s = statsRes.data.stats;
    setTxt('stat-active',    s.active       || 0);
    setTxt('stat-credits',   s.totalCredits || 0);
    setTxt('stat-completed', s.completed    || 0);
    renderRecentList(s.recent || []);
  }
  if (coursesRes.ok && coursesRes.data.success) {
    setTxt('stat-avail', coursesRes.data.total || 0);
    renderTrending(coursesRes.data.courses || []);
  }

  var name = currentUser ? currentUser.fullName.split(' ')[0] : 'Student';
  setTxt('dash-greeting', greeting() + ', ' + name + '.');

  var enrollRes = await EnrollmentsAPI.list('active');
  if (enrollRes.ok) setTxt('sb-enroll-badge', enrollRes.data.stats.active || 0);
}

function renderRecentList(list) {
  var c = el('recent-list'); if (!c) return;
  if (!list.length) {
    c.innerHTML = '<div class="empty"><div class="empty-icon">&#128218;</div><h3>No enrollments yet</h3><p>Browse courses to get started.</p>' +
      '<button class="btn btn-primary btn-sm" style="margin-top:.7rem" onclick="showPage(\'courses\')">Browse Courses</button></div>';
    return;
  }
  c.innerHTML = list.map(function(e, i) {
    return '<div style="display:flex;align-items:center;gap:.8rem;padding:.55rem 0;' + (i < list.length-1 ? 'border-bottom:1px solid var(--gray-100)' : '') + '">' +
      '<div style="width:34px;height:34px;border-radius:var(--radius);background:var(--teal-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--teal-600);font-weight:700;">&#128218;</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-weight:600;font-size:.85rem;color:var(--gray-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (e.courseTitle || 'Course') + '</div>' +
        '<div style="font-size:.73rem;color:var(--gray-400);">' + (e.courseCode || '') + ' &middot; ' + fmtRelative(e.enrolledAt) + '</div>' +
      '</div>' +
      '<span class="badge badge-green" style="font-size:.67rem;">Active</span>' +
    '</div>';
  }).join('');
}

function renderTrending(courses) {
  var c = el('trending-list'); if (!c) return;
  if (!courses.length) { c.innerHTML = '<div class="empty"><p>No courses found.</p></div>'; return; }
  c.innerHTML = courses.slice(0,3).map(function(c2, i) {
    return '<div style="display:flex;align-items:center;gap:.8rem;padding:.55rem 0;cursor:pointer;' + (i<2?'border-bottom:1px solid var(--gray-100)':'') + '" onclick="showPage(\'courses\')">' +
      '<div style="width:34px;height:34px;border-radius:var(--radius);background:var(--amber-100);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--amber-700);font-weight:700;">&#9733;</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-weight:600;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + c2.title + '</div>' +
        '<div style="font-size:.73rem;color:var(--gray-400);">' + c2.courseCode + ' &middot; ' + c2.availableSeats + ' seats left</div>' +
      '</div>' +
      '<span class="badge badge-teal" style="font-size:.67rem;">' + c2.credits + ' cr</span>' +
    '</div>';
  }).join('');
}

async function loadProfile() {
  var u = currentUser; if (!u) return;
  var ini = initials(u.fullName);
  setTxt('ph-avatar', ini);
  setTxt('ph-name',   u.fullName);
  setTxt('ph-id',     u.studentId || '—');
  var sfx = ['','st','nd','rd','th','th'];
  var yr = u.year ? u.year + (sfx[u.year] || 'th') + ' Year' : null;
  setHTML('ph-tags',
    (u.department ? '<div class="ph-tag">' + u.department + '</div>' : '') +
    (yr           ? '<div class="ph-tag">' + yr + '</div>' : '') +
    '<div class="ph-tag">' + u.email + '</div>'
  );
  setHTML('personal-info',
    infoRow('Full Name',    u.fullName) +
    infoRow('Email',        u.email) +
    infoRow('Phone',        u.phone) +
    infoRow('Member Since', fmtDate(u.createdAt))
  );
  var res = await EnrollmentsAPI.stats();
  var s   = res.ok ? res.data.stats : null;
  setHTML('academic-info',
    infoRow('Student ID',   u.studentId) +
    infoRow('Department',   u.department) +
    infoRow('Year',         yr) +
    infoRow('Active Courses',  s ? s.active : '—') +
    infoRow('Credits Enrolled', s ? s.totalCredits + ' / 24' : '—') +
    infoRow('Completed',    s ? s.completed : '—')
  );
}
window.loadProfile = loadProfile;

function openProfileModal() {
  var u = currentUser; if (!u) return;
  el('pf-name').value  = u.fullName   || '';
  el('pf-phone').value = u.phone      || '';
  el('pf-dept').value  = u.department || '';
  el('pf-year').value  = u.year       || '';
  show('profile-modal');
}
function closeProfileModal() { hide('profile-modal'); }

async function saveProfile() {
  var name  = el('pf-name').value.trim();
  var phone = el('pf-phone').value.trim();
  var dept  = el('pf-dept').value;
  var year  = el('pf-year').value;
  if (!name) { Toast.error('Full name is required.'); return; }
  btnLoad('save-profile-btn', true);
  var payload = { fullName: name, phone: phone, department: dept };
  if (year) payload.year = parseInt(year);
  var result = await AuthAPI.profile(payload);
  btnLoad('save-profile-btn', false);
  if (result.ok && result.data.success) {
    currentUser = result.data.student;
    UserCache.set(result.data.student);
    renderUser(result.data.student);
    closeProfileModal();
    loadProfile();
    Toast.success('Profile updated successfully.');
  } else {
    Toast.error(result.data.message || 'Could not update profile.');
  }
}
window.openProfileModal  = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.saveProfile       = saveProfile;

async function changePassword() {
  var cur = el('pwd-cur').value;
  var nw  = el('pwd-new').value;
  if (!cur || !nw) { Toast.error('Both fields are required.'); return; }
  if (nw.length < 6) { Toast.error('New password must be at least 6 characters.'); return; }
  if (cur === nw)    { Toast.warn('New password must be different from current.'); return; }
  var btn = qs('[onclick="changePassword()"]');
  if (btn) { btn.classList.add('loading'); btn.disabled = true; }
  var result = await AuthAPI.changePwd(cur, nw);
  if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
  if (result.ok && result.data.success) {
    el('pwd-cur').value = '';
    el('pwd-new').value = '';
    Toast.success('Password changed successfully.');
  } else {
    Toast.error(result.data.message || 'Could not change password.');
  }
}
window.changePassword = changePassword;

function toggleSidebar() {
  el('sidebar').classList.toggle('open');
  el('sb-overlay').classList.toggle('show');
}
function closeSidebar() {
  el('sidebar').classList.remove('open');
  el('sb-overlay').classList.remove('show');
}
window.toggleSidebar = toggleSidebar;
window.closeSidebar  = closeSidebar;

document.addEventListener('click', function(e) {
  if (e.target.id === 'course-modal')  closeCourseModal();
  if (e.target.id === 'profile-modal') closeProfileModal();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeCourseModal(); closeProfileModal(); }
});