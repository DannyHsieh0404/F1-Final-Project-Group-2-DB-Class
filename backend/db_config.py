import sqlite3
import os

# 資料庫連線設定
def get_db_connection():
    # 資料庫檔案會放在 backend 資料夾內
    db_path = os.path.join(os.path.dirname(__file__), 'college_events.db')
    try:
        # SQLite 只需要指定檔案路徑
        connection = sqlite3.connect(db_path)
        return connection
    except sqlite3.Error as e:
        print(f"Error connecting to SQLite: {e}")
        return None
