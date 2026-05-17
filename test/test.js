// =================== DATA ===================
let ACTS = [
  { id:0, emoji:'🏀', color:'green', title:'2025 校際籃球錦標賽', date:'2025/03/15 09:00', loc:'體育館A館', tags:['體育','競賽'], quota:128, max:200, desc:'一年一度的校際籃球盛典！今年將有來自全台20所大學的隊伍參與角逐...' },
  { id:1, emoji:'🎨', color:'orange', title:'陶藝創作工作坊', date:'2025/03/22 13:00', loc:'藝術中心301', tags:['藝術','手作'], quota:45, max:80, desc:'由知名陶藝家王老師親自指導，帶領參與者學習陶藝技巧...' },
  { id:2, emoji:'🎵', color:'purple', title:'爵士之夜音樂節', date:'2025/03/28 19:00', loc:'大禮堂', tags:['音樂','藝術'], quota:67, max:70, desc:'音樂系年度爵士音樂演出，12組樂團輪番上陣...' },
  { id:3, emoji:'🌿', color:'blue', title:'永續生活工作坊', date:'2025/04/05 14:00', loc:'學生活動中心', tags:['環保','生活'], quota:30, max:60, desc:'學習低碳生活與環保手作技巧，實作蜂蠟布與堆肥...' },
  { id:4, emoji:'💻', color:'blue', title:'Python 入門黑客松', date:'2025/04/12 09:00', loc:'資訊大樓502', tags:['資訊','競賽'], quota:52, max:120, desc:'24小時程式設計挑戰賽，從零開始打造小型應用程式，適合新手與進階同學參加。' },
  { id:5, emoji:'📸', color:'purple', title:'校園攝影展徵件', date:'2025/04/18 10:00', loc:'藝文走廊', tags:['藝術','展覽'], quota:20, max:50, desc:'徵集校園攝影作品，主題為「日常與光影」，優秀作品將於校園展出。' },
  { id:6, emoji:'🧠', color:'orange', title:'心理學講座：壓力管理', date:'2025/04/20 14:00', loc:'綜合大樓B1演講廳', tags:['講座','生活'], quota:90, max:150, desc:'邀請心理師分享壓力調適技巧，提升學生心理健康與情緒管理能力。' },
  { id:7, emoji:'🌏', color:'green', title:'國際文化交流日', date:'2025/04/25 11:00', loc:'學生活動中心', tags:['文化','交流'], quota:110, max:200, desc:'多國學生攤位交流活動，體驗各國文化、美食與傳統服飾。' },
  { id:8, emoji:'🏃', color:'green', title:'校園路跑挑戰賽', date:'2025/05/02 07:00', loc:'操場', tags:['體育','健康'], quota:300, max:500, desc:'5公里校園路跑活動，完成即可獲得紀念獎牌與運動補給包。' },
  { id:9, emoji:'🎮', color:'purple', title:'電競聯賽春季賽', date:'2025/05/10 18:00', loc:'電競館', tags:['競賽','娛樂'], quota:64, max:128, desc:'校內英雄聯盟與VALORANT電競比賽，爭奪校園冠軍榮耀。' },
  { id:10, emoji:'🍳', color:'orange', title:'學生廚藝挑戰營', date:'2025/05/18 12:00', loc:'生活實驗室', tags:['生活','手作'], quota:25, max:40, desc:'學習基礎料理技巧，進行團隊料理比賽，最後由評審選出最佳料理組。' }
];

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

