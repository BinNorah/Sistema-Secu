# Architecture Diagram

This diagram summarizes how the school management system connects its browser interface, Go REST API, and SQLite persistence. The second view focuses on the principal component dependencies and cross-cutting concerns.

## Application Architecture

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
flowchart TD
    subgraph ClientLayer["Web Client"]
        Browser["Web Browser"]
        ReactUI["React User Interface"]
        Router["React Router"]
        HttpClient["Axios API Client"]
    end
    subgraph ServerLayer["Go REST Server"]
        RouterHTTP["Chi HTTP Router"]
        Middleware["JWT Role Middleware"]
        Handlers["HTTP Handlers"]
        Services["Business Services"]
        Domain["Domain Rules"]
        RepoPorts["Repository Interfaces"]
        SQLiteAdapter["SQLite Adapter"]
    end
    subgraph DataLayer["Local Persistence"]
        Database[("SQLite Database")]
        Uploads["Uploaded Documents"]
    end

    Browser -->|"renders"| ReactUI
    ReactUI -->|"selects pages"| Router
    Router -->|"calls"| HttpClient
    HttpClient -->|"HTTP JSON and Bearer token"| RouterHTTP
    RouterHTTP -->|"routes requests"| Middleware
    Middleware -->|"authorized request"| Handlers
    Handlers -->|"invokes"| Services
    Services -->|"applies"| Domain
    Services -->|"uses contracts"| RepoPorts
    RepoPorts -.->|"implemented by"| SQLiteAdapter
    SQLiteAdapter -->|"SQL and transactions"| Database
    Handlers -->|"reads and serves files"| Uploads
```

### Technology Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Web UI | React | 19.x | Renders public pages and school modules |
| Web build and development | Vite | 8.x | Serves the frontend in development and builds static assets |
| Client routing | React Router | 7.x | Maps browser paths to pages |
| HTTP client | Axios | 1.x | Calls the REST API and sends bearer tokens |
| API server | Go | 1.26.10 module target | Runs handlers and business services |
| HTTP routing | Chi | 5.x | Matches REST paths and applies router middleware |
| Relational storage | SQLite with modernc.org/sqlite | 1.61.1 | Persists accounts, admissions, grades, and academic data |
| Authentication | JWT and bcrypt | Go modules | Signs access tokens and verifies password hashes |

### Data Storage & External Services

SQLite is the persistent store and is opened or created at startup. Numbered SQL migrations are embedded in the Go backend and applied on startup; demonstration users and school records are seeded when the database has no users. Uploaded documents are stored on the backend filesystem and served under `/uploads`. There is no separate cache, message broker, or required external service in the current local architecture.

### Key Architectural Decisions

- The frontend communicates with Go through JSON HTTP endpoints; it does not connect directly to SQLite.
- Services depend on repository contracts while the SQLite package provides the concrete storage adapter.
- Authentication and role checks are enforced by backend middleware; frontend route checks only control the user experience.
- Admission requests and normalized academic enrollments remain distinct data models; attendance and timetable screens are not yet backed by write endpoints.

## Component Relationships

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
flowchart LR
    subgraph cPresentation["Presentation"]
        cPages["React Pages and Modules"]
        cRoutes["App Routes"]
        cApiClient["Axios Client"]
    end
    subgraph cHttpLayer["HTTP and Security"]
        cChi["Chi Router"]
        cCors["CORS Middleware"]
        cJwt["JWT Authentication"]
        cRole["Role Authorization"]
        cHandlers["REST Handlers"]
    end
    subgraph cBusinessLayer["Business Logic"]
        cAuthService["Authentication Service"]
        cEnrollmentService["Enrollment Service"]
        cGradeService["Grade Service"]
        cMementoService["Memento Service"]
        cDirectorService["Director Service"]
        cDomain["Domain Entities and Rules"]
    end
    subgraph cDataLayer["Data Access"]
        cRepoInterfaces["Repository Interfaces"]
        cUserRepo["User Repository"]
        cEnrollmentRepo["Enrollment Repository"]
        cGradeRepo["Grade Repository"]
        cAcademicRepo["Academic Repository"]
        cSqlite["SQLite Database"]
    end
    subgraph cInfrastructure["Infrastructure"]
        cBootstrap["API Composition Root"]
        cMigrations["Embedded SQL Migrations"]
        cUploads["Upload File Server"]
    end

    cPages -->|"navigation"| cRoutes
    cRoutes -->|"API requests"| cApiClient
    cApiClient -->|"HTTP JSON"| cChi
    cCors -.->|"cross origin policy"| cChi
    cChi -->|"routes"| cJwt
    cJwt -->|"authenticated requests"| cRole
    cRole -->|"authorized requests"| cHandlers
    cHandlers -->|"delegates"| cAuthService
    cHandlers -->|"delegates"| cEnrollmentService
    cHandlers -->|"delegates"| cGradeService
    cHandlers -->|"delegates"| cMementoService
    cHandlers -->|"delegates"| cDirectorService
    cAuthService -->|"uses"| cDomain
    cEnrollmentService -->|"uses"| cDomain
    cGradeService -->|"uses"| cDomain
    cAuthService -->|"queries"| cRepoInterfaces
    cEnrollmentService -->|"queries"| cRepoInterfaces
    cGradeService -->|"queries"| cRepoInterfaces
    cMementoService -->|"queries"| cRepoInterfaces
    cDirectorService -->|"queries"| cRepoInterfaces
    cRepoInterfaces -.->|"implemented by"| cUserRepo
    cRepoInterfaces -.->|"implemented by"| cEnrollmentRepo
    cRepoInterfaces -.->|"implemented by"| cGradeRepo
    cRepoInterfaces -.->|"implemented by"| cAcademicRepo
    cUserRepo -->|"SQL"| cSqlite
    cEnrollmentRepo -->|"SQL"| cSqlite
    cGradeRepo -->|"SQL and snapshots"| cSqlite
    cAcademicRepo -->|"SQL"| cSqlite
    cBootstrap -->|"wires components"| cChi
    cBootstrap -->|"opens database"| cSqlite
    cMigrations -->|"creates schema"| cSqlite
    cChi -->|"serves documents"| cUploads
```

### Component Inventory

| Component | Layer | Type | Responsibility |
|---|---|---|---|
| `AppRoutes` and React pages | Presentation | Router and UI | Maps URLs and renders workflows |
| Axios client | Presentation | HTTP client | Adds API base URL, bearer token, timeout, and error mapping |
| Chi router | HTTP | Router | Maps paths and installs shared middleware |
| Authentication and role middleware | HTTP security | Middleware | Validates JWT and limits protected operations by role |
| Handlers | HTTP | Controllers | Decode requests, call services, and write responses |
| Services | Business logic | Use cases | Coordinate authentication, enrollment, grades, history, and academic administration |
| Domain entities and patterns | Domain | Business rules | Represents core concepts and State or Memento behavior |
| Repository interfaces | Data boundary | Ports | Define persistence operations required by services |
| SQLite repositories | Data access | Adapters | Execute queries and transactions against SQLite |
| API composition root | Infrastructure | Bootstrap | Creates and connects routers, handlers, services, repositories, and database |
| SQL migrations | Infrastructure | Schema versioning | Builds and upgrades the local database schema |
| Upload file server | Infrastructure | Static files | Exposes uploaded documents through `/uploads` |
