package service

import (
	"errors"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/repository"
)

type DirectorService struct {
	userRepo     repository.UserRepository
	academicRepo repository.AcademicRepository
}

func NewDirectorService(userRepo repository.UserRepository, academicRepo repository.AcademicRepository) *DirectorService {
	return &DirectorService{
		userRepo:     userRepo,
		academicRepo: academicRepo,
	}
}

// User Management
type CreateUserDTO struct {
	Username string        `json:"username"`
	FullName string        `json:"full_name"`
	Email    string        `json:"email"`
	Password string        `json:"password"`
	Role     entities.Role `json:"role"`
}

func (s *DirectorService) CreateUser(dto CreateUserDTO) (*entities.User, error) {
	if strings.TrimSpace(dto.Username) == "" || strings.TrimSpace(dto.FullName) == "" || strings.TrimSpace(dto.Password) == "" {
		return nil, errors.New("todos los campos son obligatorios")
	}

	existing, _ := s.userRepo.GetByUsername(dto.Username)
	if existing != nil {
		return nil, errors.New("el nombre de usuario ya está registrado")
	}

	bytes, err := bcrypt.GenerateFromPassword([]byte(dto.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u := &entities.User{
		Username:     strings.TrimSpace(dto.Username),
		FullName:     strings.TrimSpace(dto.FullName),
		Email:        strings.TrimSpace(dto.Email),
		PasswordHash: string(bytes),
		Role:         dto.Role,
		IsActive:     true,
		CreatedAt:    time.Now(),
	}

	if err := s.userRepo.Create(u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *DirectorService) ListUsers(role string) ([]*entities.User, error) {
	return s.userRepo.List(role)
}

func (s *DirectorService) ToggleUserActive(id int64, active bool) error {
	return s.userRepo.ToggleActive(id, active)
}

// Academic Management
func (s *DirectorService) ListGrades() ([]*entities.GradeLevel, error) {
	return s.academicRepo.ListGrades()
}

func (s *DirectorService) ListSections(gradeLevelID int64) ([]*entities.Section, error) {
	return s.academicRepo.ListSections(gradeLevelID)
}

func (s *DirectorService) ListSubjects() ([]*entities.Subject, error) {
	return s.academicRepo.ListSubjects()
}

func (s *DirectorService) CreateSubject(name, code, desc string) (*entities.Subject, error) {
	sub := &entities.Subject{
		Name:        strings.TrimSpace(name),
		Code:        strings.TrimSpace(code),
		Description: strings.TrimSpace(desc),
	}
	if err := s.academicRepo.CreateSubject(sub); err != nil {
		return nil, err
	}
	return sub, nil
}

func (s *DirectorService) ListAssignments() ([]*entities.TeacherAssignment, error) {
	return s.academicRepo.ListAssignments()
}

func (s *DirectorService) ListAssignmentsByTeacher(teacherID int64) ([]*entities.TeacherAssignment, error) {
	return s.academicRepo.ListAssignmentsByTeacher(teacherID)
}

type AssignTeacherDTO struct {
	TeacherID  int64  `json:"teacher_id"`
	SubjectID  int64  `json:"subject_id"`
	GradeLevel string `json:"grade_level"`
	Section    string `json:"section"`
}

func (s *DirectorService) AssignTeacher(dto AssignTeacherDTO) (*entities.TeacherAssignment, error) {
	if dto.TeacherID <= 0 || dto.SubjectID <= 0 || dto.GradeLevel == "" || dto.Section == "" {
		return nil, errors.New("todos los campos son requeridos para la asignación")
	}

	a := &entities.TeacherAssignment{
		TeacherID:  dto.TeacherID,
		SubjectID:  dto.SubjectID,
		GradeLevel: dto.GradeLevel,
		Section:    strings.ToUpper(dto.Section),
		CreatedAt:  time.Now(),
	}

	if err := s.academicRepo.CreateAssignment(a); err != nil {
		return nil, err
	}
	return a, nil
}

func (s *DirectorService) DeleteAssignment(id int64) error {
	return s.academicRepo.DeleteAssignment(id)
}
