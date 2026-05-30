// =================== DATA ===================
const API_BASE = 'http://127.0.0.1:5000/api';

let ACTS = [];

// Simulate registration records per activity (mock data)
const REGISTRATIONS = {
  0: [
    { uid:'B10001', name:'John Doe', dept:'CSE', meal:'meat' },
    { uid:'B10002', name:'Jane Smith', dept:'Management', meal:'veg' },
    { uid:'B10003', name:'David Chen', dept:'EE', meal:'meat' },
    { uid:'B10001', name:'John Doe', dept:'CSE', meal:'meat' },
    { uid:'B10002', name:'Jane Smith', dept:'Management', meal:'veg' },
    { uid:'B10003', name:'David Chen', dept:'EE', meal:'meat' },
  ],
  1: [
    { uid:'B10004', name:'Emily Huang', dept:'Arts', meal:'veg' },
    { uid:'B10005', name:'Michael Lee', dept:'Design', meal:'meat' },
    { uid:'B10004', name:'Emily Huang', dept:'Arts', meal:'veg' },
    { uid:'B10005', name:'Michael Lee', dept:'Design', meal:'meat' },
  ],
  2: [
    { uid:'B10006', name:'Sarah Chang', dept:'Music', meal:'meat' },
    { uid:'B10006', name:'Sarah Chang', dept:'Music', meal:'meat' },
  ],
};

const TAGCOLOR = {
  'Sports':'green','Competition':'green','Arts':'purple','Handicraft':'orange',
  'Music':'purple','Eco':'blue','Life':'blue','IT':'blue',
  'Exhibition':'purple','Lecture':'orange','Culture':'green','Exchange':'green',
  'Health':'green','Entertainment':'purple'
  'Sports':'green','Competition':'green','Arts':'purple','Handicraft':'orange',
  'Music':'purple','Eco':'blue','Life':'blue','IT':'blue',
  'Exhibition':'purple','Lecture':'orange','Culture':'green','Exchange':'green',
  'Health':'green','Entertainment':'purple'
};
const HEROCOLOR = { green:'var(--primary-pale)', orange:'var(--accent-pale)', purple:'#EDE7F6', blue:'#E3F2FD' };

// =================== STATE ===================
let currentUser = null;
let currentRole = null; // 'user' | 'admin'
let myActivities = [];
let currentDetailId = null;
let selectedMeal = null;
let mealModalMode = 'register'; // 'register' | 'update'
let mealModalMode = 'register'; // 'register' | 'update'
let pendingAfterAuth = false;
let cancelTargetId = null;
let profileEditing = false;
let selectedAuthRole = 'user'; // selected in the login modal
let nextActId = ACTS.length;

// Admin state
let editingActId = null; // null = new, number = edit
let deleteTargetId = null;

// =================== LAYOUT ===================
function isDesktop() { return window.innerWidth >= 900; }

