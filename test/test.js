// =================== DATA ===================
const API_BASE = 'http://127.0.0.1:5000/api';

let ACTS = [];
//yeeeee
const REGISTRATIONS = {
  0: [
  ],
  1: [
  ],
  2: [
  ],
};

const TAGCOLOR = {
  'Competition':'green','Arts':'purple','Music':'purple','Eco / Environment':'green',
  'IT / Info':'blue','Photography':'purple','Lectures':'orange','Culture':'green',
  'Sports & Exercise':'green','Gaming / Esports':'purple','Lifestyle':'orange'
};

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Competition' },
  { id: 2, name: 'Arts' },
  { id: 3, name: 'Music' },
  { id: 4, name: 'Eco / Environment' },
  { id: 5, name: 'IT / Info' },
  { id: 6, name: 'Photography' },
  { id: 7, name: 'Lectures' },
  { id: 8, name: 'Culture' },
  { id: 9, name: 'Sports & Exercise' },
  { id: 10, name: 'Gaming / Esports' },
  { id: 11, name: 'Lifestyle' }
];
let CATEGORIES = [...DEFAULT_CATEGORIES];
let CATEGORY_IDS = Object.fromEntries(CATEGORIES.map(c => [c.name, c.id]));

function getCategoryId(categoryName) {
  return CATEGORY_IDS[categoryName] || 1;
}

function renderCategorySelects() {
  const filterTag = document.getElementById('filterTag');

  if (filterTag) {
    const text = filterTag.querySelector('.category-select-text');
    const menu = filterTag.querySelector('.category-select-menu');

    const currentValue = filterTag.dataset.value || 'all';

    const options = [
      { value: 'all', label: 'All Tags' },
      ...CATEGORIES.map(c => ({
        value: c.name,
        label: c.name
      }))
    ];

    const validValue = options.some(o => o.value === currentValue)
      ? currentValue
      : 'all';

    filterTag.dataset.value = validValue;

    const selectedOption = options.find(o => o.value === validValue);

    if (text) {
      text.textContent = selectedOption?.label || 'All Tags';
    }

    if (menu) {
      menu.innerHTML = options.map(option => `
        <div 
          class="category-select-option ${option.value === validValue ? 'active' : ''}" 
          data-value="${option.value}"
        >
          ${option.label}
        </div>
      `).join('');
    }
  }

  const adminTag = document.getElementById('af_tags');

  if (adminTag) {
    const currentValue = adminTag.dataset.value;

    const options = CATEGORIES.map(c => ({
      value: c.name,
      label: c.name
    }));

    const fallbackValue = CATEGORIES.some(c => c.name === currentValue)
      ? currentValue
      : '';

    renderFormSelectOptions('af_tags', options, fallbackValue);
  }
  }

document.addEventListener('click', function (e) {
  const filterTag = document.getElementById('filterTag');
  if (!filterTag) return;

  const btn = e.target.closest('.category-select-btn');
  const option = e.target.closest('.category-select-option');

  // 點按鈕：打開 / 關閉選單
  if (btn && filterTag.contains(btn)) {
    e.preventDefault();
    e.stopPropagation();

    filterTag.classList.toggle('open');
    return;
  }

  // 點選項：更新目前選到的分類
  if (option && filterTag.contains(option)) {
    e.preventDefault();
    e.stopPropagation();

    const value = option.dataset.value;
    const label = option.textContent.trim();

    filterTag.dataset.value = value;

    const text = filterTag.querySelector('.category-select-text');
    if (text) {
      text.textContent = label;
    }

    filterTag.querySelectorAll('.category-select-option').forEach(el => {
      el.classList.remove('active');
    });

    option.classList.add('active');
    filterTag.classList.remove('open');

    requestAnimationFrame(() => {
      filterTag.dispatchEvent(new Event('change'));
    });

    return;
  }

  // 點外面：關閉選單
  filterTag.classList.remove('open');
});

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to load categories');
    const data = await res.json();
    CATEGORIES = data.map(c => ({ id: Number(c.id), name: c.name })).filter(c => c.id && c.name);
    if (!CATEGORIES.length) CATEGORIES = [...DEFAULT_CATEGORIES];
  } catch (error) {
    console.error('Failed to load categories:', error);
    CATEGORIES = [...DEFAULT_CATEGORIES];
  }
  CATEGORY_IDS = Object.fromEntries(CATEGORIES.map(c => [c.name, c.id]));
  renderCategorySelects();
}

function getPrimaryTag(tags) {
  if (Array.isArray(tags)) return tags[0] || 'Uncategorized';
  return tags || 'Uncategorized';
}

const HEROCOLOR = {
  green: 'var(--green-pale)',
  orange: 'var(--orange-pale)',
  purple: 'var(--purple-pale)',
  blue: 'var(--blue-pale)'
};

const DEFAULT_MEAL_OPTIONS = ['meat', 'veg'];
let MEAL_OPTIONS = [...DEFAULT_MEAL_OPTIONS];
const MEAL_META = {
  meat: { label: 'Non-Vegetarian', icon: 'ti-meat', className: 'meat' },
  veg: { label: 'Vegetarian', icon: 'ti-leaf', className: 'veg' }
};

function getMealOptions(eventData) {
  return Array.isArray(eventData?.meal_options) && eventData.meal_options.length
    ? eventData.meal_options
    : MEAL_OPTIONS;
}

function getMealMeta(option) {
  return MEAL_META[option] || { label: option, icon: 'ti-tools-kitchen-2', className: 'custom' };
}

function formatMealLabel(option) {
  return getMealMeta(option).label;
}

function formatMealIcon(option) {
  return option === 'meat' ? '🍖' : (option === 'veg' ? '🌿' : '🍽');
}

function normalizeRegistrationMeal(meal) {
  if (!meal) return 'meat';
  const value = String(meal).trim().toLowerCase();
  if (value === 'meat' || value === 'veg') return value;
  if (String(meal).includes('素')) return 'veg';
  return value;
}

function renderMealOptions(eventData) {
  const wrap = document.getElementById('mealOptions');
  if (!wrap) return;
  const options = getMealOptions(eventData);
  wrap.innerHTML = options.map(option => {
    const meta = getMealMeta(option);
    return `<button class="meal-btn" data-meal="${option}" onclick="selectMeal('${option}')"><i class="ti ${meta.icon}"></i>${meta.label}</button>`;
  }).join('');
}

async function loadMealOptions() {
  try {
    const res = await fetch(`${API_BASE}/meal-options`);
    if (!res.ok) throw new Error('Failed to load meal options');
    const data = await res.json();
    MEAL_OPTIONS = Array.isArray(data) && data.length ? data : [...DEFAULT_MEAL_OPTIONS];
  } catch (error) {
    console.error('Failed to load meal options:', error);
    MEAL_OPTIONS = [...DEFAULT_MEAL_OPTIONS];
  }
}

// =================== STATE ===================
let currentUser = null;
let currentRole = null; // 'user' | 'admin'
let myActivities = [];
let currentDetailId = null;
let selectedMeal = null;
let mealModalMode = 'register'; // 'register' 
let pendingAfterAuth = false;
let cancelTargetId = null;
let profileEditing = false;
let selectedAuthRole = 'user';

