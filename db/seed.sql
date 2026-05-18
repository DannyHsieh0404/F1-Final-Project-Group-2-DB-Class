-- 插入 User 範例資料 (包含 Organizer, Student 等角色)
INSERT INTO User (role, password, name, department, grade, email, phone) VALUES
('Organizer', 'hashed_pw_admin1', 'Alice (Admin)', 'Information Management', 'Staff', 'alice@university.edu', '0912345678'),
('Student', 'hashed_pw_student1', 'Bob (Student)', 'Computer Science', 'Sophomore', 'bob@university.edu', '0923456789'),
('Student', 'hashed_pw_student2', 'Charlie (Student)', 'Business', 'Junior', 'charlie@university.edu', '0934567890'),
('Student', 'hashed_pw_student3', 'David (Student)', 'Design', 'Freshman', 'david@university.edu', '0945678901');

-- 插入 Category 範例資料
INSERT INTO Category (category_name) VALUES
('Seminar'),
('Workshop'),
('Social');

-- 插入 Event 範例資料
INSERT INTO Event (category_id, title, host_id, department, event_day, event_time, location, guest_capacity, student_capacity) VALUES
(3, '期末聯合聚餐', 1, 'Information Management', '2026-06-15', '18:30:00', '學生活動中心', 5, 50),
(2, 'SQL 工作坊', 1, 'Computer Science', '2026-05-25', '14:00:00', '電腦教室A', 0, 2);

-- 插入 Meal_Option 範例資料
INSERT INTO Meal_Option (event_id, meal_option) VALUES
(1, '葷食 (豬肉)'),
(1, '葷食 (牛肉)'),
(1, '素食 (全素)');

-- 插入 Registration 範例資料 (包含正常報名、取消報名)
INSERT INTO Registration (event_id, user_id, status, attendance_flag) VALUES
(1, 2, 'Registered', 0),   -- Bob 報名聚餐
(1, 3, 'Registered', 1),    -- Charlie 報名聚餐，且已出席 (假設提早 check-in)
(1, 4, 'Cancelled', 0),    -- David 報名後取消
(2, 2, 'Registered', 0),   -- Bob 報名工作坊
(2, 3, 'Registered', 0);   -- Charlie 報名工作坊

-- 插入 Dietary_Req 範例資料 (特殊飲食需求)
INSERT INTO Dietary_Req (registration_id, dietary_req) VALUES
(1, '素食 (全素)'),           -- Bob 在 registration_id=1 填寫的飲食需求
(2, '不吃牛');                -- Charlie 在 registration_id=2 填寫的飲食需求