function applyLayout() {
  const logo = document.getElementById('navLogo');
  const logo = document.getElementById('navLogo');
  const adminLogo = document.getElementById('adminNavLogo');
  const app = document.getElementById('app');
  const mainNav = document.getElementById('mainNav');
  const adminNav = document.getElementById('adminNav');
  const app = document.getElementById('app');
  const mainNav = document.getElementById('mainNav');
  const adminNav = document.getElementById('adminNav');

  if (isDesktop()) {
    if (logo) logo.style.display = 'block';
    if (adminLogo) adminLogo.style.display = 'block';
    if (app) app.style.gridTemplateColumns = 'var(--sidebar-w) 1fr';
    if (mainNav) mainNav.style.order = '-1';
    if (adminNav) adminNav.style.order = '-1';
    if (app) app.style.gridTemplateColumns = 'var(--sidebar-w) 1fr';
    if (mainNav) mainNav.style.order = '-1';
    if (adminNav) adminNav.style.order = '-1';
  } else {
    if (logo) logo.style.display = 'none';
    if (adminLogo) adminLogo.style.display = 'none';
    if (app) app.style.gridTemplateColumns = '';
    if (mainNav) mainNav.style.order = '';
    if (adminNav) adminNav.style.order = '';
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
  if (mainNav) mainNav.style.display = isDesktop() ? 'flex' : 'flex';
  if (adminNav) adminNav.style.display = 'none';
  applyLayout();
  const userApp = document.getElementById('userApp');
  const adminApp = document.getElementById('adminApp');
  const mainNav = document.getElementById('mainNav');
  const adminNav = document.getElementById('adminNav');

  userApp.style.display = 'contents';
  adminApp.style.display = 'none';
  if (mainNav) mainNav.style.display = isDesktop() ? 'flex' : 'flex';
  if (adminNav) adminNav.style.display = 'none';
  applyLayout();
}

async function showAdminInterface() {
  const userApp = document.getElementById('userApp');
  const adminApp = document.getElementById('adminApp');
  const mainNav = document.getElementById('mainNav');
  const adminNav = document.getElementById('adminNav');

  userApp.style.display = 'none';
  adminApp.style.display = 'contents';
  if (mainNav) mainNav.style.display = 'none';
  if (adminNav) adminNav.style.display = 'flex';

  const userApp = document.getElementById('userApp');
  const adminApp = document.getElementById('adminApp');
  const mainNav = document.getElementById('mainNav');
  const adminNav = document.getElementById('adminNav');

  userApp.style.display = 'none';
  adminApp.style.display = 'contents';
  if (mainNav) mainNav.style.display = 'none';
  if (adminNav) adminNav.style.display = 'flex';

  renderAdminNav();
  await loadAllRegistrations();
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
  if (i === 1) renderMine();
  if (i === 2) renderProfile();
}

// =================== TABS (ADMIN) ===================
const adminScreens = ['admin-screen-dashboard','admin-screen-registrations','admin-screen-profile'];
const adminNavs = ['anav0','anav1','anav2'];

function switchAdminTab(i) {
  adminScreens.forEach((s, idx) => document.getElementById(s).classList.toggle('active', idx === i));
  adminNavs.forEach((n, idx) => document.getElementById(n).classList.toggle('active', idx === i));
  if (i === 0) renderAdminDashboard();
  if (i === 1) {
      loadAllRegistrations(); // load details dynamically from backend when switching tabs
  }
  if (i === 2) renderAdminProfile();
}

// =================== RENDER CARDS (USER) ===================
function renderCards() {
  const list = document.querySelector('.activity-list');
  list.innerHTML = ACTS.map(a => {
    const reg = myActivities.find(m => m.id === a.id);
    const pct = Math.round(a.quota / a.max * 100);
    return `
    <div class="act-card" onclick="openDetail(${a.id})">
      <div class="act-card-top">
        <div class="act-thumb ${a.color}">${a.emoji}</div>
        <div class="act-info">
          <h3>${a.title}</h3>
          <div class="act-meta"><i class="ti ti-calendar"></i><span class="act-date">${a.date}</span></div>
          <div class="act-tags">
            ${a.tags.map(t => `<span class="tag ${TAGCOLOR[t]||'green'}">${t}</span>`).join('')}
            ${reg ? '<span class="tag green">✓ Registered</span>' : ''}
            ${reg ? '<span class="tag green">✓ Registered</span>' : ''}
          </div>
        </div>
      </div>
      <div class="act-bottom">
        <div class="progress-wrap">
          <div class="progress-label">${a.quota} / ${a.max} Attending</div>
          <div class="progress-label">${a.quota} / ${a.max} Attending</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <span class="act-spots">${a.max - a.quota} Spots Left</span>
        <span class="act-spots">${a.max - a.quota} Spots Left</span>
      </div>
    </div>`;
  }).join('');
}

// =================== DETAIL ===================
function openDetail(id) {
  const a = ACTS.find(x => x.id === id) || myActivities.find(x => x.id === id);
  const a = ACTS.find(x => x.id === id) || myActivities.find(x => x.id === id);
  if (!a) return;
  currentDetailId = id;
  
  document.getElementById('dTitle').textContent = a.title;
  document.getElementById('dHero').textContent = a.emoji || '📅';
  document.getElementById('dHero').textContent = a.emoji || '📅';
  document.getElementById('dHero').style.background = HEROCOLOR[a.color] || '#4f46e5';
  
  const tagsArray = Array.isArray(a.tags) ? a.tags : (a.tags ? String(a.tags).split(',') : ['Uncategorized']);
  const tagsArray = Array.isArray(a.tags) ? a.tags : (a.tags ? String(a.tags).split(',') : ['Uncategorized']);
  document.getElementById('dTags').innerHTML = tagsArray.map(t => {
    const cleanTag = t.trim();
    return `<span class="tag ${TAGCOLOR[cleanTag] || 'green'}">${cleanTag}</span>`;
  }).join('');
  
  document.getElementById('dDate').textContent = a.date || '';
  document.getElementById('dLocation').textContent = a.loc || 'Location not provided';
  document.getElementById('dDate').textContent = a.date || '';
  document.getElementById('dLocation').textContent = a.loc || 'Location not provided';
  document.getElementById('dDesc').textContent = a.desc || "No description available for this event.";
  document.getElementById('dQuota').textContent = a.quota ?? '-';
  document.getElementById('dMax').textContent = a.max ?? '-';
  document.getElementById('dQuota').textContent = a.quota ?? '-';
  document.getElementById('dMax').textContent = a.max ?? '-';

  const already = myActivities.find(m => m.id === id);
  const btn = document.getElementById('regBtn');
  const mealUpdateBtn = document.getElementById('mealUpdateBtn');
  const mealUpdateBtn = document.getElementById('mealUpdateBtn');
  if (already) {
    btn.textContent = '✕ Cancel Registration';
    btn.className = 'register-btn cancel';
    btn.disabled = false;
    if (mealUpdateBtn) mealUpdateBtn.style.display = 'block';
    btn.textContent = '✕ Cancel Registration';
    btn.className = 'register-btn cancel';
    btn.disabled = false;
    if (mealUpdateBtn) mealUpdateBtn.style.display = 'block';
  } else if (a.quota >= a.max) {
    btn.textContent = 'Fully Booked';
    btn.className = 'register-btn';
    btn.disabled = true;
    if (mealUpdateBtn) mealUpdateBtn.style.display = 'none';
    btn.textContent = 'Fully Booked';
    btn.className = 'register-btn';
    btn.disabled = true;
    if (mealUpdateBtn) mealUpdateBtn.style.display = 'none';
  } else {
    btn.textContent = 'Register Now';
    btn.className = 'register-btn';
    btn.disabled = false;
    if (mealUpdateBtn) mealUpdateBtn.style.display = 'none';
    btn.textContent = 'Register Now';
    btn.className = 'register-btn';
    btn.disabled = false;
    if (mealUpdateBtn) mealUpdateBtn.style.display = 'none';
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
    mealModalMode = 'register';
    selectedMeal = null;
    document.getElementById('meatBtn').classList.remove('selected');
    document.getElementById('vegBtn').classList.remove('selected');
    document.getElementById('submitMealBtn').style.opacity = '0.5';
    document.getElementById('submitMealBtn').style.pointerEvents = 'none';
    document.getElementById('mealModal').classList.add('open');
  }
}

function openMealUpdateModal(id) {
  const registered = myActivities.find(m => m.id === id);
  if (!registered) return;
  currentDetailId = id;
  mealModalMode = 'update';
  selectedMeal = registered.meal || null;
  document.getElementById('meatBtn').classList.toggle('selected', selectedMeal === 'meat');
  document.getElementById('vegBtn').classList.toggle('selected', selectedMeal === 'veg');
  const submitBtn = document.getElementById('submitMealBtn');
  submitBtn.textContent = 'Save Meal Preference';
  submitBtn.style.opacity = selectedMeal ? '1' : '0.5';
  submitBtn.style.pointerEvents = selectedMeal ? 'auto' : 'none';
  document.getElementById('mealModal').classList.add('open');
}

function openMealUpdateModal(id) {
  const registered = myActivities.find(m => m.id === id);
  if (!registered) return;
  currentDetailId = id;
  mealModalMode = 'update';
  selectedMeal = registered.meal || null;
  document.getElementById('meatBtn').classList.toggle('selected', selectedMeal === 'meat');
  document.getElementById('vegBtn').classList.toggle('selected', selectedMeal === 'veg');
  const submitBtn = document.getElementById('submitMealBtn');
  submitBtn.textContent = 'Save Meal Preference';
  submitBtn.style.opacity = selectedMeal ? '1' : '0.5';
  submitBtn.style.pointerEvents = selectedMeal ? 'auto' : 'none';
  document.getElementById('mealModal').classList.add('open');
}

function selectMeal(type) {
  selectedMeal = type;
  document.getElementById('meatBtn').classList.toggle('selected', type === 'meat');
  document.getElementById('vegBtn').classList.toggle('selected', type === 'veg');
  document.getElementById('submitMealBtn').style.opacity = '1';
  document.getElementById('submitMealBtn').style.pointerEvents = 'auto';
}

async function loadMyActivities() {
  if (!currentUser || !currentUser.id_db) return;
  try {
    const res = await fetch(`${API_BASE}/my-activities/${currentUser.id_db}`);
    if (!res.ok) throw new Error('Failed to load my activities');
    const data = await res.json();
    myActivities = data.map(d => ({
      id: Number(d.id),
      title: d.title,
      emoji: '📅', // default emoji since backend doesn't have it
      color: 'blue', // default color
      date: d.date,
      meal: d.dietary_req || null
    }));
    
    // 如果你在「我的活動」分頁，要重新 render
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

  if (mealModalMode === 'update') {
    await updateMealPreference();
    return;
  }

  const a = ACTS.find(x => x.id === currentDetailId);
  if (!a) return alert('Event not found');
  if (!a) return alert('Event not found');

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
      const data = await res.json();
      if (!res.ok) {
          alert(data.error || 'Registration failed');
          alert(data.error || 'Registration failed');
          return;
      }
      
      document.getElementById('mealModal').classList.remove('open');
      document.getElementById('submitMealBtn').textContent = 'Confirm Registration';
      document.getElementById('submitMealBtn').textContent = 'Confirm Registration';
      document.getElementById('successMsg').textContent = `You have successfully registered for "${a.title}". Meal preference: ${selectedMeal==='meat'?'Non-Vegetarian':'Vegetarian'}.`;
      document.getElementById('successModal').classList.add('open');
      
      await loadMyActivities();
      await loadEvents();
      
      const btn = document.getElementById('regBtn');
      btn.textContent = '✕ Cancel Registration'; btn.className = 'register-btn cancel';
      const mealUpdateBtn = document.getElementById('mealUpdateBtn');
      if (mealUpdateBtn) mealUpdateBtn.style.display = 'block';
      const reloaded = ACTS.find(x => x.id === currentDetailId);
      if (reloaded) document.getElementById('dQuota').textContent = reloaded.quota;
      const mealUpdateBtn = document.getElementById('mealUpdateBtn');
      if (mealUpdateBtn) mealUpdateBtn.style.display = 'block';
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
    showAdminSuccess('Meal Preference Updated', `Your meal preference for "${a.title}" is now ${selectedMeal === 'meat' ? 'Non-Vegetarian' : 'Vegetarian'}.`);
  } catch (e) {
    console.error(e);
    alert(e.message || 'Failed to update meal preference');
  } finally {
    mealModalMode = 'register';
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
    showAdminSuccess('Meal Preference Updated', `Your meal preference for "${a.title}" is now ${selectedMeal === 'meat' ? 'Non-Vegetarian' : 'Vegetarian'}.`);
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
function closeMeal() {
  document.getElementById('mealModal').classList.remove('open');
  document.getElementById('submitMealBtn').textContent = 'Confirm Registration';
  mealModalMode = 'register';
}

// =================== CANCEL ===================
function openCancelModal(id) {
  cancelTargetId = id;
  const a = ACTS.find(x => x.id === id);
  document.getElementById('cancelMsg').textContent = `Are you sure you want to cancel your registration for "${a.title}"? Your spot will be released.`;
  document.getElementById('cancelMsg').textContent = `Are you sure you want to cancel your registration for "${a.title}"? Your spot will be released.`;
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
          body: JSON.stringify({ 
              user_id: currentUser.id_db, 
              event_id: a.id 
          })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Cancellation failed');
        return;
    }
        alert(data.error || 'Cancellation failed');
        return;
    }

    document.getElementById('cancelModal').classList.remove('open');
    document.getElementById('cancelSuccessMsg').textContent = `Successfully canceled registration for "${a.title}". The spot has been released.`;
    document.getElementById('cancelSuccessModal').classList.add('open');
    document.getElementById('cancelModal').classList.remove('open');
    document.getElementById('cancelSuccessMsg').textContent = `Successfully canceled registration for "${a.title}". The spot has been released.`;
    document.getElementById('cancelSuccessModal').classList.add('open');
      
      // 先更新 myActivities，renderCards() 才能正確判斷 reg 是否存在
      await loadMyActivities();
      // 再 loadEvents，裡面會呼叫 renderCards()，此時 myActivities 已是最新的
      await loadEvents();
      
    
      // Update UI button on detail page explicitly
      if (currentDetailId === cancelTargetId) {
        const btn = document.getElementById('regBtn');
        btn.textContent = 'Register Now'; btn.className = 'register-btn'; btn.disabled = false;
        // After loadEvents, ACTS is reloaded so we need to fetch a again to get new quota
        const reloadedA = ACTS.find(x => x.id === cancelTargetId);
        document.getElementById('dQuota').textContent = reloadedA ? reloadedA.quota : a.quota;
    }
} catch (e) {
    console.error(e);
    alert('An error occurred');
}
        const btn = document.getElementById('regBtn');
        btn.textContent = 'Register Now'; btn.className = 'register-btn'; btn.disabled = false;
        // After loadEvents, ACTS is reloaded so we need to fetch a again to get new quota
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
  // Show admin code field only in register form for admin
  const adminCodeWrap = document.getElementById('adminCodeWrap');
  if (adminCodeWrap) adminCodeWrap.style.display = (role === 'admin') ? 'block' : 'none';
}

