const ACTS = [
  { id:0, emoji:'🏀', color:'green', title:'2025 校際籃球錦標賽', date:'2025/03/15 09:00', loc:'體育館A館', tags:['體育','競賽'], quota:128, max:200, desc:'一年一度的校際籃球盛典！今年將有來自全台20所大學的隊伍參與角逐，精彩賽程分為初賽、準決賽及決賽三個階段，現場備有熱情啦啦隊表演及豐富獎品。歡迎所有愛好運動的同學踴躍參與！' },
  { id:1, emoji:'🎨', color:'orange', title:'陶藝創作工作坊', date:'2025/03/22 13:00', loc:'藝術中心301', tags:['藝術','手作'], quota:45, max:80, desc:'由知名陶藝家王老師親自指導，帶領參與者從零開始學習陶土塑形、拉坯技法與釉燒工序。每位學員可帶走自己親手製作的作品，名額有限，先報先得！' },
  { id:2, emoji:'🎵', color:'purple', title:'爵士之夜音樂節', date:'2025/03/28 19:00', loc:'大禮堂', tags:['音樂','藝術'], quota:67, max:70, desc:'本校音樂系年度大型演出，今年以爵士樂為主題，邀請校內外共12組樂團輪番上陣，現場設有調酒區與輕食區，打造沉浸式音樂體驗之夜。' },
  { id:3, emoji:'🌿', color:'blue', title:'永續生活工作坊', date:'2025/04/05 14:00', loc:'學生活動中心', tags:['環保','生活'], quota:30, max:60, desc:'與環保達人一起實踐低碳生活！課程涵蓋蜂蠟布製作、舊衣改造與有機廚餘堆肥，活動結束後每人可帶走專屬環保工具包。' },
];

const TAGCOLOR = { '體育':'green','競賽':'green','藝術':'purple','手作':'orange','音樂':'purple','環保':'blue','生活':'blue' };
const HEROCOLOR = {green:'var(--primary-pale)',orange:'var(--accent-pale)',purple:'#EDE7F6',blue:'#E3F2FD'};

let currentUser = null;
let myActivities = [];
let currentDetailId = null;
let selectedMeal = null;
let pendingAfterAuth = false;
let cancelTargetId = null;
let profileEditing = false;

const FIELDS = [
  {key:'id',label:'學號',icon:'ti-id-badge'},
  {key:'name',label:'姓名',icon:'ti-user'},
  {key:'phone',label:'電話號碼',icon:'ti-phone'},
  {key:'email',label:'電子郵件',icon:'ti-mail'},
  {key:'dept',label:'系所',icon:'ti-school'},
];

// --- Desktop layout check ---
function isDesktop() { return window.innerWidth >= 900; }

function applyLayout() {
  const logo = document.getElementById('navLogo');
  const nav = document.getElementById('mainNav');
  const app = document.getElementById('app');
  const screensWrap = document.querySelector('.screens-wrap');

  if (isDesktop()) {
    logo.style.display = 'block';
    // Reorder: sidebar right (grid order), screens left
    app.style.gridTemplateColumns = 'var(--sidebar-w) 1fr';
    nav.style.order = '-1'; // sidebar on left
  } else {
    logo.style.display = 'none';
  }
}

window.addEventListener('resize', applyLayout);
applyLayout();

// --- TABS ---
const screens = ['screen-events','screen-mine','screen-profile'];
const navs = ['nav0','nav1','nav2'];

function switchTab(i) {
  screens.forEach((s,idx) => document.getElementById(s).classList.toggle('active', idx===i));
  navs.forEach((n,idx) => document.getElementById(n).classList.toggle('active', idx===i));
  if(i===1) renderMine();
  if(i===2) renderProfile();
}

