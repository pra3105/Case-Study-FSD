/**
 * courses.js
 * Browse, search, filter and enroll in courses
 */

let coursesPage = 1;
let totalPages  = 1;
let searchTimer = null;
let activeCourseId = null;

async function loadCourses(page) {
  if (page !== undefined) coursesPage = page;

  const search = (el('course-search') ? el('course-search').value.trim() : '');
  const dept   = el('filter-dept') ? el('filter-dept').value : '';
  const diff   = el('filter-diff') ? el('filter-diff').value : '';
  const sem    = el('filter-sem')  ? el('filter-sem').value  : '';
  const sort   = el('sort-sel')    ? el('sort-sel').value    : 'newest';

  showLoader('courses-grid', 'Loading courses...');

  const params = { page: coursesPage, limit: 9 };
  if (search) params.search     = search;
  if (dept)   params.department = dept;
  if (diff)   params.difficulty = diff;
  if (sem)    params.semester   = sem;

  const { ok, data } = await CoursesAPI.list(params);

  if (!ok || !data.success) {
    setHTML('courses-grid',
      '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">!</div>' +
      '<h3>Failed to load courses</h3><p>' + (data.message || 'Please try again.') + '</p>' +
      '<button class="btn btn-primary btn-sm" style="margin-top:.7rem" onclick="loadCourses()">Retry</button></div>'
    );
    return;
  }

  totalPages = data.pages || 1;

  // Populate filter dropdowns on first load
  if (data.filterOptions) {
    const deptSel = el('filter-dept');
    const semSel  = el('filter-sem');
    if (deptSel && deptSel.options.length <= 1) {
      data.filterOptions.departments.forEach(d => {
        const o = document.createElement('option');
        o.value = d; o.textContent = d;
        deptSel.appendChild(o);
      });
    }
    if (semSel && semSel.options.length <= 1) {
      data.filterOptions.semesters.forEach(s => {
        const o = document.createElement('option');
        o.value = s; o.textContent = s;
        semSel.appendChild(o);
      });
    }
  }

  // Count label
  const countEl = el('courses-count');
  if (countEl) {
    if (data.total === 0) {
      countEl.textContent = 'No courses found';
    } else {
      const start = (coursesPage - 1) * 9 + 1;
      const end   = Math.min(coursesPage * 9, data.total);
      countEl.textContent = 'Showing ' + start + ' to ' + end + ' of ' + data.total + ' courses';
    }
  }

  // Sort client-side
  const courses = data.courses || [];
  if (sort === 'az')         courses.sort((a,b) => a.title.localeCompare(b.title));
  if (sort === 'credits-lo') courses.sort((a,b) => a.credits - b.credits);
  if (sort === 'credits-hi') courses.sort((a,b) => b.credits - a.credits);
  if (sort === 'seats')      courses.sort((a,b) => b.availableSeats - a.availableSeats);

  if (!courses.length) {
    setHTML('courses-grid',
      '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">?</div>' +
      '<h3>No courses found</h3><p>Try changing your search or filters.</p>' +
      '<button class="btn btn-outline btn-sm" style="margin-top:.7rem" onclick="clearFilters()">Clear Filters</button></div>'
    );
    buildPages('courses-pages', coursesPage, totalPages, 'loadCourses');
    return;
  }

  const grid = el('courses-grid');
  if (grid) {
    grid.className = 'courses-grid stagger';
    grid.innerHTML = courses.map(c => courseCardHTML(c)).join('');
  }

  buildPages('courses-pages', coursesPage, totalPages, 'loadCourses');
}
window.loadCourses = loadCourses;

