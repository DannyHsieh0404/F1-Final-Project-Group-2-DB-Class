let ACTS = []; // 改為空陣列，等一下從後端抓取
const API_BASE = 'http://127.0.0.1:5000/api';

// 隨機產生視覺元素的輔助函式（因為資料庫沒存圖示與顏色）
const EMOJIS = ['🏀', '🎨', '🎵', '🌿', '💻', '📸', '🧠', '🌏', '🏃', '🎮', '🍳'];
const COLORS = ['green', 'orange', 'purple', 'blue'];

// 初始化時從後端抓資料
async function fetchEvents() {
  try {
    const res = await fetch(`${API_BASE}/events`);
    const data = await res.json();
    
    // 將後端資料轉換成前端卡片能用的格式
    ACTS = data.map((d, index) => ({
      ...d,
      emoji: EMOJIS[index % EMOJIS.length], 
      color: COLORS[index % COLORS.length],
      tags: d.tags ? [d.tags] : ['綜合'],
      max: d.student_capacity || d.max, // 以學生名額為主
      desc: '詳細活動內容請依主辦單位公告為主。'
    }));
    
    renderCards();
  } catch (err) {
    console.error('Fetch events error:', err);
    document.querySelector('.activity-list').innerHTML = '<p style="padding:20px; color:red;">無法連線到伺服器，請確認後端已啟動。</p>';
  }
}

// 畫面載入時呼叫
document.addEventListener('DOMContentLoaded', fetchEvents);

const TAGCOLOR = { '體育':'green','競賽':'green',
                  'Seminar':'purple','Workshop':'orange',
                  'Social':'blue',
                  '藝術':'purple','手作':'orange',
                  '音樂':'purple',
                  '綜合':'blue','生活':'blue' };//定義tag顏色
const HEROCOLOR = {green:'var(--primary-pale)',orange:'var(--accent-pale)',purple:'#EDE7F6',blue:'#E3F2FD'};//顏色代號 轉成實際背景色//

let currentUser = null;                 //預設使用者沒有登入
let myActivities = [];                  //預設一開始沒有報名任何活動
let currentDetailId = null;             //目前正在看的「活動詳細頁 ID」
let selectedMeal = null;                //預設使用者還沒選餐點
let pendingAfterAuth = false;           //登入後是否要「繼續剛剛的動作」>例如：使用者沒登入 → 點「報名」
let cancelTargetId = null;              //要取消報名的活動 ID
let profileEditing = false;             //個人資料是否在編輯狀態

const FIELDS = [                        //定義「個人資料的欄位規格」
  {key:'id',label:'學號',icon:'ti-id-badge'},
  {key:'name',label:'姓名',icon:'ti-user'},
  {key:'phone',label:'電話號碼',icon:'ti-phone'},
  {key:'email',label:'電子郵件',icon:'ti-mail'},
  {key:'dept',label:'系所',icon:'ti-school'},
];

// --- Desktop layout check ---
function isDesktop() { return window.innerWidth >= 900; }//用來檢查是不是桌機(>900)

function applyLayout() {                                // 根據螢幕大小調整版面（桌機 / 手機）
  const logo = document.getElementById('navLogo');
  const nav = document.getElementById('mainNav');
  const app = document.getElementById('app');
  const screensWrap = document.querySelector('.screens-wrap');

  if (isDesktop()) {  
    // 桌機：顯示 logo + 側邊欄布局                               
    logo.style.display = 'block';
    // Reorder: sidebar right (grid order), screens left
    app.style.gridTemplateColumns = 'var(--sidebar-w) 1fr';
    nav.style.order = '-1'; // sidebar on left
  } else {
    // 手機：隱藏 logo
    logo.style.display = 'none';
  }
}

// 視窗改變時重新套用版面
window.addEventListener('resize', applyLayout);

// 初始化版面
applyLayout();

// --- TABS ---
// 所有頁面（screen）ID
const screens = ['screen-events','screen-mine','screen-profile'];

// 導覽列按鈕 ID
const navs = ['nav0','nav1','nav2'];

