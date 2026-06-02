// =================== CONFIG ===================
const API_BASE = 'http://127.0.0.1:5000/api';

// =================== DATA / STATE ===================
let ACTS = [];
let REGISTRATIONS = {};

let currentUser = null;
let currentRole = null; // 'user' | 'admin'
let myActivities = [];
let currentDetailId = null;
let selectedMeal = null;
let mealModalMode = 'register'; // 'register' | 'update'
let pendingAfterAuth = false;
let cancelTargetId = null;
let profileEditing = false;
let selectedAuthRole = 'user';

let editingActId = null;
let deleteTargetId = null;

let bannerIndex = 0;
let bannerTimer = null;

const TAGCOLOR = {
  Sports: 'green',
  Competition: 'green',
  Arts: 'purple',
  Handicraft: 'orange',
  Music: 'purple',
  Eco: 'blue',
  Life: 'blue',
  IT: 'blue',
  Exhibition: 'purple',
  Lecture: 'orange',
  Culture: 'green',
  Exchange: 'green',
  Health: 'green',
  Entertainment: 'purple',
  'Eco / Environment': 'blue',
  'Sports & Exercise': 'green',
  'Gaming / Esports': 'purple',
  Lifestyle: 'orange'
};

const HEROCOLOR = {
  green: 'var(--primary-pale)',
  orange: 'var(--accent-pale)',
  purple: '#EDE7F6',
  blue: '#E3F2FD'
};

const BANNER_LABELS = ['🔥 Hot', '🎨 New', '🎵 Limited'];
const BANNER_GRADIENTS = [
  'linear-gradient(135deg, #025E73 0%, #7ab752 100%)',
  'linear-gradient(135deg, #025E73 0%, #F2EBEB 100%)',
  'linear-gradient(135deg, #2EA69A 0%, #F2EBEB 100%)'
];

const FIELDS = [
  { key: 'id', label: 'Student ID', icon: 'ti-id-badge' },
  { key: 'name', label: 'Name', icon: 'ti-user' },
  { key: 'phone', label: 'Phone No.', icon: 'ti-phone' },
  { key: 'email', label: 'Email', icon: 'ti-mail' },
  { key: 'dept', label: 'Department', icon: 'ti-school' }
];

// =================== HELPERS ===================
function $(id) {
  return document.getElementById(id);
}

function safeText(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value);
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean);
  if (!tags) return [];
  return String(tags).split(',').map(t => t.trim()).filter(Boolean);
}

function normalizeEvent(d) {
  const rawDate = d.date || d.event_day || '';
  const rawTime = d.time || d.event_time || '';
  const datePart = String(rawDate).replace(/-/g, '/');
  const displayDate = rawTime ? `${datePart} ${String(rawTime).slice(0, 5)}` : datePart;

  return {
    id: Number(d.id ?? d.event_id),
    emoji: d.emoji || '📅',
    color: d.color || 'blue',
    title: d.title || d.name || 'Untitled Event',
    date: displayDate,
    time: rawTime ? String(rawTime).slice(0, 5) : '',
    loc: d.loc || d.location || 'Location not provided',
    tags: normalizeTags(d.tags || d.category || d.category_name),
    quota: Number(d.quota ?? d.registered ?? d.registered_count ?? 0),
    max: Number(d.student_capacity ?? d.max ?? d.guest_capacity ?? d.capacity ?? 100),
    desc: d.description || d.desc || 'No description available for this event.',
    department: d.department || 'College of Management'
  };
}

function isDesktop() {
  return window.innerWidth >= 900;
}

