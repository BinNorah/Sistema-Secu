package service

import (
	"errors"
	"fmt"

	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/repository"
	"sistema-colegio/internal/domain/patterns/memento"
)

// MementoService acts as the Caretaker in the Memento Pattern
type MementoService struct {
	gradeRepo repository.GradeRepository
}

func NewMementoService(gradeRepo repository.GradeRepository) *MementoService {
	return &MementoService{gradeRepo: gradeRepo}
}

func (s *MementoService) GetHistory(gradeID int64) (*memento.HistorySummary, error) {
	g, err := s.gradeRepo.GetByID(gradeID)
	if err != nil || g == nil {
		return nil, errors.New("calificación no encontrada")
	}

	list, err := s.gradeRepo.ListMementos(gradeID)
	if err != nil {
		return nil, err
	}

	return memento.BuildHistorySummary(gradeID, g.CurrentVersion, list), nil
}

// Undo restores the previous version from SQLite Mementos
func (s *MementoService) Undo(gradeID int64) (*entities.Grade, error) {
	g, err := s.gradeRepo.GetByID(gradeID)
	if err != nil || g == nil {
		return nil, errors.New("calificación no encontrada")
	}

	targetVersion := g.CurrentVersion - 1
	if targetVersion < 1 {
		return nil, errors.New("no hay versiones anteriores para deshacer (se encuentra en la versión inicial)")
	}

	prevMemento, err := s.gradeRepo.GetMementoByVersion(gradeID, targetVersion)
	if err != nil || prevMemento == nil {
		return nil, fmt.Errorf("no se encontró la instantánea para la versión v%d", targetVersion)
	}

	// Originator restores its state (Encapsulation preserved)
	g.RestoreMemento(prevMemento)

	if err := s.gradeRepo.Update(g); err != nil {
		return nil, fmt.Errorf("error al persistir el estado deshecho: %w", err)
	}

	return g, nil
}

// Redo advances to the subsequent version from SQLite Mementos
func (s *MementoService) Redo(gradeID int64) (*entities.Grade, error) {
	g, err := s.gradeRepo.GetByID(gradeID)
	if err != nil || g == nil {
		return nil, errors.New("calificación no encontrada")
	}

	targetVersion := g.CurrentVersion + 1
	nextMemento, err := s.gradeRepo.GetMementoByVersion(gradeID, targetVersion)
	if err != nil || nextMemento == nil {
		return nil, errors.New("no hay versiones posteriores para rehacer (se encuentra en la versión más reciente)")
	}

	// Originator restores its state
	g.RestoreMemento(nextMemento)

	if err := s.gradeRepo.Update(g); err != nil {
		return nil, fmt.Errorf("error al persistir el estado rehecho: %w", err)
	}

	return g, nil
}

// RestoreVersion restores any specific historical version
func (s *MementoService) RestoreVersion(gradeID, mementoID int64) (*entities.Grade, error) {
	g, err := s.gradeRepo.GetByID(gradeID)
	if err != nil || g == nil {
		return nil, errors.New("calificación no encontrada")
	}

	targetMemento, err := s.gradeRepo.GetMementoByID(mementoID)
	if err != nil || targetMemento == nil {
		return nil, errors.New("instantánea de versión no encontrada")
	}

	if targetMemento.GradeID != gradeID {
		return nil, errors.New("la instantánea seleccionada no corresponde a esta calificación")
	}

	g.RestoreMemento(targetMemento)

	if err := s.gradeRepo.Update(g); err != nil {
		return nil, fmt.Errorf("error al restaurar la versión seleccionada: %w", err)
	}

	return g, nil
}