// 切換頁面
function switchTab(i) {
  screens.forEach((s, idx) =>
    document.getElementById(s).classList.toggle('active', idx === i)        // 顯示對應 screen，其它隱藏
  );

  navs.forEach((n, idx) =>
    document.getElementById(n).classList.toggle('active', idx === i)        // 切換 nav active 狀態
  );
  if (i === 1) renderMine();                                                // 切到「我的活動」時更新資料
  if (i === 2) renderProfile();                                             // 切到「個人資料」時更新資料
}

// --- RENDER CARDS ---
function renderCards() {                                                    // 產生活動卡片列表

  const list = document.querySelector('.activity-list');                    // 取得活動列表容器

  // 把 ACTS 轉成 HTML 字串
  list.innerHTML = ACTS.map(a => {

    // 檢查使用者是否已報名
    const reg = myActivities.find(m => m.id === a.id);

    // 報名進度百分比
    const pct = Math.round(a.quota / a.max * 100);

    return `
    <div class="act-card" onclick="openDetail(${a.id})">

      
      <div class="act-card-top">                                  

        <!-- 圖示 -->
        <div class="act-thumb ${a.color}">${a.emoji}</div>

        <!-- 活動資訊 -->
        <div class="act-info">

          <!-- 標題 -->
          <h3>${a.title}</h3>

          <!-- 日期 -->
          <div class="act-meta">
            <i class="ti ti-calendar"></i>
            <span class="act-date">${a.date}</span>
          </div>

          <!-- 標籤 -->
          <div class="act-tags">

            ${a.tags.map(t =>
              `<span class="tag ${TAGCOLOR[t] || 'green'}">${t}</span>`
            ).join('')}

            ${reg ? '<span class="tag green">✓ 已報名</span>' : ''}

          </div>
        </div>
      </div>

      <!-- 卡片下半部 -->
      <div class="act-bottom">

        <!-- 報名進度條 -->
        <div class="progress-wrap">
          <div class="progress-label">
            ${a.quota} / ${a.max} 人已報名
          </div>

          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
        </div>

        <!-- 剩餘名額 -->
        <span class="act-spots">
          ${a.max - a.quota} 名額
        </span>

      </div>
    </div>`;
  }).join('');
}
// --- DETAIL ---
// 開啟活動詳細頁
function openDetail(id) {

  // 取得該活動資料 (注意：由於變成從後端抓的陣列，必須用 find 找正確的 id)
  const a = ACTS.find(x => x.id === id);
  if(!a) return;

  // 記住目前看的活動
  currentDetailId = id;

  // ===== 填入詳細頁內容 =====

  // 標題
  document.getElementById('dTitle').textContent = a.title;

  // 圖示 + 背景色
  document.getElementById('dHero').textContent = a.emoji;
  document.getElementById('dHero').style.background = HEROCOLOR[a.color];

  // 標籤
  document.getElementById('dTags').innerHTML =
    a.tags.map(t =>
      `<span class="tag ${TAGCOLOR[t] || 'green'}">${t}</span>`
    ).join('');

  // 日期 / 地點 / 描述
  document.getElementById('dDate').textContent = a.date;
  document.getElementById('dLocation').textContent = a.loc;
  document.getElementById('dDesc').textContent = a.desc;

  // 人數資訊
  document.getElementById('dQuota').textContent = a.quota;
  document.getElementById('dMax').textContent = a.max;

  // ===== 報名按鈕狀態控制 =====

  const already = myActivities.find(m => m.id === id);
  const btn = document.getElementById('regBtn');

  // 已報名 → 顯示取消
  if (already) {
    btn.textContent = '✕ 取消報名';
    btn.className = 'register-btn cancel';
    btn.disabled = false;

  // 名額已滿 → 禁用
  } else if (a.quota >= a.max) {
    btn.textContent = '名額已滿';
    btn.className = 'register-btn';
    btn.disabled = true;

  // 可報名
  } else {
    btn.textContent = '立即報名';
    btn.className = 'register-btn';
    btn.disabled = false;
  }

  // 打開詳細頁彈窗
  document.getElementById('detailOverlay').classList.add('open');
}

