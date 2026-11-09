package state_test

import (
	"testing"
	"time"

	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/domain/patterns/state"
)

func TestStatePatternTransitions(t *testing.T) {
	enrollment := &entities.Enrollment{
		ID:         1,
		Code:       "SOL-2026-0001",
		GradeLevel: "3° de Secundaria",
		Section:    "A",
		Status:     string(state.StatusPending),
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	// 1. Initial State should be Pending
	if enrollment.GetState().Name() != state.StatusPending {
		t.Fatalf("Esperado estado inicial '%s', obtenido '%s'", state.StatusPending, enrollment.GetState().Name())
	}

	// 2. Transition from Pending to Observed
	err := enrollment.TransitionTo(string(state.StatusObserved), "Falta boleta original")
	if err != nil {
		t.Fatalf("Error en transición de Pendiente a Observada: %v", err)
	}
	if enrollment.Status != string(state.StatusObserved) {
		t.Fatalf("Estado no actualizado a Observada")
	}

	// 3. Transition from Observed back to Pending (Subsanado)
	err = enrollment.TransitionTo(string(state.StatusPending), "Documentos subsanados por el apoderado")
	if err != nil {
		t.Fatalf("Error en subsanación de Observada a Pendiente: %v", err)
	}

	// 4. Transition from Pending to Approved (Formalizada)
	err = enrollment.TransitionTo(string(state.StatusApproved), "Expediente y pago conforme")
	if err != nil {
		t.Fatalf("Error en aprobación de matrícula: %v", err)
	}
	if enrollment.Status != string(state.StatusApproved) {
		t.Fatalf("Estado no actualizado a Aprobada")
	}

	// 5. Invalid transition: Cannot transition from Approved directly to Observed
	err = enrollment.TransitionTo(string(state.StatusObserved), "Intento inválido")
	if err == nil {
		t.Fatalf("Se esperaba error al intentar pasar de Aprobada a Observada, pero se permitió")
	}

	// 6. Transition from Approved to Cancelled (Anulada) is allowed
	err = enrollment.TransitionTo(string(state.StatusCancelled), "Traslado externo solicitado")
	if err != nil {
		t.Fatalf("Error en anulación de matrícula aprobada: %v", err)
	}
	if enrollment.Status != string(state.StatusCancelled) {
		t.Fatalf("Estado no actualizado a Anulada")
	}

	// 7. Final State: Cancelled cannot transition to any other state
	err = enrollment.TransitionTo(string(state.StatusApproved), "Intento reabrir")
	if err == nil {
		t.Fatalf("Se esperaba error al intentar reactivar una matrícula anulada")
	}
}

