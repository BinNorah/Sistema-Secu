package entities

import (
	"math"
	"time"

	"sistema-colegio/internal/domain/patterns/memento"
)

type Grade struct {
	ID             int64     `json:"id"`
	StudentID      int64     `json:"student_id"`
	StudentName    string    `json:"student_name,omitempty"`
	StudentDNI     string    `json:"student_dni,omitempty"`
	TeacherID      int64     `json:"teacher_id"`
	TeacherName    string    `json:"teacher_name,omitempty"`
	SubjectID      int64     `json:"subject_id"`
	SubjectName    string    `json:"subject_name,omitempty"`
	GradeLevel     string    `json:"grade_level"`
	Section        string    `json:"section"`
	B1             float64   `json:"b1"`
	B2             float64   `json:"b2"`
	B3             float64   `json:"b3"`
	B4             float64   `json:"b4"`
	Average        float64   `json:"average"`
	Observation    string    `json:"observation"`
	CurrentVersion int       `json:"current_version"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (g *Grade) CalculateAverage() {
	count := 0.0
	sum := 0.0

	if g.B1 > 0 {
		sum += g.B1
		count++
	}
	if g.B2 > 0 {
		sum += g.B2
		count++
	}
	if g.B3 > 0 {
		sum += g.B3
		count++
	}
	if g.B4 > 0 {
		sum += g.B4
		count++
	}

	if count > 0 {
		g.Average = math.Round((sum/count)*10) / 10
	} else {
		g.Average = 0
	}
}

// CreateMemento captures current state into an immutable Memento snapshot (Originator -> Memento)
func (g *Grade) CreateMemento(action string) *memento.GradeMemento {
	g.CalculateAverage()
	return &memento.GradeMemento{
		GradeID:     g.ID,
		Version:     g.CurrentVersion,
		B1:          g.B1,
		B2:          g.B2,
		B3:          g.B3,
		B4:          g.B4,
		Average:     g.Average,
		Observation: g.Observation,
		TeacherID:   g.TeacherID,
		Action:      action,
		CreatedAt:   time.Now(),
	}
}

// RestoreMemento restores internal state from a Memento snapshot (Memento -> Originator)
func (g *Grade) RestoreMemento(m *memento.GradeMemento) {
	g.B1 = m.B1
	g.B2 = m.B2
	g.B3 = m.B3
	g.B4 = m.B4
	g.Average = m.Average
	g.Observation = m.Observation
	g.TeacherID = m.TeacherID
	g.CurrentVersion = m.Version
	g.UpdatedAt = time.Now()
}