function parseActivityDateTime(dateValue, timeValue) {
  return {
    event_day: (dateValue || '').replace(/\//g, '-'),
    event_time: timeValue || '00:00'
  };
}

function splitActivityDateTime(value) {
  if (!value) return { date: '', time: '' };
  const normalized = String(value).replace(/\//g, '-').replace('T', ' ');
  const parts = normalized.split(' ');
  return {
    date: parts[0] || '',
    time: (parts[1] || '').slice(0, 5)
  };
}

function showToast(message) {
  alert(message);
}

// =================== LAYOUT ===================
function applyLayout() {
  const logo = $('navLogo');
  const adminLogo = $('adminNavLogo');
  const app = $('app');
  const mainNav = $('mainNav');
  const adminNav = $('adminNav');

  if (isDesktop()) {
    if (logo) logo.style.display = 'block';
    if (adminLogo) adminLogo.style.display = 'block';
    if (app) app.style.gridTemplateColumns = 'var(--sidebar-w) 1fr';
    if (mainNav) mainNav.style.order = '-1';
    if (adminNav) adminNav.style.order = '-1';
  } else {
    if (logo) logo.style.display = 'none';
    if (adminLogo) adminLogo.style.display = 'none';
    if (app) app.style.gridTemplateColumns = '';
    if (mainNav) mainNav.style.order = '';
    if (adminNav) adminNav.style.order = '';
  }
}

// =================== INTERFACE SWITCH ===================
function showUserInterface() {
  const userApp = $('userApp');
  const adminApp = $('adminApp');
  const mainNav = $('mainNav');
  const adminNav = $('adminNav');

  if (userApp) userApp.style.display = 'contents';
  if (adminApp) adminApp.style.display = 'none';
  if (mainNav) mainNav.style.display = 'flex';
  if (adminNav) adminNav.style.display = 'none';
  applyLayout();
}

async function showAdminInterface() {
  const userApp = $('userApp');
  const adminApp = $('adminApp');
  const mainNav = $('mainNav');
  const adminNav = $('adminNav');

  if (userApp) userApp.style.display = 'none';
  if (adminApp) adminApp.style.display = 'contents';
  if (mainNav) mainNav.style.display = 'none';
  if (adminNav) adminNav.style.display = 'flex';

  renderAdminNav();
  await loadAllRegistrations();
  renderAdminDashboard();
  renderAdminRegistrations();
  renderAdminProfile();
  applyLayout();
}

// =================== TABS ===================
const screens = ['screen-events', 'screen-mine', 'screen-profile'];
const navs = ['nav0', 'nav1', 'nav2'];

function switchTab(i) {
  screens.forEach((s, idx) => $(s)?.classList.toggle('active', idx === i));
  navs.forEach((n, idx) => $(n)?.classList.toggle('active', idx === i));
  if (i === 1) renderMine();
  if (i === 2) renderProfile();
}

const adminScreens = ['admin-screen-dashboard', 'admin-screen-registrations', 'admin-screen-profile'];
const adminNavs = ['anav0', 'anav1', 'anav2'];

function switchAdminTab(i) {
  adminScreens.forEach((s, idx) => $(s)?.classList.toggle('active', idx === i));
  adminNavs.forEach((n, idx) => $(n)?.classList.toggle('active', idx === i));

  if (i === 0) renderAdminDashboard();
  if (i === 1) {
    loadAllRegistrations().then(renderAdminRegistrations);
  }
  if (i === 2) renderAdminProfile();
}

// =================== EVENTS ===================
async function loadEvents() {
  try {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error('Failed to load events');
    const data = await res.json();

    ACTS = Array.isArray(data) ? data.map(normalizeEvent) : [];
    window.ACTS = ACTS;
    window.allEvents = ACTS;

    renderCards();
    renderBanner();

    if (currentRole === 'admin') {
      renderAdminDashboard();
      renderAdminRegistrations();
    }
  } catch (error) {
    console.error('loadEvents error:', error);
    const list = document.querySelector('#screen-events .activity-list');
    if (list) {
      list.innerHTML = `<div class="empty-state"><i class="ti ti-alert-circle"></i><p>Failed to load events.<br>Please make sure Flask is running.</p></div>`;
    }
  }
}

function renderCards(events = ACTS) {
  const list = document.querySelector('#screen-events .activity-list');
  if (!list) return;

  if (!events.length) {
    list.innerHTML = `<div class="empty-state"><i class="ti ti-calendar-off"></i><p>No events found</p></div>`;
    return;
  }

  list.innerHTML = events.map(a => {
    const reg = myActivities.find(m => Number(m.id) === Number(a.id));
    const pct = Math.min(100, Math.round(Number(a.quota || 0) / Number(a.max || 1) * 100));

    return `
      <div class="act-card" onclick="openDetail(${a.id})">
        <div class="act-card-top">
          <div class="act-thumb ${a.color}">${a.emoji || '📅'}</div>
          <div class="act-info">
            <h3>${safeText(a.title)}</h3>
            <div class="act-meta"><i class="ti ti-calendar"></i><span class="act-date">${safeText(a.date)}</span></div>
            <div class="act-tags">
              ${normalizeTags(a.tags).map(t => `<span class="tag ${TAGCOLOR[t] || 'green'}">${t}</span>`).join('')}
              ${reg ? '<span class="tag green">✓ Registered</span>' : ''}
            </div>
          </div>
        </div>
        <div class="act-bottom">
          <div class="progress-wrap">
            <div class="progress-label">${a.quota} / ${a.max} Attending</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>
          <span class="act-spots">${Math.max(0, Number(a.max || 0) - Number(a.quota || 0))} Spots Left</span>
        </div>
      </div>
    `;
  }).join('');
}

function doFilter() {
  const keyword = ($('searchKeyword')?.value || '').toLowerCase().trim();
  const selectedTag = $('filterTag')?.value || 'all';

  const filtered = ACTS.filter(act => {
    const text = [
      act.title,
      act.loc,
      act.desc,
      act.date,
      normalizeTags(act.tags).join(' ')
    ].join(' ').toLowerCase();

    const matchText = !keyword || text.includes(keyword);
    const matchTag = selectedTag === 'all' || normalizeTags(act.tags).includes(selectedTag) || act.emoji === selectedTag;

    return matchText && matchTag;
  });

  renderCards(filtered);
}

function resetFilter() {
  if ($('searchKeyword')) $('searchKeyword').value = '';
  if ($('filterTag')) $('filterTag').value = 'all';
  renderCards();
}

// =================== DETAIL ===================
function openDetail(id) {
  const a = ACTS.find(x => Number(x.id) === Number(id)) || myActivities.find(x => Number(x.id) === Number(id));
  if (!a) return;

  currentDetailId = Number(id);

  $('dTitle').textContent = a.title || '';
  $('dHero').textContent = a.emoji || '📅';
  $('dHero').style.background = HEROCOLOR[a.color] || '#E3F2FD';
  $('dTags').innerHTML = normalizeTags(a.tags).map(t => `<span class="tag ${TAGCOLOR[t] || 'green'}">${t}</span>`).join('');
  $('dDate').textContent = a.date || '';
  $('dLocation').textContent = a.loc || 'Location not provided';
  $('dDesc').textContent = a.desc || 'No description available for this event.';
  $('dQuota').textContent = a.quota ?? '-';
  $('dMax').textContent = a.max ?? '-';

  const already = myActivities.find(m => Number(m.id) === Number(id));
  const btn = $('regBtn');
  const mealUpdateBtn = $('mealUpdateBtn');

  if (already) {
    btn.textContent = '✕ Cancel Registration';
    btn.className = 'register-btn cancel';
    btn.disabled = false;
    if (mealUpdateBtn) mealUpdateBtn.style.display = 'block';
  } else if (Number(a.quota || 0) >= Number(a.max || 0)) {
    btn.textContent = 'Fully Booked';
    btn.className = 'register-btn';
    btn.disabled = true;
    if (mealUpdateBtn) mealUpdateBtn.style.display = 'none';
  } else {
    btn.textContent = 'Register Now';
    btn.className = 'register-btn';
    btn.disabled = false;
    if (mealUpdateBtn) mealUpdateBtn.style.display = 'none';
  }

  $('detailOverlay')?.classList.add('open');
}

function closeDetail(e) {
  if (!e || e.target === $('detailOverlay')) closeDetailForce();
}

function closeDetailForce() {
  $('detailOverlay')?.classList.remove('open');
}

// =================== REGISTER / MEAL ===================
function handleRegister() {
  const already = myActivities.find(m => Number(m.id) === Number(currentDetailId));

  if (already) {
    openCancelModal(currentDetailId);
    return;
  }

  if (!currentUser) {
    pendingAfterAuth = true;
    $('authModal')?.classList.add('open');
    return;
  }

  mealModalMode = 'register';
  selectedMeal = null;
  $('meatBtn')?.classList.remove('selected');
  $('vegBtn')?.classList.remove('selected');

  const submitBtn = $('submitMealBtn');
  if (submitBtn) {
    submitBtn.textContent = 'Confirm Registration';
    submitBtn.style.opacity = '0.5';
    submitBtn.style.pointerEvents = 'none';
  }

  $('mealModal')?.classList.add('open');
}

function openMealUpdateModal(id) {
  const registered = myActivities.find(m => Number(m.id) === Number(id));
  if (!registered) return;

  currentDetailId = Number(id);
  mealModalMode = 'update';
  selectedMeal = registered.meal || null;

  $('meatBtn')?.classList.toggle('selected', selectedMeal === 'meat');
  $('vegBtn')?.classList.toggle('selected', selectedMeal === 'veg');

  const submitBtn = $('submitMealBtn');
  if (submitBtn) {
    submitBtn.textContent = 'Save Meal Preference';
    submitBtn.style.opacity = selectedMeal ? '1' : '0.5';
    submitBtn.style.pointerEvents = selectedMeal ? 'auto' : 'none';
  }

  $('mealModal')?.classList.add('open');
}

function selectMeal(type) {
  selectedMeal = type;
  $('meatBtn')?.classList.toggle('selected', type === 'meat');
  $('vegBtn')?.classList.toggle('selected', type === 'veg');

  const submitBtn = $('submitMealBtn');
  if (submitBtn) {
    submitBtn.style.opacity = '1';
    submitBtn.style.pointerEvents = 'auto';
  }
}

function closeMeal() {
  $('mealModal')?.classList.remove('open');
  const submitBtn = $('submitMealBtn');
  if (submitBtn) submitBtn.textContent = 'Confirm Registration';
  mealModalMode = 'register';
  selectedMeal = null;
}

async function submitReg() {
  if (mealModalMode === 'update') {
    await updateMealPreference();
    return;
  }

  const a = ACTS.find(x => Number(x.id) === Number(currentDetailId));
  if (!a) return alert('Event not found');
  if (!currentUser?.id_db) return alert('Please log in first');
  if (!selectedMeal) return alert('Please select your meal preference');

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id_db,
        event_id: a.id,
        dietary_req: selectedMeal
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || 'Registration failed');
      return;
    }

    closeMeal();
    $('successMsg').textContent = `You have successfully registered for "${a.title}". Meal preference: ${selectedMeal === 'meat' ? 'Non-Vegetarian' : 'Vegetarian'}.`;
    $('successModal')?.classList.add('open');

    await loadMyActivities();
    await loadEvents();
    openDetail(a.id);
  } catch (e) {
    console.error(e);
    alert('An error occurred');
  }
}

