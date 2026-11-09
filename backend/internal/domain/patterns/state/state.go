package state

import (
	"errors"
	"strings"
)

type EnrollmentStatus string

const (
	StatusPending  EnrollmentStatus = "Pendiente"
	StatusApproved EnrollmentStatus = "Aprobada"
	StatusObserved EnrollmentStatus = "Observada"
	StatusCancelled EnrollmentStatus = "Anulada"
)

var (
	ErrInvalidStateTransition = errors.New("transición de estado no permitida por las reglas del negocio")
)

// Context interface that the Enrollment entity must satisfy for the State pattern
type EnrollmentContext interface {
	SetState(s State)
	SetObservation(obs string)
	TouchUpdatedAt()
}

// State interface for the State Pattern
type State interface {
	Name() EnrollmentStatus
	Approve(ctx EnrollmentContext) error
	Observe(ctx EnrollmentContext, reason string) error
	Cancel(ctx EnrollmentContext, reason string) error
	Reopen(ctx EnrollmentContext, reason string) error
}

func FromString(status string) State {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "aprobada", "aprobado", "approved":
		return &ApprovedState{}
	case "observada", "observado", "observed":
		return &ObservedState{}
	case "anulada", "anulado", "cancelled":
		return &CancelledState{}
	case "pendiente", "pending":
		fallthrough
	default:
		return &PendingState{}
	}
}
