package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"sistema-colegio/internal/service"
)

type EnrollmentHandler struct {
	service    *service.EnrollmentService
	uploadsDir string
}

func NewEnrollmentHandler(svc *service.EnrollmentService, uploadsDir string) *EnrollmentHandler {
	return &EnrollmentHandler{
		service:    svc,
		uploadsDir: uploadsDir,
	}
}

// RegisterPublic handles the public online enrollment form (supports multipart for file upload)
func (h *EnrollmentHandler) RegisterPublic(w http.ResponseWriter, r *http.Request) {
	// 10 MB max memory
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		// Try parsing as normal JSON if not multipart
		var dto service.PublicEnrollmentDTO
		if jsonErr := json.NewDecoder(r.Body).Decode(&dto); jsonErr == nil {
			enrollment, err := h.service.RegisterPublic(dto)
			if err != nil {
				http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    enrollment,
				"message": "Solicitud de matrícula registrada con éxito",
			})
			return
		}
	}

	dto := service.PublicEnrollmentDTO{
		StudentNames:         r.FormValue("student_names"),
		StudentSurnames:      r.FormValue("student_surnames"),
		StudentDNI:           r.FormValue("student_dni"),
		StudentBirthDate:     r.FormValue("student_birth_date"),
		GradeLevel:           r.FormValue("grade_level"),
		GuardianNames:        r.FormValue("guardian_names"),
		GuardianSurnames:     r.FormValue("guardian_surnames"),
		GuardianDNI:          r.FormValue("guardian_dni"),
		GuardianPhone:        r.FormValue("guardian_phone"),
		GuardianEmail:        r.FormValue("guardian_email"),
		GuardianRelationship: r.FormValue("guardian_relationship"),
	}

	// Handle uploaded report card file (PDF or Image)
	file, fileHeader, err := r.FormFile("report_card")
	if err == nil && file != nil {
		defer file.Close()
		ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
		if ext == ".pdf" || ext == ".png" || ext == ".jpg" || ext == ".jpeg" {
			_ = os.MkdirAll(h.uploadsDir, 0755)
			newFilename := fmt.Sprintf("boleta_%d%s", time.Now().UnixNano(), ext)
			dstPath := filepath.Join(h.uploadsDir, newFilename)

			dst, createErr := os.Create(dstPath)
			if createErr == nil {
				defer dst.Close()
				_, _ = io.Copy(dst, file)
				dto.ReportCardURL = "/uploads/" + newFilename
			}
		}
	}

	if dto.ReportCardURL == "" {
		// Provide default example card if none uploaded
		dto.ReportCardURL = "/uploads/boleta_ejemplo.pdf"
	}

	enrollment, err := h.service.RegisterPublic(dto)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    enrollment,
		"message": "Solicitud de matrícula registrada con éxito",
	})
}

// List returns enrollments filtered by status and search
func (h *EnrollmentHandler) List(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")

	list, err := h.service.List(status, search)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    list,
		"count":   len(list),
	})
}

// GetByID returns single enrollment details
func (h *EnrollmentHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID inválido"}`, http.StatusBadRequest)
		return
	}

	enrollment, err := h.service.GetByID(id)
	if err != nil || enrollment == nil {
		http.Error(w, `{"error": "Matrícula no encontrada"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    enrollment,
	})
}

// Update updates enrollment metadata
func (h *EnrollmentHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID inválido"}`, http.StatusBadRequest)
		return
	}

	var dto service.UpdateEnrollmentDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, `{"error": "Cuerpo JSON inválido"}`, http.StatusBadRequest)
		return
	}

	updated, err := h.service.Update(id, dto)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    updated,
		"message": "Matrícula actualizada exitosamente",
	})
}

// TransitionStatus executes the State Pattern
type TransitionDTO struct {
	Status string `json:"status"`
	Reason string `json:"reason"`
}

func (h *EnrollmentHandler) TransitionStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID inválido"}`, http.StatusBadRequest)
		return
	}

	var dto TransitionDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, `{"error": "Cuerpo JSON inválido"}`, http.StatusBadRequest)
		return
	}

	updated, err := h.service.TransitionStatus(id, dto.Status, dto.Reason)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    updated,
		"message": fmt.Sprintf("Estado actualizado a '%s' correctamente", updated.Status),
	})
}

// RecordPayment registers a payment for enrollment
func (h *EnrollmentHandler) RecordPayment(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID inválido"}`, http.StatusBadRequest)
		return
	}

	var dto service.PaymentRecordDTO
	_ = json.NewDecoder(r.Body).Decode(&dto)

	payment, err := h.service.RecordPayment(id, dto)
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    payment,
		"message": "Pago registrado con éxito",
	})
}

// Delete deletes or archives an enrollment
func (h *EnrollmentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, `{"error": "ID inválido"}`, http.StatusBadRequest)
		return
	}

	if err := h.service.Delete(id); err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Matrícula eliminada correctamente",
	})
}

// Stats returns KPI metrics for Secretariat
func (h *EnrollmentHandler) Stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.GetStats()
	if err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    stats,
	})
}

