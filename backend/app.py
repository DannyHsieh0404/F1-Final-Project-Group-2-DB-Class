import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from db_config import get_db_connection
import sqlite3

# 設定前端靜態檔案的資料夾路徑 (位於專案根目錄下的 test 資料夾)
FRONTEND_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'test')
app = Flask(__name__, static_folder=FRONTEND_FOLDER, static_url_path='')

# 啟用 CORS 讓前端的網頁可以順利呼叫 API
CORS(app)

# === 提供前端網頁路由 ===
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'test.html')

# === 提供網頁所需的其他靜態檔案 (css, js) ===
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# 1. 取得所有活動列表
@app.route('/api/events', methods=['GET'])
def get_events():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        # 查詢 Event 表，並帶出 Category 的名稱
        query = """
            SELECT 
                e.event_id as id, 
                c.category_name as tags,
                e.title, 
                e.event_day as date, 
                e.event_time as time,
                e.location as loc, 
                e.guest_capacity as max, 
                e.student_capacity,
                (SELECT COUNT(*) FROM Registration r WHERE r.event_id = e.event_id AND r.status = 'Registered') as quota
            FROM Event e
            LEFT JOIN Category c ON e.category_id = c.category_id
        """
        cursor.execute(query)
        # 將資料轉為字典格式
        events = [dict(row) for row in cursor.fetchall()]

        # 轉換日期
        for event in events:
            if event['date']:
                # SQLite 存出來是字串，可以直接處理（如果格式是 YYYY-MM-DD，轉成 YYYY/MM/DD）
                event['date'] = str(event['date']).replace('-', '/')

        return jsonify(events)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 2. 報名活動 (與可選的飲食需求)