function switchAuthTab(tab) {
  document.getElementById('loginForm').style.display = tab === 'login' ? 'flex' : 'none';
  document.getElementById('regForm').style.display  = tab === 'reg'   ? 'flex' : 'none';
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabReg').classList.toggle('active', tab === 'reg');
  // Keep admin code wrap state in sync
  const adminCodeWrap = document.getElementById('adminCodeWrap');
  if (adminCodeWrap) adminCodeWrap.style.display = (selectedAuthRole === 'admin' && tab === 'reg') ? 'block' : 'none';
}

async function doLogin() {
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value.trim();
  if (!id || !pw) return alert('Please enter both your account ID and password');
  if (!id || !pw) return alert('Please enter both your account ID and password');

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pw, role: selectedAuthRole })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Login failed');
      alert(data.error || 'Login failed');
      return;
    }
    
    currentUser = data.user;
    currentRole = selectedAuthRole;
    
    closeAuth();
    
    // 前端選 admin 且資料庫角色也是 Organizer/Admin，才進管理後台
    if (currentRole === 'admin' && (currentUser.role === 'Organizer' || currentUser.role === 'Admin')) { 
      showAdminInterface();
    } else {
      showUserInterface();
      renderProfile();
      await loadMyActivities();
      // Load user registered events if API supports it
      // myActivities = [] or load from db
      if (pendingAfterAuth) { pendingAfterAuth = false; handleRegister(); }
    }
  } catch(e) {
    console.error(e);
    alert('An error occurred');
    alert('An error occurred');
  }
}