// Admin state
let editingActId = null;
let deleteTargetId = null;

// =================== LAYOUT ===================
function isDesktop() { return window.innerWidth >= 900; }

function applyLayout() {
  const logo = document.getElementById('navLogo');
  const adminLogo = document.getElementById('adminNavLogo');
  const app = document.getElementById('app');
  const mainNav = document.getElementById('mainNav');
  const adminNav = document.getElementById('adminNav');

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

window.addEventListener('resize', applyLayout);
applyLayout();

// =================== INTERFACE SWITCH ===================
function showUserInterface() {
  const userApp = document.getElementById('userApp');
  const adminApp = document.getElementById('adminApp');
  const mainNav = document.getElementById('mainNav');
  const adminNav = document.getElementById('adminNav');

  userApp.style.display = 'contents';
  adminApp.style.display = 'none';
  if (mainNav) mainNav.style.display = 'flex';
  if (adminNav) adminNav.style.display = 'none';
  applyLayout();
}

async function showAdminInterface() {
  const userApp = document.getElementById('userApp');
  const adminApp = document.getElementById('adminApp');
  const mainNav = document.getElementById('mainNav');
  const adminNav = document.getElementById('adminNav');

  resetFilter(); // 切換到管理員介面前先重置篩選

  userApp.style.display = 'none';
  adminApp.style.display = 'contents';
  if (mainNav) mainNav.style.display = 'none';
  if (adminNav) adminNav.style.display = 'flex';

  renderAdminNav();
  await loadAllRegistrations();
  renderAdminDashboard();
  renderAdminRegistrations();
  renderAdminProfile();
  applyLayout();
}

// =================== TABS (USER) ===================
const screens = ['screen-events','screen-mine','screen-profile'];
const navs = ['nav0','nav1','nav2'];

function switchTab(i) {
  screens.forEach((s, idx) => document.getElementById(s).classList.toggle('active', idx === i));
  navs.forEach((n, idx) => document.getElementById(n).classList.toggle('active', idx === i));
  if (i === 1) loadMyActivities().then(() => renderMine());
  if (i === 2) renderProfile();
}

// =================== TABS (ADMIN) ===================
const adminScreens = ['admin-screen-dashboard','admin-screen-registrations','admin-screen-profile'];
const adminNavs = ['anav0','anav1','anav2'];

async function switchAdminTab(i) {
  adminScreens.forEach((s, idx) => document.getElementById(s).classList.toggle('active', idx === i));
  adminNavs.forEach((n, idx) => document.getElementById(n).classList.toggle('active', idx === i));
  if (i === 0) renderAdminDashboard();
  if (i === 1) {
    await loadAllRegistrations();
    renderAdminRegistrations();
  }
  if (i === 2) renderAdminProfile();
}

// =================== FILTER ===================
function resetFilter() {
  const searchInput = document.getElementById('searchKeyword');
  const filterTag = document.getElementById('filterTag');

  if (searchInput) searchInput.value = '';

  if (filterTag) {
    filterTag.dataset.value = 'all';

    const text = filterTag.querySelector('.category-select-text');
    if (text) text.textContent = 'All Tags';

    filterTag.querySelectorAll('.category-select-option').forEach(option => {
      option.classList.toggle('active', option.dataset.value === 'all');
    });

    filterTag.classList.remove('open');
  }

  if (window.allEvents) ACTS = [...window.allEvents];

  renderCards();
}

function doFilter() {
  if (!window.allEvents) return;

  const searchInput = document.getElementById('searchKeyword');
  const filterTag = document.getElementById('filterTag');

  const keyword = searchInput
    ? searchInput.value.toLowerCase().trim()
    : '';

  const selectedTag = filterTag
    ? (filterTag.dataset.value || 'all')
    : 'all';

  ACTS = window.allEvents.filter(act => {
    const matchText = !keyword || (
      (act.title && act.title.toLowerCase().includes(keyword)) ||
      (act.loc && act.loc.toLowerCase().includes(keyword)) ||
      (act.desc && act.desc.toLowerCase().includes(keyword))
    );

    const tags = Array.isArray(act.tags)
      ? act.tags
      : (act.tags ? [act.tags] : []);

    const matchTag = selectedTag === 'all' || tags.includes(selectedTag);

    return matchText && matchTag;
  });

  renderCards();
}

// =================== RENDER CARDS (USER) ===================
function renderCards() {
  const list = document.querySelector('.activity-list');
  if (!list) return;

  const now = new Date();

  const sortedActs = [...ACTS].sort((a, b) => {
    const dateA = parseCalendarDate(a.date);
    const dateB = parseCalendarDate(b.date);

    const aPast = dateA && dateA < now;
    const bPast = dateB && dateB < now;

    if (aPast && !bPast) return 1;
    if (!aPast && bPast) return -1;
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return dateA - dateB;
  });

  const html = sortedActs.map(a => {
    const reg = myActivities.find(m => m.id === a.id);
    const pct = a.max > 0
      ? Math.min(100, Math.round(a.quota / a.max * 100))
      : 0;

    const tags = Array.isArray(a.tags)
      ? a.tags
      : (a.tags ? [a.tags] : []);

    return `
      <div class="act-card" onclick="openDetail(${a.id})">
        <div class="act-card-top">
          <div class="act-thumb ${a.color || 'green'}">${a.emoji || ''}</div>

          <div class="act-info">
            <h3>${a.title || ''}</h3>

            <div class="act-meta">
              <i class="ti ti-calendar"></i>
              <span class="act-date">${a.date || ''}</span>
            </div>

            <div class="act-tags">
              ${tags.map(t => `<span class="tag ${TAGCOLOR[t] || 'green'}">${t}</span>`).join('')}
              ${reg ? '<span class="tag green">✓ Registered</span>' : ''}
            </div>
          </div>
        </div>

        <div class="act-bottom">
          <div class="progress-wrap">
            <div class="progress-label">${a.quota || 0} / ${a.max || 0} Attending</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${pct}%"></div>
            </div>
          </div>

          <span class="act-spots">${Math.max(0, (a.max || 0) - (a.quota || 0))} Spots Left</span>
        </div>
      </div>
    `;
  }).join('');

  list.innerHTML = html || `
    <div class="empty-state">
      No activities found.
    </div>
  `;
}

function padCalendarPart(value) {
  return String(value).padStart(2, '0');
}

function parseCalendarDate(value) {
  const match = String(value || '').match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!match) return null;

  const [, year, month, day, hour = '0', minute = '0'] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}

function formatCalendarDate(date) {
  return [
    date.getFullYear(),
    padCalendarPart(date.getMonth() + 1),
    padCalendarPart(date.getDate())
  ].join('') + 'T' + [
    padCalendarPart(date.getHours()),
    padCalendarPart(date.getMinutes()),
    '00'
  ].join('');
}

function getCalendarEvent(id) {
  const fullEvent = window.allEvents ? window.allEvents.find(x => x.id === id) : null;
  const listedEvent = ACTS.find(x => x.id === id);
  const registeredEvent = myActivities.find(x => x.id === id);
  return { ...(registeredEvent || {}), ...(listedEvent || {}), ...(fullEvent || {}) };
}

