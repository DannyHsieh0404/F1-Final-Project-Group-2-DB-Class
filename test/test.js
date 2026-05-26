// =================== DATA ===================
const API_BASE = 'http://127.0.0.1:5000/api';

let ACTS = [];

// Simulate registration records per activity (mock data)
const REGISTRATIONS = {
  0: [
    { uid:'B10001', name:'王小明', dept:'資工系', meal:'meat' },
    { uid:'B10002', name:'林雅婷', dept:'管理系', meal:'veg' },
    { uid:'B10003', name:'陳俊宏', dept:'電機系', meal:'meat' },
  ],
  1: [
    { uid:'B10004', name:'黃怡君', dept:'藝術系', meal:'veg' },
    { uid:'B10005', name:'李建志', dept:'設計系', meal:'meat' },
  ],
  2: [
    { uid:'B10006', name:'張美玲', dept:'音樂系', meal:'meat' },
  ],
};

const TAGCOLOR = {
  '體育':'green','競賽':'green','藝術':'purple','手作':'orange',
  '音樂':'purple','環保':'blue','生活':'blue','資訊':'blue',
  '展覽':'purple','講座':'orange','文化':'green','交流':'green',
  '健康':'green','娛樂':'purple'
};
const HEROCOLOR = { green:'var(--primary-pale)', orange:'var(--accent-pale)', purple:'#EDE7F6', blue:'#E3F2FD' };

// =================== STATE ===================
let currentUser = null;
let currentRole = null; // 'user' | 'admin'
let myActivities = [];
let currentDetailId = null;
let selectedMeal = null;
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
  const logo    = document.getElementById('navLogo');
  const adminLogo = document.getElementById('adminNavLogo');

  if (isDesktop()) {
    if (logo) logo.style.display = 'block';
    if (adminLogo) adminLogo.style.display = 'block';
    document.getElementById('app').style.gridTemplateColumns = 'var(--sidebar-w) 1fr';
    document.getElementById('mainNav').style.order = '-1';
    document.getElementById('adminNav').style.order = '-1';
  } else {
    if (logo) logo.style.display = 'none';
    if (adminLogo) adminLogo.style.display = 'none';
  }
}

window.addEventListener('resize', applyLayout);
applyLayout();

// =================== INTERFACE SWITCH ===================
function showUserInterface() {
  document.getElementById('userApp').style.display = 'contents';
  document.getElementById('adminApp').style.display = 'none';
}

