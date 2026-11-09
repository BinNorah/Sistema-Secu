package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"sistema-colegio/internal/middleware"
	"sistema-colegio/internal/service"
)

type GradeHandler struct {
	gradeService   *service.GradeService
	mementoService *service.MementoService
}

func NewGradeHandler(gradeService *service.GradeService, mementoService *service.MementoService) *GradeHandler {
	return &GradeHandler{
		gradeService:   gradeService,
		mementoService: mementoService,
	}
}

// List returns grades filtered by teacher or grade_level and section
func (h *GradeHandler) List(w http.ResponseWriter, r *http.Request) {
	teacherID := middleware.GetUserID(r)
	gradeLevel := r.URL.Query().Get("grade_level")
	section := r.URL.Query().Get("section")

	grades, err := h.gradeService.ListByTeacher(teacherID, gradeLevel, section)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    grades,
		"count":   len(grades),
	})
}

// GetByID returns single grade
func (h *GradeHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID inválido"}`, http.StatusBadRequest)
		return
	}

	grade, err := h.gradeService.GetByID(id)
	if err != nil || grade == nil {
		http.Error(w, `{"error": "Calificación no encontrada"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    grade,
	})
}

// Save handles creating or editing a grade (creates a Memento snapshot in SQLite)
func (h *GradeHandler) Save(w http.ResponseWriter, r *http.Request) {
	teacherID := middleware.GetUserID(r)

	var dto service.SaveGradeDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, `{"error": "Cuerpo JSON inválido"}`, http.StatusBadRequest)
		return
	}

	grade, err := h.gradeService.SaveGrade(teacherID, dto)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    grade,
		"message": "Calificación guardada y versión registrada exitosamente (Patrón Memento)",
	})
}

// History returns Memento snapshots history for this grade
func (h *GradeHandler) History(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID inválido"}`, http.StatusBadRequest)
		return
	}

	history, err := h.mementoService.GetHistory(id)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    history,
	})
}

// Undo steps back to previous version
func (h *GradeHandler) Undo(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID inválido"}`, http.StatusBadRequest)
		return
	}

	grade, err := h.mementoService.Undo(id)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    grade,
		"message": "Se ha deshecho la última modificación correctamente (Memento)",
	})
}

// Redo steps forward to next version
func (h *GradeHandler) Redo(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID inválido"}`, http.StatusBadRequest)
		return
	}

	grade, err := h.mementoService.Redo(id)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    grade,
		"message": "Se ha rehecho la modificación correctamente (Memento)",
	})
}

// Restore restores a specific version by its memento ID
func (h *GradeHandler) Restore(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID de calificación inválido"}`, http.StatusBadRequest)
		return
	}

	mementoIDStr := chi.URLParam(r, "mementoId")
	mementoID, err := strconv.ParseInt(mementoIDStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID de versión inválido"}`, http.StatusBadRequest)
		return
	}

	grade, err := h.mementoService.RestoreVersion(id, mementoID)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    grade,
		"message": "Versión histórica restaurada con éxito (Memento)",
	})
}