function buildGoogleCalendarUrl(event) {
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', event.title || 'NSYSU Event');
  url.searchParams.set('location', event.loc || '');
  url.searchParams.set('details', event.desc || 'Registered event from NSYSU Event Registration Platform.');
  url.searchParams.set('ctz', 'Asia/Taipei');

  const start = parseCalendarDate(event.date);
  if (start) {
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    url.searchParams.set('dates', `${formatCalendarDate(start)}/${formatCalendarDate(end)}`);
  }

  return url.toString();
}

// =================== DETAIL ===================
function openDetail(id) {
  const fullEvent = window.allEvents ? window.allEvents.find(x => x.id === id) : null;
  const a = ACTS.find(x => x.id === id) || myActivities.find(x => x.id === id) || fullEvent;
  if (!a) return;
  currentDetailId = id;

  document.getElementById('dTitle').textContent = a.title;
  document.getElementById('dHero').textContent = a.emoji || '📅';
  document.getElementById('dHero').style.background = HEROCOLOR[a.color] || '#4f46e5';

  const tagsArray = Array.isArray(a.tags) ? a.tags : (a.tags ? String(a.tags).split(',') : ['Uncategorized']);
  document.getElementById('dTags').innerHTML = tagsArray.map(t => {
    const cleanTag = t.trim();
    return `<span class="tag ${TAGCOLOR[cleanTag] || 'green'}">${cleanTag}</span>`;
  }).join('');

  document.getElementById('dDate').textContent = a.date || '';
  document.getElementById('dLocation').textContent = a.loc || 'Location not provided';
  document.getElementById('dDesc').textContent = a.desc || 'No description available for this event.';
  document.getElementById('dQuota').textContent = a.quota ?? '-';
  document.getElementById('dMax').textContent = a.max ?? '-';

  const already = myActivities.find(m => m.id === id);
  const btn = document.getElementById('regBtn');
  const calendarBtn = document.getElementById('calendarBtn');
  const isFull = Number(a.quota) >= Number(a.max);
  const isPast = parseCalendarDate(a.date) && parseCalendarDate(a.date) < new Date();

if (isPast) {
  btn.textContent = 'Event Ended';
  btn.className = 'register-btn';
  btn.disabled = true;
} else if (already) {
  btn.textContent = '✕ Cancel Registration';
  btn.className = 'register-btn cancel';
  btn.disabled = false;
} else if (isFull) {
  btn.textContent = 'Registration Full';
  btn.className = 'register-btn';
  btn.disabled = true;
} else if (!currentUser) {
  btn.textContent = 'Register Now';
  btn.className = 'register-btn';
  btn.disabled = false;
} else {
  btn.textContent = 'Register Now';
  btn.className = 'register-btn';
  btn.disabled = false;
}

  if (calendarBtn) {
    if (already && !isPast) {
      calendarBtn.href = buildGoogleCalendarUrl(getCalendarEvent(id));
      calendarBtn.hidden = false;
    } else {
      calendarBtn.hidden = true;
      calendarBtn.href = '#';
    }
  }

  document.getElementById('detailOverlay').classList.add('open');
}

function closeDetail(e) {
  if (e.target === document.getElementById('detailOverlay')) closeDetailForce();
}

function closeDetailForce() {
  document.getElementById('detailOverlay').classList.remove('open');
}

// =================== REGISTER ===================
function handleRegister() {
  const already = myActivities.find(m => m.id === currentDetailId);
  if (already) { openCancelModal(currentDetailId); return; }
  if (!currentUser) {
    pendingAfterAuth = true;
    document.getElementById('authModal').classList.add('open');
  } else {
    mealModalMode = 'register';
    selectedMeal = null;
    const a = ACTS.find(x => x.id === currentDetailId) || window.allEvents?.find(x => x.id === currentDetailId);
    renderMealOptions(a);
    document.getElementById('submitMealBtn').style.opacity = '0.5';
    document.getElementById('submitMealBtn').style.pointerEvents = 'none';
    document.getElementById('mealModal').classList.add('open');
  }
}


function selectMeal(type) {
  selectedMeal = type;
  document.querySelectorAll('#mealOptions .meal-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.meal === type);
  });
  document.getElementById('submitMealBtn').style.opacity = '1';
  document.getElementById('submitMealBtn').style.pointerEvents = 'auto';
}

async function loadMyActivities() {
  if (!currentUser || !currentUser.id_db) {
    myActivities = [];
    renderCards();
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/my-activities/${currentUser.id_db}`);
    if (!res.ok) throw new Error('Failed to load my activities');
    const data = await res.json();
    myActivities = data.map(d => ({
      id: Number(d.id),
      title: d.title,
      emoji: d.emoji || '📅',
      color: d.color || 'blue',
      date: d.date,
      tags: d.tags ? [d.tags] : [],
      meal: normalizeRegistrationMeal(d.dietary_req)
    }));
    renderCards();
    if (document.getElementById('screen-mine').classList.contains('active')) {
      renderMine();
    }
  } catch (error) {
    console.error(error);
  }
}

async function submitReg() {
  if (mealModalMode === 'update') {
    await updateMealPreference();
    return;
  }

  const a = ACTS.find(x => x.id === currentDetailId);
  if (!a) return alert('Event not found');

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id_db, event_id: a.id, dietary_req: selectedMeal })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Registration failed'); return; }

    document.getElementById('mealModal').classList.remove('open');
    document.getElementById('submitMealBtn').textContent = 'Confirm Registration';
    document.getElementById('successMsg').textContent = `You have successfully registered for "${a.title}". Meal preference: ${formatMealLabel(selectedMeal)}.`;
    document.getElementById('successModal').classList.add('open');

    await loadMyActivities();
    await loadEvents();

    const btn = document.getElementById('regBtn');
    btn.textContent = '✕ Cancel Registration'; btn.className = 'register-btn cancel';

    const calendarBtn = document.getElementById('calendarBtn');
    if (calendarBtn) {
      calendarBtn.href = buildGoogleCalendarUrl(getCalendarEvent(currentDetailId));
      calendarBtn.hidden = false;
    }

    const reloaded = ACTS.find(x => x.id === currentDetailId);
    if (reloaded) document.getElementById('dQuota').textContent = reloaded.quota;
  } catch (e) {
    console.error(e);
    alert('An error occurred');
  }
}

async function updateMealPreference() {
  const a = ACTS.find(x => x.id === currentDetailId) || myActivities.find(x => x.id === currentDetailId);
  if (!a || !currentUser || !currentUser.id_db) return alert('Unable to update meal preference');

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

    document.getElementById('mealModal').classList.remove('open');
    document.getElementById('submitMealBtn').textContent = 'Confirm Registration';
    await loadMyActivities();
    await loadEvents();
    renderMine();
    openDetail(a.id);
    showAdminSuccess('Meal Preference Updated', `Your meal preference for "${a.title}" is now ${formatMealLabel(selectedMeal)}.`);
  } catch (e) {
    console.error(e);
    alert(e.message || 'Failed to update meal preference');
  } finally {
    mealModalMode = 'register';
  }
}

function goToMine() {
  document.getElementById('successModal').classList.remove('open');
  closeDetailForce();
  switchTab(1);
}

function closeMeal() {
  document.getElementById('mealModal').classList.remove('open');
  document.getElementById('submitMealBtn').textContent = 'Confirm Registration';
  mealModalMode = 'register';
}

// =================== CANCEL ===================
function openCancelModal(id) {
  cancelTargetId = id;
  const a = ACTS.find(x => x.id === id);
  document.getElementById('cancelMsg').innerHTML =
    `Are you sure you want to cancel your registration for "<strong>${a.title}</strong>"? Your spot will be released.`;
  document.getElementById('cancelModal').classList.add('open');
}

function closeCancelModal() {
  document.getElementById('cancelModal').classList.remove('open');
  cancelTargetId = null;
}

async function confirmCancel() {
  if (cancelTargetId === null) return;
  const a = ACTS.find(x => x.id === cancelTargetId);

  try {
    const res = await fetch(`${API_BASE}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id_db, event_id: a.id })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Cancellation failed'); return; }

    document.getElementById('cancelModal').classList.remove('open');
    document.getElementById('cancelSuccessMsg').textContent = `Successfully canceled registration for "${a.title}". The spot has been released.`;
    document.getElementById('cancelSuccessModal').classList.add('open');

    await loadMyActivities();
    await loadEvents();

    if (currentDetailId === cancelTargetId) {
      const btn = document.getElementById('regBtn');
      btn.textContent = 'Register Now'; btn.className = 'register-btn'; btn.disabled = false;
      const calendarBtn = document.getElementById('calendarBtn');
      if (calendarBtn) {
        calendarBtn.hidden = true;
        calendarBtn.href = '#';
      }
      const reloadedA = ACTS.find(x => x.id === cancelTargetId);
      document.getElementById('dQuota').textContent = reloadedA ? reloadedA.quota : a.quota;
    }
  } catch (e) {
    console.error(e);
    alert('An error occurred');
  }

  cancelTargetId = null;
}

