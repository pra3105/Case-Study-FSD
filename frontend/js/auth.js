requireGuest();

function switchTab(tab) {
  var isLogin = tab === 'login';
  
  // Using native Javascript just in case 'el' fails
  document.getElementById('sec-login').classList.toggle('hidden', !isLogin);
  document.getElementById('sec-reg').classList.toggle('hidden', isLogin);
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-reg').classList.toggle('active', !isLogin);
  
  const authAlert = document.getElementById('auth-alert');
  if (authAlert) authAlert.classList.add('hidden');
}
window.switchTab = switchTab;

function showAuthAlert(type, msg) {
  var box = document.getElementById('auth-alert');
  if (!box) return;
  box.className = 'alert alert-' + type;
  box.innerHTML = msg;
  box.classList.remove('hidden');
}

// Ensure the page is fully loaded before trying to attach listeners!
document.addEventListener('DOMContentLoaded', function() {
  
  try {
    setupEye('login-pwd', 'login-eye');
    setupEye('reg-pwd',   'reg-eye');
  } catch(err) {
    console.warn("Could not setup password eyes (utils.js might be missing)", err);
  }

  // ==========================================
  // LOGIN FORM LISTENER
  // ==========================================
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault(); // GUARANTEED TO STOP THE PAGE RELOAD NOW
      
      const authAlert = document.getElementById('auth-alert');
      if (authAlert) authAlert.classList.add('hidden');

      var email = document.getElementById('login-email').value.trim();
      var pwd   = document.getElementById('login-pwd').value;

      // Basic fallback validation if V object from utils.js is missing
      if (!email || !pwd) {
        showAuthAlert('error', 'Please enter both email and password.');
        return;
      }

      try {
        btnLoad('login-btn', true);
      } catch(e) {} // Ignore if btnLoad doesn't exist

      var result = await AuthAPI.login(email, pwd);

      try {
        btnLoad('login-btn', false);
      } catch(e) {}

      if (result.ok && result.data.success) {
        Token.set(result.data.token);
        UserCache.set(result.data.student);
        try { Toast.success('Welcome back!'); } catch(e) {}
        
        setTimeout(function() {
          window.location.href = '/pages/dashboard.html';
        }, 600);
      } else {
        showAuthAlert('error', result.data.message || 'Login failed. Please try again.');
      }
    });
  }

  // ==========================================
  // REGISTER FORM LISTENER
  // ==========================================
  const regForm = document.getElementById('reg-form');
  if (regForm) {
    regForm.addEventListener('submit', async function(e) {
      e.preventDefault(); // GUARANTEED TO STOP THE PAGE RELOAD NOW
      
      const authAlert = document.getElementById('auth-alert');
      if (authAlert) authAlert.classList.add('hidden');

      var name    = document.getElementById('reg-name').value.trim();
      var email   = document.getElementById('reg-email').value.trim();
      var pwd     = document.getElementById('reg-pwd').value;
      var confirm = document.getElementById('reg-confirm').value;
      var phone   = document.getElementById('reg-phone').value.trim();
      var year    = document.getElementById('reg-year').value;
      var dept    = document.getElementById('reg-dept').value;

      if (!name || !email || !pwd) {
        showAuthAlert('error', 'Please fill in all required fields.');
        return;
      }
      if (pwd !== confirm) {
        showAuthAlert('error', 'Passwords do not match.');
        return;
      }

      try { btnLoad('reg-btn', true); } catch(e) {}

      var payload = { fullName: name, email: email, password: pwd };
      if (phone) payload.phone      = phone;
      if (year)  payload.year       = parseInt(year);
      if (dept)  payload.department = dept;

      var result = await AuthAPI.register(payload);

      try { btnLoad('reg-btn', false); } catch(e) {}

      if (result.ok && result.data.success) {
        Token.set(result.data.token);
        UserCache.set(result.data.student);
        try { Toast.success('Account created. Welcome!'); } catch(e) {}
        
        setTimeout(function() {
          window.location.href = '/pages/dashboard.html';
        }, 700);
      } else {
        showAuthAlert('error', result.data.message || 'Registration failed. Please try again.');
      }
    });
  }
});