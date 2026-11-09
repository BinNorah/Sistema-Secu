package memento

import "time"

// GradeMemento represents the Memento in the Memento Pattern (Immutable Snapshot)
type GradeMemento struct {
	ID          int64     `json:"id"`
	GradeID     int64     `json:"grade_id"`
	Version     int       `json:"version"`
	B1          float64   `json:"b1"`
	B2          float64   `json:"b2"`
	B3          float64   `json:"b3"`
	B4          float64   `json:"b4"`
	Average     float64   `json:"average"`
	Observation string    `json:"observation"`
	TeacherID   int64     `json:"teacher_id"`
	Action      string    `json:"action"` // "CREACION", "MODIFICACION", "DESHACER", "REHACER", "RESTAURACION"
	CreatedAt   time.Time `json:"created_at"`
}

// HistorySummary encapsulates the versions available for Undo / Redo
type HistorySummary struct {
	GradeID        int64           `json:"grade_id"`
	CurrentVersion int             `json:"current_version"`
	TotalVersions  int             `json:"total_versions"`
	CanUndo        bool            `json:"can_undo"`
	CanRedo        bool            `json:"can_redo"`
	Mementos       []*GradeMemento `json:"mementos"`
}

func BuildHistorySummary(gradeID int64, currentVersion int, list []*GradeMemento) *HistorySummary {
	canUndo := false
	canRedo := false

	for _, m := range list {
		if m.Version < currentVersion {
			canUndo = true
		}
		if m.Version > currentVersion {
			canRedo = true
		}
	}

	return &HistorySummary{
		GradeID:        gradeID,
		CurrentVersion: currentVersion,
		TotalVersions:  len(list),
		CanUndo:        canUndo,
		CanRedo:        canRedo,
		Mementos:       list,
	}
}