async function showAdminInterface() {
  document.getElementById('userApp').style.display = 'none';
  document.getElementById('adminApp').style.display = 'contents';
  renderAdminNav();
  await loadAllRegistrations(); // ← 加這行，進後台就先把報名資料撈進來
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
            ${reg ? '<span class="tag green">✓ 已報名</span>' : ''}
          </div>
        </div>
      </div>
      <div class="act-bottom">
        <div class="progress-wrap">
          <div class="progress-label">${a.quota} / ${a.max} 人已報名</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <span class="act-spots">${a.max - a.quota} 名額</span>
      </div>
    </div>`;
  }).join('');
}

// =================== DETAIL ===================
function openDetail(id) {
  const a = ACTS.find(x => x.id === id);
  if (!a) return;
  currentDetailId = id;
  
  document.getElementById('dTitle').textContent = a.title;
  document.getElementById('dHero').textContent = a.emoji;
  document.getElementById('dHero').style.background = HEROCOLOR[a.color] || '#4f46e5';
  
  // === 💡 核心修正：相容字串格式的標籤處理 ===
  // 如果 a.tags 已經是字串，直接切開變成陣列，或者直接包成陣列來做 map
  const tagsArray = Array.isArray(a.tags) ? a.tags : (a.tags ? a.tags.split(',') : ['未分類']);
  document.getElementById('dTags').innerHTML = tagsArray.map(t => {
    const cleanTag = t.trim();
    return `<span class="tag ${TAGCOLOR[cleanTag] || 'green'}">${cleanTag}</span>`;
  }).join('');
  
  document.getElementById('dDate').textContent = a.date;
  document.getElementById('dLocation').textContent = a.loc;
  
  // 🎯 這裡就能順利渲染活動描述，不會中途死機了！
  document.getElementById('dDesc').textContent = a.desc || "此活動暫無詳細描述。";
  document.getElementById('dQuota').textContent = a.quota;
  document.getElementById('dMax').textContent = a.max;

  const already = myActivities.find(m => m.id === id);
  const btn = document.getElementById('regBtn');
  if (already) {
    btn.textContent = '✕ 取消報名'; btn.className = 'register-btn cancel'; btn.disabled = false;
  } else if (a.quota >= a.max) {
    btn.textContent = '名額已滿'; btn.className = 'register-btn'; btn.disabled = true;
  } else {
    btn.textContent = '立即報名'; btn.className = 'register-btn'; btn.disabled = false;
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
    selectedMeal = null;
    document.getElementById('meatBtn').classList.remove('selected');
    document.getElementById('vegBtn').classList.remove('selected');
    document.getElementById('submitMealBtn').style.opacity = '0.5';
    document.getElementById('submitMealBtn').style.pointerEvents = 'none';
    document.getElementById('mealModal').classList.add('open');
  }
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
  const a = ACTS.find(x => x.id === currentDetailId);

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
          alert(data.error || '報名失敗');
          return;
      }
      
      document.getElementById('mealModal').classList.remove('open');
      document.getElementById('successMsg').textContent = `您已成功報名「${a.title}」，餐點選擇：${selectedMeal==='meat'?'葷食':'素食'}。`;
      document.getElementById('successModal').classList.add('open');
      
      await loadMyActivities();
      await loadEvents();
      
      
      // Update UI button on detail page explicitly
      const btn = document.getElementById('regBtn');
      btn.textContent = '✕ 取消報名'; btn.className = 'register-btn cancel';
      document.getElementById('dQuota').textContent = ACTS.find(x => x.id === currentDetailId).quota;
  } catch (e) {
      console.error(e);
      alert('發生錯誤');
  }
}

function goToMine() {
  document.getElementById('successModal').classList.remove('open');
  closeDetailForce();
  switchTab(1);
}

function closeMeal() { document.getElementById('mealModal').classList.remove('open'); }

// =================== CANCEL ===================
function openCancelModal(id) {
  cancelTargetId = id;
  const a = ACTS.find(x => x.id === id);
  document.getElementById('cancelMsg').textContent = `確定要取消「${a.title}」的報名嗎？取消後名額將釋出。`;
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
          alert(data.error || '取消失敗');
          return;
      }

      document.getElementById('cancelModal').classList.remove('open');
      document.getElementById('cancelSuccessMsg').textContent = `已取消「${a.title}」的報名，名額已釋出。`;
      document.getElementById('cancelSuccessModal').classList.add('open');
      
      // 先更新 myActivities，renderCards() 才能正確判斷 reg 是否存在
      await loadMyActivities();
      // 再 loadEvents，裡面會呼叫 renderCards()，此時 myActivities 已是最新的
      await loadEvents();
      
    
      // Update UI button on detail page explicitly
      if (currentDetailId === cancelTargetId) {
          const btn = document.getElementById('regBtn');
          btn.textContent = '立即報名'; btn.className = 'register-btn'; btn.disabled = false;
          // After loadEvents, ACTS is reloaded so we need to fetch a again to get new quota
          const reloadedA = ACTS.find(x => x.id === cancelTargetId);
          document.getElementById('dQuota').textContent = reloadedA ? reloadedA.quota : a.quota;
      }
  } catch (e) {
      console.error(e);
      alert('發生錯誤');
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
  if (!id || !pw) return alert('請填寫學號與密碼');

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pw, role: selectedAuthRole })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '登入失敗');
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
    alert('發生錯誤');
  }
}

async function doRegister() {
  const user_id = document.getElementById('rId').value.trim();  // 學號
  const name  = document.getElementById('rName').value.trim();
  const phone = document.getElementById('rPhone').value.trim();
  const email = document.getElementById('rEmail').value.trim();
  const dept  = document.getElementById('rDept').value.trim();
  const pw = document.getElementById('rPw').value.trim();

  if (!user_id) return alert('請填寫學號');
  if (!pw)      return alert('請填寫密碼');

  try {
    const res = await fetch(`${API_BASE}/register_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          id: user_id,       // 學號
          user_id: user_id,  // 主鍵
          pw,
          role: selectedAuthRole,
          name, phone, email, dept
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
        alert(data.error || '註冊失敗');
        return;
    }

    currentUser = { id: user_id, id_db: user_id, name, phone, email, dept };
    currentRole = selectedAuthRole;

    if (currentRole === 'admin') {
      const code = document.getElementById('rAdminCode') ? document.getElementById('rAdminCode').value.trim() : 'nsysu2025';
      if (code && code !== 'nsysu2025' && code !== '2025admin') return alert('管理員驗證碼錯誤（提示：nsysu2025）');
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
    alert('發生錯誤');
  }
}