async function updateMealPreference() {
  const a = ACTS.find(x => Number(x.id) === Number(currentDetailId)) || myActivities.find(x => Number(x.id) === Number(currentDetailId));
  if (!a || !currentUser?.id_db) return alert('Unable to update meal preference');
  if (!selectedMeal) return alert('Please select your meal preference');

  try {
    const cancelRes = await fetch(`${API_BASE}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id_db, event_id: a.id })
    });

    const cancelData = await cancelRes.json().catch(() => ({}));
    if (!cancelRes.ok) throw new Error(cancelData.error || 'Failed to update meal preference');

    const regRes = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id_db, event_id: a.id, dietary_req: selectedMeal })
    });

    const regData = await regRes.json().catch(() => ({}));
    if (!regRes.ok) throw new Error(regData.error || 'Failed to save the new meal preference');

    closeMeal();
    await loadMyActivities();
    await loadEvents();
    renderMine();
    openDetail(a.id);
    showAdminSuccess('Meal Preference Updated', `Your meal preference for "${a.title}" is now ${selectedMeal === 'meat' ? 'Non-Vegetarian' : 'Vegetarian'}.`);
  } catch (e) {
    console.error(e);
    alert(e.message || 'Failed to update meal preference');
  } finally {
    mealModalMode = 'register';
  }
}

async function loadMyActivities() {
  if (!currentUser?.id_db) {
    myActivities = [];
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/my-activities/${currentUser.id_db}`);
    if (!res.ok) throw new Error('Failed to load my activities');
    const data = await res.json();

    myActivities = Array.isArray(data) ? data.map(d => ({
      id: Number(d.id ?? d.event_id),
      title: d.title || d.name || 'Untitled Event',
      emoji: d.emoji || '📅',
      color: d.color || 'blue',
      date: d.date || d.event_day || '',
      loc: d.loc || d.location || 'Location not provided',
      tags: normalizeTags(d.tags || d.category_name || 'Registered'),
      quota: d.quota ?? '-',
      max: d.max ?? d.student_capacity ?? '-',
      desc: d.description || d.desc || 'No description available for this event.',
      meal: d.dietary_req || d.meal || null
    })) : [];

    if ($('screen-mine')?.classList.contains('active')) renderMine();
  } catch (error) {
    console.error(error);
  }
}