// 點背景關閉詳細頁（避免點到內容區誤關）
function closeDetail(e) {
  if (e.target === document.getElementById('detailOverlay'))
    closeDetailForce();
}
// 強制關閉詳細頁
function closeDetailForce() {
  document.getElementById('detailOverlay').classList.remove('open');
}
// 報名 / 取消報名流程
async function handleRegister() {
  const already = myActivities.find(m => m.id === currentDetailId);
  if(already) {
    openCancelModal(currentDetailId);// 已報名 → 進入取消流程
    return;
  }
  if(!currentUser) {// 未登入 → 先登入
    pendingAfterAuth = true;
    document.getElementById('authModal').classList.add('open');
  } else { // 已登入 → 選餐點
    selectedMeal = null;

    // 重置餐點選擇 UI
    document.getElementById('meatBtn').classList.remove('selected');
    document.getElementById('vegBtn').classList.remove('selected');

    // 禁用確認按鈕
    document.getElementById('submitMealBtn').style.opacity='0.5';
    document.getElementById('submitMealBtn').style.pointerEvents='none';

    // 開啟餐點選擇視窗
    document.getElementById('mealModal').classList.add('open');
  }
}

function selectMeal(type) {// 選擇餐點
  selectedMeal = type;

  // 更新 UI 選取狀態
  document.getElementById('meatBtn').classList.toggle('selected', type==='meat');
  document.getElementById('vegBtn').classList.toggle('selected', type==='veg');

  // 啟用確認按鈕
  document.getElementById('submitMealBtn').style.opacity='1';
  document.getElementById('submitMealBtn').style.pointerEvents='auto';
}

async function submitReg() {// 完成報名
  const a = ACTS.find(x => x.id === currentDetailId);
  try {
    // 呼叫後端 API
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id_db || currentUser.id, // 用登入狀態記錄的 DB ID 或學號
        event_id: a.id,
        dietary_req: selectedMeal === 'meat' ? '葷食' : '素食'
      })
    });
    const data = await res.json();
    
    if (data.success) {
      document.getElementById('mealModal').classList.remove('open');
      document.getElementById('successMsg').textContent = `您已成功報名「${a.title}」，餐點選擇：${selectedMeal==='meat'?'葷食':'素食'}。`;
      document.getElementById('successModal').classList.add('open');
      
      // 更新本機資料
      await fetchMyActivities(); 
      await fetchEvents();
    } else {
      alert('報名失敗：' + (data.error || '未知錯誤'));
    }
  } catch(err) {
    alert('網路錯誤，請稍後再試。');
  }
}

function goToMine() {// 成功後跳轉我的活動
  document.getElementById('successModal').classList.remove('open');
  closeDetailForce();// 關閉詳細頁
  switchTab(1);// 切到「我的活動」
}

function closeMeal() { document.getElementById('mealModal').classList.remove('open'); }// 關閉餐點選擇視窗

// --- CANCEL LOGIC ---
function openCancelModal(id) {// 開啟取消報名視窗
  cancelTargetId = id;
  const a = ACTS.find(x => x.id === id);
  if(!a) return;
  document.getElementById('cancelMsg').textContent = `確定要取消「${a.title}」的報名嗎？取消後名額將釋出。`;
  document.getElementById('cancelModal').classList.add('open');
}

function closeCancelModal() {
  document.getElementById('cancelModal').classList.remove('open');
  cancelTargetId = null;
}