@app.route('/api/register', methods=['POST'])
def register_event():
    data = request.json
    user_id = data.get('user_id')
    event_id = data.get('event_id')
    dietary_req = data.get('dietary_req', None)

    if not user_id or not event_id:
        return jsonify({"error": "Missing user_id or event_id"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # 1. 先確認是否曾經報名過
        cursor.execute("SELECT registration_id, status FROM Registration WHERE event_id = ? AND user_id = ?", (event_id, user_id))
        existing_reg = cursor.fetchone()

        if existing_reg:
            registration_id, current_status = existing_reg
            # 1-1. 如果已經是報名狀態
            if current_status == 'Registered':
                return jsonify({"error": "您已經報名過這個活動了"}), 400

            # 1-2. 如果是 Cancelled 狀態，將其恢復為 Registered，並更新時間 (使用 localtime 修正台灣時區)
            cursor.execute("UPDATE Registration SET status = 'Registered', registration_date = datetime('now', 'localtime') WHERE registration_id = ?", (registration_id,))

            # 清除舊的飲食需求
            cursor.execute("DELETE FROM Dietary_Req WHERE registration_id = ?", (registration_id,))

        else:
            # 2. 若完全沒報名過，走一般插入流程 (加上 localtime 修正台灣時區)
            query_reg = """
                INSERT INTO Registration (event_id, user_id, status, attendance_flag, registration_date) 
                VALUES (?, ?, 'Registered', 0, datetime('now', 'localtime'))
            """
            cursor.execute(query_reg, (event_id, user_id))
            registration_id = cursor.lastrowid # 取得剛剛產生的 PK

        # 若有飲食需求，統一寫入
        if dietary_req:
            query_diet = "INSERT INTO Dietary_Req (registration_id, dietary_req) VALUES (?, ?)"
            cursor.execute(query_diet, (registration_id, dietary_req))

        conn.commit()
        return jsonify({"success": True, "message": "報名成功！", "registration_id": registration_id})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 3. 取得「我的活動」(特定使用者的報名紀錄)
@app.route('/api/my-activities/<user_id>', methods=['GET'])
def get_my_activities(user_id):
    conn = get_db_connection()
    try:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        query = """
            SELECT 
                r.registration_id,
                e.event_id as id,
                e.title,
                e.event_day as date,
                r.status,
                d.dietary_req
            FROM Registration r
            JOIN Event e ON r.event_id = e.event_id
            LEFT JOIN Dietary_Req d ON r.registration_id = d.registration_id
            WHERE r.user_id = ? AND r.status = 'Registered'
        """
        cursor.execute(query, (user_id,))
        activities = [dict(row) for row in cursor.fetchall()]

        for act in activities:
            if act['date']:
                act['date'] = str(act['date']).replace('-', '/')

        return jsonify(activities)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 4. 取消報名
@app.route('/api/cancel', methods=['POST'])
def cancel_event():
    data = request.json
    user_id = data.get('user_id')
    event_id = data.get('event_id')

    if not user_id or not event_id:
        return jsonify({"error": "Missing parameters"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = "UPDATE Registration SET status = 'Cancelled' WHERE user_id = ? AND event_id = ?"
        cursor.execute(query, (user_id, event_id))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 5. 更新使用者個人資料
@app.route('/api/user', methods=['PUT'])
def update_user_profile():
    data = request.json
    # 支援前端傳來的 'id' 或 'id_db' 作為 user_id
    user_id = data.get('id_db') or data.get('id')

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # 【修正】拿掉不安全的 OR email = ?，統一只用唯一的 user_id (主鍵) 來做精準更新
        query = """
            UPDATE User 
            SET name = ?, phone = ?, email = ?, department = ?
            WHERE user_id = ?
        """
        cursor.execute(query, (
            data.get('name'), 
            data.get('phone'), 
            data.get('email'), 
            data.get('dept'), 
            user_id
        ))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 6. 使用者登入 —— 已修正管理員權限未驗證漏洞
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    account = data.get('id')      # 前端傳入的 Email
    password = data.get('pw')     # 前端傳入的密碼
    login_role = data.get('role') # 【新增】接收前端選擇的登入角色 (例如: 'admin' 或 'student')

    # 安全檢查：確保必要參數都有傳入
    if not account or not password or not login_role:
        return jsonify({"error": "缺少帳號、密碼或角色資訊"}), 400

    conn = get_db_connection()
    try:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM User WHERE email = ?", (account,))
        user = cursor.fetchone()

        if user:
            # 1. 先驗證密碼雜湊是否正確
            if check_password_hash(user['password'], password):
                user_dict = dict(user)
                db_role = user_dict['role'] # 資料庫內真正的角色標籤：'Organizer' 或 'Student'

                # 2. 【核心修正】將前端角色對齊資料庫的角色定義
                # 依據註冊邏輯：前端傳 'admin' 代表想登入 'Organizer' 後台
                expected_db_role = 'Organizer' if login_role == 'admin' else 'Student'

                # 3. 【關鍵防禦】比對「他自稱的角色」與「資料庫真實角色」是否相符
                if db_role != expected_db_role:
                    # 帳密雖對，但角色不符！精準回傳 403 Forbidden 拒絕訪問
                    return jsonify({"error": "權限不符，您無法以該角色身份登入"}), 403

                # 4. 安全過關，允許登入
                return jsonify({
                    "success": True, 
                    "user": {
                        "id": user_dict['email'],      
                        "id_db": user_dict['user_id'], 
                        "name": user_dict['name'],
                        "phone": user_dict['phone'],
                        "email": user_dict['email'],
                        "dept": user_dict['department'],
                        "role": db_role
                    }
                })
        return jsonify({"error": "帳號或密碼錯誤"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 7. 使用者註冊
@app.route('/api/register_user', methods=['POST'])
def register_user():
    data = request.json
    account = data.get('id')  # 帳號為 email
    password = data.get('pw')

    # 這裡成功產生了安全的雜湊密碼
    hashed_password = generate_password_hash(password)

    role = data.get('role')

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # 檢查是否已存在
        cursor.execute("SELECT user_id FROM User WHERE email = ?", (account,))
        if cursor.fetchone():
            return jsonify({"error": "此帳號(Email)已被註冊"}), 400

        real_role = 'Organizer' if role == 'admin' else 'Student'

        query = """
            INSERT INTO User (email, password, role, name, department, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        # === 核心修正點 ===
        # 這裡的第二個參數必須帶入 剛剛加密好的 hashed_password，而不是原始的 password
        cursor.execute(query, (account, hashed_password, real_role, "新使用者", "未設定", ""))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 8. 取得特定活動的報名名單 (供管理員使用)
@app.route('/api/registrations', methods=['GET'])
def get_all_registrations():
    # 改為抓取所有的報名紀錄，並用 event_id 來分組
    conn = get_db_connection()
    try:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        query = """
            SELECT 
                r.event_id,
                u.email as uid,
                u.name,
                u.department as dept,
                d.dietary_req as meal
            FROM Registration r
            JOIN User u ON r.user_id = u.user_id
            LEFT JOIN Dietary_Req d ON r.registration_id = d.registration_id
            WHERE r.status = 'Registered'
        """
        cursor.execute(query)
        rows = [dict(row) for row in cursor.fetchall()]

        # 整理成以 event_id 為 key 的字典
        regs_dict = {}
        for row in rows:
            eid = row.pop('event_id')
            if eid not in regs_dict:
                regs_dict[eid] = []
            regs_dict[eid].append(row)

        return jsonify(regs_dict)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)