function goToMine() {
  $('successModal')?.classList.remove('open');
  closeDetailForce();
  switchTab(1);
}

// =================== CANCEL ===================
function openCancelModal(id) {
  cancelTargetId = Number(id);
  const a = ACTS.find(x => Number(x.id) === Number(id)) || myActivities.find(x => Number(x.id) === Number(id));
  $('cancelMsg').textContent = `Are you sure you want to cancel your registration for "${a?.title || 'this event'}"? Your spot will be released.`;
  $('cancelModal')?.classList.add('open');
}

function closeCancelModal() {
  $('cancelModal')?.classList.remove('open');
  cancelTargetId = null;
}

async function confirmCancel() {
  if (cancelTargetId === null || !currentUser?.id_db) return;

  const a = ACTS.find(x => Number(x.id) === Number(cancelTargetId)) || myActivities.find(x => Number(x.id) === Number(cancelTargetId));

  try {
    const res = await fetch(`${API_BASE}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id_db,
        event_id: cancelTargetId
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || 'Cancellation failed');
      return;
    }

    $('cancelModal')?.classList.remove('open');
    $('cancelSuccessMsg').textContent = `Successfully canceled registration for "${a?.title || 'this event'}". The spot has been released.`;
    $('cancelSuccessModal')?.classList.add('open');

    await loadMyActivities();
    await loadEvents();

    if (currentDetailId === cancelTargetId) openDetail(cancelTargetId);
  } catch (e) {
    console.error(e);
    alert('An error occurred');
  } finally {
    cancelTargetId = null;
  }
}

function closeCancelSuccess() {
  $('cancelSuccessModal')?.classList.remove('open');
  if ($('screen-mine')?.classList.contains('active')) renderMine();
}

function cancelFromMine(id) {
  currentDetailId = Number(id);
  openCancelModal(id);
}

// =================== AUTH ===================
function selectRole(role) {
  selectedAuthRole = role;
  $('roleUser')?.classList.toggle('active', role === 'user');
  $('roleAdmin')?.classList.toggle('active', role === 'admin');

  const adminCodeWrap = $('adminCodeWrap');
  if (adminCodeWrap) {
    adminCodeWrap.style.display = (role === 'admin' && $('regForm')?.style.display !== 'none') ? 'block' : 'none';
  }
}

function switchAuthTab(tab) {
  if ($('loginForm')) $('loginForm').style.display = tab === 'login' ? 'flex' : 'none';
  if ($('regForm')) $('regForm').style.display = tab === 'reg' ? 'flex' : 'none';
  $('tabLogin')?.classList.toggle('active', tab === 'login');
  $('tabReg')?.classList.toggle('active', tab === 'reg');

  const adminCodeWrap = $('adminCodeWrap');
  if (adminCodeWrap) adminCodeWrap.style.display = (selectedAuthRole === 'admin' && tab === 'reg') ? 'block' : 'none';
}

async function doLogin() {
  const id = $('loginId')?.value.trim();
  const pw = $('loginPw')?.value.trim();

  if (!id || !pw) return alert('Please enter both your account ID and password');

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pw, role: selectedAuthRole })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || 'Login failed');
      return;
    }

    currentUser = data.user || {};
    currentUser.id = currentUser.id || currentUser.user_id || id;
    currentUser.id_db = currentUser.id_db || currentUser.user_id || currentUser.id || id;
    currentRole = selectedAuthRole;

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('currentRole', currentRole);

    closeAuth();

    if (currentRole === 'admin' && (currentUser.role === 'Organizer' || currentUser.role === 'Admin' || currentUser.role === 'admin')) {
      await showAdminInterface();
    } else {
      showUserInterface();
      renderProfile();
      await loadMyActivities();
      if (pendingAfterAuth) {
        pendingAfterAuth = false;
        handleRegister();
      }
    }
  } catch (e) {
    console.error(e);
    alert('An error occurred');
  }
}

async function doRegister() {
  const user_id = $('rId')?.value.trim();
  const name = $('rName')?.value.trim();
  const phone = $('rPhone')?.value.trim();
  const email = $('rEmail')?.value.trim();
  const dept = $('rDept')?.value.trim();
  const pw = $('rPw')?.value.trim();

  if (!user_id) return alert('Please enter your Student ID / Account');
  if (!pw) return alert('Please enter your password');

  if (selectedAuthRole === 'admin') {
    const code = $('rAdminCode')?.value.trim();
    if (code && code !== 'nsysu2025' && code !== '2025admin') {
      return alert('Incorrect administrator verification code (Hint: nsysu2025)');
    }
  }

  try {
    const res = await fetch(`${API_BASE}/register_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user_id,
        user_id,
        pw,
        role: selectedAuthRole,
        name,
        phone,
        email,
        dept
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || 'Registration failed');
      return;
    }

    currentUser = { id: user_id, id_db: user_id, name, phone, email, dept, role: selectedAuthRole };
    currentRole = selectedAuthRole;

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('currentRole', currentRole);

    closeAuth();

    if (currentRole === 'admin') {
      await showAdminInterface();
    } else {
      showUserInterface();
      renderProfile();
      await loadMyActivities();
      if (pendingAfterAuth) {
        pendingAfterAuth = false;
        handleRegister();
      }
    }
  } catch (e) {
    console.error(e);
    alert('An error occurred');
  }
}

