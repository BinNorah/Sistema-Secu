package state

import (
	"fmt"
	"strings"
)

// PendingState represents the initial enrollment state
type PendingState struct{}

func (s *PendingState) Name() EnrollmentStatus {
	return StatusPending
}

func (s *PendingState) Approve(ctx EnrollmentContext) error {
	ctx.SetState(&ApprovedState{})
	ctx.SetObservation("Matrícula aprobada y formalizada con éxito")
	ctx.TouchUpdatedAt()
	return nil
}

func (s *PendingState) Observe(ctx EnrollmentContext, reason string) error {
	if strings.TrimSpace(reason) == "" {
		reason = "Expediente con observaciones en documentación o pago"
	}
	ctx.SetState(&ObservedState{})
	ctx.SetObservation(reason)
	ctx.TouchUpdatedAt()
	return nil
}

func (s *PendingState) Cancel(ctx EnrollmentContext, reason string) error {
	if strings.TrimSpace(reason) == "" {
		reason = "Solicitud cancelada por el apoderado"
	}
	ctx.SetState(&CancelledState{})
	ctx.SetObservation(reason)
	ctx.TouchUpdatedAt()
	return nil
}

func (s *PendingState) Reopen(ctx EnrollmentContext, reason string) error {
	return fmt.Errorf("%w: la matrícula ya se encuentra en estado pendiente", ErrInvalidStateTransition)
}

// ApprovedState represents the formalized enrollment state
type ApprovedState struct{}

func (s *ApprovedState) Name() EnrollmentStatus {
	return StatusApproved
}

func (s *ApprovedState) Approve(ctx EnrollmentContext) error {
	return fmt.Errorf("%w: la matrícula ya se encuentra aprobada", ErrInvalidStateTransition)
}

func (s *ApprovedState) Observe(ctx EnrollmentContext, reason string) error {
	return fmt.Errorf("%w: una matrícula aprobada no puede observarse directamente; debe ser anulada", ErrInvalidStateTransition)
}

func (s *ApprovedState) Cancel(ctx EnrollmentContext, reason string) error {
	if strings.TrimSpace(reason) == "" {
		reason = "Matrícula anulada por retiro o traslado escolar"
	}
	ctx.SetState(&CancelledState{})
	ctx.SetObservation(reason)
	ctx.TouchUpdatedAt()
	return nil
}

func (s *ApprovedState) Reopen(ctx EnrollmentContext, reason string) error {
	return fmt.Errorf("%w: una matrícula ya formalizada no puede regresar a pendiente", ErrInvalidStateTransition)
}

// ObservedState represents an enrollment with requirements to correct
type ObservedState struct{}

func (s *ObservedState) Name() EnrollmentStatus {
	return StatusObserved
}

func (s *ObservedState) Approve(ctx EnrollmentContext) error {
	ctx.SetState(&ApprovedState{})
	ctx.SetObservation("Observaciones subsanadas y matrícula aprobada")
	ctx.TouchUpdatedAt()
	return nil
}

func (s *ObservedState) Observe(ctx EnrollmentContext, reason string) error {
	if strings.TrimSpace(reason) != "" {
		ctx.SetObservation(reason)
		ctx.TouchUpdatedAt()
	}
	return nil
}

func (s *ObservedState) Cancel(ctx EnrollmentContext, reason string) error {
	if strings.TrimSpace(reason) == "" {
		reason = "Matrícula rechazada por no subsanar observaciones a tiempo"
	}
	ctx.SetState(&CancelledState{})
	ctx.SetObservation(reason)
	ctx.TouchUpdatedAt()
	return nil
}

func (s *ObservedState) Reopen(ctx EnrollmentContext, reason string) error {
	if strings.TrimSpace(reason) == "" {
		reason = "Observaciones subsanadas, reabierta para evaluación"
	}
	ctx.SetState(&PendingState{})
	ctx.SetObservation(reason)
	ctx.TouchUpdatedAt()
	return nil
}

// CancelledState represents the terminal cancelled enrollment state
type CancelledState struct{}

func (s *CancelledState) Name() EnrollmentStatus {
	return StatusCancelled
}

func (s *CancelledState) Approve(ctx EnrollmentContext) error {
	return fmt.Errorf("%w: una matrícula anulada no puede reactivarse directamente; debe generarse una nueva solicitud", ErrInvalidStateTransition)
}

func (s *CancelledState) Observe(ctx EnrollmentContext, reason string) error {
	return fmt.Errorf("%w: una matrícula anulada no puede ser observada", ErrInvalidStateTransition)
}

func (s *CancelledState) Cancel(ctx EnrollmentContext, reason string) error {
	return fmt.Errorf("%w: la matrícula ya se encuentra anulada", ErrInvalidStateTransition)
}

func (s *CancelledState) Reopen(ctx EnrollmentContext, reason string) error {
	return fmt.Errorf("%w: una matrícula anulada no puede reabrirse", ErrInvalidStateTransition)
}
