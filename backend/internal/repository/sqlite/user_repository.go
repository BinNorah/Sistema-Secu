package sqlite

import (
	"database/sql"
	"fmt"

	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/repository"
)

type userRepo struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) repository.UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) GetByUsername(username string) (*entities.User, error) {
	query := `
		SELECT id, username, full_name, email, password_hash, role, is_active, created_at
		FROM users
		WHERE username = ?
	`
	row := r.db.QueryRow(query, username)

	var u entities.User
	var activeInt int
	err := row.Scan(&u.ID, &u.Username, &u.FullName, &u.Email, &u.PasswordHash, &u.Role, &activeInt, &u.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("error querying user: %w", err)
	}
	u.IsActive = (activeInt == 1)
	return &u, nil
}

func (r *userRepo) GetByID(id int64) (*entities.User, error) {
	query := `
		SELECT id, username, full_name, email, password_hash, role, is_active, created_at
		FROM users
		WHERE id = ?
	`
	row := r.db.QueryRow(query, id)

	var u entities.User
	var activeInt int
	err := row.Scan(&u.ID, &u.Username, &u.FullName, &u.Email, &u.PasswordHash, &u.Role, &activeInt, &u.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("error querying user by id: %w", err)
	}
	u.IsActive = (activeInt == 1)
	return &u, nil
}

func (r *userRepo) List(role string) ([]*entities.User, error) {
	query := `
		SELECT id, username, full_name, email, role, is_active, created_at
		FROM users
		WHERE 1=1
	`
	var args []interface{}
	if role != "" && role != "todos" {
		query += " AND role = ?"
		args = append(args, role)
	}
	query += " ORDER BY id DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*entities.User
	for rows.Next() {
		var u entities.User
		var activeInt int
		if err := rows.Scan(&u.ID, &u.Username, &u.FullName, &u.Email, &u.Role, &activeInt, &u.CreatedAt); err != nil {
			return nil, err
		}
		u.IsActive = (activeInt == 1)
		list = append(list, &u)
	}
	return list, nil
}

func (r *userRepo) Create(u *entities.User) error {
	activeInt := 0
	if u.IsActive {
		activeInt = 1
	}

	query := `
		INSERT INTO users (username, full_name, email, password_hash, role, is_active, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	res, err := r.db.Exec(query, u.Username, u.FullName, u.Email, u.PasswordHash, u.Role, activeInt, u.CreatedAt)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	u.ID = id
	return nil
}

func (r *userRepo) Update(u *entities.User) error {
	activeInt := 0
	if u.IsActive {
		activeInt = 1
	}

	query := `
		UPDATE users
		SET full_name = ?, email = ?, role = ?, is_active = ?
		WHERE id = ?
	`
	_, err := r.db.Exec(query, u.FullName, u.Email, u.Role, activeInt, u.ID)
	return err
}

func (r *userRepo) ToggleActive(id int64, active bool) error {
	val := 0
	if active {
		val = 1
	}
	_, err := r.db.Exec("UPDATE users SET is_active = ? WHERE id = ?", val, id)
	return err
}
