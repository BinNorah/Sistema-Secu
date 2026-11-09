package service

import (
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/repository"
	"sistema-colegio/internal/domain/patterns/state"
)

type EnrollmentService struct {
	repo repository.EnrollmentRepository
}

func NewEnrollmentService(repo repository.EnrollmentRepository) *EnrollmentService {
	return &EnrollmentService{repo: repo}
}

type PublicEnrollmentDTO struct {
	// Student data
	StudentNames     string `json:"student_names"`
	StudentSurnames  string `json:"student_surnames"`
	StudentDNI       string `json:"student_dni"`
	StudentBirthDate string `json:"student_birth_date"`
	GradeLevel       string `json:"grade_level"` // e.g. "3° de Secundaria"

	// Guardian data
	GuardianNames        string `json:"guardian_names"`
	GuardianSurnames     string `json:"guardian_surnames"`
	GuardianDNI          string `json:"guardian_dni"`
	GuardianPhone        string `json:"guardian_phone"`
	GuardianEmail        string `json:"guardian_email"`
	GuardianRelationship string `json:"guardian_relationship"`

	// Report Card file URL or path
	ReportCardURL string `json:"report_card_url"`
}

func (s *EnrollmentService) RegisterPublic(dto PublicEnrollmentDTO) (*entities.Enrollment, error) {
	if strings.TrimSpace(dto.StudentNames) == "" || strings.TrimSpace(dto.StudentSurnames) == "" || strings.TrimSpace(dto.StudentDNI) == "" {
		return nil, errors.New("los nombres, apellidos y DNI del alumno son obligatorios")
	}
	if strings.TrimSpace(dto.GuardianNames) == "" || strings.TrimSpace(dto.GuardianPhone) == "" {
		return nil, errors.New("los datos de contacto del apoderado son obligatorios")
	}
	if strings.TrimSpace(dto.GradeLevel) == "" {
		dto.GradeLevel = "1° de Secundaria"
	}

	now := time.Now()
	// Generate unique application code
	code := fmt.Sprintf("SOL-2026-%04d", rand.Intn(9000)+1000)

	student := &entities.Student{
		Names:        strings.TrimSpace(dto.StudentNames),
		Surnames:     strings.TrimSpace(dto.StudentSurnames),
		FullName:     strings.TrimSpace(dto.StudentNames) + " " + strings.TrimSpace(dto.StudentSurnames),
		DNI:          strings.TrimSpace(dto.StudentDNI),
		BirthDate:    strings.TrimSpace(dto.StudentBirthDate),
		GradeLevel:   strings.TrimSpace(dto.GradeLevel),
		AcademicYear: "2026",
		CreatedAt:    now,
	}

	guardian := &entities.Guardian{
		Names:        strings.TrimSpace(dto.GuardianNames),
		Surnames:     strings.TrimSpace(dto.GuardianSurnames),
		FullName:     strings.TrimSpace(dto.GuardianNames) + " " + strings.TrimSpace(dto.GuardianSurnames),
		DNI:          strings.TrimSpace(dto.GuardianDNI),
		Phone:        strings.TrimSpace(dto.GuardianPhone),
		Email:        strings.TrimSpace(dto.GuardianEmail),
		Relationship: strings.TrimSpace(dto.GuardianRelationship),
		CreatedAt:    now,
	}

	if guardian.Relationship == "" {
		guardian.Relationship = "Apoderado"
	}

	enrollment := &entities.Enrollment{
		Code:          code,
		GradeLevel:    student.GradeLevel,
		Section:       "A", // Default assigned section
		AcademicYear:  "2026",
		Status:        string(state.StatusPending), // Starts in Pendiente
		ReportCardURL: dto.ReportCardURL,
		Observation:   "Solicitud web registrada por el apoderado",
		PaymentStatus: "Pendiente",
		PaymentAmount: 920.00,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.repo.Create(enrollment, student, guardian); err != nil {
		return nil, fmt.Errorf("error al guardar la matrícula: %w", err)
	}

	enrollment.Student = student
	enrollment.Guardian = guardian
	return enrollment, nil
}

func (s *EnrollmentService) List(status, search string) ([]*entities.Enrollment, error) {
	return s.repo.List(status, search)
}

func (s *EnrollmentService) GetByID(id int64) (*entities.Enrollment, error) {
	return s.repo.GetByID(id)
}

type UpdateEnrollmentDTO struct {
	GradeLevel  string `json:"grade_level"`
	Section     string `json:"section"`
	Observation string `json:"observation"`
}

func (s *EnrollmentService) Update(id int64, dto UpdateEnrollmentDTO) (*entities.Enrollment, error) {
	e, err := s.repo.GetByID(id)
	if err != nil || e == nil {
		return nil, errors.New("matrícula no encontrada")
	}

	if dto.GradeLevel != "" {
		e.GradeLevel = dto.GradeLevel
	}
	if dto.Section != "" {
		e.Section = strings.ToUpper(dto.Section)
	}
	if dto.Observation != "" {
		e.Observation = dto.Observation
	}
	e.UpdatedAt = time.Now()

	if err := s.repo.Update(e); err != nil {
		return nil, err
	}
	return e, nil
}

// TransitionStatus executes the State Pattern in Go
func (s *EnrollmentService) TransitionStatus(id int64, targetStatus, reason string) (*entities.Enrollment, error) {
	e, err := s.repo.GetByID(id)
	if err != nil || e == nil {
		return nil, errors.New("matrícula no encontrada")
	}

	// Delegate transition to the concrete State object (State Pattern)
	if err := e.TransitionTo(targetStatus, reason); err != nil {
		return nil, err
	}

	// If transitioning to Approved, generate official SIAGIE code
	if e.Status == string(state.StatusApproved) && strings.HasPrefix(e.Code, "SOL-") {
		e.Code = fmt.Sprintf("MAT-2026-SEC-%04d", e.ID)
	}

	if err := s.repo.Update(e); err != nil {
		return nil, fmt.Errorf("error persistiendo estado de matrícula: %w", err)
	}

	return e, nil
}

type PaymentRecordDTO struct {
	VoucherNumber string  `json:"voucher_number"`
	Amount        float64 `json:"amount"`
}

func (s *EnrollmentService) RecordPayment(enrollmentID int64, dto PaymentRecordDTO) (*entities.Payment, error) {
	if dto.Amount <= 0 {
		dto.Amount = 920.00
	}
	if strings.TrimSpace(dto.VoucherNumber) == "" {
		dto.VoucherNumber = fmt.Sprintf("B001-%07d", rand.Intn(9000000)+1000000)
	}

	p := &entities.Payment{
		EnrollmentID:  enrollmentID,
		Amount:        dto.Amount,
		VoucherNumber: strings.TrimSpace(dto.VoucherNumber),
		Status:        "Pagado",
		PaymentDate:   time.Now(),
	}

	if err := s.repo.RecordPayment(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *EnrollmentService) Delete(id int64) error {
	e, err := s.repo.GetByID(id)
	if err != nil || e == nil {
		return errors.New("matrícula no encontrada")
	}

	if e.Status == string(state.StatusApproved) {
		return errors.New("una matrícula formalizada y aprobada no puede eliminarse; debe ser anulada para preservar la auditoría")
	}

	return s.repo.Delete(id)
}

func (s *EnrollmentService) GetStats() (map[string]int, error) {
	return s.repo.GetStats()
}
