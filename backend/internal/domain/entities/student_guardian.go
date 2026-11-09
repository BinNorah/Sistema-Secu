package entities

import "time"

type Student struct {
	ID           int64     `json:"id"`
	Names        string    `json:"names"`
	Surnames     string    `json:"surnames"`
	FullName     string    `json:"full_name"`
	DNI          string    `json:"dni"`
	BirthDate    string    `json:"birth_date"`
	GradeLevel   string    `json:"grade_level"` // e.g. "1ro Secundaria", "3ro Secundaria"
	AcademicYear string    `json:"academic_year"`
	CreatedAt    time.Time `json:"created_at"`
}

type Guardian struct {
	ID           int64     `json:"id"`
	StudentID    int64     `json:"student_id"`
	Names        string    `json:"names"`
	Surnames     string    `json:"surnames"`
	FullName     string    `json:"full_name"`
	DNI          string    `json:"dni"`
	Phone        string    `json:"phone"`
	Email        string    `json:"email"`
	Relationship string    `json:"relationship"` // e.g. "Madre", "Padre", "Tutor"
	CreatedAt    time.Time `json:"created_at"`
}