async function confirmCancel() {
  if(cancelTargetId === null) return;
  const a = ACTS.find(x => x.id === cancelTargetId);
  try {
    const res = await fetch(`${API_BASE}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: currentUser.id_db || currentUser.id,
        event_id: cancelTargetId 
      })
    });
    const data = await res.json();
    if(data.success) {
      document.getElementById('cancelModal').classList.remove('open');
      document.getElementById('cancelSuccessMsg').textContent = `已取消「${a.title}」的報名，名額已釋出。`;
      document.getElementById('cancelSuccessModal').classList.add('open');
      
      await fetchMyActivities();
      await fetchEvents();
      
      // 更新詳細窗（如果還開著）
      if(currentDetailId === cancelTargetId) {
        const btn = document.getElementById('regBtn');
        btn.textContent = '立即報名';
        btn.className = 'register-btn';
        btn.disabled = false;
        document.getElementById('dQuota').textContent = Math.max(0, parseInt(document.getElementById('dQuota').textContent) - 1);
      }
    } else {
      alert('取消失敗：' + data.error);
    }
  } catch(err) {
    alert('網路錯誤，請重試。');
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
  // 假登入，因為這個範例中使用者 ID=2 代表 Bob，為求測試方便直接帶入 id_db: 2
  currentUser = { id, id_db: 2, name:'Bob (Student)', phone:'0923-456-789', email:id+'@university.edu', dept:'Computer Science' };
  closeAuth();
  
  // 剛登入，去抓這名使用者的資料
  fetchMyActivities().then(() => {
    renderProfile();
    renderCards();
    if(pendingAfterAuth) { pendingAfterAuth=false; handleRegister(); }
  });
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

// 取得登入者的活動
async function fetchMyActivities() {
  if (!currentUser) return;
  try {
    const res = await fetch(`${API_BASE}/my-activities/${currentUser.id_db || currentUser.id}`);
    const data = await res.json();
    if (!data.error) {
       // 將後端資料轉換為前端需要的格式
       myActivities = data.map((d, idx) => ({
         ...d,
         emoji: EMOJIS[d.id % EMOJIS.length], 
         color: COLORS[d.id % COLORS.length],
         meal: d.dietary_req && d.dietary_req.includes('素') ? 'veg' : 'meat'
       }));
    }
  } catch(err) {
    console.error('Fetch my-activities error:', err);
  }
}

// --- MINE ---
async function renderMine() {
  if(currentUser) {
    await fetchMyActivities(); // 確保資料是最新的
  }
  
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
    // 儲存資料前：先收集輸入框的內容
    const updatedData = { ...currentUser };
    FIELDS.forEach(f=>{ 
      const inp=document.getElementById('fi_'+f.key); 
      if(inp) updatedData[f.key]=inp.value; 
    });

    // 呼叫後端 API 更新資料庫
    fetch(`${API_BASE}/user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_db: currentUser.id_db,
        name: updatedData.name,
        phone: updatedData.phone,
        email: updatedData.email,
        dept: updatedData.dept
      })
    })
    .then(res => res.json())
    .then(data => {
      if(data.success) {
        // 更新前端變數並切換回檢視模式
        currentUser = updatedData;
        profileEditing=false;
        document.getElementById('profileEditBtn').textContent='編輯資料';
        renderFields();
        const hero=document.querySelector('.profile-name');
        const dep=document.querySelector('.profile-dept');
        const av=document.querySelector('.avatar');
        if(hero) hero.textContent=currentUser.name;
        if(dep) dep.textContent=currentUser.dept;
        if(av) av.textContent=currentUser.name.slice(-2);
        alert("個人資料更新成功！");
      } else {
        alert("更新失敗：" + data.error);
      }
    })
    .catch(err => alert("網路錯誤，無法更新個人資料"));
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








let bannerIndex = 0;
let bannerTimer = null;

function getBannerWidth() {
  const el = document.getElementById('bannerScroll');
  if (!el || !el.firstElementChild) return 0;
  return el.firstElementChild.offsetWidth + 12;
}

function updateDots(index) {
  ['d0', 'd1', 'd2'].forEach((id, i) => {
    document.getElementById(id).classList.toggle('on', i === index);
  });
}

function moveBanner(index) {
  const el = document.getElementById('bannerScroll');
  const width = getBannerWidth();

  el.scrollTo({
    left: index * width,
    behavior: 'smooth'
  });

  updateDots(index);
}

function nextBanner() {
  const el = document.getElementById('bannerScroll');
  const total = el.children.length;

  bannerIndex = (bannerIndex + 1) % total;
  moveBanner(bannerIndex);
}

function startBannerAuto() {
  bannerTimer = setInterval(nextBanner, 3000);
}

startBannerAuto();

const banner = document.getElementById('bannerScroll');

banner.addEventListener('touchstart', () => clearInterval(bannerTimer));
banner.addEventListener('mouseenter', () => clearInterval(bannerTimer));

banner.addEventListener('touchend', startBannerAuto);
banner.addEventListener('mouseleave', startBannerAuto);


renderCards();