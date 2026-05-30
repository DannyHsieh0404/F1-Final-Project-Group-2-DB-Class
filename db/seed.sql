-- 插入 User 範例資料
INSERT INTO User (user_id, role, password, name, department, email, phone) VALUES
('ADMIN01',   'Organizer', 'scrypt:32768:8:1$KYDlZ4U2V4wL3XBL$a417457038f26158c796aed530d2cd0be2ea09d1d286e259ce2711f58e1e0a7296fde32b7df51c6df667cdc42cbf191467e5b89bb6703c0304dffb8bae536153', 'Alice (Admin)',    'Information Management', 'alice@university.edu',   '0912345678'),
('B10402001', 'Student',   'scrypt:32768:8:1$HwIfmoxAzNkGxCHP$d6263d7cf35ed38ed9af17e8bb16e608613099a94f7409c66fc147b070b5f00cfca86073de750b61b5f5daf5fab57a3159269fbcdfdc8b0308cdf171d1e8fe98', 'Bob (Student)',    'Computer Science',       'bob@university.edu',     '0923456789'),
('B10402002', 'Student',   'scrypt:32768:8:1$GVRr2qhBzRPX6frJ$5060ad8bb81b2eb91c1e23435f94fff366fb96a2df459110ffa969e1f2790262eb0e9ed21740f974c7c542edaf87d4aac654f4ed43dd107afde4de0749dca100', 'Charlie (Student)','Business',               'charlie@university.edu', '0934567890'),
('B10402003', 'Student',   'scrypt:32768:8:1$RJK0zIcCPVcAh6Ml$d0669efe4c4391c0220dfa24bf18999ae9d268358b7031caff96670661f45a2c497fc2a24b7ab43bc789159c4cf2853d908c410220cf7ad47c4eaad358a1c8cb', 'David (Student)',  'Design',                 'david@university.edu',   '0945678901');

-- 插入 Category 範例資料
INSERT INTO Category (category_name) VALUES
('Seminar'),
('Workshop'),
('Social');

-- 插入 Event 範例資料
INSERT INTO Event (category_id, title, description, emoji, color, host_id, department, event_day, event_time, location, guest_capacity, student_capacity) VALUES
(3, '期末聯合聚餐', '辛苦了一整學期，快來一起享用美味的晚餐吧！現場備有豐富精緻的各類餐點。', '🍔', 'orange', 'ADMIN01', 'Information Management', '2026-06-15', '18:30:00', '學生活動中心', 5, 50),
(2, 'SQL 工作坊', '想一窺資料庫的奧秘嗎？本工作坊將手把手帶你從小試身手到熟練操作 SQL 語法！', '💻', 'blue', 'ADMIN01', 'Computer Science', '2026-06-05', '14:00:00', '電腦教室A', 0, 2);

-- 插入 Meal_Option 範例資料
INSERT INTO Meal_Option (event_id, meal_option) VALUES
(1, '葷食 (豬肉)'),
(1, '葷食 (牛肉)'),
(1, '素食 (全素)');

-- 插入 Registration 範例資料
INSERT INTO Registration (event_id, user_id, status, attendance_flag) VALUES
(1, 'B10402001', 'Registered', 0),
(1, 'B10402002', 'Registered', 1),
(1, 'B10402003', 'Cancelled',  0),
(2, 'B10402001', 'Registered', 0),
(2, 'B10402002', 'Registered', 0);

-- 插入 Dietary_Req 範例資料
INSERT INTO Dietary_Req (registration_id, dietary_req) VALUES
(1, '素食 (全素)'),
(2, '不吃牛');