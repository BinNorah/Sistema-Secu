CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    names TEXT NOT NULL,
    surnames TEXT NOT NULL,
    dni TEXT NOT NULL UNIQUE,
    birth_date TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS guardians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    names TEXT NOT NULL,
    surnames TEXT NOT NULL,
    dni TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    relationship TEXT NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    grade_level TEXT NOT NULL,
    section TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendiente',
    report_card_url TEXT,
    observation TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Pendiente',
    payment_amount REAL NOT NULL DEFAULT 920.00,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_id INTEGER NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
    amount REAL NOT NULL CHECK (amount > 0),
    voucher_number TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_date DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS grade_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade_level_id INTEGER NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    classroom TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS teacher_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_level TEXT NOT NULL,
    section TEXT NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    grade_level TEXT NOT NULL,
    section TEXT NOT NULL,
    b1 REAL NOT NULL DEFAULT 0 CHECK (b1 BETWEEN 0 AND 20),
    b2 REAL NOT NULL DEFAULT 0 CHECK (b2 BETWEEN 0 AND 20),
    b3 REAL NOT NULL DEFAULT 0 CHECK (b3 BETWEEN 0 AND 20),
    b4 REAL NOT NULL DEFAULT 0 CHECK (b4 BETWEEN 0 AND 20),
    average REAL NOT NULL DEFAULT 0,
    observation TEXT,
    current_version INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS grade_mementos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grade_id INTEGER NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    b1 REAL NOT NULL,
    b2 REAL NOT NULL,
    b3 REAL NOT NULL,
    b4 REAL NOT NULL,
    average REAL NOT NULL,
    observation TEXT,
    teacher_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enrollments_status_year
    ON enrollments(status, academic_year);
CREATE INDEX IF NOT EXISTS idx_grades_teacher
    ON grades(teacher_id, grade_level, section);