function closeAuth() { document.getElementById('authModal').classList.remove('open'); }

// =================== MY ACTIVITIES ===================
function renderMine() {
  const el = document.getElementById('mine-content');
  if (!currentUser) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-calendar-off"></i><p>請先登入以查看<br>已報名的活動</p><button class="lp-btn primary" onclick="document.getElementById('authModal').classList.add('open')" style="margin-top:6px">前往登入</button></div>`;
    return;
  }
  if (!myActivities.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-mood-empty"></i><p>還沒有報名任何活動</p><button class="lp-btn outline" onclick="switchTab(0)" style="margin-top:4px">去探索活動</button></div>`;
    return;
  }
  el.innerHTML = `<div class="my-act-list">` + myActivities.map(m => `
    <div class="my-act-card">
      <div class="my-act-icon" style="background:${HEROCOLOR[m.color]}">${m.emoji}</div>
      <div class="my-act-info">
        <h4>${m.title}</h4>
        <p>${m.date} · ${m.meal==='meat'?'🍖 葷食':'🌿 素食'}</p>
      </div>
      <div class="my-act-right">
        <span class="my-badge confirmed">已確認</span>
        <button class="cancel-small-btn" onclick="cancelFromMine(${m.id})">取消報名</button>
      </div>
    </div>`).join('') + `</div>`;
}

// =================== PROFILE (USER) ===================
const FIELDS = [
  {key:'id',   label:'學號',    icon:'ti-id-badge'},
  {key:'name', label:'姓名',    icon:'ti-user'},
  {key:'phone',label:'電話號碼',icon:'ti-phone'},
  {key:'email',label:'電子郵件',icon:'ti-mail'},
  {key:'dept', label:'系所',    icon:'ti-school'},
];

