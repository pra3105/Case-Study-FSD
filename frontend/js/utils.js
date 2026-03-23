/**
 * utils.js
 * Contains shared helper functions used across all pages.
 */

// 1. DOM Helpers
function el(id) { return document.getElementById(id); }
function show(id) { const e = el(id); if (e) e.classList.remove('hidden'); }
function hide(id) { const e = el(id); if (e) e.classList.add('hidden'); }
function setHTML(id, html) { const e = el(id); if (e) e.innerHTML = html; }
function setTxt(id, txt) { const e = el(id); if (e) e.textContent = txt; }

// 2. UI Helpers
function showLoader(id, msg) {
  setHTML(id, '<div class="page-loader"><div class="spinner"></div><span>' + (msg || 'Loading...') + '</span></div>');
}

function btnLoad(id, isLoading) {
  const e = el(id);
  if (!e) return;
  if (isLoading) { e.classList.add('loading'); e.disabled = true; } 
  else { e.classList.remove('loading'); e.disabled = false; }
}

function setupEye(inputId, eyeId) {
  const inp = el(inputId), eye = el(eyeId);
  if (inp && eye) {
    eye.addEventListener('click', function() {
      if (inp.type === 'password') { inp.type = 'text'; eye.textContent = 'Hide'; } 
      else { inp.type = 'password'; eye.textContent = 'Show'; }
    });
  }
}

// 3. Toast Notifications
const Toast = {
  show: function(msg, type) {
    const area = el('toast-area');
    if (!area) return;
    const t = document.createElement('div');
    t.className = 'toast toast-' + type; // Assuming your CSS has styles for this
    t.textContent = msg;
    area.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  },
  success: function(msg) { this.show(msg, 'success'); },
  error: function(msg) { this.show(msg, 'error'); }
};

// 4. Form Validation Helper
const V = {
  required: function(v) { return v && v.trim().length > 0; },
  email: function(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
  minLen: function(v, l) { return v && v.length >= l; },
  markErr: function(id, msg) { const e = el(id); if (e) e.classList.add('is-invalid'); },
  markOk: function(id) { const e = el(id); if (e) e.classList.remove('is-invalid'); },
  clear: function(ids) { ids.forEach(id => { const e = el(id); if (e) e.classList.remove('is-invalid'); }); }
};

// 5. Course Formatting Helpers (used in courses.js)
function fmtTime(timeStr) { return timeStr; } // Customize if your time needs formatting

function diffBadge(diff) {
  let color = diff === 'Beginner' ? 'green' : (diff === 'Advanced' ? 'red' : 'amber');
  return '<span class="badge badge-' + color + '">' + (diff || 'Unknown') + '</span>';
}

function progressHTML(pct) {
  return '<div style="background:var(--gray-200);height:6px;border-radius:3px;margin-top:4px;overflow:hidden;">' +
         '<div style="background:var(--green-600);height:100%;width:' + pct + '%"></div></div>';
}

function infoRow(label, value) {
  return '<div><span style="font-size:0.8rem;color:var(--gray-500);">' + label + '</span>' +
         '<div style="font-weight:500;">' + value + '</div></div>';
}

function buildPages(id, current, total, funcName) {
  let html = '<button class="btn btn-outline btn-sm" onclick="' + funcName + '(' + (current > 1 ? current - 1 : 1) + ')" ' + (current === 1 ? 'disabled' : '') + '>Prev</button>';
  html += '<span style="margin:0 1rem;font-size:0.9rem;">Page ' + current + ' of ' + total + '</span>';
  html += '<button class="btn btn-outline btn-sm" onclick="' + funcName + '(' + (current < total ? current + 1 : total) + ')" ' + (current === total ? 'disabled' : '') + '>Next</button>';
  setHTML(id, html);
}