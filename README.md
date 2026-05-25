# 專案開發啟動說明

## 1. 啟動虛擬環境

請在終端機開啟專案根目錄，並啟動虛擬環境：
<<<<<<< HEAD
- 若使用 CMD：
  ```cmd
  .venv\Scripts\activate
  ```
- 若使用 PowerShell：
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```

## 2. 安裝必要套件

初次執行時，請先安裝系統所需的後端套件：
```bash
pip install flask flask-cors
```

## 3. 連接資料庫 (DBeaver)

1. 打開 DBeaver
2. 建立新連線，選擇 **SQLite**
3. Path (路徑) 貼上專案內的 `backend\college_events.db` 完整路徑即可檢視

## 4. 執行應用程式

啟動後端伺服器 (已設定為一併渲染前端網頁)：
```bash
python backend/app.py
```
⚠️ **注意：不要直接點開 test.html！必須透過啟動伺服器才能正確串接資料庫與 API。**

## 5. 開啟網站

伺服器成功啟動後，在瀏覽器輸入以下網址即可檢視與操作：
=======

.venv\Scripts\activate

## 2. 連接資料庫

開DBeaver

建立新連線
path貼 backend\college_events.db 的完整路徑

## 3. 執行應用程式

執行 `app.py` 

python backend/app.py

!!!! 不要直接開test.html !!!!


## 4. 開啟網站

伺服器成功啟動後，在瀏覽器輸入以下網址即可檢視開發中網頁：
>>>>>>> d90ad5e25139e7b4ed6adf246f891d4e8423dd76
http://127.0.0.1:5000
