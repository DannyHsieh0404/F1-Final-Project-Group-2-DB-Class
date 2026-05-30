import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'college_events.db')
schema_path = os.path.join(os.path.dirname(__file__), '..', 'db', 'schema.sql')
seed_path = os.path.join(os.path.dirname(__file__), '..', 'db', 'seed.sql')

# 如果資料庫已存在就先刪除，重新建立最新的
# if os.path.exists(db_path):
#     os.remove(db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 讀取並執行 schema
with open(schema_path, 'r', encoding='utf-8') as f:
    schema_sql = f.read()
    cursor.executescript(schema_sql)

# 讀取並執行 seed
with open(seed_path, 'r', encoding='utf-8') as f:
    seed_sql = f.read()
    cursor.executescript(seed_sql)

conn.commit()
conn.close()

print(f"✅ SQLite 資料庫初始化完成！已建立檔案: {db_path}")