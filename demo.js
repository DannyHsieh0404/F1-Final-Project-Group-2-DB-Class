const ACTS = [
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
const TAGCOLOR = { '體育':'green','競賽':'green',
                  '藝術':'purple','手作':'orange',
                  '音樂':'purple',
                  '環保':'blue','生活':'blue' };//定義tag顏色
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

  // 取得該活動資料
  const a = ACTS[id];

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
function handleRegister() {
  const already = myActivities.find(m=>m.id===currentDetailId);
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

function submitReg() {// 完成報名
  const a = ACTS[currentDetailId];
  myActivities.push({ id:a.id, title:a.title, emoji:a.emoji, color:a.color, date:a.date, meal:selectedMeal });// 加入我的活動
  a.quota = Math.min(a.quota+1, a.max); // 更新名額
  document.getElementById('mealModal').classList.remove('open');// 關閉餐點視窗
  document.getElementById('successMsg').textContent = `您已成功報名「${a.title}」，餐點選擇：${selectedMeal==='meat'?'葷食':'素食'}。`;  // 顯示報名成功訊息
  document.getElementById('successModal').classList.add('open');
  renderCards(); // 更新首頁卡片
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