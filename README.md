# 🏫 NSYSU Event Hub - 校園活動報名平台

這是一個為校園設計的綜合活動報名與管理系統，為資料庫課程的期末專案 (Group 2)。
提供學生直覺的活動探索與報名體驗，同時也提供主辦方（管理員）方便的活動管理後台。

## ✨ 系統功能 (Features)

### 🎓 學生端 (Student)
* **探索活動**：透過關鍵字搜尋或類別篩選，快速找到有興趣的校園活動。
* **活動報名**：一鍵報名活動，並支援勾選餐飲需求（葷/素食）。
* **我的活動**：專屬儀表板查看已報名的活動狀態。
* **取消報名**：在活動開始前可隨時取消報名，釋出名額。
* **個人資料管理**：可更新個人聯絡資訊與系所資料。

### 🛡️ 管理員端 (Organizer/Admin)
* **總覽儀表板**：檢視所有已建立的活動狀態與報名人數概況。
* **活動管理 (CRUD)**：
  * **新增活動**：設定活動名稱、時間、地點、人數上限、分類與圖示等。
  * **編輯活動**：隨時更新活動資訊。
  * **刪除活動**：自動連帶刪除該活動的報名紀錄與餐飲需求（Cascade Delete）。
* **報名者名單**：檢視特定活動的所有報名學生清單及餐飲需求，方便事前籌備。

---

## 🛠️ 技術架構 (Tech Stack)

* **前端 (Frontend)**: HTML5, CSS3, Vanilla JavaScript, Tabler Icons.
* **後端 (Backend)**: Python, Flask, Flask-CORS, Werkzeug (密碼加密).
* **資料庫 (Database)**: SQLite3.

---

## 📂 專案架構 (Project Structure)

```text
F1-Final-Project-Group-2-DB-Class/
├── backend/
│   ├── app.py           # Flask 主程式 (API 路由與伺服器入口)
│   ├── db_config.py     # 資料庫連線設定
│   ├── init_db.py       # 資料庫初始化腳本 (執行 schema & seed)
│   └── college_events.db# SQLite 資料庫檔案
├── db/
│   ├── schema.sql       # 資料庫結構定義 (Tables: User, Event, Registration...)
│   └── seed.sql         # 初始預設/測試資料
├── test/                # 前端靜態檔案
│   ├── test.html        # 前端主頁面 (SPA)
│   ├── test.css         # 樣式表
│   └── test.js          # 前端互動邏輯
└── README.md            # 專案說明文件
```

---

## 🚀 專案啟動說明 (Getting Started)

### 1. 啟動虛擬環境
請在終端機 (Terminal) 開啟專案根目錄，並啟動虛擬環境：
* **使用 CMD (Windows):**
  ```cmd
  .venv\Scriptsctivate
  ```
* **使用 PowerShell (Windows):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
*(若無虛擬環境，請先執行 `python -m venv .venv` 建立)*

### 2. 安裝必要套件
初次執行時，請先安裝後端所需套件：
```bash
pip install flask flask-cors werkzeug
```

### 3. 初始化或連線資料庫
* 若需重置資料庫或初次建立，可執行：
  ```bash
  python backend/init_db.py
  ```
* **檢視資料庫 (DBeaver)**：打開 DBeaver，建立 SQLite 連線，路徑選擇 `backend/college_events.db` 即可檢視。

### 4. 執行應用程式
啟動後端伺服器 (已設定為一併渲染前端網頁)：
```bash
python backend/app.py
```
> ⚠️ **注意**：請不要直接雙擊點開 `test/test.html`！這會導致 CORS 及 API 呼叫失敗。必須透過啟動伺服器才能正確串接資料庫與 API。

### 5. 開啟網站
伺服器成功啟動後，在瀏覽器輸入以下網址即可檢視與操作：
👉 **http://127.0.0.1:5000**

---

## 🔑 預設測試帳號

提供以下測試帳號供開發與功能測試使用：

**管理員 (Organizer)**
* 帳號：`ADMIN01`
* 密碼：`admin123`

**一般學生 (Student)**
*(您也可以直接在首頁點擊 "Sign Up" 建立一組新的學生帳號作測試)*
* 帳號：`B124020000`
* 密碼：`amy181`