// --- RENDER CARDS ---
function renderCards() {
  const list = document.querySelector('.activity-list');
  list.innerHTML = ACTS.map(a => {
    const reg = myActivities.find(m=>m.id===a.id);
    const pct = Math.round(a.quota/a.max*100);
    return `
    <div class="act-card" onclick="openDetail(${a.id})">
      <div class="act-card-top">
        <div class="act-thumb ${a.color}">${a.emoji}</div>
        <div class="act-info">
          <h3>${a.title}</h3>
          <div class="act-meta"><i class="ti ti-calendar" style="font-size:12px;color:var(--text-muted)"></i><span class="act-date">${a.date}</span></div>
          <div class="act-tags">${a.tags.map(t=>`<span class="tag ${TAGCOLOR[t]||'green'}">${t}</span>`).join('')}${reg?'<span class="tag green">✓ 已報名</span>':''}</div>
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

// --- DETAIL ---
function openDetail(id) {
  const a = ACTS[id];
  currentDetailId = id;
  document.getElementById('dTitle').textContent = a.title;
  document.getElementById('dHero').textContent = a.emoji;
  document.getElementById('dHero').style.background = HEROCOLOR[a.color];
  document.getElementById('dTags').innerHTML = a.tags.map(t=>`<span class="tag ${TAGCOLOR[t]||'green'}">${t}</span>`).join('');
  document.getElementById('dDate').textContent = a.date;
  document.getElementById('dLocation').textContent = a.loc;
  document.getElementById('dDesc').textContent = a.desc;
  document.getElementById('dQuota').textContent = a.quota;
  document.getElementById('dMax').textContent = a.max;
  const already = myActivities.find(m=>m.id===id);
  const btn = document.getElementById('regBtn');
  if(already) {
    btn.textContent = '✕ 取消報名';
    btn.className = 'register-btn cancel';
    btn.disabled = false;
  } else if(a.quota >= a.max) {
    btn.textContent = '名額已滿';
    btn.className = 'register-btn';
    btn.disabled = true;
  } else {
    btn.textContent = '立即報名';
    btn.className = 'register-btn';
    btn.disabled = false;
  }
  document.getElementById('detailOverlay').classList.add('open');
}

function closeDetail(e) { if(e.target===document.getElementById('detailOverlay')) closeDetailForce(); }
function closeDetailForce() { document.getElementById('detailOverlay').classList.remove('open'); }

function handleRegister() {
  const already = myActivities.find(m=>m.id===currentDetailId);
  if(already) {
    openCancelModal(currentDetailId);
    return;
  }
  if(!currentUser) {
    pendingAfterAuth = true;
    document.getElementById('authModal').classList.add('open');
  } else {
    selectedMeal = null;
    document.getElementById('meatBtn').classList.remove('selected');
    document.getElementById('vegBtn').classList.remove('selected');
    document.getElementById('submitMealBtn').style.opacity='0.5';
    document.getElementById('submitMealBtn').style.pointerEvents='none';
    document.getElementById('mealModal').classList.add('open');
  }
}

function selectMeal(type) {
  selectedMeal = type;
  document.getElementById('meatBtn').classList.toggle('selected', type==='meat');
  document.getElementById('vegBtn').classList.toggle('selected', type==='veg');
  document.getElementById('submitMealBtn').style.opacity='1';
  document.getElementById('submitMealBtn').style.pointerEvents='auto';
}

function submitReg() {
  const a = ACTS[currentDetailId];
  myActivities.push({ id:a.id, title:a.title, emoji:a.emoji, color:a.color, date:a.date, meal:selectedMeal });
  a.quota = Math.min(a.quota+1, a.max);
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

// --- CANCEL LOGIC ---
function openCancelModal(id) {
  cancelTargetId = id;
  const a = ACTS[id];
  document.getElementById('cancelMsg').textContent = `確定要取消「${a.title}」的報名嗎？取消後名額將釋出。`;
  document.getElementById('cancelModal').classList.add('open');
}

function closeCancelModal() {
  document.getElementById('cancelModal').classList.remove('open');
  cancelTargetId = null;
}

function confirmCancel() {
  if(cancelTargetId === null) return;
  const a = ACTS[cancelTargetId];
  myActivities = myActivities.filter(m=>m.id !== cancelTargetId);
  a.quota = Math.max(0, a.quota - 1);
  document.getElementById('cancelModal').classList.remove('open');
  document.getElementById('cancelSuccessMsg').textContent = `已取消「${a.title}」的報名，名額已釋出。`;
  document.getElementById('cancelSuccessModal').classList.add('open');
  renderCards();
  // update detail btn if still open
  if(currentDetailId === cancelTargetId) {
    const btn = document.getElementById('regBtn');
    btn.textContent = '立即報名';
    btn.className = 'register-btn';
    btn.disabled = false;
    document.getElementById('dQuota').textContent = a.quota;
  }
  cancelTargetId = null;
}

function closeCancelSuccess() {
  document.getElementById('cancelSuccessModal').classList.remove('open');
  if(document.getElementById('screen-mine').classList.contains('active')) renderMine();
}

// Cancel from "我的活動" list
function cancelFromMine(id) {
  currentDetailId = id;
  openCancelModal(id);
}

// --- AUTH ---
function switchAuthTab(tab) {
  document.getElementById('loginForm').style.display = tab==='login'?'flex':'none';
  document.getElementById('regForm').style.display = tab==='reg'?'flex':'none';
  document.getElementById('tabLogin').classList.toggle('active', tab==='login');
  document.getElementById('tabReg').classList.toggle('active', tab==='reg');
}

function doLogin() {
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value.trim();
  if(!id||!pw) return alert('請填寫學號與密碼');
  currentUser = { id, name:'王小明', phone:'0912-345-678', email:id+'@student.edu.tw', dept:'資訊工程學系' };
  closeAuth();
  renderProfile();
  if(pendingAfterAuth) { pendingAfterAuth=false; handleRegister(); }
}

function doRegister() {
  const id = document.getElementById('rId').value.trim();
  const name = document.getElementById('rName').value.trim();
  const phone = document.getElementById('rPhone').value.trim();
  const email = document.getElementById('rEmail').value.trim();
  const dept = document.getElementById('rDept').value.trim();
  if(!id||!name||!phone||!email||!dept) return alert('請填寫所有欄位');
  currentUser = { id, name, phone, email, dept };
  closeAuth();
  renderProfile();
  if(pendingAfterAuth) { pendingAfterAuth=false; handleRegister(); }
}

function closeAuth() { document.getElementById('authModal').classList.remove('open'); }

// --- MINE ---
function renderMine() {
  const el = document.getElementById('mine-content');
  if(!currentUser) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-calendar-off"></i><p>請先登入以查看<br>已報名的活動</p><button class="lp-btn primary" onclick="document.getElementById('authModal').classList.add('open')" style="margin-top:6px">前往登入</button></div>`;
    return;
  }
  if(!myActivities.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-mood-empty"></i><p>還沒有報名任何活動</p><button class="lp-btn outline" onclick="switchTab(0)" style="margin-top:4px">去探索活動</button></div>`;
    return;
  }
  el.innerHTML = `<div class="my-act-list">` + myActivities.map(m=>`
    <div class="my-act-card">
      <div class="my-act-icon" style="background:${HEROCOLOR[m.color]}">${m.emoji}</div>
      <div class="my-act-info">
        <h4>${m.title}</h4>
        <p>${m.date} · ${m.meal==='meat'?'葷食':'素食'}</p>
      </div>
      <div class="my-act-right">
        <span class="my-badge confirmed">已確認</span>
        <button class="cancel-small-btn" onclick="cancelFromMine(${m.id})">取消報名</button>
      </div>
    </div>`).join('') + `</div>`;
}

// --- PROFILE ---
function renderProfile() {
  const el = document.getElementById('profile-content');
  if(!currentUser) {
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
    <div style="padding:0 18px 16px"><button class="logout-btn" onclick="logout()">登出</button></div>`;
  renderFields();
}

function renderFields() {
  const c = document.getElementById('profileFields');
  if(!c) return;
  c.innerHTML = FIELDS.map(f=>`
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
  if(profileEditing) {
    FIELDS.forEach(f=>{ const inp=document.getElementById('fi_'+f.key); if(inp) currentUser[f.key]=inp.value; });
    profileEditing=false;
    document.getElementById('profileEditBtn').textContent='編輯資料';
    renderFields();
    const hero=document.querySelector('.profile-name');
    const dep=document.querySelector('.profile-dept');
    const av=document.querySelector('.avatar');
    if(hero) hero.textContent=currentUser.name;
    if(dep) dep.textContent=currentUser.dept;
    if(av) av.textContent=currentUser.name.slice(-2);
  } else {
    profileEditing=true;
    document.getElementById('profileEditBtn').textContent='儲存變更';
    renderFields();
  }
}

function logout() {
  currentUser=null; profileEditing=false; renderProfile();
}

// Banner dots
document.getElementById('bannerScroll').addEventListener('scroll', ()=>{
  const el=document.getElementById('bannerScroll');
  const idx=Math.round(el.scrollLeft/(el.firstElementChild?.offsetWidth+12||252));
  ['d0','d1','d2'].forEach((d,i)=>{ document.getElementById(d).className=i===idx?'on':''; });
});

renderCards();