package sqlite

import (
	"database/sql"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
	"sistema-colegio/internal/service"
)

func TestNewConnectionAppliesAcademicMigrations(t *testing.T) {
	db, err := NewConnection(filepath.Join(t.TempDir(), "colegio.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	var migrationCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM schema_migrations").Scan(&migrationCount); err != nil {
		t.Fatal(err)
	}
	if migrationCount != 2 {
		t.Fatalf("expected 2 numbered migrations, got %d", migrationCount)
	}

	var foreignKeys int
	if err := db.QueryRow("PRAGMA foreign_keys").Scan(&foreignKeys); err != nil {
		t.Fatal(err)
	}
	if foreignKeys != 1 {
		t.Fatalf("expected foreign keys to be enabled, got %d", foreignKeys)
	}

	for _, table := range []string{"docentes", "cursos", "asignaciones", "horarios", "matriculas", "notas", "nota_historial", "asistencias"} {
		var count int
		err := db.QueryRow(
			"SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?",
			table,
		).Scan(&count)
		if err != nil {
			t.Fatal(err)
		}
		if count != 1 {
			t.Errorf("expected table %q to exist", table)
		}
	}

	for _, expected := range []struct {
		table string
		count int
	}{
		{table: "cursos", count: 5},
		{table: "docentes", count: 2},
		{table: "matriculas", count: 1},
		{table: "notas", count: 4},
		{table: "nota_historial", count: 8},
	} {
		var count int
		if err := db.QueryRow("SELECT COUNT(*) FROM " + expected.table).Scan(&count); err != nil {
			t.Fatal(err)
		}
		if count != expected.count {
			t.Errorf("expected %d seeded rows in %q, got %d", expected.count, expected.table, count)
		}
	}

	if err := Migrate(db); err != nil {
		t.Fatalf("numbered migrations should be safe to apply again: %v", err)
	}

	gradeRepo := NewGradeRepository(db)
	gradeService := service.NewGradeService(gradeRepo)
	saved, err := gradeService.SaveGrade(3, service.SaveGradeDTO{
		StudentID:  2,
		SubjectID:  1,
		GradeLevel: "3° de Secundaria",
		Section:    "A",
		B1:         18,
		B2:         18,
		B3:         18,
		B4:         18,
	})
	if err != nil {
		t.Fatal(err)
	}
	if saved.CurrentVersion != 3 {
		t.Fatalf("expected grade version 3 after update, got %d", saved.CurrentVersion)
	}

	mementoService := service.NewMementoService(gradeRepo)
	if _, err := mementoService.Undo(saved.ID); err != nil {
		t.Fatal(err)
	}
	branched, err := gradeService.SaveGrade(3, service.SaveGradeDTO{
		StudentID:  2,
		SubjectID:  1,
		GradeLevel: "3° de Secundaria",
		Section:    "A",
		B1:         12,
		B2:         12,
		B3:         12,
		B4:         12,
	})
	if err != nil {
		t.Fatal(err)
	}
	if branched.CurrentVersion != 3 {
		t.Fatalf("expected a new branch at version 3, got %d", branched.CurrentVersion)
	}

	mementos, err := gradeRepo.ListMementos(saved.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(mementos) != 3 {
		t.Fatalf("expected abandoned redo history to be replaced, got %d mementos", len(mementos))
	}
	latest, err := gradeRepo.GetMementoByVersion(saved.ID, 3)
	if err != nil {
		t.Fatal(err)
	}
	if latest == nil || latest.B1 != 12 {
		t.Fatalf("expected version 3 to contain the branched grade, got %#v", latest)
	}
}

func TestNewConnectionUpgradesLegacySections(t *testing.T) {
	path := filepath.Join(t.TempDir(), "legacy.db")
	legacyDB, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	_, err = legacyDB.Exec(`
		CREATE TABLE grade_levels (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE
		);
		CREATE TABLE sections (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			grade_level_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			classroom TEXT NOT NULL
		);
	`)
	if err != nil {
		t.Fatal(err)
	}
	if err := legacyDB.Close(); err != nil {
		t.Fatal(err)
	}

	db, err := NewConnection(path)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	columns, err := db.Query("PRAGMA table_info(sections)")
	if err != nil {
		t.Fatal(err)
	}
	defer columns.Close()

	found := map[string]bool{}
	for columns.Next() {
		var id, notNull, primaryKey int
		var name, columnType string
		var defaultValue sql.NullString
		if err := columns.Scan(&id, &name, &columnType, &notNull, &defaultValue, &primaryKey); err != nil {
			t.Fatal(err)
		}
		found[name] = true
	}
	if err := columns.Err(); err != nil {
		t.Fatal(err)
	}
	for _, column := range []string{"academic_year", "capacity"} {
		if !found[column] {
			t.Errorf("expected legacy sections table to gain %q", column)
		}
	}
}
