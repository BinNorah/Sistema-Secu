package memento_test

import (
	"testing"
	"time"

	"sistema-colegio/internal/domain/entities"
)

func TestMementoPatternOriginatorAndCare(t *testing.T) {
	grade := &entities.Grade{
		ID:             1,
		StudentID:      10,
		TeacherID:      3,
		SubjectID:      1,
		GradeLevel:     "3° de Secundaria",
		Section:        "A",
		B1:             14.0,
		B2:             15.0,
		B3:             16.0,
		B4:             15.0,
		CurrentVersion: 1,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	grade.CalculateAverage()

	if grade.Average != 15.0 {
		t.Fatalf("Promedio inicial esperado 15.0, obtenido %.2f", grade.Average)
	}

	// 1. Create Memento (Snapshot v1)
	mementoV1 := grade.CreateMemento("CREACION")
	if mementoV1.Version != 1 || mementoV1.B1 != 14.0 || mementoV1.Average != 15.0 {
		t.Fatalf("Memento v1 no capturó el estado correctamente")
	}

	// 2. Modify Originator to Version 2
	grade.CurrentVersion = 2
	grade.B1 = 18.0
	grade.B2 = 19.0
	grade.B3 = 20.0
	grade.B4 = 19.0
	grade.CalculateAverage()

	if grade.Average != 19.0 {
		t.Fatalf("Promedio modificado esperado 19.0, obtenido %.2f", grade.Average)
	}

	// Create Memento (Snapshot v2)
	mementoV2 := grade.CreateMemento("ACTUALIZACION")
	if mementoV2.Version != 2 || mementoV2.Average != 19.0 {
		t.Fatalf("Memento v2 no capturó el nuevo estado")
	}

	// 3. Restore to Version 1 (Undo)
	grade.RestoreMemento(mementoV1)
	if grade.CurrentVersion != 1 || grade.B1 != 14.0 || grade.Average != 15.0 {
		t.Fatalf("Fallo al restaurar Memento v1 en Originator: versión=%d, b1=%.1f, prom=%.1f",
			grade.CurrentVersion, grade.B1, grade.Average)
	}

	// 4. Restore to Version 2 (Redo)
	grade.RestoreMemento(mementoV2)
	if grade.CurrentVersion != 2 || grade.B1 != 18.0 || grade.Average != 19.0 {
		t.Fatalf("Fallo al restaurar Memento v2 en Originator: versión=%d, b1=%.1f, prom=%.1f",
			grade.CurrentVersion, grade.B1, grade.Average)
	}
}

