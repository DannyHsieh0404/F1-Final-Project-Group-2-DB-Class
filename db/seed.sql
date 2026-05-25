-- 插入 User 範例資料 (包含 Organizer, Student 等角色)
INSERT INTO User (user_id, role, password, name, department, email, phone) VALUES
('ADMIN01', 'Organizer', 'hashed_pw_admin1', 'Alice (Admin)', 'Information Management', 'alice@university.edu', '0912345678'),
('B10402001', 'Student', 'hashed_pw_student1', 'Bob (Student)', 'Computer Science', 'bob@university.edu', '0923456789'),
('B10402002', 'Student', 'hashed_pw_student2', 'Charlie (Student)', 'Business', 'charlie@university.edu', '0934567890'),
('B10402003', 'Student', 'hashed_pw_student3', 'David (Student)', 'Design', 'david@university.edu', '0945678901');

-- 插入 Category 範例資料
INSERT INTO Category (category_name) VALUES
('Seminar'),
('Workshop'),
('Social');

-- 插入 Event 範例資料
INSERT INTO Event (category_id, title, host_id, department, event_day, event_time, location, guest_capacity, student_capacity) VALUES
(3, '期末聯合聚餐', 'ADMIN01', 'Information Management', '2026-06-15', '18:30:00', '學生活動中心', 5, 50),
(2, 'SQL 工作坊', 'ADMIN01', 'Computer Science', '2026-05-25', '14:00:00', '電腦教室A', 0, 2);

-- 插入 Meal_Option 範例資料
INSERT INTO Meal_Option (event_id, meal_option) VALUES
(1, '葷食 (豬肉)'),
(1, '葷食 (牛肉)'),
(1, '素食 (全素)');

-- 插入 Registration 範例資料 (包含正常報名、取消報名)
INSERT INTO Registration (event_id, user_id, status, attendance_flag) VALUES
(1, 'B10402001', 'Registered', 0),   -- Bob 報名聚餐
(1, 'B10402002', 'Registered', 1),    -- Charlie 報名聚餐，且已出席 (假設提早 check-in)
(1, 'B10402003', 'Cancelled', 0),    -- David 報名後取消
(2, 'B10402001', 'Registered', 0),   -- Bob 報名工作坊
(2, 'B10402002', 'Registered', 0);   -- Charlie 報名工作坊

-- 插入 Dietary_Req 範例資料 (特殊飲食需求)
INSERT INTO Dietary_Req (registration_id, dietary_req) VALUES
(1, '素食 (全素)'),           -- Bob 在 registration_id=1 填寫的飲食需求
(2, '不吃牛');                -- Charlie 在 registration_id=2 填寫的飲食需求