package service

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"sistema-colegio/internal/domain/entities"
	"sistema-colegio/internal/repository"
)

var (
	JwtSecretKey = []byte("sistema_gestion_escolar_jwt_secret_key_2026")
)

type AuthService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

type LoginDTO struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string         `json:"token"`
	User  *entities.User `json:"user"`
}

func (s *AuthService) Login(dto LoginDTO) (*AuthResponse, error) {
	u, err := s.userRepo.GetByUsername(dto.Username)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, errors.New("credenciales incorrectas: usuario no encontrado")
	}

	if !u.IsActive {
		return nil, errors.New("la cuenta de usuario está desactivada por la dirección")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(dto.Password)); err != nil {
		return nil, errors.New("credenciales incorrectas: contraseña inválida")
	}

	tokenString, err := s.GenerateToken(u)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: tokenString,
		User:  u,
	}, nil
}

func (s *AuthService) GenerateToken(u *entities.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":       u.ID,
		"username":  u.Username,
		"full_name": u.FullName,
		"role":      string(u.Role),
		"exp":       time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JwtSecretKey)
}