function closeAuth() {
  $('authModal')?.classList.remove('open');
}

function closeAuthOnBg(e) {
  if (e.target === $('authModal')) {
    $('authModal')?.classList.remove('open');
    pendingAfterAuth = false;
  }
}

function logout() {
  $('logoutConfirmModal')?.classList.add('open');
}

function adminLogout() {
  logout();
}

function confirmLogout() {
  $('logoutConfirmModal')?.classList.remove('open');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('currentRole');

  currentUser = null;
  currentRole = null;
  profileEditing = false;
  myActivities = [];

  if ($('loginId')) $('loginId').value = '';
  if ($('loginPw')) $('loginPw').value = '';

  resetFilter();
  showUserInterface();
  renderProfile();
  switchTab(0);
}

// =================== MY ACTIVITIES ===================
function renderMine() {
  const el = $('mine-content');
  if (!el) return;

  if (!currentUser) {
    el.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-calendar-off"></i>
        <p>Please log in first to view<br>your registered events</p>
        <button class="lp-btn primary" onclick="$('authModal').classList.add('open')" style="margin-top:6px">Go to Login</button>
      </div>
    `;
    return;
  }

  if (!myActivities.length) {
    el.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-mood-empty"></i>
        <p>You haven't registered for any events yet</p>
        <button class="lp-btn outline" onclick="switchTab(0)" style="margin-top:4px">Explore Events</button>
      </div>
    `;
    return;
  }

  el.innerHTML = `<div class="my-act-list">` + myActivities.map(m => `
    <div class="my-act-card" onclick="openDetailFromMine(${m.id})">
      <div class="my-act-icon" style="background:${HEROCOLOR[m.color] || '#E3F2FD'}">${m.emoji || '📅'}</div>
      <div class="my-act-info">
        <h4>${m.title}</h4>
        <p>${m.date || ''} · ${m.meal === 'meat' ? '🍖 Non-Vegetarian' : '🌿 Vegetarian'}</p>
      </div>
      <div class="my-act-right">
        <span class="my-badge confirmed">Confirmed</span>
        <button class="cancel-small-btn" onclick="event.stopPropagation();cancelFromMine(${m.id})">Cancel</button>
        <button class="cancel-small-btn" onclick="event.stopPropagation();openMealUpdateModal(${m.id})">Meal</button>
      </div>
    </div>
  `).join('') + `</div>`;
}

function openDetailFromMine(id) {
  const existsInEvents = ACTS.find(x => Number(x.id) === Number(id));
  if (!existsInEvents) {
    const mine = myActivities.find(x => Number(x.id) === Number(id));
    if (!mine) return;
    ACTS.push({
      ...mine,
      loc: mine.loc || 'Location not provided',
      tags: normalizeTags(mine.tags || 'Registered'),
      quota: mine.quota ?? '-',
      max: mine.max ?? '-',
      desc: mine.desc || 'No description available for this event.'
    });
  }
  openDetail(id);
}

// =================== PROFILE ===================
function renderProfile() {
  const el = $('profile-content');
  if (!el) return;

  if (!currentUser) {
    el.innerHTML = `
      <div class="login-prompt">
        <i class="ti ti-user-circle"></i>
        <h3>Not Logged In</h3>
        <p>Log in to view and manage<br>your personal profile</p>
        <button class="lp-btn primary" onclick="$('authModal').classList.add('open')">Login</button>
        <button class="lp-btn outline" onclick="switchAuthTab('reg');$('authModal').classList.add('open')">Register New Account</button>
      </div>
    `;
    return;
  }

  const initials = safeText(currentUser.name || currentUser.id || 'U').slice(-2);

  el.innerHTML = `
    <div class="profile-hero">
      <div class="avatar">${initials}</div>
      <div class="profile-name">${safeText(currentUser.name || currentUser.id)}</div>
      <div class="profile-dept">${safeText(currentUser.dept)}</div>
    </div>
    <div class="profile-fields" id="profileFields"></div>
    <div class="edit-bar">
      <button class="save-btn" id="profileEditBtn" onclick="toggleProfileEdit()">${profileEditing ? 'Save Changes' : 'Edit Profile'}</button>
    </div>
    <div style="padding:0 32px 16px">
      <button class="logout-btn" onclick="logout()">Logout</button>
    </div>
  `;

  renderFields();
}

function renderFields() {
  const c = $('profileFields');
  if (!c || !currentUser) return;

  c.innerHTML = FIELDS.map(f => `
    <div class="field-card">
      <div class="field-label">${f.label}</div>
      <div class="field-row">
        <i class="ti ${f.icon}" style="font-size:17px;color:var(--primary)"></i>
        ${profileEditing
          ? `<input class="field-input" id="fi_${f.key}" value="${safeText(currentUser[f.key])}">`
          : `<span class="field-val">${safeText(currentUser[f.key])}</span>`}
      </div>
    </div>
  `).join('');
}

