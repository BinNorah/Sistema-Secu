package entities

import (
	"fmt"
	"strings"
	"time"

	"sistema-colegio/internal/domain/patterns/state"
)

type Enrollment struct {
	ID            int64      `json:"id"`
	Code          string     `json:"code"` // e.g. "SOL-2026-0001" or "MAT-2026-SEC-0001"
	StudentID     int64      `json:"student_id"`
	Student       *Student   `json:"student,omitempty"`
	Guardian      *Guardian  `json:"guardian,omitempty"`
	GradeLevel    string     `json:"grade_level"`
	Section       string     `json:"section"`
	AcademicYear  string     `json:"academic_year"`
	Status        string     `json:"status"` // "Pendiente", "Aprobada", "Observada", "Anulada"
	ReportCardURL string     `json:"report_card_url"`
	Observation   string     `json:"observation"`
	PaymentStatus string     `json:"payment_status"` // "Pagado", "Pendiente"
	PaymentAmount float64    `json:"payment_amount"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`

	currentState state.State `json:"-"`
}

func (e *Enrollment) SetState(s state.State) {
	e.currentState = s
	e.Status = string(s.Name())
}

func (e *Enrollment) SetObservation(obs string) {
	e.Observation = obs
}

func (e *Enrollment) TouchUpdatedAt() {
	e.UpdatedAt = time.Now()
}

func (e *Enrollment) GetState() state.State {
	if e.currentState == nil {
		e.currentState = state.FromString(e.Status)
	}
	return e.currentState
}

func (e *Enrollment) Approve() error {
	return e.GetState().Approve(e)
}

func (e *Enrollment) Observe(reason string) error {
	return e.GetState().Observe(e, reason)
}

func (e *Enrollment) Cancel(reason string) error {
	return e.GetState().Cancel(e, reason)
}

func (e *Enrollment) Reopen(reason string) error {
	return e.GetState().Reopen(e, reason)
}

func (e *Enrollment) TransitionTo(targetStatus, reason string) error {
	normalized := strings.ToLower(strings.TrimSpace(targetStatus))
	switch normalized {
	case "pendiente", "pending":
		return e.Reopen(reason)
	case "aprobada", "aprobado", "approved":
		return e.Approve()
	case "observada", "observado", "observed":
		return e.Observe(reason)
	case "anulada", "anulado", "cancelled":
		return e.Cancel(reason)
	default:
		return fmt.Errorf("%w: estado destino '%s' no válido", state.ErrInvalidStateTransition, targetStatus)
	}
}
