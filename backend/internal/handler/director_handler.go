package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"sistema-colegio/internal/service"
)

type DirectorHandler struct {
	service *service.DirectorService
}

func NewDirectorHandler(svc *service.DirectorService) *DirectorHandler {
	return &DirectorHandler{service: svc}
}

// User endpoints
func (h *DirectorHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	role := r.URL.Query().Get("role")
	users, err := h.service.ListUsers(role)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    users,
	})
}

func (h *DirectorHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var dto service.CreateUserDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, `{"error": "Cuerpo JSON inválido"}`, http.StatusBadRequest)
		return
	}

	user, err := h.service.CreateUser(dto)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    user,
		"message": "Usuario registrado exitosamente",
	})
}

type ToggleActiveDTO struct {
	IsActive bool `json:"is_active"`
}

func (h *DirectorHandler) ToggleUserActive(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID inválido"}`, http.StatusBadRequest)
		return
	}

	var dto ToggleActiveDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, `{"error": "Cuerpo JSON inválido"}`, http.StatusBadRequest)
		return
	}

	if err := h.service.ToggleUserActive(id, dto.IsActive); err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Estado del usuario actualizado",
	})
}

// Academic endpoints
func (h *DirectorHandler) ListGrades(w http.ResponseWriter, r *http.Request) {
	grades, err := h.service.ListGrades()
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    grades,
	})
}

func (h *DirectorHandler) ListSections(w http.ResponseWriter, r *http.Request) {
	gradeIDStr := r.URL.Query().Get("grade_level_id")
	var gradeID int64
	if gradeIDStr != "" {
		gradeID, _ = strconv.ParseInt(gradeIDStr, 10, 64)
	}

	sections, err := h.service.ListSections(gradeID)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    sections,
	})
}

func (h *DirectorHandler) ListSubjects(w http.ResponseWriter, r *http.Request) {
	subjects, err := h.service.ListSubjects()
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    subjects,
	})
}

type CreateSubjectDTO struct {
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
}

func (h *DirectorHandler) CreateSubject(w http.ResponseWriter, r *http.Request) {
	var dto CreateSubjectDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, `{"error": "Cuerpo JSON inválido"}`, http.StatusBadRequest)
		return
	}

	subject, err := h.service.CreateSubject(dto.Name, dto.Code, dto.Description)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    subject,
		"message": "Asignatura creada con éxito",
	})
}

func (h *DirectorHandler) ListAssignments(w http.ResponseWriter, r *http.Request) {
	assignments, err := h.service.ListAssignments()
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    assignments,
	})
}

func (h *DirectorHandler) AssignTeacher(w http.ResponseWriter, r *http.Request) {
	var dto service.AssignTeacherDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, `{"error": "Cuerpo JSON inválido"}`, http.StatusBadRequest)
		return
	}

	assignment, err := h.service.AssignTeacher(dto)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    assignment,
		"message": "Profesor asignado con éxito",
	})
}

func (h *DirectorHandler) DeleteAssignment(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID inválido"}`, http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteAssignment(id); err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Asignación eliminada",
	})
}

