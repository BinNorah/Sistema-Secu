package handler

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/middleware"
)

type RouterConfig struct {
	AuthHandler       *AuthHandler
	EnrollmentHandler *EnrollmentHandler
	GradeHandler      *GradeHandler
	DirectorHandler   *DirectorHandler
	UploadsDir        string
}

func SetupRouter(cfg RouterConfig) *chi.Mux {
	r := chi.NewRouter()

	// Base middlewares
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Static file server for /uploads/*
	fileServer(r, "/uploads", http.Dir(cfg.UploadsDir))

	// API Routes
	r.Route("/api", func(api chi.Router) {
		// Public Auth
		api.Post("/auth/login", cfg.AuthHandler.Login)

		// Public Enrollment Form submission
		api.Post("/enrollments/public", cfg.EnrollmentHandler.RegisterPublic)

		// Authenticated Routes
		api.Group(func(auth chi.Router) {
			auth.Use(middleware.RequireAuth)
			auth.Get("/auth/me", cfg.AuthHandler.Me)

			// Secretariat & Director routes for Enrollments
			auth.Group(func(sec chi.Router) {
				sec.Use(middleware.RequireRole(string(entities.RoleSecretariat), string(entities.RoleDirector)))
				sec.Get("/enrollments", cfg.EnrollmentHandler.List)
				sec.Get("/enrollments/stats", cfg.EnrollmentHandler.Stats)
				sec.Get("/enrollments/{id}", cfg.EnrollmentHandler.GetByID)
				sec.Put("/enrollments/{id}", cfg.EnrollmentHandler.Update)
				sec.Patch("/enrollments/{id}/state", cfg.EnrollmentHandler.TransitionStatus)
				sec.Post("/enrollments/{id}/payment", cfg.EnrollmentHandler.RecordPayment)
				sec.Delete("/enrollments/{id}", cfg.EnrollmentHandler.Delete)
			})

			// Teacher routes for Grades (Memento Pattern)
			auth.Group(func(teach chi.Router) {
				teach.Use(middleware.RequireRole(string(entities.RoleTeacher), string(entities.RoleDirector)))
				teach.Get("/grades", cfg.GradeHandler.List)
				teach.Get("/grades/{id}", cfg.GradeHandler.GetByID)
				teach.Post("/grades", cfg.GradeHandler.Save)
				teach.Get("/grades/{id}/history", cfg.GradeHandler.History)
				teach.Post("/grades/{id}/undo", cfg.GradeHandler.Undo)
				teach.Post("/grades/{id}/redo", cfg.GradeHandler.Redo)
				teach.Post("/grades/{id}/restore/{mementoId}", cfg.GradeHandler.Restore)
			})

			// Director exclusive administration routes
			auth.Group(func(dir chi.Router) {
				dir.Use(middleware.RequireRole(string(entities.RoleDirector)))
				dir.Get("/director/users", cfg.DirectorHandler.ListUsers)
				dir.Post("/director/users", cfg.DirectorHandler.CreateUser)
				dir.Patch("/director/users/{id}/toggle", cfg.DirectorHandler.ToggleUserActive)
				dir.Get("/director/grades", cfg.DirectorHandler.ListGrades)
				dir.Get("/director/sections", cfg.DirectorHandler.ListSections)
				dir.Get("/director/subjects", cfg.DirectorHandler.ListSubjects)
				dir.Post("/director/subjects", cfg.DirectorHandler.CreateSubject)
				dir.Get("/director/assignments", cfg.DirectorHandler.ListAssignments)
				dir.Post("/director/assignments", cfg.DirectorHandler.AssignTeacher)
				dir.Delete("/director/assignments/{id}", cfg.DirectorHandler.DeleteAssignment)
			})

			// Common academic reference read for all logged-in roles
			auth.Get("/academic/grades", cfg.DirectorHandler.ListGrades)
			auth.Get("/academic/sections", cfg.DirectorHandler.ListSections)
			auth.Get("/academic/subjects", cfg.DirectorHandler.ListSubjects)
			auth.Get("/academic/assignments", cfg.DirectorHandler.ListAssignments)
		})
	})

	return r
}

func fileServer(r chi.Router, path string, root http.FileSystem) {
	if strings.ContainsAny(path, "{}*") {
		panic("FileServer does not permit any URL parameters.")
	}

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", http.StatusMovedPermanently).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		rctx := chi.RouteContext(r.Context())
		pathPrefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		fs := http.StripPrefix(pathPrefix, http.FileServer(root))
		fs.ServeHTTP(w, r)
	})
}