function renderProfile() {
  const el = document.getElementById('profile-content');
  if (!currentUser) {
    el.innerHTML = `<div class="login-prompt"><i class="ti ti-user-circle"></i><h3>尚未登入</h3><p>登入後可查看與管理<br>您的個人資料</p><button class="lp-btn primary" onclick="document.getElementById('authModal').classList.add('open')">登入</button><button class="lp-btn outline" onclick="switchAuthTab('reg');document.getElementById('authModal').classList.add('open')">註冊新帳號</button></div>`;
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
      <button class="save-btn" id="profileEditBtn" onclick="toggleProfileEdit()">${profileEditing?'儲存變更':'編輯資料'}</button>
    </div>
    <div style="padding:0 32px 16px"><button class="logout-btn" onclick="logout()">登出</button></div>`;
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
    document.getElementById('profileEditBtn').textContent = '編輯資料';
    
    // Save to database
    try {
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
        });
        const result = await res.json();
        if (!res.ok) alert('儲存失敗：' + (result.error || '未知錯誤'));
    } catch(e) {
        console.error("更新失敗", e);
        alert('網路錯誤，儲存失敗');
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
    document.getElementById('profileEditBtn').textContent = '儲存變更';
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
const BANNER_LABELS = ['🔥 熱門', '🎨 新上架', '🎵 限量'];
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
      <div class="label">${BANNER_LABELS[i] || '📅 活動'}</div>
      <div class="people">${a.quota} / ${a.max} 人</div>
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

  // Inject badge and logout in sidebar bottom (desktop only)
  const nav = document.getElementById('adminNav');
  // Remove any existing badge/bottom injected
  const existing = nav.querySelector('.admin-badge-nav');
  if (existing) existing.remove();
  const existingBottom = nav.querySelector('.nav-bottom');
  if (existingBottom) existingBottom.remove();

  const badge = document.createElement('div');
  badge.className = 'admin-badge-nav';
  badge.innerHTML = `<i class="ti ti-shield-check"></i> 管理員模式`;
  nav.insertBefore(badge, nav.children[1]);

  const bottom = document.createElement('div');
  bottom.className = 'nav-bottom';
  bottom.innerHTML = `<button class="nav-bottom-btn" onclick="adminLogout()"><i class="ti ti-logout"></i> 登出管理員</button>`;
  nav.appendChild(bottom);

  // update header badge
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
  renderAdminStats();
  renderAdminActivityList();
}

function renderAdminStats() {
  const totalActs = ACTS.length;
  const totalReg  = ACTS.reduce((s, a) => s + a.quota, 0);
  const totalMeat = Object.values(REGISTRATIONS).flat().filter(r => r.meal === 'meat').length;
  const totalVeg  = Object.values(REGISTRATIONS).flat().filter(r => r.meal === 'veg').length;

  document.getElementById('admin-stats-row').innerHTML = `
    <div class="admin-stat-card">
      <div class="admin-stat-num">${totalActs}</div>
      <div class="admin-stat-label">活動總數</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-num">${totalReg}</div>
      <div class="admin-stat-label">總報名人數</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-num">${totalMeat}</div>
      <div class="admin-stat-label">葷食訂餐</div>
      <div class="admin-stat-sub">🍖 葷食</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-num">${totalVeg}</div>
      <div class="admin-stat-label">素食訂餐</div>
      <div class="admin-stat-sub">🌿 素食</div>
    </div>`;
}

function renderAdminActivityList() {
  const list = document.getElementById('admin-activity-list');
  if (!list) return;
  list.innerHTML = ACTS.map(a => {
    const regs   = REGISTRATIONS[a.id] || [];
    const meat   = regs.filter(r => r.meal === 'meat').length;
    const veg    = regs.filter(r => r.meal === 'veg').length;
    const pct    = Math.round(a.quota / a.max * 100);
    return `
    <div class="admin-act-card">
      <div class="admin-act-header">
        <div class="act-thumb ${a.color}" style="width:48px;height:48px;font-size:22px">${a.emoji}</div>
        <div class="admin-act-info">
          <h3>${a.title}</h3>
          <p>${a.date} · ${a.loc}</p>
        </div>
        <div class="admin-act-actions">
          <button class="admin-btn view" onclick="openRegDetail(${a.id})">
            <i class="ti ti-users"></i>報名
          </button>
          <button class="admin-btn edit" onclick="openEditActivity(${a.id})">
            <i class="ti ti-edit"></i>編輯
          </button>
          <button class="admin-btn del" onclick="openDeleteModal(${a.id})">
            <i class="ti ti-trash"></i>刪除
          </button>
        </div>
      </div>
      <div class="admin-act-footer">
        <div class="admin-progress-wrap">
          <div class="admin-quota-label">${a.quota} / ${a.max} 人已報名（${pct}%）</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="admin-meal-pills">
          <span class="meal-pill meat">🍖 ${meat}</span>
          <span class="meal-pill veg">🌿 ${veg}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// =================== ADMIN: REGISTRATION DETAIL ===================
function openRegDetail(actId) {
  const a    = ACTS.find(x => x.id === actId);
  const regs = REGISTRATIONS[actId] || [];
  const meat = regs.filter(r => r.meal === 'meat').length;
  const veg  = regs.filter(r => r.meal === 'veg').length;

  document.getElementById('adminRegDetailTitle').textContent = a.title;
  document.getElementById('adminRegDetailSub').textContent   = `共 ${regs.length} 人報名・葷食 ${meat} 人・素食 ${veg} 人`;

  let tableHtml = '';
  if (regs.length === 0) {
    tableHtml = `<div class="empty-state" style="padding:24px 0"><i class="ti ti-users" style="font-size:32px;opacity:.3"></i><p>目前尚無人報名</p></div>`;
  } else {
    tableHtml = `
    <div style="margin-bottom:12px;display:flex;gap:8px">
      <span class="meal-pill meat" style="font-size:13px;padding:4px 12px">🍖 葷食 ${meat} 人</span>
      <span class="meal-pill veg"  style="font-size:13px;padding:4px 12px">🌿 素食 ${veg} 人</span>
    </div>
    <div style="overflow-x:auto">
    <table class="reg-table">
      <thead>
        <tr>
          <th>#</th>
          <th>學號/帳號</th>
          <th>姓名</th>
          <th>系所</th>
          <th>餐點</th>
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
            <span class="meal-pill ${r.meal}">${r.meal==='meat'?'🍖 葷食':'🌿 素食'}</span>
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
          <div class="reg-overview-count">${a.quota}<span>/ ${a.max} 人</span></div>
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
  document.getElementById('actFormTitle').textContent    = '新增活動';
  document.getElementById('actFormSubtitle').textContent = '填寫活動資訊';
  document.getElementById('af_title').value  = '';
  document.getElementById('af_date').value   = '';
  document.getElementById('af_loc').value    = '';
  document.getElementById('af_quota').value  = '0';
  document.getElementById('af_max').value    = '100';
  document.getElementById('af_emoji').value  = '🏀';
  document.getElementById('af_color').value  = 'green';
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
        return alert('請填寫所有必填欄位，並確保人數為數字！');
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
        color: "blue"         // 預設卡片顏色
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
        if (!res.ok) throw new Error(data.error || '儲存失敗');

        alert(data.message || '操作成功！');
        
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
  document.getElementById('actFormTitle').textContent    = '編輯活動';
  document.getElementById('actFormSubtitle').textContent = `正在編輯：${a.title}`;
  document.getElementById('af_title').value  = a.title;
  document.getElementById('af_date').value   = a.date;
  document.getElementById('af_loc').value    = a.loc;
  document.getElementById('af_quota').value  = a.quota;
  document.getElementById('af_max').value    = a.max;
  document.getElementById('af_emoji').value  = a.emoji;
  document.getElementById('af_color').value  = a.color;
  document.getElementById('af_tags').value   = a.tags.join(',');
  document.getElementById('af_desc').value   = a.desc;
  document.getElementById('activityFormModal').classList.add('open');
}

// 修改「新增／編輯活動」的表單送出
async function submitActivityForm() {
  const title = document.getElementById('af_title').value.trim();
  const date   = document.getElementById('af_date').value.trim();
  const loc    = document.getElementById('af_loc').value.trim();
  const quota = parseInt(document.getElementById('af_quota').value) || 0;
  const max   = parseInt(document.getElementById('af_max').value)   || 100;
  const emoji = document.getElementById('af_emoji').value;
  const color = document.getElementById('af_color').value;
  const tagsRaw = document.getElementById('af_tags').value.trim();
  const desc  = document.getElementById('af_desc').value.trim();

  if (!title || !date || !loc) return alert('請填寫活動名稱、日期時間與地點');

  // 將時間拆分（因為後端 SQLite 分開存 event_day 與 event_time）
  
  // !!!假設前端 date 格式為 "2026-05-20 14:00" 或是分開的(html預設的日期時間選擇器)
  // 這裡安全起見，直接把整串字串送給後端的 date，time 留空或簡單切割
  const parts = date.split(' ');
  const event_day = parts[0] ? parts[0].replace(/\//g, '-') : date; // 轉換為 YYYY-MM-DD
  const event_time = parts[1] || "00:00";

  // 整理要傳送給後端的資料包（對應您 Flask 的變數名稱）
  const payload = {
    title: title,
    date: event_day,
    time: event_time,
    loc: loc,
    max: max,
    student_capacity: max, // 同步容量
    emoji: emoji,
    color: color,
    description: desc,
    category_id: 1 // 預設分類 ID，可根據需求調整
  };

  try {
    if (editingActId !== null) {
      // === 編輯現有活動 (PUT) ===
      const res = await fetch(`${API_BASE}/api/events/${editingActId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '修改失敗');

      document.getElementById('activityFormModal').classList.remove('open');
      showAdminSuccess('活動已更新', `「${title}」的資訊已成功同步至資料庫。`);
    } else {
      // === 新增全新活動 (POST) ===
      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '新增失敗');

      document.getElementById('activityFormModal').classList.remove('open');
      showAdminSuccess('活動已新增', `「${title}」已成功寫入資料庫活動列表。`);
    }

    // 重新載入資料庫最新資料並重新渲染 UI
    await loadEvents();
    renderAdminRegistrations();

  } catch (e) {
    console.error(e);
    alert('操作失敗：' + e.message);
  }
}