async function doRegister() {
  const user_id = document.getElementById('rId').value.trim();  // 學號
  const user_id = document.getElementById('rId').value.trim();  // 學號
  const name  = document.getElementById('rName').value.trim();
  const phone = document.getElementById('rPhone').value.trim();
  const email = document.getElementById('rEmail').value.trim();
  const dept  = document.getElementById('rDept').value.trim();
  const pw = document.getElementById('rPw').value.trim();

  if (!user_id) return alert('Please enter your Student ID / Account');
  if (!pw)      return alert('Please enter your password');
  if (!user_id) return alert('Please enter your Student ID / Account');
  if (!pw)      return alert('Please enter your password');

  try {
    const res = await fetch(`${API_BASE}/register_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          id: user_id,       // 學號
          user_id: user_id,  // 主鍵
          pw,
          id: user_id,       // 學號
          user_id: user_id,  // 主鍵
          pw,
          role: selectedAuthRole,
          name, phone, email, dept
          name, phone, email, dept
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
        alert(data.error || 'Registration failed');
        alert(data.error || 'Registration failed');
        return;
    }

    currentUser = { id: user_id, id_db: user_id, name, phone, email, dept };
    currentUser = { id: user_id, id_db: user_id, name, phone, email, dept };
    currentRole = selectedAuthRole;

    if (currentRole === 'admin') {
      const code = document.getElementById('rAdminCode') ? document.getElementById('rAdminCode').value.trim() : 'nsysu2025';
      if (code && code !== 'nsysu2025' && code !== '2025admin') return alert('Incorrect administrator verification code (Hint: nsysu2025)');
      if (code && code !== 'nsysu2025' && code !== '2025admin') return alert('Incorrect administrator verification code (Hint: nsysu2025)');
      closeAuth();
      showAdminInterface();
    } else {
      closeAuth();
      showUserInterface();
      renderProfile();
      if (pendingAfterAuth) { pendingAfterAuth = false; handleRegister(); }
    }
  } catch(e) {
    console.error(e);
    alert('An error occurred');
    alert('An error occurred');
  }
}

function closeAuth() { document.getElementById('authModal').classList.remove('open'); }

// =================== MY ACTIVITIES ===================
function renderMine() {
  const el = document.getElementById('mine-content');
  if (!el) return;

  if (!currentUser) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-calendar-off"></i><p>Please log in first to view<br>your registered events</p><button class="lp-btn primary" onclick="document.getElementById('authModal').classList.add('open')" style="margin-top:6px">Go to Login</button></div>`;
    el.innerHTML = `<div class="empty-state"><i class="ti ti-calendar-off"></i><p>Please log in first to view<br>your registered events</p><button class="lp-btn primary" onclick="document.getElementById('authModal').classList.add('open')" style="margin-top:6px">Go to Login</button></div>`;
    return;
  }
  if (!myActivities.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-mood-empty"></i><p>You haven't registered for any events yet</p><button class="lp-btn outline" onclick="switchTab(0)" style="margin-top:4px">Explore Events</button></div>`;
    return;
  }
  el.innerHTML = `<div class="my-act-list">` + myActivities.map(m => `
    <div class="my-act-card" onclick="openDetailFromMine(${m.id})">
    <div class="my-act-card" onclick="openDetailFromMine(${m.id})">
      <div class="my-act-icon" style="background:${HEROCOLOR[m.color]}">${m.emoji}</div>
      <div class="my-act-info">
        <h4>${m.title}</h4>
        <p>${m.date} · ${m.meal==='meat'?'🍖 Non-Vegetarian':'🌿 Vegetarian'}</p>
      </div>
      <div class="my-act-right">
        <span class="my-badge confirmed">Confirmed</span>
        <button class="cancel-small-btn" onclick="event.stopPropagation();cancelFromMine(${m.id})">Cancel</button>
        <button class="cancel-small-btn" onclick="event.stopPropagation();cancelFromMine(${m.id})">Cancel</button>
      </div>
    </div>`).join('') + `</div>`;
}

function openDetailFromMine(id) {
  const existsInEvents = ACTS.find(x => x.id === id);
  if (!existsInEvents) {
    const mine = myActivities.find(x => x.id === id);
    if (!mine) return;
    ACTS.push({
      id: mine.id,
      title: mine.title,
      emoji: mine.emoji || '📅',
      color: mine.color || 'blue',
      date: mine.date || '',
      loc: 'Location not provided',
      tags: ['Registered'],
      quota: '-',
      max: '-',
      desc: 'No description available for this event.'
    });
  }
  openDetail(id);
}

function openDetailFromMine(id) {
  const existsInEvents = ACTS.find(x => x.id === id);
  if (!existsInEvents) {
    const mine = myActivities.find(x => x.id === id);
    if (!mine) return;
    ACTS.push({
      id: mine.id,
      title: mine.title,
      emoji: mine.emoji || '📅',
      color: mine.color || 'blue',
      date: mine.date || '',
      loc: 'Location not provided',
      tags: ['Registered'],
      quota: '-',
      max: '-',
      desc: 'No description available for this event.'
    });
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
      <button class="save-btn" id="profileEditBtn" onclick="toggleProfileEdit()">${profileEditing?'Save Changes':'Edit Profile'}</button>
    </div>
    <div style="padding:0 32px 16px"><button class="logout-btn" onclick="logout()">Logout</button></div>`;
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
    document.getElementById('profileEditBtn').textContent = 'Edit Profile';
    
    // Save to database
    try {
        const res = await fetch(`${API_BASE}/user`, {
        const res = await fetch(`${API_BASE}/user`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_db: currentUser.id_db,
                name:  currentUser.name,
                phone: currentUser.phone,
                email: currentUser.email,
                dept:  currentUser.dept
            })
            body: JSON.stringify({
                id_db: currentUser.id_db,
                name:  currentUser.name,
                phone: currentUser.phone,
                email: currentUser.email,
                dept:  currentUser.dept
            })
        });
        const result = await res.json();
        if (!res.ok) alert('Save failed: ' + (result.error || 'Unknown error'));
        if (!res.ok) alert('Save failed: ' + (result.error || 'Unknown error'));
    } catch(e) {
        console.error("Update failed", e);
        alert('Network error. Failed to save.');
        console.error("Update failed", e);
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
    document.getElementById('profileEditBtn').textContent = 'Save Changes';
    renderFields();
  }
}

function logout() {
  currentUser = null;
  currentRole = null;
  profileEditing = false;
  myActivities = [];
  document.getElementById('loginId').value = '';
  document.getElementById('loginPw').value = '';
  showUserInterface();
  renderProfile();
  switchTab(0);
}

// =================== BANNER ===================
const BANNER_LABELS = ['🔥 Hot', '🎨 New', '🎵 Limited'];
const BANNER_LABELS = ['🔥 Hot', '🎨 New', '🎵 Limited'];
const BANNER_GRADIENTS = [
  'linear-gradient(135deg, #025E73 0%, #7ab752 100%)',
  'linear-gradient(135deg, #025E73 0%, #F2EBEB 100%)',
  'linear-gradient(135deg, #2EA69A 0%, #F2EBEB 100%)',
];

let bannerIndex = 0;
let bannerTimer = null;

function renderBanner() {
  const scroll = document.getElementById('bannerScroll');
  const dotWrap = document.querySelector('.banner-dot');
  if (!scroll || ACTS.length === 0) return;

  const items = ACTS.slice(0, 3);

  scroll.innerHTML = items.map((a, i) => `
  <div class="banner-card" onclick="openDetail(${a.id})" style="background:${BANNER_GRADIENTS[i]}">
    <div class="label">${BANNER_LABELS[i] || '📅 Event'}</div>
    <div class="people">${a.quota} / ${a.max} Attending</div>
    <div class="title">${a.title}</div>
  </div>
  <div class="banner-card" onclick="openDetail(${a.id})" style="background:${BANNER_GRADIENTS[i]}">
    <div class="label">${BANNER_LABELS[i] || '📅 Event'}</div>
    <div class="people">${a.quota} / ${a.max} Attending</div>
    <div class="title">${a.title}</div>
  </div>
  `).join('');

  dotWrap.innerHTML = items.map((_, i) =>
    `<span id="d${i}" class="${i === 0 ? 'on' : ''}"></span>`
  ).join('');

  bannerIndex = 0;
  scroll.scrollLeft = 0;
  scroll.removeEventListener('scroll', onBannerScroll);
  scroll.addEventListener('scroll', onBannerScroll);
  clearInterval(bannerTimer);
  startBannerAuto();
}

function onBannerScroll() {
  const el = document.getElementById('bannerScroll');
  const idx = Math.round(el.scrollLeft / (el.firstElementChild?.offsetWidth + 12 || 252));
  updateDots(idx);
  bannerIndex = idx;
}

function getBannerWidth() {
  const el = document.getElementById('bannerScroll');
  return el && el.firstElementChild ? el.firstElementChild.offsetWidth + 12 : 0;
}

function updateDots(index) {
  document.querySelectorAll('.banner-dot span').forEach((dot, i) =>
    dot.classList.toggle('on', i === index)
  );
}

function moveBanner(index) {
  const el = document.getElementById('bannerScroll');
  el.scrollTo({ left: index * getBannerWidth(), behavior: 'smooth' });
  updateDots(index);
}

function nextBanner() {
  const el = document.getElementById('bannerScroll');
  if (!el.children.length) return;
  bannerIndex = (bannerIndex + 1) % el.children.length;
  moveBanner(bannerIndex);
}

function startBannerAuto() {
  clearInterval(bannerTimer);
  bannerTimer = setInterval(nextBanner, 3000);
}

const banner = document.getElementById('bannerScroll');
banner.addEventListener('touchstart', () => clearInterval(bannerTimer));
banner.addEventListener('mouseenter', () => clearInterval(bannerTimer));
banner.addEventListener('touchend', startBannerAuto);
banner.addEventListener('mouseleave', startBannerAuto);

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
  // 💡 文字同步修改為 管理者模式
  badge.innerHTML = `<i class="ti ti-shield-check"></i> Administrator Mode`;
  // 💡 文字同步修改為 管理者模式
  badge.innerHTML = `<i class="ti ti-shield-check"></i> Administrator Mode`;
  nav.insertBefore(badge, nav.children[1]);

  const bottom = document.createElement('div');
  bottom.className = 'nav-bottom';
  bottom.innerHTML = `<button class="nav-bottom-btn" onclick="adminLogout()"><i class="ti ti-logout"></i> Log out Admin</button>`;
  bottom.innerHTML = `<button class="nav-bottom-btn" onclick="adminLogout()"><i class="ti ti-logout"></i> Log out Admin</button>`;
  nav.appendChild(bottom);

  const hb = document.getElementById('adminHeaderBadge');
  if (hb && currentUser) hb.textContent = `👤 ${currentUser.name}`;
}

function adminLogout() {
  currentUser = null;
  currentRole = null;
  // Remove injected elements
  const nav = document.getElementById('adminNav');
  const badge = nav.querySelector('.admin-badge-nav');
  if (badge) badge.remove();
  const bottom = nav.querySelector('.nav-bottom');
  if (bottom) bottom.remove();
  showUserInterface();
  switchTab(0);
}

// =================== ADMIN: DASHBOARD ===================
function renderAdminDashboard() {
  const combinedZone = document.getElementById('admin-combined-card-zone');
  const activityList = document.getElementById('admin-activity-list');
  if (!combinedZone) return;

  const totalEvents = ACTS.length;

  // Overview top area: two separate small cards in the same row
  combinedZone.innerHTML = `
    <div class="admin-overview-card-row">
      <div class="admin-overview-mini-card">
        <div class="admin-overview-icon total">
          <i class="ti ti-calendar-event"></i>
        </div>
        <div>
          <div class="admin-overview-label">Total Events</div>
          <div class="admin-overview-number">${totalEvents}</div>
        </div>
      </div>

      <button type="button" class="admin-overview-mini-card add" onclick="openAddActivity()">
        <div class="admin-overview-icon add">
          <i class="ti ti-plus"></i>
        </div>
        <div>
          <div class="admin-overview-label">Quick Action</div>
          <div class="admin-overview-title">Add Event</div>
        </div>
      </button>
    </div>
  `;

  // 下方活動列表直接渲染（不需要按鈕觸發）
  if (activityList) {
    activityList.classList.remove('admin-shortcut-grid');
    
    if (ACTS.length === 0) {
      activityList.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">No events available. Click Add Event to create one.</div>`;
      return;
    }

    activityList.innerHTML = ACTS.map(a => {
      const regs = REGISTRATIONS[a.id] || [];
      const meat = regs.filter(r => r.meal === 'meat').length;
      const veg = regs.filter(r => r.meal === 'veg').length;
      const pct = Math.round(Number(a.quota || 0) / Number(a.max || 1) * 100);
      
      return `
      <div class="admin-act-card">
        <div class="admin-act-header">
          <div class="act-thumb ${a.color}" style="width:48px;height:48px;font-size:22px">${a.emoji || '📅'}</div>
          <div class="admin-act-info">
            <h3>${a.title}</h3>
            <p>${a.date} · ${a.loc}</p>
          </div>
          <div class="admin-act-actions">
            <button class="admin-btn view" onclick="openRegDetail(${a.id})">
              <i class="ti ti-users"></i>List
            </button>
            <button class="admin-btn edit" onclick="openEditActivity(${a.id})">
              <i class="ti ti-edit"></i>Edit
            </button>
            <button class="admin-btn del" onclick="openDeleteModal(${a.id})">
              <i class="ti ti-trash"></i>Delete
            </button>
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
  const combinedZone = document.getElementById('admin-combined-card-zone');
  const activityList = document.getElementById('admin-activity-list');
  if (!combinedZone) return;

  const totalEvents = ACTS.length;

  // Overview top area: two separate small cards in the same row
  combinedZone.innerHTML = `
    <div class="admin-overview-card-row">
      <div class="admin-overview-mini-card">
        <div class="admin-overview-icon total">
          <i class="ti ti-calendar-event"></i>
        </div>
        <div>
          <div class="admin-overview-label">Total Events</div>
          <div class="admin-overview-number">${totalEvents}</div>
        </div>
      </div>

      <button type="button" class="admin-overview-mini-card add" onclick="openAddActivity()">
        <div class="admin-overview-icon add">
          <i class="ti ti-plus"></i>
        </div>
        <div>
          <div class="admin-overview-label">Quick Action</div>
          <div class="admin-overview-title">Add Event</div>
        </div>
      </button>
    </div>
  `;

  // 下方活動列表直接渲染（不需要按鈕觸發）
  if (activityList) {
    activityList.classList.remove('admin-shortcut-grid');
    
    if (ACTS.length === 0) {
      activityList.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">No events available. Click Add Event to create one.</div>`;
      return;
    }

    activityList.innerHTML = ACTS.map(a => {
      const regs = REGISTRATIONS[a.id] || [];
      const meat = regs.filter(r => r.meal === 'meat').length;
      const veg = regs.filter(r => r.meal === 'veg').length;
      const pct = Math.round(Number(a.quota || 0) / Number(a.max || 1) * 100);
      
      return `
      <div class="admin-act-card">
        <div class="admin-act-header">
          <div class="act-thumb ${a.color}" style="width:48px;height:48px;font-size:22px">${a.emoji || '📅'}</div>
          <div class="admin-act-info">
            <h3>${a.title}</h3>
            <p>${a.date} · ${a.loc}</p>
          </div>
          <div class="admin-act-actions">
            <button class="admin-btn view" onclick="openRegDetail(${a.id})">
              <i class="ti ti-users"></i>List
            </button>
            <button class="admin-btn edit" onclick="openEditActivity(${a.id})">
              <i class="ti ti-edit"></i>Edit
            </button>
            <button class="admin-btn del" onclick="openDeleteModal(${a.id})">
              <i class="ti ti-trash"></i>Delete
            </button>
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

// =================== ADMIN: REGISTRATION DETAIL
// =================== ADMIN: REGISTRATION DETAIL
function openRegDetail(actId) {
  const a    = ACTS.find(x => x.id === actId);
  const regs = REGISTRATIONS[actId] || [];
  const meat = regs.filter(r => r.meal === 'meat').length;
  const veg  = regs.filter(r => r.meal === 'veg').length;

  document.getElementById('adminRegDetailTitle').textContent = a.title;
  document.getElementById('adminRegDetailSub').textContent   = `Total ${regs.length} registrations · Meat ${meat} · Vegetarian ${veg}`;
  document.getElementById('adminRegDetailSub').textContent   = `Total ${regs.length} registrations · Meat ${meat} · Vegetarian ${veg}`;
  let tableHtml = '';
  if (regs.length === 0) {
    tableHtml = `<div class="empty-state" style="padding:24px 0"><i class="ti ti-users" style="font-size:32px;opacity:.3"></i><p>No registrations yet</p></div>`;
    tableHtml = `<div class="empty-state" style="padding:24px 0"><i class="ti ti-users" style="font-size:32px;opacity:.3"></i><p>No registrations yet</p></div>`;
  } else {
    tableHtml = `
    <div style="margin-bottom:12px;display:flex;gap:8px">
      <span class="meal-pill meat" style="font-size:13px;padding:4px 12px">🍖 Meat ${meat}</span>
      <span class="meal-pill veg"  style="font-size:13px;padding:4px 12px">🌿 Veg ${veg}</span>
      <span class="meal-pill meat" style="font-size:13px;padding:4px 12px">🍖 Meat ${meat}</span>
      <span class="meal-pill veg"  style="font-size:13px;padding:4px 12px">🌿 Veg ${veg}</span>
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
          <th>Student ID / Account</th>
          <th>Name</th>
          <th>Department</th>
          <th>Meal</th>
        </tr>
      </thead>
      <tbody>
        ${regs.map((r, i) => `
        <tr>
          <td style="color:var(--text-muted)">${i+1}</td>
          <td>${r.uid}</td>
          <td style="font-weight:600">${r.name}</td>
          <td>${r.dept}</td>
          <td>
            <span class="meal-pill ${r.meal}">${r.meal==='meat'?'🍖 ':'🌿'}</span>
            <span class="meal-pill ${r.meal}">${r.meal==='meat'?'🍖 ':'🌿'}</span>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>`;
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

    // 清空舊資料
    Object.keys(REGISTRATIONS).forEach(k => delete REGISTRATIONS[k]);

    // 重新整理資料
    Object.entries(data).forEach(([k, v]) => {
      REGISTRATIONS[Number(k)] = v.map(r => ({
        ...r,
        meal: (r.meal && r.meal.includes('素')) ? 'veg' : 'meat'
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
        <div>
          <div class="reg-overview-count">${a.quota}<span>/ ${a.max} Attendees</span></div>
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
    </div>`;
  }).join('');
}

// =================== ADMIN: ADD / EDIT ACTIVITY ===================
function openAddActivity() {
  editingActId = null;
  document.getElementById('actFormTitle').textContent    = 'Create Event';
  document.getElementById('actFormSubtitle').textContent = 'Fill in event details';
  document.getElementById('actFormTitle').textContent    = 'Create Event';
  document.getElementById('actFormSubtitle').textContent = 'Fill in event details';
  document.getElementById('af_title').value  = '';
  document.getElementById('af_date').value   = '';
  document.getElementById('af_time').value   = '';
  document.getElementById('af_time').value   = '';
  document.getElementById('af_loc').value    = '';
  const deptSelect = document.getElementById('af_dept');
  if (deptSelect) deptSelect.value = 'College of Management';
  const deptSelect = document.getElementById('af_dept');
  if (deptSelect) deptSelect.value = 'College of Management';
  document.getElementById('af_quota').value  = '0';
  document.getElementById('af_max').value    = '100';
  document.getElementById('af_emoji').value  = '💻';
  document.getElementById('af_color').value  = 'blue';
  document.getElementById('af_emoji').value  = '💻';
  document.getElementById('af_color').value  = 'blue';
  document.getElementById('af_tags').value   = '';
  document.getElementById('af_desc').value   = '';
  document.getElementById('activityFormModal').classList.add('open');
}
// =================== 💡 新增：儲存活動（支援新增與編輯） ===================
async function saveActivity() {
    // 1. 抓取表單輸入值
    const title = document.getElementById('af_title').value.trim();
    const date = document.getElementById('af_date').value.trim(); // 格式通常為 YYYY-MM-DD
    const loc = document.getElementById('af_loc').value.trim();
    const max = parseInt(document.getElementById('af_max').value.trim(), 10);

    // 簡單驗證
    if (!title || !date || !loc || isNaN(max)) {
      return alert('Please fill in all required fields and ensure capacity is a number!');
    }

    // 2. 組裝要送給後端的 JSON 欄位（精準對齊 Flask 接收名稱）
    const payload = {
        title: title,
        date: date,           // 後端會存入 event_day
        time: "14:00",        // 如果前端沒做時間輸入框，先給預設值
        loc: loc,             // 對應後端 location
        max: max,             // 對應後端 guest_capacity
        category_id: 1,       // 預設分類分類ID
        description: "",      // 預設詳細描述
        emoji: "📅",           // 預設卡片圖示
        color: "blue",        // 預設卡片顏色
        host_id: currentUser.id_db,
    department: dept
        color: "blue",        // 預設卡片顏色
        host_id: currentUser.id_db,
    department: dept
    };

    try {
        let res;
        // 判斷當前是「編輯」還是「新增」狀態
        if (editingActId !== null) {
            // 💡 編輯：發送 PUT 請求
            res = await fetch(`${API_BASE}/events/${editingActId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // 💡 新增：發送 POST 請求
            res = await fetch(`${API_BASE}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Save failed');

        alert(data.message || 'Operation successful!');
        
        // 3. 關閉表單彈窗（請確保對應到你的 HTML 關閉 id 或是 class）
        document.getElementById('adminActFormModal')?.classList.remove('open'); 

        // 4. 全域重新載入最新數據並刷新管理員後台畫面
        await loadEvents(); 
        await loadAllRegistrations();
        renderAdminDashboard();
        renderAdminRegistrations();

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}
function openEditActivity(id) {
  const a = ACTS.find(x => x.id === id);
  if (!a) return;
  editingActId = id;
  document.getElementById('actFormTitle').textContent    = 'Edit Event';
  document.getElementById('actFormSubtitle').textContent = `Editing: ${a.title}`;
  document.getElementById('af_title').value  = a.title;
  const editDateTime = splitActivityDateTime(a.date);
  document.getElementById('af_date').value   = editDateTime.date;
  document.getElementById('af_time').value   = editDateTime.time;
  const editDateTime = splitActivityDateTime(a.date);
  document.getElementById('af_date').value   = editDateTime.date;
  document.getElementById('af_time').value   = editDateTime.time;
  document.getElementById('af_loc').value    = a.loc;
  const deptSelect = document.getElementById('af_dept');
  if (deptSelect) deptSelect.value = a.department || 'College of Management';
  const deptSelect = document.getElementById('af_dept');
  if (deptSelect) deptSelect.value = a.department || 'College of Management';
  document.getElementById('af_quota').value  = a.quota;
  document.getElementById('af_max').value    = a.max;
  document.getElementById('af_emoji').value  = a.emoji;
  document.getElementById('af_color').value  = a.color;
  document.getElementById('af_tags').value   = a.tags.join(',');
  document.getElementById('af_desc').value   = a.desc;
  document.getElementById('activityFormModal').classList.add('open');
}


function parseActivityDateTime(dateValue, timeValue) {
  const normalizedDate = (dateValue || '').replace(/\//g, '-');
  const normalizedTime = timeValue || '00:00';
  return {
    event_day: normalizedDate,
    event_time: normalizedTime
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

function formatDateTimeLocal(value) {
  if (!value) return '';
  const normalized = String(value).replace(/\//g, '-').replace(' ', 'T');
  return normalized.slice(0, 16);
}


function parseActivityDateTime(dateValue, timeValue) {
  const normalizedDate = (dateValue || '').replace(/\//g, '-');
  const normalizedTime = timeValue || '00:00';
  return {
    event_day: normalizedDate,
    event_time: normalizedTime
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

function formatDateTimeLocal(value) {
  if (!value) return '';
  const normalized = String(value).replace(/\//g, '-').replace(' ', 'T');
  return normalized.slice(0, 16);
}

// 修改「新增／編輯活動」的表單送出
async function submitActivityForm() {
  const title = document.getElementById('af_title').value.trim();
  const date   = document.getElementById('af_date').value.trim();
  const time   = document.getElementById('af_time').value.trim();
  const time   = document.getElementById('af_time').value.trim();
  const loc    = document.getElementById('af_loc').value.trim();
  const max   = parseInt(document.getElementById('af_max').value)   || 100;
  const dept  = document.getElementById('af_dept') ? document.getElementById('af_dept').value : 'College of Management';
  const dept  = document.getElementById('af_dept') ? document.getElementById('af_dept').value : 'College of Management';
  const emoji = document.getElementById('af_emoji').value;
  const color = document.getElementById('af_color').value;
  const desc  = document.getElementById('af_desc').value.trim();

  if (!title || !date || !time || !loc) return alert('Please fill in the event name, date, time, and location');
  if (!title || !date || !time || !loc) return alert('Please fill in the event name, date, time, and location');

  const { event_day, event_time } = parseActivityDateTime(date, time);
  const { event_day, event_time } = parseActivityDateTime(date, time);

  // 整理要傳送給後端的資料包
  const payload = {
    title: title,
    date: event_day,
    time: event_time,
    loc: loc,
    max: max,
    student_capacity: max, 
    emoji: emoji,        
    color: color,        
    description: desc,
    category_id: 1 ,// 預設分類 ID，可根據需求調整
    host_id: currentUser.id_db,
    department: dept
    category_id: 1 ,// 預設分類 ID，可根據需求調整
    host_id: currentUser.id_db,
    department: dept
  };

  try {
    if (editingActId !== null) {
      // === 編輯現有活動 (PUT) ===
      const res = await fetch(`${API_BASE}/events/${editingActId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      if (!res.ok) throw new Error(data.error || 'Update failed');

      document.getElementById('activityFormModal').classList.remove('open');
      showAdminSuccess('Event Updated', `"${title}" has been successfully synchronized to the database.`);
    } else {
      // === 新增全新活動 (POST) ===
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Creation failed');
      if (!res.ok) throw new Error(data.error || 'Creation failed');

      document.getElementById('activityFormModal').classList.remove('open');
      showAdminSuccess('Event Created', `"${title}" has been successfully added to the database event list.`);
    }

    // 重新載入最新資料
    if (typeof loadEvents === 'function') await loadEvents();
    if (typeof loadAllRegistrations === 'function') await loadAllRegistrations();
    
    // 重新渲染 UI 畫面
    if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    if (typeof renderAdminRegistrations === 'function') renderAdminRegistrations();
    if (typeof renderEvents === 'function') renderEvents(); // 同步更新前端探索列表

  } catch (e) {
    console.error(e);
    alert('Operation failed: ' + e.message);
  }
}
function closeActivityForm() {
  document.getElementById('activityFormModal')?.classList.remove('open');
  document.getElementById('adminActFormModal')?.classList.remove('open'); 
}

// =================== ADMIN: DELETE ===================
function openDeleteModal(id) {
  deleteTargetId = id;
  const a = ACTS.find(x => x.id === id);
  if (!a) return;
  document.getElementById('adminDeleteMsg').textContent = `Are you sure you want to permanently delete "${a.title}"? This operation cannot be undone and all registration records will be cleared.`;
  document.getElementById('adminDeleteModal').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('adminDeleteModal')?.classList.remove('open');
  deleteTargetId = null;
}

async function confirmDeleteActivity() {
  if (deleteTargetId === null) return;
  
  const a = ACTS.find(x => x.id === deleteTargetId);
  
  try {
    const res = await fetch(`${API_BASE}/events/${deleteTargetId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Delete failed');

    document.getElementById('adminDeleteModal')?.classList.remove('open');
    if (typeof showAdminSuccess === 'function') {
        showAdminSuccess('Event Deleted', `"${a ? a.title : 'The event'}" has been permanently removed.`);
    } else {
        alert('Event Deleted successfully!');
    }
    
    await loadEvents();
    await loadAllRegistrations(); 
    
    if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    if (typeof renderAdminRegistrations === 'function') renderAdminRegistrations();

  } catch (e) {
    console.error(e);
    alert('Operation failed: ' + e.message);
  }

  deleteTargetId = null;
}

// 初始化時綁定搜尋與篩選事件 不重整網頁的即時活動查詢
document.getElementById('searchKeyword')?.addEventListener('input', doFilter);
document.getElementById('filterTag')?.addEventListener('change', doFilter);

function doFilter() {
    const keyword = document.getElementById('searchKeyword').value.toLowerCase().trim();
    const selectedTag = document.getElementById('filterTag').value;

    // 確保全域活動變數存在，防範未載入完成時噴錯
    const eventsToFilter = window.allEvents || window.ACTS || [];

    const filteredResult = eventsToFilter.filter(act => {
        // 關鍵字比對
        const matchText = act.title.toLowerCase().includes(keyword) || 
                          act.loc.toLowerCase().includes(keyword) ||
                          (act.description && act.description.toLowerCase().includes(keyword));
        
        // 標籤安全比對：支援 act.tags 為字串或陣列的情況
        let matchTag = false;
        if (selectedTag === 'all') {
            matchTag = true;
        } else if (typeof act.tags === 'string') {
            matchTag = act.tags === selectedTag;
        } else if (Array.isArray(act.tags)) {
            matchTag = act.tags.includes(selectedTag);
        }

        return matchText && matchTag;
    });

    if (typeof renderActivityList === 'function') {
        renderActivityList(filteredResult); 
    }
}

function closeActivityForm() {
  document.getElementById('activityFormModal').classList.remove('open');
}

// =================== ADMIN: DELETE ===================
function openDeleteModal(id) {
  deleteTargetId = id;
  const a = ACTS.find(x => x.id === id);
  document.getElementById('adminDeleteMsg').textContent = `Are you sure you want to permanently delete "${a.title}"? This operation cannot be undone and all registration records will be cleared.`;
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
    // === 💡 修正 1：拿掉多餘的 /api ===
    const res = await fetch(`${API_BASE}/events/${deleteTargetId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    if (!res.ok) throw new Error(data.error || 'Delete failed');

    // 關閉刪除確認彈窗
    document.getElementById('adminDeleteModal').classList.remove('open');
    showAdminSuccess('Event Deleted', `"${a ? a.title : 'The event'}" has been permanently removed from the database.`);
    showAdminSuccess('Event Deleted', `"${a ? a.title : 'The event'}" has been permanently removed from the database.`);
    
    // 重新從資料庫載入最新活動列表
    await loadEvents();
    
    // 同步更新後台的記憶體資料（讓便當人數與名單同步清空）
    await loadAllRegistrations(); 
    
    // === 💡 修正 2：同時刷新「總覽主頁」與「報名分頁」，確保兩邊卡片都同步消失 ===
    renderAdminDashboard();
    renderAdminRegistrations();

  } catch (e) {
    console.error(e);
    alert('Delete failed: ' + e.message);
    alert('Delete failed: ' + e.message);
  }

  deleteTargetId = null;
}
// 初始化時綁定搜尋與篩選事件 不重整網頁的即時活動查詢
document.getElementById('searchKeyword').addEventListener('input', doFilter);
document.getElementById('filterTag').addEventListener('change', doFilter);

function doFilter() {
    const keyword = document.getElementById('searchKeyword').value.toLowerCase().trim();
    const selectedTag = document.getElementById('filterTag').value;

    const filteredResult = window.allEvents.filter(act => {
        // 關鍵字比對：名稱、地點、或是描述
        const matchText = act.title.toLowerCase().includes(keyword) || 
                          act.loc.toLowerCase().includes(keyword) ||
                          (act.description && act.description.toLowerCase().includes(keyword));
        
        // 標籤比對
        const matchTag = selectedTag === 'all' || act.tags === selectedTag;

        return matchText && matchTag;
    });

    // 呼叫你原本渲染列表的 function，把 filteredResult 丢進去重新畫出畫面
    renderActivityList(filteredResult); 
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
  {key:'id',   label:'Account',     icon:'ti-id-badge'},
  {key:'name', label:'Name',        icon:'ti-user'},
  {key:'phone',label:'Phone',       icon:'ti-phone'},
  {key:'email',label:'Email',       icon:'ti-mail'},
  {key:'dept', label:'Organization',icon:'ti-building'},
  {key:'id',   label:'Account',     icon:'ti-id-badge'},
  {key:'name', label:'Name',        icon:'ti-user'},
  {key:'phone',label:'Phone',       icon:'ti-phone'},
  {key:'email',label:'Email',       icon:'ti-mail'},
  {key:'dept', label:'Organization',icon:'ti-building'},
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
        Administrator · ${currentUser.dept}
      </div>
    </div>
    <div class="profile-fields" id="adminProfileFields"></div>
    <div class="edit-bar">
      <button class="save-btn" id="adminProfileEditBtn" onclick="toggleAdminProfileEdit()">${adminProfileEditing?'Save Changes':'Edit Profile'}</button>
      <button class="save-btn" id="adminProfileEditBtn" onclick="toggleAdminProfileEdit()">${adminProfileEditing?'Save Changes':'Edit Profile'}</button>
    </div>
    <div style="padding:0 32px 16px">
      <button class="logout-btn" onclick="adminLogout()">Logout Admin</button>
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
    document.getElementById('adminProfileEditBtn').textContent = 'Edit Profile';
    
    // Save to database
    try {
        const res = await fetch(`${API_BASE}/user`, {
        const res = await fetch(`${API_BASE}/user`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_db: currentUser.id_db,
                name:  currentUser.name,
                phone: currentUser.phone,
                email: currentUser.email,
                dept:  currentUser.dept
            })
            body: JSON.stringify({
                id_db: currentUser.id_db,
                name:  currentUser.name,
                phone: currentUser.phone,
                email: currentUser.email,
                dept:  currentUser.dept
            })
        });
        const result = await res.json();
        if (!res.ok) alert('Save failed：' + (result.error || 'Unknow error'));
        const result = await res.json();
        if (!res.ok) alert('Save failed：' + (result.error || 'Unknow error'));
    } catch(e) {
        console.error("Update failed", e);
        alert('Network error, save failed.');
        console.error("Update failed", e);
        alert('Network error, save failed.');
    }

    renderAdminFields();
    const nm = document.querySelector('#admin-screen-profile .profile-name');
    const dp = document.querySelector('#admin-screen-profile .profile-dept');
    const av = document.querySelector('#admin-screen-profile .avatar');
    if (nm) nm.textContent = currentUser.name;
    if (av) av.textContent = currentUser.name.slice(-2);
  } else {
    adminProfileEditing = true;
    document.getElementById('adminProfileEditBtn').textContent = 'Save Changes';
    document.getElementById('adminProfileEditBtn').textContent = 'Save Changes';
    renderAdminFields();
  }
}

// =================== DATA FETCH ===================
async function loadEvents() {
  try {
    const res = await fetch(`${API_BASE}/events`);
    const data = await res.json();
    
    // Convert API data to matching ACTS structure
    ACTS = data.map(d => {
      // 🌟【致命修正 1】Banner 與日曆通常需要獨立的 date 欄位 (YYYY/MM/DD)
      // 如果直接把 time 塞進 date，會導致 Banner 解析日期失敗而整塊消失！
      const rawDate = d.date ? String(d.date).replace(/-/g, '/') : '';
      
      // 確保 tags 一定是陣列
      let formattedTags = [];
      if (d.tags) {
        formattedTags = Array.isArray(d.tags) ? d.tags : [String(d.tags).trim()];
      }

      return {
        id: Number(d.id),
        emoji: d.emoji || '📅', // 優先使用後端傳來的 emoji，沒有才用預設
        color: d.color || 'blue', // 優先使用後端傳來的顏色
        title: d.title,
        date: rawDate,          // 保持純日期格式，保住 Banner 運作
        time: d.time || '00:00', // 獨立分開時間欄位
        loc: d.loc,
        tags: formattedTags,    // 確保為陣列
        quota: d.quota || 0,
        max: d.student_capacity || d.max || 100,
        desc: d.description || d.desc || '',
        department: d.department || d.dept || 'College of Management'
      };
    });
  
    window.allEvents = [...ACTS];
    
    // 依序安全渲染
    if (typeof renderCards === 'function') renderCards();
    if (typeof renderBanner === 'function') renderBanner();

    if (currentRole === 'admin' && typeof renderAdminDashboard === 'function') {
      renderAdminDashboard();
    }
  } catch (error) {
    console.error('Failed to load events from DB:', error);
  }
}

// === 雙重監聽：無論是輸入文字還是切換下拉選單，都觸發 doFilter ===
const searchKeywordEl = document.getElementById('searchKeyword');
if (searchKeywordEl) {
    searchKeywordEl.addEventListener('input', doFilter);
}

const filterTagEl = document.getElementById('filterTag');
if (filterTagEl) {
    filterTagEl.addEventListener('change', doFilter);
}

// === 核心複合篩選 Function (完美整合與去重版) ===
function doFilter() {
    if (!window.allEvents) return;

    const searchInput = document.getElementById('searchKeyword');
    const filterSelect = document.getElementById('filterTag');

    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedTag = filterSelect ? filterSelect.value : 'all';

    // 開始過濾
    ACTS = window.allEvents.filter(act => {
        
        // 🟢 1. 安全處理標籤字串化（防止陣列調用 .toLowerCase() 崩潰）
        let tagString = '';
        if (Array.isArray(act.tags)) {
            tagString = act.tags.join(' ').toLowerCase(); 
        } else if (typeof act.tags === 'string') {
            tagString = act.tags.toLowerCase();
        }

        // 🟢 2. 關鍵字複合比對 (名稱、地點、描述、標籤)
        const matchText = !keyword || (
            (act.title && act.title.toLowerCase().includes(keyword)) || 
            (act.loc   && act.loc.toLowerCase().includes(keyword))   ||
            (act.desc  && act.desc.toLowerCase().includes(keyword))  ||
            tagString.includes(keyword)
        );
        
        // 🟢 3. 下拉選單標籤比對 (完美相容陣列與字串比對)
        let matchTag = false;
        if (selectedTag === 'all') {
            matchTag = true;
        } else {
            if (Array.isArray(act.tags)) {
                matchTag = act.tags.some(t => {
                    const cleanT = String(t).trim();
                    return cleanT === selectedTag || cleanT.includes(selectedTag) || selectedTag.includes(cleanT);
                });
            } else if (typeof act.tags === 'string') {
                matchTag = act.tags === selectedTag || act.tags.includes(selectedTag);
            }
        }

        return matchText && matchTag;
    });

    // 重新繪製畫面卡片
    if (typeof renderCards === 'function') renderCards(); 
}

// =================== INIT ===================
loadEvents();
if (typeof showUserInterface === 'function') showUserInterface();

// === 事件綁定：處理按鈕與 Enter 鍵觸發 ===
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchKeyword');

    // 💡 1. 點擊「搜尋按鈕」時觸發
    if (searchBtn) {
        searchBtn.addEventListener('click', doFilter);
    }

    // 💡 2. 在輸入框按下「Enter 鍵」時也觸發
    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                doFilter();
            }
        });
    }
});