function closeCancelSuccess() {
  document.getElementById('cancelSuccessModal').classList.remove('open');
  if (document.getElementById('screen-mine').classList.contains('active')) renderMine();
}

function cancelFromMine(id) {
  currentDetailId = id;
  openCancelModal(id);
}

// =================== AUTH ===================
function selectRole(role) {
  selectedAuthRole = role;
  document.getElementById('roleUser').classList.toggle('active', role === 'user');
  document.getElementById('roleAdmin').classList.toggle('active', role === 'admin');
  const adminCodeWrap = document.getElementById('adminCodeWrap');
  if (adminCodeWrap) adminCodeWrap.style.display = (role === 'admin') ? 'block' : 'none';
}

function switchAuthTab(tab) {
  document.getElementById('loginForm').style.display = tab === 'login' ? 'flex' : 'none';
  document.getElementById('regForm').style.display  = tab === 'reg'   ? 'flex' : 'none';
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabReg').classList.toggle('active', tab === 'reg');
  const adminCodeWrap = document.getElementById('adminCodeWrap');
  if (adminCodeWrap) adminCodeWrap.style.display = (selectedAuthRole === 'admin' && tab === 'reg') ? 'block' : 'none';
}

async function doLogin() {
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value.trim();
  if (!id || !pw) return alert('Please enter both your account ID and password');

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pw, role: selectedAuthRole })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Login failed'); return; }

    currentUser = data.user;
    currentRole = selectedAuthRole;

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('currentRole', currentRole);

    closeAuth();
    resetFilter(); // 登入時重置篩選

    if (currentRole === 'admin' && (currentUser.role === 'Organizer' || currentUser.role === 'Admin')) {
      await showAdminInterface();
    } else {
      showUserInterface();
      renderProfile();
      await loadMyActivities();
      if (pendingAfterAuth) {
        pendingAfterAuth = false;
        const already = myActivities.find(m => m.id === currentDetailId);
        if (already) {
        // 已報名，直接開取消確認
        openCancelModal(currentDetailId);
        } else {
          handleRegister();
        }
      }
    }
  } catch(e) {
    console.error(e);
    alert('An error occurred');
  }
}

