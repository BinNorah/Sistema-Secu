package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"sistema-colegio/internal/handler"
	"sistema-colegio/internal/repository/sqlite"
	"sistema-colegio/internal/service"
)

func main() {
	log.Println("==================================================")
	log.Println(" SISTEMA DE GESTIÓN ESCOLAR - SECUNDARIA")
	log.Println(" Backend Go con Chi Router & Arquitectura Limpia")
	log.Println(" Patrones: State (Matrículas) y Memento (Notas)")
	log.Println("==================================================")

	// Determine SQLite path (defaults to app.db)
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		if _, err := os.Stat("app.db"); err == nil {
			dbPath = "app.db"
		} else if _, err := os.Stat(filepath.Join("backend", "app.db")); err == nil {
			dbPath = filepath.Join("backend", "app.db")
		} else {
			dbPath = "app.db"
		}
	}

	uploadsDir := os.Getenv("UPLOADS_DIR")
	if uploadsDir == "" {
		if _, err := os.Stat("uploads"); err == nil {
			uploadsDir = "uploads"
		} else if _, err := os.Stat(filepath.Join("backend", "uploads")); err == nil {
			uploadsDir = filepath.Join("backend", "uploads")
		} else {
			uploadsDir = "uploads"
		}
	}
	_ = os.MkdirAll(uploadsDir, 0755)

	// Initialize SQLite Database with migrations and seed data
	db, err := sqlite.NewConnection(dbPath)
	if err != nil {
		log.Fatalf("Error al conectar con SQLite (%s): %v", dbPath, err)
	}
	defer db.Close()
	log.Printf("Base de datos SQLite activa en: %s", dbPath)

	// Repositories
	userRepo := sqlite.NewUserRepository(db)
	enrollmentRepo := sqlite.NewEnrollmentRepository(db)
	gradeRepo := sqlite.NewGradeRepository(db)
	academicRepo := sqlite.NewAcademicRepository(db)

	// Services
	authService := service.NewAuthService(userRepo)
	enrollmentService := service.NewEnrollmentService(enrollmentRepo)
	gradeService := service.NewGradeService(gradeRepo)
	mementoService := service.NewMementoService(gradeRepo)
	directorService := service.NewDirectorService(userRepo, academicRepo)

	// Handlers
	authHandler := handler.NewAuthHandler(authService)
	enrollmentHandler := handler.NewEnrollmentHandler(enrollmentService, uploadsDir)
	gradeHandler := handler.NewGradeHandler(gradeService, mementoService)
	directorHandler := handler.NewDirectorHandler(directorService)

	// Setup Chi Router
	r := handler.SetupRouter(handler.RouterConfig{
		AuthHandler:       authHandler,
		EnrollmentHandler: enrollmentHandler,
		GradeHandler:      gradeHandler,
		DirectorHandler:   directorHandler,
		UploadsDir:        uploadsDir,
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Servidor API REST escuchando en http://localhost:%s", port)
	log.Println("Rutas disponibles:")
	log.Println(" - POST   /api/auth/login")
	log.Println(" - POST   /api/enrollments/public")
	log.Println(" - CRUD   /api/enrollments/* (State Pattern)")
	log.Println(" - CRUD   /api/grades/* (Memento Pattern: undo, redo, restore)")
	log.Println(" - ADMIN  /api/director/*")

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Error en el servidor HTTP: %v", err)
	}
}

