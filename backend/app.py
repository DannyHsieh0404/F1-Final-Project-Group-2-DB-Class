import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from db_config import get_db_connection
import sqlite3

# Set the folder path for frontend static files (located in the 'test' folder under the project root)
FRONTEND_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'test')
app = Flask(__name__, static_folder=FRONTEND_FOLDER, static_url_path='')

# Enable CORS to allow the frontend web pages to smoothly call the API
CORS(app)

# === Serve Frontend Web Page Routing ===
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'test.html')

# === Serve Other Static Files (css, js) Required by the Web Page ===
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# 1. Get all events list
@app.route('/api/events', methods=['GET'])
def get_events():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        # Query the Event table and retrieve the Category name
        query = """
            SELECT
                e.event_id as id, 
                c.category_name as tags,
                e.title,
                e.description,
                e.emoji, 
                e.color, 
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
        # Convert data into dictionary format
        events = [dict(row) for row in cursor.fetchall()]

        # Convert date format
        for event in events:
            if event['date']:
                # SQLite returns data as string, can be handled directly (if format is YYYY-MM-DD, convert to YYYY/MM/DD)
                event['date'] = str(event['date']).replace('-', '/')

        return jsonify(events)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 2. Event Registration (with optional dietary requirements)
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

        # 1. First, check if the user has registered before
        cursor.execute("SELECT registration_id, status FROM Registration WHERE event_id = ? AND user_id = ?", (event_id, user_id))
        existing_reg = cursor.fetchone()

        if existing_reg:
            registration_id, current_status = existing_reg
            # 1-1. If already in 'Registered' status
            if current_status == 'Registered':
                return jsonify({"error": "You have registered this Activity!"}), 400

            # 1-2. If in 'Cancelled' status, restore it to 'Registered' and update the timestamp (using localtime to fix Taiwan timezone)
            cursor.execute("UPDATE Registration SET status = 'Registered', registration_date = datetime('now', 'localtime') WHERE registration_id = ?", (registration_id,))

            # Clear old dietary requirements
            cursor.execute("DELETE FROM Dietary_Req WHERE registration_id = ?", (registration_id,))

        else:
            # 在 INSERT 之前加這段
            cursor.execute("""
                SELECT e.student_capacity,
                    COUNT(r.registration_id) as current_count
                FROM Event e
                LEFT JOIN Registration r ON e.event_id = r.event_id AND r.status = 'Registered'
                WHERE e.event_id = ?
            GROUP BY e.event_id
            """, (event_id,))
            cap = cursor.fetchone()
            if cap and cap[1] >= cap[0]:
                return jsonify({"error": "Sorry, this event is fully booked!"}), 400
            # 2. If never registered before, proceed with standard insertion flow (using localtime to fix Taiwan timezone)
            query_reg = """
                INSERT INTO Registration (event_id, user_id, status, attendance_flag, registration_date) 
                VALUES (?, ?, 'Registered', 0, datetime('now', 'localtime'))
            """
            cursor.execute(query_reg, (event_id, user_id))
            registration_id = cursor.lastrowid # Get the newly generated PK

        # If dietary requirements are provided, write them into the database uniformly
        if dietary_req:
            query_diet = "INSERT INTO Dietary_Req (registration_id, dietary_req) VALUES (?, ?)"
            cursor.execute(query_diet, (registration_id, dietary_req))

        conn.commit()
        return jsonify({"success": True, "message": "Registration successful!", "registration_id": registration_id})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 3. Get "My Activities" (Registration records for a specific user)
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
                e.description,
                e.emoji, 
                e.color, 
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

# 4. Cancel Registration
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

# 5. Update User Profile
@app.route('/api/user', methods=['PUT'])
def update_user_profile():
    data = request.json
    # Support 'id' or 'id_db' sent from frontend as user_id
    user_id = data.get('id_db') or data.get('id')

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # [Fix] Removed the unsafe 'OR email = ?' to precisely update using only the unique user_id (Primary Key)
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

# 6. User Login —— Fixed admin privilege unverified vulnerability
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    account = data.get('id')      # Email passed from frontend
    password = data.get('pw')     # Password passed from frontend
    login_role = data.get('role') # [New] Receive the login role selected by the frontend (e.g., 'admin' or 'student')

    # Security check: Ensure required parameters are provided
    if not account or not password or not login_role:
        return jsonify({"error": "Missing account, password, or role information"}), 400

    conn = get_db_connection()
    try:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM User WHERE user_id = ?", (account,))
        user = cursor.fetchone()

        if user:
            # 1. Verify if the password hash is correct
            if check_password_hash(user['password'], password):
                user_dict = dict(user)
                db_role = user_dict['role'] # The actual role label in the database: 'Organizer' or 'Student'

                # 2. [Core Fix] Align the frontend role with the database role definition
                # Based on registration logic: frontend passing 'admin' means trying to log into the 'Organizer' backend
                expected_db_role = 'Organizer' if login_role == 'admin' else 'Student'

            # 3. [Critical Defense] Compare "the claimed role" with "the real database role"
                if db_role != expected_db_role:
                # Password is correct, but role does not match! Precisely return 403 Forbidden to deny access.
                    return jsonify({"error": "Permission mismatch. You cannot log in as this role."}), 403

                # 4. Security check passed, allow login
                return jsonify({
                    "success": True, 
                    "user": {
                        "id": user_dict['user_id'],      
                        "id_db": user_dict['user_id'], 
                        "name": user_dict['name'],
                        "phone": user_dict['phone'],
                        "email": user_dict['email'],
                        "dept": user_dict['department'],
                        "role": db_role
                    }
                })
        return jsonify({"error": "Wrong Student ID/ Account or Password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# 7. User Registration
@app.route('/api/register_user', methods=['POST'])
def register_user():
    data = request.json
    user_id  = data.get('user_id')
    account = data.get('id')  
    password = data.get('pw')

    if not user_id:
        user_id = account

    if not user_id or not password:
        return jsonify({"error": "請填寫學號與密碼"}), 400
    
    # Secure password hash is successfully generated here
    hashed_password = generate_password_hash(password)

    role  = data.get('role')
    name  = data.get('name', '新使用者')
    dept  = data.get('dept', '未設定')
    phone = data.get('phone', '')
    email = data.get('email', '')

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Check if already exists
        cursor.execute("SELECT user_id FROM User WHERE user_id  = ?", (user_id,))
        if cursor.fetchone():
            return jsonify({"error": "This Email has been registered"}), 400

        real_role = 'Organizer' if role == 'admin' else 'Student'

        name = data.get('name', '新使用者')
        dept = data.get('dept', '未設定')
        phone = data.get('phone', '')

        query = """
            INSERT INTO User (user_id, email, password, role, name, department, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        cursor.execute(query, (user_id, email, hashed_password, real_role, name, dept, phone))
        conn.commit()
        return jsonify({"success": True, "user_id": user_id})
    except Exception as e:
        conn.rollback()
        print("ERROR:", e) 
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# 8. Get registration list for a specific event (For Admin use)
@app.route('/api/registrations', methods=['GET'])
def get_all_registrations():
    # Changed to fetch all registration records and group them by event_id
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

        # Organize into a dictionary with event_id as the key
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

# =======================================================
# New Features: Admin Backend "Add, Edit, Delete Event" APIs
# =======================================================

# 9. Create Event (POST /api/events)
@app.route('/api/events', methods=['POST'])
def create_event():
    data = request.json
    if not data:
        return jsonify({"error": "Missing event data"}), 400

    title = data.get('title')
    category_id = data.get('category_id', 1) 
    event_day = data.get('date')               
    event_time = data.get('time')
    location = data.get('loc')
    guest_capacity = data.get('max')
    student_capacity = data.get('student_capacity', 0)
    description = data.get('description', '')
    emoji = data.get('emoji', '📅')
    color = data.get('color', '#4f46e5')
    host_id = data.get('host_id')

    
    if not title or not event_day or not location or not host_id:
        return jsonify({"error": "Event title, date, location, and host are required"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        
        query = """
            INSERT INTO Event (category_id, title, description, emoji, color, host_id, event_day, event_time, location, guest_capacity, student_capacity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        cursor.execute(query, (category_id, title, description, emoji, color, host_id, event_day, event_time, location, guest_capacity, student_capacity))
        conn.commit()
        return jsonify({"success": True, "message": "Event created successfully!", "event_id": cursor.lastrowid})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# 10. Edit Event (PUT /api/events/<int:event_id>)
@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    data = request.json
    if not data:
        return jsonify({"error": "Missing modification data"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Check if the event exists first
        cursor.execute("SELECT event_id FROM Event WHERE event_id = ?", (event_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Event not found, modification failed"}), 404

        # Updates for description, emoji, and color are also reserved here
        query = """
            UPDATE Event 
            SET category_id = ?, title = ?, description = ?, emoji = ?, color = ?, 
                event_day = ?, event_time = ?, location = ?, guest_capacity = ?, student_capacity = ?
            WHERE event_id = ?
        """
        cursor.execute(query, (
            data.get('category_id', 1),
            data.get('title'),
            data.get('description', ''),
            data.get('emoji', '📅'),
            data.get('color', '#4f46e5'),
            data.get('date'),
            data.get('time'),
            data.get('loc'),
            data.get('max'),
            data.get('student_capacity', 0),
            event_id
        ))
        conn.commit()
        return jsonify({"success": True, "message": "Event updated successfully!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# 11. Delete Event (DELETE /api/events/<int:event_id>)
@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute("SELECT event_id FROM Event WHERE event_id = ?", (event_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Event not found, deletion failed"}), 404

        # 🛠️ [Mandatory Fix for Cascade Deletion Order]
        # 1. Delete associated dietary requirements (Dietary_Req) first
        cursor.execute("""
            DELETE FROM Dietary_Req 
            WHERE registration_id IN (SELECT registration_id FROM Registration WHERE event_id = ?)
        """, (event_id,))
        
        # 2. Then delete associated registration records (Registration)
        cursor.execute("DELETE FROM Registration WHERE event_id = ?", (event_id,))
        
        # 3. Finally delete the event object itself (Event)
        cursor.execute("DELETE FROM Event WHERE event_id = ?", (event_id,))
        
        conn.commit()
        return jsonify({"success": True, "message": "Event deleted successfully!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)