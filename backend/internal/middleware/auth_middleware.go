package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"sistema-colegio/internal/service"
)

type contextKey string

const (
	UserIDKey   contextKey = "userID"
	UserRoleKey contextKey = "userRole"
)

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error": "Cabecera Authorization requerida"}`, http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error": "Formato de token Bearer inválido"}`, http.StatusUnauthorized)
			return
		}

		tokenStr := parts[1]
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return service.JwtSecretKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, `{"error": "Token inválido o expirado"}`, http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, `{"error": "Claims de token no válidos"}`, http.StatusUnauthorized)
			return
		}

		userIDFloat, _ := claims["sub"].(float64)
		userRole, _ := claims["role"].(string)

		ctx := context.WithValue(r.Context(), UserIDKey, int64(userIDFloat))
		ctx = context.WithValue(ctx, UserRoleKey, userRole)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, _ := r.Context().Value(UserRoleKey).(string)
			allowed := false
			for _, ar := range allowedRoles {
				if strings.EqualFold(role, ar) {
					allowed = true
					break
				}
			}

			if !allowed {
				http.Error(w, `{"error": "Acceso denegado: permisos insuficientes para este perfil"}`, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func GetUserID(r *http.Request) int64 {
	val, _ := r.Context().Value(UserIDKey).(int64)
	return val
}

func GetUserRole(r *http.Request) string {
	val, _ := r.Context().Value(UserRoleKey).(string)
	return val
}

