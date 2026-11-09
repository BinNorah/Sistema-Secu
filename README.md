# SISTEMA DE GESTIÓN ESCOLAR - COLEGIO SECUNDARIO
**Grupo 4: Implementación Completa con Arquitectura Limpia y Patrones de Diseño (State + Memento)**

Sistema integral desarrollado para la gestión académica y administrativa de un colegio secundario (1° a 5° de Secundaria), conectando **Go (Chi Router)**, **React + Vite + Tailwind CSS**, y base de datos relacional **SQLite (`app.db`)** con autenticación **JWT** y contraseñas cifradas con **bcrypt**.

---

## 1. TECNOLOGÍAS UTILIZADAS

- **Backend:** Go (Golang) v1.21+ con [Chi Router v5](https://github.com/go-chi/chi)
- **Frontend:** React 19 + Vite + Tailwind CSS v4 + Lucide React + Axios + React Router DOM
- **Base de Datos:** SQLite (`app.db`) con driver nativo en Go puro (`modernc.org/sqlite`) sin dependencia de CGO ni GCC
- **Seguridad:** Autenticación JWT v5 y hashing con bcrypt
- **Almacenamiento de Documentos:** Servidor estático integrado en `/uploads/*` para boletas de notas y constancias

---

## 2. ESTRUCTURA DEL PROYECTO (ARQUITECTURA LIMPIA POR CAPAS)

```text
SistemaColegio/
│
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go              # Punto de entrada principal Chi
│   │
│   ├── internal/
│   │   ├── domain/                  # CAPA 1: Dominio y Reglas de Negocio
│   │   │   ├── entities/            # Entidades (Enrollment, Grade, Student, Guardian, User)
│   │   │   └── patterns/
│   │   │       ├── state/           # Patrón STATE (Matrículas: Pendiente, Aprobada, Observada, Anulada)
│   │   │       └── memento/         # Patrón MEMENTO (Notas: Originator, Memento, Caretaker)
│   │   │
│   │   ├── repository/              # CAPA 2: Interfaces de acceso a datos
│   │   │   ├── interfaces.go        # Puertos de los repositorios
│   │   │   └── sqlite/              # Adaptadores SQLite y semillas
│   │   │
│   │   ├── service/                 # CAPA 3: Casos de Uso y Servicios
│   │   │   ├── auth_service.go
│   │   │   ├── enrollment_service.go
│   │   │   ├── grade_service.go
│   │   │   ├── memento_service.go
│   │   │   └── director_service.go
│   │   │
│   │   ├── handler/                 # CAPA 4: Controladores HTTP y Rutas REST
│   │   │   ├── auth_handler.go
│   │   │   ├── enrollment_handler.go
│   │   │   ├── grade_handler.go
│   │   │   ├── director_handler.go
│   │   │   └── routes.go
│   │   │
│   │   └── middleware/              # Autenticación JWT y Guardas de Roles
│   │       └── auth_middleware.go
│   │
│   ├── migrations/                  # Esquema inicial y modelo académico versionados
│   ├── uploads/                     # Boletas de notas y comprobantes subidos
│   ├── app.db                       # Base de datos SQLite
│   ├── go.mod
│   └── cmd/api/main.go              # Unico punto de entrada
│
├── frontend/
│   ├── src/
│   │   ├── api/                     # Cliente Axios con interceptor JWT
│   │   ├── components/              # Navbar público (Inicio, Matrícula, Iniciar Sesión)
│   │   ├── layouts/                 # Estructura compartida de las pantallas
│   │   ├── pages/                   # Rutas de la aplicacion
│   │   ├── styles/                  # Tokens visuales
│   │   ├── features/
│   │   │   ├── auth/                # Login con selector de 3 perfiles y credenciales de prueba
│   │   │   ├── enrollment/          # Página de Inicio y Formulario de Matrícula pública
│   │   │   ├── secretariat/         # Panel de Secretaría: KPIs, emisión SIAGIE, validación y pagos
│   │   │   ├── director/            # Panel de Dirección: Usuarios, Grados, Secciones, Asignaciones
│   │   │   └── teacher/             # Panel Docente: 4 Bimestres (0-20), Undo, Redo e Historial Memento
│   │   ├── App.jsx                  # Enrutador principal
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── docs/                            # Arquitectura y contrato HTTP
└── README.md
```

Las solicitudes existentes siguen usando el flujo de admision y las notas B1-B4. Las tablas academicas normalizadas se agregan en forma compatible mediante migraciones numeradas. La descripcion detallada de las capas y el contrato HTTP se encuentra en [docs/arquitectura.md](./docs/arquitectura.md) y [docs/api.md](./docs/api.md).

---

## 3. GRUPO 4: PATRONES DE DISEÑO IMPLEMENTADOS

### A. Patrón State (CRUD de Matrículas)
- **Problema que resuelve:** Evitar sentencias `if/else` gigantescas y garantizar transiciones de estado válidas según el flujo normativo de matrícula.
- **Estados:** `Pendiente`, `Aprobada`, `Observada`, `Anulada`.
- **Reglas de Transición:**
  1. Toda matrícula nueva inicia en **Pendiente** con código de solicitud temporal (`SOL-2026-xxxx`).
  2. Una matrícula **Pendiente** puede transicionar a **Aprobada** (emitiendo código oficial SIAGIE `MAT-2026-SEC-xxxx`), a **Observada** (requiriendo subsanación) o a **Anulada**.
  3. Una matrícula **Observada** puede subsanarse regresando a **Pendiente** o directamente a **Aprobada**.
  4. Una matrícula **Aprobada** es inmutable ante modificaciones arbitrarias; solo puede ser **Anulada** con justificación por traslado externo para preservar la auditoría.
  5. Una matrícula **Anulada** es un estado terminal que no permite reactivación arbitraria.

### B. Patrón Memento (CRUD de Notas)
- **Problema que resuelve:** Registrar y restaurar versiones anteriores de calificaciones bimestrales (B1 a B4) sin violar el principio de encapsulamiento del objeto `Grade`.
- **Componentes:**
  - **Originator (`Grade`):** Entidad que calcula el promedio (0-20), genera snapshots mediante `CreateMemento()` y restaura su estado interno con `RestoreMemento()`.
  - **Memento (`GradeMemento`):** Instantánea inmutable que almacena la versión, las notas de los 4 bimestres, el promedio, la fecha/hora y la acción realizada.
  - **Caretaker (`MementoService`):** Administra el historial de snapshots persistidos en la tabla `grade_mementos` de SQLite, permitiendo operaciones de **Deshacer (Undo)**, **Rehacer (Redo)** y **Restaurar Versión Específica**.

---

## 4. CREDENCIALES DE PRUEBA Y PERFILES

| Perfil | Usuario | Contraseña | Funciones Principales |
| :--- | :--- | :--- | :--- |
| **Secretaría** | `secretaria` | `Secre123*` | Gestionar solicitudes, emitir códigos SIAGIE, validar boletas y registrar pagos (S/ 920.00). |
| **Director** | `director` | `Direc123*` | Crear y activar/desactivar usuarios, gestionar grados y materias, asignar docentes a clases. |
| **Profesor** | `profesor` | `Profe123*` | Calificar bimestres B1 a B4 (0-20), ver promedios, deshacer cambios y consultar historial Memento. |

> **Nota:** La pantalla de inicio de sesión cuenta con un botón **[ Cargar de prueba ]** para autocompletar estas credenciales con un solo clic.

---

## 5. GUÍA DE EJECUCIÓN EN VISUAL STUDIO CODE

### Paso 1: Levantar el Backend (Go Chi)
Abra una terminal en VS Code y ejecute:
```powershell
cd backend
go run ./cmd/api
```
El backend iniciará en `http://localhost:8080`, creará la base de datos `app.db` con sus migraciones y datos semilla automáticamente.

### Paso 2: Levantar el Frontend (React + Vite)
Abra una segunda terminal en VS Code y ejecute:
```powershell
cd frontend
npm install
npm run dev
```
El frontend abrirá en `http://localhost:5173`.

---

## 6. GUÍA DE DESPLIEGUE EN AMAZON WEB SERVICES (AWS EC2 + UBUNTU + NGINX + HTTPS)

### Paso 1: Crear Instancia EC2 en AWS
1. Inicie sesión en la consola de AWS y acceda a **EC2**.
2. Lance una instancia con:
   - **AMI:** Ubuntu Server 24.04 LTS (x86_64).
   - **Tipo de instancia:** `t3.small` o `t2.micro` (Capa gratuita).
   - **Key Pair:** Cree o seleccione su par de claves `.pem`.
   - **Security Group (Reglas de Entrada):**
     - Puerto `22` (SSH) desde su IP.
     - Puerto `80` (HTTP) desde `0.0.0.0/0`.
     - Puerto `443` (HTTPS) desde `0.0.0.0/0`.

### Paso 2: Conectar a la Instancia e Instalar Dependencias
```bash
ssh -i "su-llave.pem" ubuntu@<IP-PUBLICA-EC2>

# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Nginx, Git, Node.js y Golang
sudo apt install -y nginx git certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo snap install go --classic
```

### Paso 3: Clonar el Proyecto y Compilar
```bash
cd /var/www
sudo git clone <URL_DE_SU_REPOSITORIO> sistema-colegio
sudo chown -R ubuntu:ubuntu /var/www/sistema-colegio
cd /var/www/sistema-colegio

# 1. Compilar Backend Go
cd backend
go build -o api-server ./cmd/api
mkdir -p uploads

# 2. Compilar Frontend React
cd ../frontend
npm install
npm run build
```

### Paso 4: Configurar el Servicio del Backend con systemd
Cree el archivo de servicio para mantener el backend activo en segundo plano:
```bash
sudo nano /etc/systemd/system/colegio-api.service
```
Pegue el siguiente contenido:
```ini
[Unit]
Description=API REST Backend Colegio Secundario
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/sistema-colegio/backend
ExecStart=/var/www/sistema-colegio/backend/api-server
Restart=always
RestartSec=5
Environment=PORT=8080
Environment=DB_PATH=/var/www/sistema-colegio/backend/app.db
Environment=UPLOADS_DIR=/var/www/sistema-colegio/backend/uploads

[Install]
WantedBy=multi-user.target
```
Active e inicie el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable colegio-api
sudo systemctl start colegio-api
sudo systemctl status colegio-api
```

### Paso 5: Configurar Nginx como Reverse Proxy y Servidor de Archivos
Edite la configuración del sitio en Nginx:
```bash
sudo nano /etc/nginx/sites-available/colegio
```
Pegue la configuración:
```nginx
server {
    listen 80;
    server_name su-dominio.com www.su-dominio.com; # o la IP pública de EC2

    # Frontend React (SPA)
    root /var/www/sistema-colegio/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API REST Go
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Documentos subidos (PDF y Boletas)
    location /uploads/ {
        proxy_pass http://localhost:8080/uploads/;
        proxy_set_header Host $host;
    }
}
```
Habilite el sitio y reinicie Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/colegio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Paso 6: Configurar Certificado SSL Gratuito con HTTPS (Let's Encrypt)
Si tiene un dominio apuntando a la IP pública de su instancia EC2, ejecute:
```bash
sudo certbot --nginx -d su-dominio.com -d www.su-dominio.com
```
Certbot configurará automáticamente la renovación del certificado SSL y redireccionará todo el tráfico HTTP a HTTPS.

---

## 7. VERIFICACIÓN Y PRUEBAS DEL SISTEMA

1. **Página de Inicio (`/`):** Acceso público con navegación a Inicio, Matrícula y Login.
2. **Matrícula Pública (`/matricula`):** Registro de estudiante, apoderado, subida de boleta en `uploads/` y generación de código de solicitud `SOL-2026-xxxx`.
3. **Módulo Secretaría (`/secretaria`):** Búsqueda de solicitudes, visualización de boleta, registro de pago y aprobación con emisión de código oficial SIAGIE `MAT-2026-SEC-xxxx` mediante el **Patrón State**.
4. **Módulo Director (`/director`):** Administración de personal docente y administrativo, creación de asignaturas y asignación de profesores.
5. **Módulo Docente (`/profesor`):** Registro de calificaciones bimestrales (0 a 20), cálculo de promedio, **Deshacer**, **Rehacer** y visualización de la línea de tiempo de versiones mediante el **Patrón Memento**.

#   S i s C o l e g i o  
 