function closeActivityForm() {
  document.getElementById('activityFormModal').classList.remove('open');
}

// =================== ADMIN: DELETE ===================
function openDeleteModal(id) {
  deleteTargetId = id;
  const a = ACTS.find(x => x.id === id);
  document.getElementById('adminDeleteMsg').textContent = `確定要永久刪除「${a.title}」嗎？此操作無法復原，所有報名資料也將一併刪除。`;
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
    
    if (!res.ok) throw new Error(data.error || '刪除失敗');

    // 關閉刪除確認彈窗
    document.getElementById('adminDeleteModal').classList.remove('open');
    showAdminSuccess('活動已刪除', `「${a ? a.title : '該活動'}」已從資料庫永久刪除。`);
    
    // 重新從資料庫載入最新活動列表
    await loadEvents();
    
    // 同步更新後台的記憶體資料（讓便當人數與名單同步清空）
    await loadAllRegistrations(); 
    
    // === 💡 修正 2：同時刷新「總覽主頁」與「報名分頁」，確保兩邊卡片都同步消失 ===
    renderAdminDashboard();
    renderAdminRegistrations();

  } catch (e) {
    console.error(e);
    alert('刪除失敗：' + e.message);
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
  {key:'id',   label:'帳號',    icon:'ti-id-badge'},
  {key:'name', label:'姓名',    icon:'ti-user'},
  {key:'phone',label:'電話',    icon:'ti-phone'},
  {key:'email',label:'電子郵件',icon:'ti-mail'},
  {key:'dept', label:'單位',    icon:'ti-building'},
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
        管理員 · ${currentUser.dept}
      </div>
    </div>
    <div class="profile-fields" id="adminProfileFields"></div>
    <div class="edit-bar">
      <button class="save-btn" id="adminProfileEditBtn" onclick="toggleAdminProfileEdit()">${adminProfileEditing?'儲存變更':'編輯資料'}</button>
    </div>
    <div style="padding:0 32px 16px">
      <button class="logout-btn" onclick="adminLogout()">登出管理員</button>
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
    document.getElementById('adminProfileEditBtn').textContent = '編輯資料';
    
    // Save to database
    try {
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
        });
        const result = await res.json();
        if (!res.ok) alert('儲存失敗：' + (result.error || '未知錯誤'));
    } catch(e) {
        console.error("更新失敗", e);
        alert('網路錯誤，儲存失敗');
    }

    renderAdminFields();
    const nm = document.querySelector('#admin-screen-profile .profile-name');
    const dp = document.querySelector('#admin-screen-profile .profile-dept');
    const av = document.querySelector('#admin-screen-profile .avatar');
    if (nm) nm.textContent = currentUser.name;
    if (av) av.textContent = currentUser.name.slice(-2);
  } else {
    adminProfileEditing = true;
    document.getElementById('adminProfileEditBtn').textContent = '儲存變更';
    renderAdminFields();
  }
}

