/**
 * enrollments.js
 * Show and manage student enrollments in a table
 */

async function loadEnrollments() {
  const filter = el('enroll-filter') ? el('enroll-filter').value : '';
  const tbody  = el('enroll-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8"><div class="page-loader"><div class="spinner"></div><span>Loading...</span></div></td></tr>';

  const { ok, data } = await EnrollmentsAPI.list(filter);

  if (!ok || !data.success) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--red-600);padding:2rem;">Failed to load. <a href="#" onclick="loadEnrollments()">Retry</a></td></tr>';
    return;
  }

  const s = data.stats;
  setTxt('es-active',    s.active    || 0);
  setTxt('es-credits',   s.totalCredits || 0);
  setTxt('es-completed', s.completed || 0);
  setTxt('es-dropped',   s.dropped   || 0);
  setTxt('sb-enroll-badge', s.active || 0);

  const list = data.enrollments;

  if (!list || !list.length) {
    if (tbody) tbody.innerHTML =
      '<tr><td colspan="8">' +
        '<div class="empty" style="padding:2.5rem;">' +
          '<div class="empty-icon">&#128218;</div>' +
          '<h3>' + (filter ? 'No ' + filter + ' enrollments' : 'No enrollments yet') + '</h3>' +
          '<p>Browse available courses to get started.</p>' +
          '<button class="btn btn-primary btn-sm" style="margin-top:.75rem;" onclick="showPage(\'courses\')">Browse Courses</button>' +
        '</div>' +
      '</td></tr>';
    return;
  }

  if (tbody) {
    tbody.innerHTML = list.map((e, i) => {
      const c    = e.course;
      if (!c) return '';
      const days = c.schedule && c.schedule.days ? c.schedule.days.slice(0,2).join(', ') : '—';
      const time = c.schedule && c.schedule.startTime ? fmtTime(c.schedule.startTime) : '—';
      return '<tr>' +
        '<td style="color:var(--gray-400);font-weight:700;">' + (i+1) + '</td>' +
        '<td class="tbl-course-name"><strong>' + (c.title || '—') + '</strong><span>' + (c.courseCode || '') + '</span></td>' +
        '<td><span class="badge badge-teal">' + (c.department || '—') + '</span></td>' +
        '<td><strong style="color:var(--green-800);">' + (c.credits || '—') + '</strong> cr</td>' +
        '<td style="font-size:.8rem;"><div style="font-weight:600;">' + days + '</div><div style="color:var(--gray-400);">' + time + '</div></td>' +
        '<td style="font-size:.8rem;color:var(--gray-500);">' + fmtDate(e.enrolledAt) + '</td>' +
        '<td>' + statusBadge(e.status) + '</td>' +
        '<td>' +
          (e.status === 'active'
            ? '<button class="btn btn-danger btn-sm" onclick="dropFromTable(\'' + (c._id) + '\',\'' + (c.title || '').replace(/'/g,"\\'") + '\',this)">Drop</button>'
            : '<button class="btn btn-outline btn-sm" disabled>—</button>') +
        '</td>' +
      '</tr>';
    }).join('');
  }
}
window.loadEnrollments = loadEnrollments;

async function dropFromTable(courseId, title, btn) {
  if (!confirm('Drop "' + title + '"?')) return;
  if (btn) { btn.classList.add('loading'); btn.disabled = true; }
  const { ok, data } = await EnrollmentsAPI.drop(courseId);
  if (ok && data.success) {
    Toast.success('Dropped "' + title + '".');
    loadEnrollments();
  } else {
    Toast.error(data.message || 'Could not drop course.');
    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
  }
}
window.dropFromTable = dropFromTable;