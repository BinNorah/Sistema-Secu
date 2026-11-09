package repository

import (
	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/domain/patterns/memento"
)

type UserRepository interface {
	GetByUsername(username string) (*entities.User, error)
	GetByID(id int64) (*entities.User, error)
	List(role string) ([]*entities.User, error)
	Create(user *entities.User) error
	Update(user *entities.User) error
	ToggleActive(id int64, active bool) error
}

type EnrollmentRepository interface {
	Create(enrollment *entities.Enrollment, student *entities.Student, guardian *entities.Guardian) error
	GetByID(id int64) (*entities.Enrollment, error)
	List(status, search string) ([]*entities.Enrollment, error)
	Update(enrollment *entities.Enrollment) error
	Delete(id int64) error
	GetStats() (map[string]int, error)
	RecordPayment(payment *entities.Payment) error
	GetPaymentByEnrollmentID(enrollmentID int64) (*entities.Payment, error)
}

type GradeRepository interface {
	Create(grade *entities.Grade) error
	CreateWithMemento(grade *entities.Grade, snapshot *memento.GradeMemento) error
	GetByID(id int64) (*entities.Grade, error)
	GetByStudentSubject(studentID, subjectID int64) (*entities.Grade, error)
	ListByTeacher(teacherID int64, gradeLevel, section string) ([]*entities.Grade, error)
	ListByStudent(studentID int64) ([]*entities.Grade, error)
	Update(grade *entities.Grade) error
	UpdateWithMemento(grade *entities.Grade, snapshot *memento.GradeMemento) error
	Delete(id int64) error
	SaveMemento(m *memento.GradeMemento) error
	ListMementos(gradeID int64) ([]*memento.GradeMemento, error)
	GetMementoByVersion(gradeID int64, version int) (*memento.GradeMemento, error)
	GetMementoByID(id int64) (*memento.GradeMemento, error)
}

type AcademicRepository interface {
	ListGrades() ([]*entities.GradeLevel, error)
	ListSections(gradeLevelID int64) ([]*entities.Section, error)
	ListSubjects() ([]*entities.Subject, error)
	CreateSubject(subject *entities.Subject) error
	ListAssignments() ([]*entities.TeacherAssignment, error)
	ListAssignmentsByTeacher(teacherID int64) ([]*entities.TeacherAssignment, error)
	CreateAssignment(assignment *entities.TeacherAssignment) error
	DeleteAssignment(id int64) error
}
