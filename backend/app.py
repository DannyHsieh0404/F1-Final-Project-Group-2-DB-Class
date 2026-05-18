from flask import Flask, jsonify, request
from flask_cors import CORS
from db_config import get_db_connection
import sqlite3

app = Flask(__name__)
# 啟用 CORS 讓前端的 demo.js 可以順利呼叫 API
CORS(app)

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
@app.route('/api/my-activities/<int:user_id>', methods=['GET'])
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
    user_id = data.get('id_db')  # 使用資料庫內的 user_id
    
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
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
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