function showAdminInterface() {
  document.getElementById('userApp').style.display = 'none';
  document.getElementById('adminApp').style.display = 'contents';
  renderAdminNav();
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
  if (i === 1) renderAdminRegistrations();
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
  document.getElementById('dHero').style.background = HEROCOLOR[a.color];
  document.getElementById('dTags').innerHTML = a.tags.map(t => `<span class="tag ${TAGCOLOR[t]||'green'}">${t}</span>`).join('');
  document.getElementById('dDate').textContent = a.date;
  document.getElementById('dLocation').textContent = a.loc;
  document.getElementById('dDesc').textContent = a.desc;
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

function submitReg() {
  const a = ACTS.find(x => x.id === currentDetailId);
  myActivities.push({ id:a.id, title:a.title, emoji:a.emoji, color:a.color, date:a.date, meal:selectedMeal });
  a.quota = Math.min(a.quota + 1, a.max);

  // Push into global registration records
  if (!REGISTRATIONS[a.id]) REGISTRATIONS[a.id] = [];
  REGISTRATIONS[a.id].push({ uid: currentUser.id, name: currentUser.name, dept: currentUser.dept, meal: selectedMeal });

  document.getElementById('mealModal').classList.remove('open');
  document.getElementById('successMsg').textContent = `您已成功報名「${a.title}」，餐點選擇：${selectedMeal==='meat'?'葷食':'素食'}。`;
  document.getElementById('successModal').classList.add('open');
  renderCards();
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

function confirmCancel() {
  if (cancelTargetId === null) return;
  const a = ACTS.find(x => x.id === cancelTargetId);
  myActivities = myActivities.filter(m => m.id !== cancelTargetId);
  a.quota = Math.max(0, a.quota - 1);

  // Remove from registration records
  if (REGISTRATIONS[a.id] && currentUser) {
    REGISTRATIONS[a.id] = REGISTRATIONS[a.id].filter(r => r.uid !== currentUser.id);
  }

  document.getElementById('cancelModal').classList.remove('open');
  document.getElementById('cancelSuccessMsg').textContent = `已取消「${a.title}」的報名，名額已釋出。`;
  document.getElementById('cancelSuccessModal').classList.add('open');
  renderCards();
  if (currentDetailId === cancelTargetId) {
    const btn = document.getElementById('regBtn');
    btn.textContent = '立即報名'; btn.className = 'register-btn'; btn.disabled = false;
    document.getElementById('dQuota').textContent = a.quota;
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

function doLogin() {
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value.trim();
  if (!id || !pw) return alert('請填寫帳號與密碼');

  currentRole = selectedAuthRole;

  if (currentRole === 'admin') {
    // Simple demo: any login with "admin" prefix is accepted
    currentUser = { id, name: id, phone: '(管理員)', email: id+'@nsysu.edu.tw', dept: '管理學院' };
    closeAuth();
    showAdminInterface();
  } else {
    currentUser = { id, name:'王小明', phone:'0912-345-678', email: id+'@student.edu.tw', dept:'資訊工程學系' };
    closeAuth();
    showUserInterface();
    renderProfile();
    if (pendingAfterAuth) { pendingAfterAuth = false; handleRegister(); }
  }
}

function doRegister() {
  const id    = document.getElementById('rId').value.trim();
  const name  = document.getElementById('rName').value.trim();
  const phone = document.getElementById('rPhone').value.trim();
  const email = document.getElementById('rEmail').value.trim();
  const dept  = document.getElementById('rDept').value.trim();
  if (!id || !name || !phone || !email || !dept) return alert('請填寫所有欄位');

  currentRole = selectedAuthRole;

  if (currentRole === 'admin') {
    const code = document.getElementById('rAdminCode').value.trim();
    if (code !== 'nsysu2025') return alert('管理員驗證碼錯誤（提示：nsysu2025）');
    currentUser = { id, name, phone, email, dept };
    closeAuth();
    showAdminInterface();
  } else {
    currentUser = { id, name, phone, email, dept };
    closeAuth();
    showUserInterface();
    renderProfile();
    if (pendingAfterAuth) { pendingAfterAuth = false; handleRegister(); }
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

function toggleProfileEdit() {
  if (profileEditing) {
    FIELDS.forEach(f => { const inp = document.getElementById('fi_'+f.key); if (inp) currentUser[f.key] = inp.value; });
    profileEditing = false;
    document.getElementById('profileEditBtn').textContent = '編輯資料';
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
  showUserInterface();
  renderProfile();
  switchTab(0);
}

// =================== BANNER ===================
document.getElementById('bannerScroll').addEventListener('scroll', () => {
  const el = document.getElementById('bannerScroll');
  const idx = Math.round(el.scrollLeft / (el.firstElementChild?.offsetWidth + 12 || 252));
  ['d0','d1','d2'].forEach((d, i) => { document.getElementById(d).className = i === idx ? 'on' : ''; });
});

let bannerIndex = 0;
let bannerTimer = null;

function getBannerWidth() {
  const el = document.getElementById('bannerScroll');
  return el && el.firstElementChild ? el.firstElementChild.offsetWidth + 12 : 0;
}

function updateDots(index) {
  ['d0','d1','d2'].forEach((id, i) => document.getElementById(id).classList.toggle('on', i === index));
}

function moveBanner(index) {
  const el = document.getElementById('bannerScroll');
  el.scrollTo({ left: index * getBannerWidth(), behavior: 'smooth' });
  updateDots(index);
}

function nextBanner() {
  const el = document.getElementById('bannerScroll');
  bannerIndex = (bannerIndex + 1) % el.children.length;
  moveBanner(bannerIndex);
}

function startBannerAuto() { bannerTimer = setInterval(nextBanner, 3000); }

startBannerAuto();
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

function submitActivityForm() {
  const title = document.getElementById('af_title').value.trim();
  const date  = document.getElementById('af_date').value.trim();
  const loc   = document.getElementById('af_loc').value.trim();
  const quota = parseInt(document.getElementById('af_quota').value) || 0;
  const max   = parseInt(document.getElementById('af_max').value)   || 100;
  const emoji = document.getElementById('af_emoji').value;
  const color = document.getElementById('af_color').value;
  const tagsRaw = document.getElementById('af_tags').value.trim();
  const desc  = document.getElementById('af_desc').value.trim();

  if (!title || !date || !loc) return alert('請填寫活動名稱、日期時間與地點');

  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : ['活動'];

  if (editingActId !== null) {
    // Edit existing
    const idx = ACTS.findIndex(x => x.id === editingActId);
    if (idx !== -1) {
      ACTS[idx] = { ...ACTS[idx], title, date, loc, quota, max, emoji, color, tags, desc };
    }
    document.getElementById('activityFormModal').classList.remove('open');
    showAdminSuccess('活動已更新', `「${title}」的資訊已成功更新。`);
  } else {
    // Add new
    const newAct = { id: nextActId++, emoji, color, title, date, loc, tags, quota, max, desc };
    ACTS.push(newAct);
    document.getElementById('activityFormModal').classList.remove('open');
    showAdminSuccess('活動已新增', `「${title}」已成功新增至活動列表。`);
  }

  renderAdminDashboard();
  renderAdminRegistrations();
  renderCards(); // update user view too
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

function confirmDeleteActivity() {
  if (deleteTargetId === null) return;
  const a = ACTS.find(x => x.id === deleteTargetId);
  ACTS = ACTS.filter(x => x.id !== deleteTargetId);
  delete REGISTRATIONS[deleteTargetId];
  // Also remove from user's myActivities if present
  myActivities = myActivities.filter(m => m.id !== deleteTargetId);
  document.getElementById('adminDeleteModal').classList.remove('open');
  showAdminSuccess('活動已刪除', `「${a.title}」已永久刪除。`);
  deleteTargetId = null;
  renderAdminDashboard();
  renderAdminRegistrations();
  renderCards();
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

function toggleAdminProfileEdit() {
  if (adminProfileEditing) {
    ADMIN_FIELDS.forEach(f => { const inp = document.getElementById('afi_'+f.key); if (inp) currentUser[f.key] = inp.value; });
    adminProfileEditing = false;
    document.getElementById('adminProfileEditBtn').textContent = '編輯資料';
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

// =================== INIT ===================
renderCards();
showUserInterface(); // default to user interface

// 頁面載入後自動開啟登入彈窗
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('authModal').classList.add('open');
});