// =================== DATA FETCH ===================
async function loadEvents() {
  try {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error('API response not ok');
    const data = await res.json();
    
    // Convert API data to matching ACTS structure
    ACTS = data.map(d => ({
      id: Number(d.id),
      emoji: '📅', // default emoji since backend doesn't have it
      color: 'blue', // default color
      title: d.title,
      date: `${d.date} ${d.time}`,
      loc: d.loc,
      tags: d.tags ? [d.tags] : [],
      quota: d.quota || 0,
      max: d.student_capacity + d.max,
      desc: d.description || '' // backend currently has no desc
    }));
  
    window.allEvents = [...ACTS];
    renderCards();
    renderBanner();

    if (currentRole === 'admin') {
      renderAdminDashboard();
    }
  } catch (error) {
    console.error('Failed to load events from DB:', error);
  }
}
// === 雙重監聽：無論是輸入文字還是切換下拉選單，都觸發 doFilter ===
document.getElementById('searchKeyword').addEventListener('input', doFilter);

if (document.getElementById('filterTag')) {
    document.getElementById('filterTag').addEventListener('change', doFilter);
}

// === 核心複合篩選 Function ===
function doFilter() {
    // 1. 取得並處理關鍵字
    const keyword = document.getElementById('searchKeyword').value.toLowerCase().trim();
    
    // 2. 取得並處理下拉選單分類
    const filterTagEl = document.getElementById('filterTag');
    const selectedTag = filterTagEl ? filterTagEl.value : 'all';

    // 3. 如果兩個欄位都是空的/預設狀態，直接還原全部活動
    if (!keyword && selectedTag === 'all') {
        ACTS = [...window.allEvents];
    } else {
        // 4. 開始複合過濾
        ACTS = window.allEvents.filter(act => {
            // 條件 A：關鍵字比對 (名稱、地點、描述、標籤)
            const matchText = !keyword || (
                (act.title && act.title.toLowerCase().includes(keyword)) || 
                (act.loc && act.loc.toLowerCase().includes(keyword)) ||
                (act.desc && act.desc.toLowerCase().includes(keyword)) ||
                (act.tags && act.tags.toLowerCase().includes(keyword))
            );
            
            // 條件 B：下拉選單標籤比對
            const matchTag = selectedTag === 'all' || (act.tags && act.tags.includes(selectedTag));

            // 同時滿足才留下來
            return matchText && matchTag;
        });
    }

    // 5. 關鍵：重新呼叫你原本渲染卡片的 function，讓畫面更新
    renderCards();
}
// =================== INIT ===================
loadEvents();
showUserInterface(); // default to user interface

