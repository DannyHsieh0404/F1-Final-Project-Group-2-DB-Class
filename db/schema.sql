-- 為了避免重建時發生 FK 衝突，建議先 Drop tables
DROP TABLE IF EXISTS Dietary_Req;
DROP TABLE IF EXISTS Meal_Option;
DROP TABLE IF EXISTS Registration;
DROP TABLE IF EXISTS Event;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS User;

-- 1. 建立 User 表
CREATE TABLE User (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT CHECK(role IN ('Student', 'Organizer', 'Admin')) NOT NULL DEFAULT 'Student',
    password TEXT NOT NULL, 
    name TEXT NOT NULL,
    department TEXT,
    grade TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT
);

-- 2. 建立 Category 表 
CREATE TABLE Category (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT NOT NULL UNIQUE
);

-- 3. 建立 Event 表
CREATE TABLE Event (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    title TEXT NOT NULL,
    host_id INTEGER NOT NULL,  
    department TEXT,
    event_day DATE NOT NULL,
    event_time TIME NOT NULL,
    location TEXT NOT NULL,
    guest_capacity INTEGER DEFAULT 0,
    student_capacity INTEGER NOT NULL,
    
    FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE SET NULL,
    FOREIGN KEY (host_id) REFERENCES User(user_id) ON DELETE CASCADE
);

-- 4. 建立 Meal_Option 表 
CREATE TABLE Meal_Option (
    event_id INTEGER NOT NULL,
    meal_option TEXT NOT NULL,
    PRIMARY KEY (event_id, meal_option),
    FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE
);

-- 5. 建立 Registration 表 
CREATE TABLE Registration (
    registration_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('Registered', 'Cancelled')) DEFAULT 'Registered',
    attendance_flag INTEGER DEFAULT 0, -- 0 for FALSE, 1 for TRUE
    
    -- 確保同一位使用者不能對同一場活動重複報名
    UNIQUE (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

-- 6. 建立 Dietary_Req 表 
CREATE TABLE Dietary_Req (
    registration_id INTEGER NOT NULL,
    dietary_req TEXT NOT NULL,
    PRIMARY KEY (registration_id, dietary_req),
    FOREIGN KEY (registration_id) REFERENCES Registration(registration_id) ON DELETE CASCADE
);