async function toggleProfileEdit() {
  if (!currentUser) return;

  if (profileEditing) {
    FIELDS.forEach(f => {
      const inp = $(`fi_${f.key}`);
      if (inp) currentUser[f.key] = inp.value;
    });

    profileEditing = false;

    try {
      const res = await fetch(`${API_BASE}/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_db: currentUser.id_db,
          name: currentUser.name,
          phone: currentUser.phone,
          email: currentUser.email,
          dept: currentUser.dept
        })
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) alert('Save failed: ' + (result.error || 'Unknown error'));

      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } catch (e) {
      console.error('Update failed', e);
      alert('Network error. Failed to save.');
    }

    renderProfile();
  } else {
    profileEditing = true;
    renderProfile();
  }
}

// =================== BANNER ===================
function renderBanner() {
  const scroll = $('bannerScroll');
  const dotWrap = document.querySelector('.banner-dot');
  if (!scroll || !dotWrap || ACTS.length === 0) return;

  const items = ACTS.slice(0, 3);

  scroll.innerHTML = items.map((a, i) => `
    <div class="banner-card" onclick="openDetail(${a.id})" style="background:${BANNER_GRADIENTS[i] || BANNER_GRADIENTS[0]}">
      <div class="label">${BANNER_LABELS[i] || '📅 Event'}</div>
      <div class="people">${a.quota} / ${a.max} Attending</div>
      <div class="title">${a.title}</div>
    </div>
  `).join('');

  dotWrap.innerHTML = items.map((_, i) => `<span id="d${i}" class="${i === 0 ? 'on' : ''}"></span>`).join('');

  bannerIndex = 0;
  scroll.scrollLeft = 0;
  scroll.removeEventListener('scroll', onBannerScroll);
  scroll.addEventListener('scroll', onBannerScroll);

  clearInterval(bannerTimer);
  startBannerAuto();
}

function onBannerScroll() {
  const el = $('bannerScroll');
  if (!el) return;
  const idx = Math.round(el.scrollLeft / (getBannerWidth() || 252));
  updateDots(idx);
  bannerIndex = idx;
}

function getBannerWidth() {
  const el = $('bannerScroll');
  return el && el.firstElementChild ? el.firstElementChild.offsetWidth + 12 : 0;
}

function updateDots(index) {
  document.querySelectorAll('.banner-dot span').forEach((dot, i) => {
    dot.classList.toggle('on', i === index);
  });
}

function moveBanner(index) {
  const el = $('bannerScroll');
  if (!el) return;
  el.scrollTo({ left: index * getBannerWidth(), behavior: 'smooth' });
  updateDots(index);
}

function nextBanner() {
  const el = $('bannerScroll');
  if (!el?.children.length) return;
  bannerIndex = (bannerIndex + 1) % el.children.length;
  moveBanner(bannerIndex);
}

function startBannerAuto() {
  clearInterval(bannerTimer);
  bannerTimer = setInterval(nextBanner, 3000);
}

// =================== ADMIN ===================
function renderAdminNav() {
  const adminLogo = $('adminNavLogo');
  if (adminLogo && isDesktop()) adminLogo.style.display = 'block';

  const nav = $('adminNav');
  if (!nav) return;

  nav.querySelector('.admin-badge-nav')?.remove();
  nav.querySelector('.nav-bottom')?.remove();

  const badge = document.createElement('div');
  badge.className = 'admin-badge-nav';
  badge.innerHTML = `<i class="ti ti-shield-check"></i> Administrator Mode`;
  nav.insertBefore(badge, nav.children[1]);

  const bottom = document.createElement('div');
  bottom.className = 'nav-bottom';
  bottom.innerHTML = `<button class="nav-bottom-btn" onclick="adminLogout()"><i class="ti ti-logout"></i> Log out Admin</button>`;
  nav.appendChild(bottom);

  const hb = $('adminHeaderBadge');
  if (hb && currentUser) hb.textContent = `👤 ${currentUser.name || currentUser.id}`;
}

function renderAdminDashboard() {
  const combinedZone = $('admin-combined-card-zone');
  const activityList = $('admin-activity-list');
  if (!combinedZone) return;

  combinedZone.innerHTML = `
    <div class="admin-overview-card-row">
      <div class="admin-overview-mini-card">
        <div class="admin-overview-icon total"><i class="ti ti-calendar-event"></i></div>
        <div>
          <div class="admin-overview-label">Total Events</div>
          <div class="admin-overview-number">${ACTS.length}</div>
        </div>
      </div>
      <button type="button" class="admin-overview-mini-card add" onclick="openAddActivity()">
        <div class="admin-overview-icon add"><i class="ti ti-plus"></i></div>
        <div>
          <div class="admin-overview-label">Quick Action</div>
          <div class="admin-overview-title">Add Event</div>
        </div>
      </button>
    </div>
  `;

  if (!activityList) return;

  if (ACTS.length === 0) {
    activityList.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">No events available. Click Add Event to create one.</div>`;
    return;
  }

  activityList.innerHTML = ACTS.map(a => {
    const regs = REGISTRATIONS[a.id] || [];
    const meat = regs.filter(r => r.meal === 'meat').length;
    const veg = regs.filter(r => r.meal === 'veg').length;
    const pct = Math.min(100, Math.round(Number(a.quota || 0) / Number(a.max || 1) * 100));

    return `
      <div class="admin-act-card">
        <div class="admin-act-header">
          <div class="act-thumb ${a.color}" style="width:48px;height:48px;font-size:22px">${a.emoji || '📅'}</div>
          <div class="admin-act-info">
            <h3>${a.title}</h3>
            <p>${a.date} · ${a.loc}</p>
          </div>
          <div class="admin-act-actions">
            <button class="admin-btn view" onclick="openRegDetail(${a.id})"><i class="ti ti-users"></i>List</button>
            <button class="admin-btn edit" onclick="openEditActivity(${a.id})"><i class="ti ti-edit"></i>Edit</button>
            <button class="admin-btn del" onclick="openDeleteModal(${a.id})"><i class="ti ti-trash"></i>Delete</button>
          </div>
        </div>
        <div class="admin-act-footer">
          <div class="admin-progress-wrap">
            <div class="admin-quota-label">Registration Progress: ${a.quota} / ${a.max}</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>
          <div class="admin-meal-pills">
            <span class="meal-pill meat">🍖 Meat: ${meat}</span>
            <span class="meal-pill veg">🌿 Veg: ${veg}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadAllRegistrations() {
  try {
    const res = await fetch(`${API_BASE}/registrations`);
    if (!res.ok) throw new Error('Failed to load registrations');

    const data = await res.json();
    REGISTRATIONS = {};

    Object.entries(data || {}).forEach(([k, v]) => {
      REGISTRATIONS[Number(k)] = Array.isArray(v) ? v.map(r => ({
        uid: r.uid || r.user_id || r.id || '',
        name: r.name || '',
        dept: r.dept || r.department || '',
        meal: String(r.meal || r.dietary_req || '').includes('veg') || String(r.meal || r.dietary_req || '').includes('素') ? 'veg' : 'meat'
      })) : [];
    });
  } catch (error) {
    console.error('loadAllRegistrations error:', error);
  }
}

function renderAdminRegistrations() {
  const el = $('admin-reg-content');
  if (!el) return;

  if (!ACTS.length) {
    el.innerHTML = `<div class="empty-state"><p>No events available</p></div>`;
    return;
  }

  el.innerHTML = ACTS.map(a => {
    const regs = REGISTRATIONS[a.id] || [];
    const meat = regs.filter(r => r.meal === 'meat').length;
    const veg = regs.filter(r => r.meal === 'veg').length;
    const pct = Math.min(100, Math.round(Number(a.quota || 0) / Number(a.max || 1) * 100));

    return `
      <div class="reg-overview-card" onclick="openRegDetail(${a.id})">
        <div class="reg-overview-header">
          <div class="act-thumb ${a.color}" style="width:46px;height:46px;font-size:20px">${a.emoji}</div>
          <div class="reg-overview-info">
            <h3>${a.title}</h3>
            <p>${a.date}</p>
          </div>
          <div>
            <div class="reg-overview-count">${a.quota}<span>/ ${a.max} Attendees</span></div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="flex:1">
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>
          <div class="admin-meal-pills">
            <span class="meal-pill meat">🍖 ${meat}</span>
            <span class="meal-pill veg">🌿 ${veg}</span>
          </div>
          <i class="ti ti-chevron-right" style="color:var(--text-muted);font-size:16px"></i>
        </div>
      </div>
    `;
  }).join('');
}

function openRegDetail(actId) {
  const a = ACTS.find(x => Number(x.id) === Number(actId));
  const regs = REGISTRATIONS[actId] || [];
  const meat = regs.filter(r => r.meal === 'meat').length;
  const veg = regs.filter(r => r.meal === 'veg').length;

  if (!a) return;

  $('adminRegDetailTitle').textContent = a.title;
  $('adminRegDetailSub').textContent = `Total ${regs.length} registrations · Meat ${meat} · Vegetarian ${veg}`;

  let tableHtml = '';

  if (regs.length === 0) {
    tableHtml = `<div class="empty-state" style="padding:24px 0"><i class="ti ti-users" style="font-size:32px;opacity:.3"></i><p>No registrations yet</p></div>`;
  } else {
    tableHtml = `
      <div style="margin-bottom:12px;display:flex;gap:8px">
        <span class="meal-pill meat" style="font-size:13px;padding:4px 12px">🍖 Meat ${meat}</span>
        <span class="meal-pill veg" style="font-size:13px;padding:4px 12px">🌿 Veg ${veg}</span>
      </div>
      <div style="overflow-x:auto">
        <table class="reg-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student ID / Account</th>
              <th>Name</th>
              <th>Department</th>
              <th>Meal</th>
            </tr>
          </thead>
          <tbody>
            ${regs.map((r, i) => `
              <tr>
                <td style="color:var(--text-muted)">${i + 1}</td>
                <td>${r.uid}</td>
                <td style="font-weight:600">${r.name}</td>
                <td>${r.dept}</td>
                <td><span class="meal-pill ${r.meal}">${r.meal === 'meat' ? '🍖 Meat' : '🌿 Veg'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  $('adminRegDetailBody').innerHTML = tableHtml;
  $('adminRegDetailModal')?.classList.add('open');
}

function closeRegDetail() {
  $('adminRegDetailModal')?.classList.remove('open');
}

function renderAdminProfile() {
  const el = $('admin-profile-content');
  if (!el) return;

  el.innerHTML = `
    <div class="profile-hero">
      <div class="avatar">${safeText(currentUser?.name || 'AD').slice(-2)}</div>
      <div class="profile-name">${safeText(currentUser?.name || 'Administrator')}</div>
      <div class="profile-dept">Administrator Mode</div>
    </div>
    <div style="padding:0 32px 16px">
      <button class="logout-btn" onclick="adminLogout()">Logout</button>
    </div>
  `;
}

// =================== ADMIN ACTIVITY FORM ===================
function openAddActivity() {
  editingActId = null;

  $('actFormTitle').textContent = 'Create Event';
  $('actFormSubtitle').textContent = 'Fill in event details';
  $('af_title').value = '';
  $('af_date').value = '';
  $('af_time').value = '';
  $('af_loc').value = '';
  $('af_quota').value = '0';
  $('af_max').value = '100';
  $('af_emoji').value = '📅';
  $('af_color').value = 'blue';
  $('af_tags').value = '';
  $('af_desc').value = '';

  $('activityFormModal')?.classList.add('open');
}

function openEditActivity(id) {
  const a = ACTS.find(x => Number(x.id) === Number(id));
  if (!a) return;

  editingActId = Number(id);
  $('actFormTitle').textContent = 'Edit Event';
  $('actFormSubtitle').textContent = `Editing: ${a.title}`;
  $('af_title').value = a.title;

  const editDateTime = splitActivityDateTime(a.date);
  $('af_date').value = editDateTime.date;
  $('af_time').value = a.time || editDateTime.time;
  $('af_loc').value = a.loc;
  $('af_quota').value = a.quota;
  $('af_max').value = a.max;
  $('af_emoji').value = a.emoji || '📅';
  $('af_color').value = a.color || 'blue';
  $('af_tags').value = normalizeTags(a.tags).join(',');
  $('af_desc').value = a.desc || '';

  $('activityFormModal')?.classList.add('open');
}

async function submitActivityForm() {
  const title = $('af_title').value.trim();
  const date = $('af_date').value.trim();
  const time = $('af_time').value.trim();
  const loc = $('af_loc').value.trim();
  const max = parseInt($('af_max').value, 10) || 100;
  const emoji = $('af_emoji').value;
  const color = $('af_color').value;
  const tags = $('af_tags').value.trim();
  const desc = $('af_desc').value.trim();
  const dept = $('af_dept') ? $('af_dept').value : 'College of Management';

  if (!title || !date || !time || !loc) {
    return alert('Please fill in the event name, date, time, and location');
  }

  const { event_day, event_time } = parseActivityDateTime(date, time);

  const payload = {
    title,
    date: event_day,
    time: event_time,
    event_day,
    event_time,
    loc,
    location: loc,
    max,
    student_capacity: max,
    guest_capacity: max,
    emoji,
    color,
    tags,
    description: desc,
    category_id: 1,
    department: dept,
    host_id: currentUser?.id_db || currentUser?.id || null
  };

  try {
    const url = editingActId === null ? `${API_BASE}/events` : `${API_BASE}/events/${editingActId}`;
    const method = editingActId === null ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Save failed');

    closeActivityForm();
    await loadEvents();
    await loadAllRegistrations();
    renderAdminDashboard();
    renderAdminRegistrations();
    showAdminSuccess('Action successful', data.message || 'Event saved successfully.');
  } catch (err) {
    console.error(err);
    alert(err.message || 'Save failed');
  }
}

function closeActivityForm() {
  $('activityFormModal')?.classList.remove('open');
  editingActId = null;
}

function openDeleteModal(id) {
  deleteTargetId = Number(id);
  const a = ACTS.find(x => Number(x.id) === Number(id));
  $('adminDeleteMsg').textContent = `Are you sure you want to delete "${a?.title || 'this event'}"? This action cannot be undone.`;
  $('adminDeleteModal')?.classList.add('open');
}

function closeDeleteModal() {
  $('adminDeleteModal')?.classList.remove('open');
  deleteTargetId = null;
}

async function confirmDeleteActivity() {
  if (deleteTargetId === null) return;

  try {
    const res = await fetch(`${API_BASE}/events/${deleteTargetId}`, {
      method: 'DELETE'
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Delete failed');

    closeDeleteModal();
    await loadEvents();
    await loadAllRegistrations();
    renderAdminDashboard();
    renderAdminRegistrations();
    showAdminSuccess('Event Deleted', data.message || 'Event deleted successfully.');
  } catch (err) {
    console.error(err);
    alert(err.message || 'Delete failed');
  }
}

// =================== MODALS ===================
function showAdminSuccess(title, message) {
  if ($('adminSuccessTitle')) $('adminSuccessTitle').textContent = title || 'Action successful';
  if ($('adminSuccessMsg')) $('adminSuccessMsg').textContent = message || '';
  $('adminSuccessModal')?.classList.add('open');
}

function closeAdminSuccess() {
  $('adminSuccessModal')?.classList.remove('open');
}

// =================== INIT ===================
function restoreSession() {
  try {
    const savedUser = localStorage.getItem('currentUser');
    const savedRole = localStorage.getItem('currentRole');

    if (savedUser) currentUser = JSON.parse(savedUser);
    if (savedRole) currentRole = savedRole;
  } catch (e) {
    console.warn('Failed to restore session:', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  restoreSession();
  applyLayout();

  window.addEventListener('resize', applyLayout);

  const banner = $('bannerScroll');
  if (banner) {
    banner.addEventListener('touchstart', () => clearInterval(bannerTimer));
    banner.addEventListener('mouseenter', () => clearInterval(bannerTimer));
    banner.addEventListener('touchend', startBannerAuto);
    banner.addEventListener('mouseleave', startBannerAuto);
  }

  const searchBtn = $('searchBtn');
  const searchInput = $('searchKeyword');
  const filterTag = $('filterTag');

  if (searchBtn) searchBtn.addEventListener('click', doFilter);
  if (filterTag) filterTag.addEventListener('change', doFilter);
  if (searchInput) {
    searchInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        doFilter();
      }
    });
  }

  if (currentRole === 'admin') {
    await loadEvents();
    await showAdminInterface();
  } else {
    showUserInterface();
    await loadEvents();
    await loadMyActivities();
    renderProfile();
  }
});