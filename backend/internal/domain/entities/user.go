package entities

import "time"

type Role string

const (
	RoleSecretariat Role = "secretaria"
	RoleDirector    Role = "director"
	RoleTeacher     Role = "profesor"
)

type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	FullName     string    `json:"full_name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}