//登入登出區
async function doRegister() {
  const user_id = document.getElementById('rId').value.trim();
  const name  = document.getElementById('rName').value.trim();
  const phone = document.getElementById('rPhone').value.trim();
  const email = document.getElementById('rEmail').value.trim();
  const dept  = document.getElementById('rDept').value.trim();
  const pw = document.getElementById('rPw').value.trim();

  if (!user_id) return alert('Please enter your Student ID / Account');
  if (!pw)      return alert('Please enter your password');

  try {
    const res = await fetch(`${API_BASE}/register_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user_id, user_id, pw, role: selectedAuthRole, name, phone, email, dept })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Registration failed'); return; }

    currentUser = { id: user_id, id_db: user_id, name, phone, email, dept };
    currentRole = selectedAuthRole;

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('currentRole', currentRole);

    if (currentRole === 'admin') {
      const code = document.getElementById('rAdminCode') ? document.getElementById('rAdminCode').value.trim() : 'nsysu2025';
      if (code && code !== 'nsysu2025' && code !== '2025admin') return alert('Incorrect administrator verification code (Hint: nsysu2025)');
      closeAuth();
      resetFilter(); // 註冊為管理員時重置篩選
      await showAdminInterface();
    } else {
      closeAuth();
      resetFilter(); // 註冊為一般使用者時重置篩選
      showUserInterface();
      renderProfile();
      await loadMyActivities();
      if (pendingAfterAuth) {
        pendingAfterAuth = false;
        const already = myActivities.find(m => m.id === currentDetailId);
        if (already) {
          openCancelModal(currentDetailId);
      } else {
        handleRegister();
      }
    }
  }
  } catch(e) {
    console.error(e);
    alert('An error occurred');
  }
}

function logout() {
  document.getElementById('logoutConfirmModal').classList.add('open');
}

function adminLogout() {
  document.getElementById('logoutConfirmModal').classList.add('open');
}

function confirmLogout() {
  document.getElementById('logoutConfirmModal').classList.remove('open');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('currentRole');
  currentUser = null;
  currentRole = null;
  profileEditing = false;
  myActivities = [];
  document.getElementById('loginId').value = '';
  document.getElementById('loginPw').value = '';
  // admin nav 清理
  const nav = document.getElementById('adminNav');
  const badge = nav.querySelector('.admin-badge-nav');
  if (badge) badge.remove();
  const bottom = nav.querySelector('.nav-bottom');
  if (bottom) bottom.remove();
  resetFilter();
  showUserInterface();
  renderProfile();
  switchTab(0);
}

function closeAuth() { 
  document.getElementById('authModal').classList.remove('open');
  pendingAfterAuth = false; // 取消待執行的報名
}

function closeAuthOnBg(e) {
  if (e.target === document.getElementById('authModal')) closeAuth();
}
// =================== MY ACTIVITIES ===================
function renderMine() {
  const el = document.getElementById('mine-content');
  if (!currentUser) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-calendar-off"></i><p>Please log in first to view<br>your registered events</p><button class="lp-btn primary" onclick="document.getElementById('authModal').classList.add('open')" style="margin-top:6px">Go to Login</button></div>`;
    return;
  }
  if (!myActivities.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-mood-empty"></i><p>You haven't registered for any events yet</p><button class="lp-btn outline" onclick="switchTab(0)" style="margin-top:4px">Explore Events</button></div>`;
    return;
  }
  const sortedActivities = [...myActivities].sort((a, b) => {
    const dateA = parseCalendarDate(a.date);
    const dateB = parseCalendarDate(b.date);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA - dateB;
  });

  const now = new Date();
  const upcoming = sortedActivities.filter(m => { const d = parseCalendarDate(m.date); return d && d >= now; });
  const past = sortedActivities.filter(m => { const d = parseCalendarDate(m.date); return !d || d < now; });

  const cardHtml = (m, isPast = false) => {
    const calendarUrl = buildGoogleCalendarUrl(getCalendarEvent(m.id));
    const tag = getPrimaryTag(m.tags);
    return `
    <div class="my-act-card" onclick="openDetailFromMine(${m.id})">
      <div class="my-act-icon" style="background:${HEROCOLOR[m.color]}">${m.emoji}</div>
      <div class="my-act-info">
        <h4>${m.title}</h4>
        <p>${m.date} · ${formatMealIcon(m.meal)} ${formatMealLabel(m.meal)}</p>
      </div>
      <div class="my-act-right">
        <span class="my-badge confirmed">Confirmed</span>
        <div class="my-act-right-btn">
        ${!isPast ? `
        <a class="calendar-small-btn" href="${calendarUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><i class="ti ti-calendar-plus"></i>Calendar</a>
        <button class="cancel-small-btn" onclick="event.stopPropagation();cancelFromMine(${m.id})">Cancel</button>
        ` : ''}
        </div>
      </div>
    </div>`;
  };

  el.innerHTML = `<div class="my-act-list">
    <div class="section-title">Upcoming Events</div>
    ${upcoming.length ? upcoming.map(m => cardHtml(m)).join('') : '<div class="empty-state"><p>No upcoming events</p></div>'}
    <div class="section-title" style="margin-top:16px">Past Events</div>
    ${past.length ? past.map(m => cardHtml(m, true)).join('') : '<div class="empty-state"><p>No past events</p></div>'}
  </div>`;
}

function openDetailFromMine(id) {
  // 優先從 allEvents 找完整資料
  const fullEvent = window.allEvents ? window.allEvents.find(x => x.id === id) : null;
  
  if (fullEvent) {
    // 確保 ACTS 裡有這筆資料（openDetail 會從 ACTS 找）
    const existsInActs = ACTS.find(x => x.id === id);
    if (!existsInActs) ACTS.push(fullEvent);
  }
  
  openDetail(id);
}

// =================== PROFILE (USER) ===================
const FIELDS = [
  {key:'id',   label:'Student ID', icon:'ti-id-badge'},
  {key:'name', label:'Name',       icon:'ti-user'},
  {key:'phone',label:'Phone No.',  icon:'ti-phone'},
  {key:'email',label:'Email',      icon:'ti-mail'},
  {key:'dept', label:'Department', icon:'ti-school'},
];

function renderProfile() {
  const el = document.getElementById('profile-content');
  if (!currentUser) {
    el.innerHTML = `<div class="login-prompt"><i class="ti ti-user-circle"></i><h3>Not Logged In</h3><p>Log in to view and manage<br>your personal profile</p><button class="lp-btn primary" onclick="document.getElementById('authModal').classList.add('open')">Login</button><button class="lp-btn outline" onclick="switchAuthTab('reg');document.getElementById('authModal').classList.add('open')">Register New Account</button></div>`;
    return;
  }
  const initials = currentUser.name.slice(-2);
  el.innerHTML = `
    <div class="profile-hero">
      <div class="avatar">${initials}</div>
      <div class="profile-name">${currentUser.name}</div>
      <div class="profile-dept">${currentUser.dept}</div>
    </div>
    <div class="profile-fields" id="profileFields"></div>
    <div class="edit-bar">
      <button class="save-btn" id="profileEditBtn" onclick="toggleProfileEdit()">${profileEditing?'Save Changes':'Edit Profile'}</button>
    </div>
    <div style="padding:0 32px 16px"><button class="logout-btn" onclick="logout()">Logout</button></div>`;
  renderFields();
}

function renderFields() {
  const c = document.getElementById('profileFields');
  if (!c) return;
  c.innerHTML = FIELDS.map(f => `
    <div class="field-card">
      <div class="field-label">${f.label}</div>
      <div class="field-row">
        <i class="ti ${f.icon}" style="font-size:17px;color:var(--primary)"></i>
        ${profileEditing
          ? `<input class="field-input" id="fi_${f.key}" value="${currentUser[f.key]}">`
          : `<span class="field-val">${currentUser[f.key]}</span>`}
      </div>
    </div>`).join('');
}

async function toggleProfileEdit() {
  if (profileEditing) {
    FIELDS.forEach(f => { const inp = document.getElementById('fi_'+f.key); if (inp) currentUser[f.key] = inp.value; });
    profileEditing = false;
    document.getElementById('profileEditBtn').textContent = 'Edit Profile';
    try {
      const res = await fetch(`${API_BASE}/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_db: currentUser.id_db, name: currentUser.name, phone: currentUser.phone, email: currentUser.email, dept: currentUser.dept })
      });
      const result = await res.json();
      if (!res.ok) alert('Save failed: ' + (result.error || 'Unknown error'));
    } catch(e) {
      console.error('Update failed', e);
      alert('Network error. Failed to save.');
    }
    renderFields();
    const hero = document.querySelector('.profile-name');
    const dep  = document.querySelector('.profile-dept');
    const av   = document.querySelector('.avatar');
    if (hero) hero.textContent = currentUser.name;
    if (dep)  dep.textContent  = currentUser.dept;
    if (av)   av.textContent   = currentUser.name.slice(-2);
  } else {
    profileEditing = true;
    document.getElementById('profileEditBtn').textContent = 'Save Changes';
    renderFields();
  }
}

// =================== BANNER ===================
const BANNER_LABELS = ['🔥 Hot', '🎨 New', '🎵 Limited'];
const BANNER_THEMES = ['banner-theme-1', 'banner-theme-2', 'banner-theme-3'];

let bannerIndex = 0;
let bannerTimer = null;
let bannerItems = [];

function renderBanner() {
  const scroll = document.getElementById('bannerScroll');
  const dotWrap = document.querySelector('.banner-dot');
  if (!scroll) return;

  const sourceEvents = window.allEvents || ACTS;

  /* 修改 1：額滿活動不放進 Banner */
  bannerItems = sourceEvents
    .filter(a => Number(a.quota) < Number(a.max))
    .slice(0, 5);

  if (bannerItems.length === 0) {
    scroll.innerHTML = '';
    if (dotWrap) dotWrap.innerHTML = '';
    clearInterval(bannerTimer);
    return;
  }

  scroll.innerHTML = bannerItems.map((a, i) => `
    <div 
      class="banner-card ${BANNER_THEMES[i % BANNER_THEMES.length]}"
      data-banner-index="${i}"
      onclick="openDetail(${a.id})"
    >
      <div class="label">${BANNER_LABELS[i % BANNER_LABELS.length]}</div>
      <div class="people">${a.quota} / ${a.max} Attending</div>
      <div class="title">${a.title}</div>
    </div>
  `).join('');

  if (dotWrap) {
    dotWrap.innerHTML = bannerItems.map((_, i) =>
      `<span class="${i === 0 ? 'on' : ''}"></span>`
    ).join('');
  }

  bannerIndex = 0;
  updateBannerPosition();

  clearInterval(bannerTimer);
  startBannerAuto();
}

/* 修改 2：根據目前 bannerIndex 決定哪張在中間、哪張在左右 */
function updateBannerPosition() {
  const cards = document.querySelectorAll('.banner-card');
  const dots = document.querySelectorAll('.banner-dot span');
  const total = cards.length;

  if (total === 0) return;

  const prevIndex = (bannerIndex - 1 + total) % total;
  const nextIndex = (bannerIndex + 1) % total;

  cards.forEach((card, i) => {
    card.classList.remove('active', 'prev', 'next', 'hidden');

    if (i === bannerIndex) {
      card.classList.add('active');
    } else if (i === prevIndex) {
      card.classList.add('prev');
    } else if (i === nextIndex) {
      card.classList.add('next');
    } else {
      card.classList.add('hidden');
    }
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle('on', i === bannerIndex);
  });
}

/* 修改 3：往下一張，最後一張會接回第一張 */
function nextBanner() {
  if (!bannerItems.length) return;
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  updateBannerPosition();
}

/* 修改 4：往上一張，第一張也可以接回最後一張 */
function prevBanner() {
  if (!bannerItems.length) return;
  bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
  updateBannerPosition();
}

function startBannerAuto() {
  clearInterval(bannerTimer);
  bannerTimer = setInterval(nextBanner, 3000);
}

/* 修改 5：滑鼠移入暫停，移出繼續 */
const banner = document.getElementById('bannerScroll');

if (banner) {
  banner.addEventListener('mouseenter', () => clearInterval(bannerTimer));
  banner.addEventListener('mouseleave', startBannerAuto);
  banner.addEventListener('touchstart', () => clearInterval(bannerTimer));
  banner.addEventListener('touchend', startBannerAuto);

  /* 修改 6：點左右兩側卡片時，也可以切換 */
  banner.addEventListener('click', (e) => {
    const card = e.target.closest('.banner-card');
    if (!card) return;

    if (card.classList.contains('prev')) {
      e.stopPropagation();
      prevBanner();
    }

    if (card.classList.contains('next')) {
      e.stopPropagation();
      nextBanner();
    }
  });
}

// =================== ADMIN: NAV ===================
function renderAdminNav() {
  const adminLogo = document.getElementById('adminNavLogo');
  if (adminLogo && isDesktop()) adminLogo.style.display = 'block';

  const nav = document.getElementById('adminNav');
  const existing = nav.querySelector('.admin-badge-nav');
  if (existing) existing.remove();
  const existingBottom = nav.querySelector('.nav-bottom');
  if (existingBottom) existingBottom.remove();

  const badge = document.createElement('div');
  badge.className = 'admin-badge-nav';
  badge.innerHTML = `<i class="ti ti-shield-check"></i> Administrator Mode`;
  nav.insertBefore(badge, nav.children[1]);

  const bottom = document.createElement('div');
  bottom.className = 'nav-bottom';
  bottom.innerHTML = `<button class="nav-bottom-btn" onclick="adminLogout()"><i class="ti ti-logout"></i> Log out Admin</button>`;
  nav.appendChild(bottom);

  const hb = document.getElementById('adminHeaderBadge');
  if (hb && currentUser) hb.textContent = `👤 ${currentUser.name}`;
}

// =================== ADMIN: DASHBOARD ===================
function renderAdminDashboard() {
  const combinedZone = document.getElementById('admin-combined-card-zone');
  const activityList = document.getElementById('admin-activity-list');
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
    </div>`;

  if (activityList) {
    activityList.classList.remove('admin-shortcut-grid');
    if (ACTS.length === 0) {
      activityList.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">No events available. Click Add Event to create one.</div>`;
      return;
    }
    activityList.innerHTML = ACTS.map(a => {
      const regs = REGISTRATIONS[a.id] || [];
      const meat = regs.filter(r => r.meal === 'meat').length;
      const veg  = regs.filter(r => r.meal === 'veg').length;
      const pct  = Math.round(Number(a.quota || 0) / Number(a.max || 1) * 100);
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
            <button class="admin-btn del"  onclick="openDeleteModal(${a.id})"><i class="ti ti-trash"></i>Delete</button>
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
      </div>`;
    }).join('');
  }
}

// =================== ADMIN: REGISTRATION DETAIL ===================
function openRegDetail(actId) {
  const a    = ACTS.find(x => x.id === actId);
  const regs = REGISTRATIONS[actId] || [];
  const meat = regs.filter(r => r.meal === 'meat').length;
  const veg  = regs.filter(r => r.meal === 'veg').length;

  document.getElementById('adminRegDetailTitle').textContent = a.title;
  document.getElementById('adminRegDetailSub').textContent   = `Total ${regs.length} registrations · Meat ${meat} · Vegetarian ${veg}`;

  let tableHtml = '';
  if (regs.length === 0) {
    tableHtml = `<div class="empty-state" style="padding:24px 0"><i class="ti ti-users" style="font-size:32px;opacity:.3"></i><p>No registrations yet</p></div>`;
  } else {
    tableHtml = `
    <div style="margin-bottom:12px;display:flex;gap:8px">
      <span class="meal-pill meat" style="font-size:13px;padding:4px 12px">🍖 Meat ${meat}</span>
      <span class="meal-pill veg"  style="font-size:13px;padding:4px 12px">🌿 Veg ${veg}</span>
    </div>
    <div style="overflow-x:auto">
    <table class="reg-table">
      <thead><tr><th>#</th><th>Student ID / Account</th><th>Name</th><th>Department</th><th>Meal</th></tr></thead>
      <tbody>
        ${regs.map((r, i) => `
        <tr>
          <td style="color:var(--text-muted)">${i+1}</td>
          <td>${r.uid}</td>
          <td style="font-weight:600">${r.name}</td>
          <td>${r.dept}</td>
          <td><span class="meal-pill ${r.meal}">${r.meal==='meat'?'🍖':'🌿'}</span></td>
        </tr>`).join('')}
      </tbody>
    </table></div>`;
  }

  document.getElementById('adminRegDetailBody').innerHTML = tableHtml;
  document.getElementById('adminRegDetailModal').classList.add('open');
}

function closeRegDetail() {
  document.getElementById('adminRegDetailModal').classList.remove('open');
}

// =================== ADMIN: REGISTRATIONS SCREEN ===================
async function loadAllRegistrations() {
  try {
    const res = await fetch(`${API_BASE}/registrations`);
    if (!res.ok) throw new Error('API config err');
    const data = await res.json();
    Object.keys(REGISTRATIONS).forEach(k => delete REGISTRATIONS[k]);
    Object.entries(data).forEach(([k, v]) => {
      REGISTRATIONS[Number(k)] = v.map(r => ({
        ...r,
        meal: normalizeRegistrationMeal(r.meal)
      }));
    });
  } catch (error) {
    console.error('loadAllRegistrations error:', error);
  }
}

function renderAdminRegistrations() {
  const el = document.getElementById('admin-reg-content');
  if (!el) return;
  el.innerHTML = ACTS.map(a => {
    const regs = REGISTRATIONS[a.id] || [];
    const meat = regs.filter(r => r.meal === 'meat').length;
    const veg  = regs.filter(r => r.meal === 'veg').length;
    const pct  = Math.round(a.quota / a.max * 100);
    return `
    <div class="reg-overview-card" onclick="openRegDetail(${a.id})">
      <div class="reg-overview-header">
        <div class="act-thumb ${a.color}" style="width:46px;height:46px;font-size:20px">${a.emoji}</div>
        <div class="reg-overview-info">
          <h3>${a.title}</h3>
          <p>${a.date}</p>
        </div>
        <div><div class="reg-overview-count">${a.quota}<span>/ ${a.max} Attendees</span></div></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1"><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div></div>
        <div class="admin-meal-pills">
          <span class="meal-pill meat">🍖 ${meat}</span>
          <span class="meal-pill veg">🌿 ${veg}</span>
        </div>
        <i class="ti ti-chevron-right" style="color:var(--text-muted);font-size:16px"></i>
      </div>
    </div>`;
  }).join('');
}

// =================== ADMIN: ADD / EDIT ACTIVITY ===================
function openAddActivity() {
  editingActId = null;
  document.getElementById('actFormTitle').textContent    = 'Create Event';
  document.getElementById('actFormSubtitle').textContent = 'Fill in event details';
  document.getElementById('af_title').value = '';
  document.getElementById('af_date').value  = '';
  document.getElementById('af_time').value  = '';
  document.getElementById('af_loc').value   = '';
  document.getElementById('af_quota').value = '0';
  document.getElementById('af_max').value   = '';
  setFormSelectValue('af_emoji', '', 'Emoji');
  setFormSelectValue('af_color', '', 'Color');
  setFormSelectValue('af_tags', '', 'Category');

  document.getElementById('af_desc').value  = '';
  document.getElementById('activityFormModal').classList.add('open');
}

function openEditActivity(id) {
  const a = ACTS.find(x => x.id === id);
  if (!a) return;

  editingActId = id;

  document.getElementById('actFormTitle').textContent = 'Edit Event';
  document.getElementById('actFormSubtitle').textContent = `Editing: ${a.title}`;
  document.getElementById('af_title').value = a.title || '';

  const editDateTime = splitActivityDateTime(a.date);
  document.getElementById('af_date').value = editDateTime.date;
  document.getElementById('af_time').value = editDateTime.time;

  document.getElementById('af_loc').value = a.loc || '';
  document.getElementById('af_quota').value = a.quota || 0;
  document.getElementById('af_max').value = a.max || 100;

  setFormSelectValue('af_emoji', a.emoji || '', a.emoji || 'Emoji');

  const colorLabelMap = {
    green: 'Green',
    orange: 'Orange',
    purple: 'Purple',
    blue: 'Blue'
  };

  setFormSelectValue(
    'af_color',
    a.color || '',
    colorLabelMap[a.color] || 'Color'
  );

  const category = getPrimaryTag(a.tags);

  setFormSelectValue(
    'af_tags',
    category || '',
    category || 'Category'
  );

  document.getElementById('af_desc').value = a.desc || '';
  document.getElementById('activityFormModal').classList.add('open');
}

function parseActivityDateTime(dateValue, timeValue) {
  return {
    event_day:  (dateValue || '').replace(/\//g, '-'),
    event_time: timeValue || '00:00'
  };
}

function splitActivityDateTime(value) {
  if (!value) return { date: '', time: '' };
  const normalized = String(value).replace(/\//g, '-').replace('T', ' ');
  const parts = normalized.split(' ');
  return { date: parts[0] || '', time: (parts[1] || '').slice(0, 5) };
}

async function submitActivityForm() {
  const title = document.getElementById('af_title').value.trim();
  const date  = document.getElementById('af_date').value.trim();
  const time  = document.getElementById('af_time').value.trim();
  const loc   = document.getElementById('af_loc').value.trim();
  const max   = parseInt(document.getElementById('af_max').value) || 100;

  const emoji = getFormSelectValue('af_emoji');
  const color = getFormSelectValue('af_color');
  const category = getFormSelectValue('af_tags');

  const desc = document.getElementById('af_desc').value.trim();
  const category_id = getCategoryId(category);

  if (!title || !date || !time || !loc) {
    return alert('Please fill in the event name, date, time, and location');
  }

  if (!emoji || !color || !category) {
    return alert('Please select emoji, color, and category');
  }

  const { event_day, event_time } = parseActivityDateTime(date, time);

  const payload = {
    title,
    date: event_day,
    time: event_time,
    loc,
    max,
    student_capacity: max,
    emoji,
    color,
    description: desc,
    category_id,
    host_id: currentUser.id_db
  };

  try {
    if (editingActId !== null) {
      const res = await fetch(`${API_BASE}/events/${editingActId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      document.getElementById('activityFormModal').classList.remove('open');
      showAdminSuccess('Event Updated', `"${title}" has been successfully synchronized to the database.`);
    } else {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Creation failed');

      document.getElementById('activityFormModal').classList.remove('open');
      showAdminSuccess('Event Created', `"${title}" has been successfully added to the database event list.`);
    }

    await loadEvents();
    renderAdminDashboard();
    renderAdminRegistrations();
  } catch (e) {
    console.error(e);
    alert('Operation failed: ' + e.message);
  }
}

function closeActivityForm() {
  document.getElementById('activityFormModal').classList.remove('open');
}

function getFormSelectValue(id) {
  const select = document.getElementById(id);
  return select ? select.dataset.value : '';
}

function setFormSelectValue(id, value, label = value) {
  const select = document.getElementById(id);
  if (!select) return;

  select.dataset.value = value;

  const text = select.querySelector('.form-select-text');
  if (text) text.textContent = label;

  select.querySelectorAll('.form-select-option').forEach(option => {
    option.classList.toggle('active', option.dataset.value === value);
  });
}

function renderFormSelectOptions(id, options, fallbackValue = '') {
  const select = document.getElementById(id);
  if (!select) return;

  const menu = select.querySelector('.form-select-menu');
  if (!menu) return;

  const currentValue = select.dataset.value || fallbackValue;
  const validValue = options.some(option => option.value === currentValue)
  ? currentValue
  : '';

  menu.innerHTML = options.map(option => `
    <div 
      class="form-select-option ${option.value === validValue ? 'active' : ''}" 
      data-value="${option.value}"
    >
      ${option.label}
    </div>
  `).join('');

  const selectedOption = options.find(option => option.value === validValue);

  const placeholderMap = {
    af_emoji: 'Emoji',
    af_color: 'Color',
    af_tags: 'Category'
  };

  setFormSelectValue(
    id,
    validValue,
    selectedOption?.label || placeholderMap[id] || ''
  );
}

document.addEventListener('click', function (e) {
  const btn = e.target.closest('.form-select-btn');
  const option = e.target.closest('.form-select-option');

  if (btn) {
    e.preventDefault();
    e.stopPropagation();

    const select = btn.closest('.form-select');

    document.querySelectorAll('.form-select.open').forEach(el => {
      if (el !== select) el.classList.remove('open');
    });

    select.classList.toggle('open');
    return;
  }

  if (option) {
    e.preventDefault();
    e.stopPropagation();

    const select = option.closest('.form-select');
    const value = option.dataset.value;
    const label = option.textContent.trim();

    if (option) {
      e.preventDefault();
      e.stopPropagation();
    
      const select = option.closest('.form-select');
      const value = option.dataset.value;
      const label = option.textContent.trim();
    
      setFormSelectValue(select.id, value, label);
    
      select.classList.remove('open');
    
      return;
    }

    return;
  }

  document.querySelectorAll('.form-select.open').forEach(el => {
    el.classList.remove('open');
  });
});

// =================== ADMIN: DELETE ===================
function openDeleteModal(id) {
  deleteTargetId = id;
  const a = ACTS.find(x => x.id === id);
  document.getElementById('adminDeleteMsg').textContent = `Are you sure you want to permanently delete "${a.title}"? This operation cannot be undone and all registration records will be cleared.`;
  document.getElementById('adminDeleteModal').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('adminDeleteModal').classList.remove('open');
  deleteTargetId = null;
}

async function confirmDeleteActivity() {
  if (deleteTargetId === null) return;
  const a = ACTS.find(x => x.id === deleteTargetId);

  try {
    const res = await fetch(`${API_BASE}/events/${deleteTargetId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');

    document.getElementById('adminDeleteModal').classList.remove('open');
    showAdminSuccess('Event Deleted', `"${a ? a.title : 'The event'}" has been permanently removed from the database.`);

    await loadEvents();
    await loadAllRegistrations();
    renderAdminDashboard();
    renderAdminRegistrations();
  } catch (e) {
    console.error(e);
    alert('Delete failed: ' + e.message);
  }

  deleteTargetId = null;
}

// =================== ADMIN: SUCCESS MODAL ===================
function showAdminSuccess(title, msg) {
  document.getElementById('adminSuccessTitle').textContent = title;
  document.getElementById('adminSuccessMsg').textContent   = msg;
  document.getElementById('adminSuccessModal').classList.add('open');
}

function closeAdminSuccess() {
  document.getElementById('adminSuccessModal').classList.remove('open');
}

// =================== ADMIN: PROFILE ===================
const ADMIN_FIELDS = [
  {key:'id',   label:'Account',      icon:'ti-id-badge'},
  {key:'name', label:'Name',         icon:'ti-user'},
  {key:'phone',label:'Phone',        icon:'ti-phone'},
  {key:'email',label:'Email',        icon:'ti-mail'},
  {key:'dept', label:'Organization', icon:'ti-building'},
];

let adminProfileEditing = false;

function renderAdminProfile() {
  const el = document.getElementById('admin-profile-content');
  if (!el || !currentUser) return;
  const initials = currentUser.name.slice(-2);
  el.innerHTML = `
    <div class="profile-hero">
      <div class="avatar admin-avatar">${initials}</div>
      <div class="profile-name">${currentUser.name}</div>
      <div class="profile-dept" style="display:flex;align-items:center;gap:5px;margin-top:4px">
        <i class="ti ti-shield-check" style="color:var(--primary)"></i>
        Administrator · ${currentUser.dept}
      </div>
    </div>
    <div class="profile-fields" id="adminProfileFields"></div>
    <div class="edit-bar">
      <button class="save-btn" id="adminProfileEditBtn" onclick="toggleAdminProfileEdit()">${adminProfileEditing?'Save Changes':'Edit Profile'}</button>
    </div>
    <div style="padding:0 32px 16px">
      <button class="logout-btn" onclick="adminLogout()">Logout Admin</button>
    </div>`;
  renderAdminFields();
}

function renderAdminFields() {
  const c = document.getElementById('adminProfileFields');
  if (!c) return;
  c.innerHTML = ADMIN_FIELDS.map(f => `
    <div class="field-card">
      <div class="field-label">${f.label}</div>
      <div class="field-row">
        <i class="ti ${f.icon}" style="font-size:17px;color:var(--primary)"></i>
        ${adminProfileEditing
          ? `<input class="field-input" id="afi_${f.key}" value="${currentUser[f.key]}">`
          : `<span class="field-val">${currentUser[f.key]}</span>`}
      </div>
    </div>`).join('');
}

async function toggleAdminProfileEdit() {
  if (adminProfileEditing) {
    ADMIN_FIELDS.forEach(f => { const inp = document.getElementById('afi_'+f.key); if (inp) currentUser[f.key] = inp.value; });
    adminProfileEditing = false;
    document.getElementById('adminProfileEditBtn').textContent = 'Edit Profile';
    try {
      const res = await fetch(`${API_BASE}/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_db: currentUser.id_db, name: currentUser.name, phone: currentUser.phone, email: currentUser.email, dept: currentUser.dept })
      });
      const result = await res.json();
      if (!res.ok) alert('Save failed：' + (result.error || 'Unknown error'));
    } catch(e) {
      console.error('Update failed', e);
      alert('Network error, save failed.');
    }
    renderAdminFields();
    const nm = document.querySelector('#admin-screen-profile .profile-name');
    const av = document.querySelector('#admin-screen-profile .avatar');
    if (nm) nm.textContent = currentUser.name;
    if (av) av.textContent = currentUser.name.slice(-2);
  } else {
    adminProfileEditing = true;
    document.getElementById('adminProfileEditBtn').textContent = 'Save Changes';
    renderAdminFields();
  }
}

// =================== DATA FETCH ===================
async function loadEvents() {
  try {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error('API response not ok');
    const data = await res.json();

    ACTS = data.map(d => ({
      id: Number(d.id),
      emoji: d.emoji || '📅',
      color: d.color || 'blue',
      title: d.title,
      date: `${d.date} ${d.time}`,
      loc: d.loc,
      tags: d.tags ? [d.tags] : [],
      category_id: d.category_id,
      quota: Number(d.quota) || 0,
      max: Number(d.student_capacity) || Number(d.max) || 0,
      desc: d.description || '',
      meal_options: getMealOptions(d)
    }));

    window.allEvents = [...ACTS];
    renderCards();
    renderBanner();

    if (currentRole === 'admin') {
      renderAdminDashboard();
      renderAdminRegistrations();
    }
  } catch (error) {
    console.error('Failed to load events from DB:', error);
  }
}

// =================== EVENT LISTENERS ===================
document.getElementById('searchKeyword').addEventListener('input', doFilter);
document.getElementById('filterTag').addEventListener('change', doFilter);
document.getElementById('searchKeyword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); doFilter(); }
});
const searchBtn = document.getElementById('searchBtn');
if (searchBtn) searchBtn.addEventListener('click', doFilter);

// =================== INIT ===================
// 還原登入狀態，不用亦刷新就重新登入
async function init() {
  await loadCategories();
  await loadMealOptions();

  const savedUser = localStorage.getItem('currentUser');
  const savedRole = localStorage.getItem('currentRole');

  if (savedUser && savedRole) {
    currentUser = JSON.parse(savedUser);
    currentRole = savedRole;
    if (currentRole === 'admin') {
      await loadEvents();
      await showAdminInterface();
    } else {
      showUserInterface();
      renderProfile();
      // 先載入已報名清單，再載入活動，renderCards 才能標記已報名的狀態
      await loadMyActivities();
      await loadEvents();
    }
  } else {
    showUserInterface();
    await loadEvents();
  }
}

init();