// 頁面載入後自動開啟登入彈窗
// === 調整後的事件綁定：確保網頁加載完後執行 ===
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchKeyword');
    const filterSelect = document.getElementById('filterTag');

    // 💡 1. 點擊「搜尋按鈕」時才觸發搜尋
    if (searchBtn) {
        searchBtn.addEventListener('click', doFilter);
    }

    // 💡 2. 在輸入框按下「Enter 鍵」時也觸發搜尋
    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // 防止表單預設重整行為
                doFilter();
            }
        });
    }

    // 💡 3. 下拉選單保持不變（切換分類時直接連動）
    if (filterSelect) {
        filterSelect.addEventListener('change', doFilter);
    }
});

// === 核心複合篩選 Function (維持精準欄位對齊) ===
function doFilter() {
    if (!window.allEvents) return;

    const keyword = document.getElementById('searchKeyword').value.toLowerCase().trim();
    const selectedTag = document.getElementById('filterTag').value;

    // 開始過濾
    ACTS = window.allEvents.filter(act => {
        // 關鍵字比對
        const matchText = !keyword || (
            (act.title && act.title.toLowerCase().includes(keyword)) || 
            (act.loc && act.loc.toLowerCase().includes(keyword)) ||
            (act.desc && act.desc.toLowerCase().includes(keyword))
        );
        
        // 標籤比對
        const matchTag = selectedTag === 'all' || act.tags === selectedTag;

        return matchText && matchTag;
    });

    // 重新繪製畫面卡片
    renderCards(); 
}