package service

import (
	"errors"
	"fmt"
	"time"

	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/repository"
)

type GradeService struct {
	gradeRepo repository.GradeRepository
}

func NewGradeService(gradeRepo repository.GradeRepository) *GradeService {
	return &GradeService{gradeRepo: gradeRepo}
}

type SaveGradeDTO struct {
	StudentID   int64   `json:"student_id"`
	SubjectID   int64   `json:"subject_id"`
	GradeLevel  string  `json:"grade_level"`
	Section     string  `json:"section"`
	B1          float64 `json:"b1"`
	B2          float64 `json:"b2"`
	B3          float64 `json:"b3"`
	B4          float64 `json:"b4"`
	Observation string  `json:"observation"`
}

func validateScore(score float64) error {
	if score < 0 || score > 20 {
		return errors.New("las notas deben estar en la escala vigesimal (0 a 20)")
	}
	return nil
}

// SaveGrade handles grade registration and editing, managing Memento snapshots
func (s *GradeService) SaveGrade(teacherID int64, dto SaveGradeDTO) (*entities.Grade, error) {
	if err := validateScore(dto.B1); err != nil {
		return nil, err
	}
	if err := validateScore(dto.B2); err != nil {
		return nil, err
	}
	if err := validateScore(dto.B3); err != nil {
		return nil, err
	}
	if err := validateScore(dto.B4); err != nil {
		return nil, err
	}

	existing, err := s.gradeRepo.GetByStudentSubject(dto.StudentID, dto.SubjectID)
	if err != nil {
		return nil, err
	}

	now := time.Now()

	if existing == nil {
		// New Grade: create initial Originator and first Memento (v1)
		grade := &entities.Grade{
			StudentID:      dto.StudentID,
			TeacherID:      teacherID,
			SubjectID:      dto.SubjectID,
			GradeLevel:     dto.GradeLevel,
			Section:        dto.Section,
			B1:             dto.B1,
			B2:             dto.B2,
			B3:             dto.B3,
			B4:             dto.B4,
			Observation:    dto.Observation,
			CurrentVersion: 1,
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		grade.CalculateAverage()

		snapshot := grade.CreateMemento("CREACION INICIAL")
		if err := s.gradeRepo.CreateWithMemento(grade, snapshot); err != nil {
			return nil, fmt.Errorf("error al registrar nota: %w", err)
		}

		return grade, nil
	}

	existing.CurrentVersion++
	existing.TeacherID = teacherID
	existing.B1 = dto.B1
	existing.B2 = dto.B2
	existing.B3 = dto.B3
	existing.B4 = dto.B4
	existing.Observation = dto.Observation
	existing.CalculateAverage()
	existing.UpdatedAt = now

	snapshot := existing.CreateMemento("MODIFICACION")
	if err := s.gradeRepo.UpdateWithMemento(existing, snapshot); err != nil {
		return nil, fmt.Errorf("error al actualizar nota: %w", err)
	}

	return existing, nil
}

func (s *GradeService) ListByTeacher(teacherID int64, gradeLevel, section string) ([]*entities.Grade, error) {
	return s.gradeRepo.ListByTeacher(teacherID, gradeLevel, section)
}

func (s *GradeService) ListByStudent(studentID int64) ([]*entities.Grade, error) {
	return s.gradeRepo.ListByStudent(studentID)
}

func (s *GradeService) GetByID(id int64) (*entities.Grade, error) {
	return s.gradeRepo.GetByID(id)
}