function courseCardHTML(c) {
  const pct   = Math.min(100, Math.round((c.enrolled / c.capacity) * 100));
  const full  = c.isFull || c.availableSeats === 0;
  const days  = c.schedule && c.schedule.days ? c.schedule.days.join(', ') : '—';
  const time  = c.schedule && c.schedule.startTime
    ? fmtTime(c.schedule.startTime) + ' – ' + fmtTime(c.schedule.endTime)
    : '—';

  let statusBadgeHTML = '';
  if (c.isEnrolled) statusBadgeHTML = '<span class="badge badge-green">Enrolled</span>';
  else if (full)    statusBadgeHTML = '<span class="badge badge-red">Full</span>';

  let actionBtn = '';
  if (c.isEnrolled) {
    actionBtn = '<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();dropCourse(\'' + c._id + '\',\'' + c.title.replace(/'/g,"\\'") + '\',this)">Drop</button>';
  } else if (full) {
    actionBtn = '<button class="btn btn-outline btn-sm" disabled>Full</button>';
  } else {
    actionBtn = '<button class="btn btn-teal btn-sm" onclick="event.stopPropagation();enrollCourse(\'' + c._id + '\',\'' + c.title.replace(/'/g,"\\'") + '\',this)">Enroll</button>';
  }

  return '<div class="course-card' + (c.isEnrolled ? ' enrolled' : '') + '" onclick="openCourseModal(\'' + c._id + '\')">' +
    '<div class="cc-top"><span class="cc-dept">' + c.department + '</span>' + statusBadgeHTML + '</div>' +
    '<div class="cc-body">' +
      '<div class="cc-code">' + c.courseCode + '</div>' +
      '<h3 class="cc-title">' + c.title + '</h3>' +
      '<div class="cc-instructor">by ' + (c.instructor ? c.instructor.name : '—') + '</div>' +
      '<p class="cc-desc">' + (c.description || '') + '</p>' +
      '<div class="cc-meta">' +
        '<span class="cc-meta-item">' + days + '</span>' +
        '<span class="cc-meta-item">' + time + '</span>' +
        (c.schedule && c.schedule.room ? '<span class="cc-meta-item">' + c.schedule.room + '</span>' : '') +
      '</div>' +
      '<div class="cc-cap">' +
        '<div class="cc-cap-row"><span>' + c.enrolled + ' / ' + c.capacity + ' enrolled</span>' +
        '<span>' + (full ? 'Full' : c.availableSeats + ' left') + '</span></div>' +
        progressHTML(pct) +
      '</div>' +
    '</div>' +
    '<div class="cc-foot">' +
      '<div class="cc-credits"><span class="cc-credit-num">' + c.credits + '</span> Credits</div>' +
      '<div style="display:flex;gap:.4rem;align-items:center;">' + diffBadge(c.difficulty) + actionBtn + '</div>' +
    '</div>' +
  '</div>';
}

// Course detail modal
async function openCourseModal(id) {
  activeCourseId = id;
  show('course-modal');
  showLoader('modal-body', 'Loading...');
  setHTML('modal-foot', '');

  const { ok, data } = await CoursesAPI.get(id);
  if (!ok || !data.success) {
    setHTML('modal-body', '<div class="empty"><div class="empty-icon">!</div><h3>Could not load course</h3></div>');
    return;
  }

  const c   = data.course;
  const pct = Math.min(100, Math.round((c.enrolled / c.capacity) * 100));
  const full = pct >= 100;
  const days = c.schedule && c.schedule.days ? c.schedule.days.join(', ') : '—';
  const time = c.schedule && c.schedule.startTime
    ? fmtTime(c.schedule.startTime) + ' – ' + fmtTime(c.schedule.endTime) : '—';

  setTxt('modal-title', c.courseCode);

  setHTML('modal-body',
    '<div>' +
      '<div style="display:flex;align-items:flex-start;gap:.6rem;flex-wrap:wrap;margin-bottom:.9rem;">' +
        '<h2 style="flex:1;font-size:1.2rem;color:var(--green-900);">' + c.title + '</h2>' +
        diffBadge(c.difficulty) +
        (c.isEnrolled ? '<span class="badge badge-green">Enrolled</span>' : '') +
      '</div>' +
      '<p style="color:var(--gray-600);font-size:.9rem;line-height:1.7;margin-bottom:1.1rem;">' + (c.description || 'No description.') + '</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem .9rem;">' +
        infoRow('Department', c.department) +
        infoRow('Credits', c.credits + ' credit hours') +
        infoRow('Instructor', c.instructor ? c.instructor.name : '—') +
        infoRow('Designation', c.instructor ? c.instructor.designation : '—') +
        infoRow('Days', days) +
        infoRow('Time', time) +
        (c.schedule && c.schedule.room ? infoRow('Room', c.schedule.room) : '') +
        infoRow('Semester', c.semester) +
      '</div>' +
      '<div style="margin:1rem 0;">' +
        '<div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:.4rem;">' +
          '<span>Enrollment</span>' +
          '<span style="font-weight:700;color:' + (full ? 'var(--red-600)' : 'var(--green-500)') + '">' +
            c.enrolled + ' / ' + c.capacity + ' seats ' + (full ? '(Full)' : '(' + c.availableSeats + ' left)') +
          '</span>' +
        '</div>' +
        progressHTML(pct) +
      '</div>' +
      (c.prerequisites && c.prerequisites.length
        ? '<div><span style="font-size:.78rem;font-weight:700;color:var(--gray-600);">Prerequisites: </span>' +
          c.prerequisites.map(p => '<span class="badge badge-gray" style="margin-right:.2rem;">' + p + '</span>').join('') +
          '</div>'
        : '') +
    '</div>'
  );

  // Footer buttons
  let footHTML = '<button class="btn btn-outline" onclick="closeCourseModal()">Close</button>';
  if (c.isEnrolled) {
    footHTML += '<button class="btn btn-danger" onclick="dropCourse(\'' + c._id + '\',\'' + c.title.replace(/'/g,"\\'") + '\',this);closeCourseModal()">Drop Course</button>';
  } else if (!full) {
    footHTML += '<button class="btn btn-primary" onclick="enrollCourse(\'' + c._id + '\',\'' + c.title.replace(/'/g,"\\'") + '\',this)">Enroll Now</button>';
  } else {
    footHTML += '<button class="btn btn-outline" disabled>Course Full</button>';
  }
  setHTML('modal-foot', footHTML);
}

function closeCourseModal() { hide('course-modal'); activeCourseId = null; }
window.openCourseModal  = openCourseModal;
window.closeCourseModal = closeCourseModal;

// Enroll
async function enrollCourse(courseId, title, btn) {
  if (btn) { btn.classList.add('loading'); btn.disabled = true; }
  const { ok, data } = await EnrollmentsAPI.enroll(courseId);
  if (ok && data.success) {
    Toast.success(data.message || 'Enrolled in "' + title + '".');
    await loadCourses(coursesPage);
    const badge = el('sb-enroll-badge');
    if (badge) badge.textContent = parseInt(badge.textContent || '0') + 1;
    if (activeCourseId === courseId) openCourseModal(courseId);
  } else {
    Toast.error(data.message || 'Enrollment failed.');
    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
  }
}

// Drop
async function dropCourse(courseId, title, btn) {
  if (!confirm('Drop "' + title + '"? You can re-enroll later.')) return;
  if (btn) { btn.classList.add('loading'); btn.disabled = true; }
  const { ok, data } = await EnrollmentsAPI.drop(courseId);
  if (ok && data.success) {
    Toast.success('Dropped "' + title + '".');
    await loadCourses(coursesPage);
    const badge = el('sb-enroll-badge');
    if (badge) badge.textContent = Math.max(0, parseInt(badge.textContent || '0') - 1);
    if (activeCourseId === courseId) openCourseModal(courseId);
  } else {
    Toast.error(data.message || 'Could not drop course.');
    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
  }
}

window.enrollCourse = enrollCourse;
window.dropCourse   = dropCourse;

// Search debounce
function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadCourses(1), 400);
}
window.onSearch = onSearch;

function clearFilters() {
  ['course-search','filter-dept','filter-diff','filter-sem'].forEach(id => { const e = el(id); if (e) e.value = ''; });
  const s = el('sort-sel'); if (s) s.value = 'newest';
  loadCourses(1);
}
window.clearFilters = clearFilters;