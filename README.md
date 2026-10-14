# TaskFlow

A small full-stack task manager.

- **Frontend:** React 18 + Vite → deployed on Vercel
- **Backend:** Spring Boot 3.3 (Java 17), Spring Data JPA → deployed on Render (Docker)
- **Database:** H2 in-memory locally, PostgreSQL on Render

## Features
Create, edit, delete and complete tasks · priority levels · all/active/done filter · input validation.

## REST API
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | List tasks (newest first) |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/{id}` | Update a task |
| PATCH | `/api/tasks/{id}/toggle` | Toggle completed |
| DELETE | `/api/tasks/{id}` | Delete a task |

## Run locally
```bash
# backend  (http://localhost:8080)
cd backend && mvn spring-boot:run

# frontend (http://localhost:5173)
cd frontend && npm install && npm run dev
```

## Deploy
See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for the full step-by-step (GitHub → Render → Vercel).
