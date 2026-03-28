# PrimeTrade Task Manager API

Scalable REST API with JWT Authentication, Role-Based Access Control, and a Vanilla JS frontend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Docs | Swagger UI |
| Frontend | Vanilla JS, HTML, CSS |

---

## Architecture Overview

This project is organized as a layered monolith:
- `routes` define versioned endpoints
- `controllers` handle request/response logic
- `middleware` enforces auth, validation, sanitization, and error handling
- Prisma manages database access to PostgreSQL
- The backend also serves the frontend and Swagger documentation

```mermaid
flowchart LR
    U["User Browser"] --> F["Frontend<br/>HTML / CSS / Vanilla JS"]
    U --> S["Swagger UI<br/>/api/docs"]
    F --> A["Express App<br/>server.js + src/app.js"]
    S --> A

    A --> M["Middleware Layer<br/>cors, helmet, rate-limit,<br/>sanitize, auth, validate"]
    M --> R["Routes<br/>/api/v1/auth<br/>/api/v1/tasks<br/>/api/v1/admin"]
    R --> C["Controllers<br/>auth / task / admin"]
    C --> P["Prisma Client"]
    P --> D["PostgreSQL Database"]

    C --> J["JWT + bcrypt"]
    A --> H["Health Check<br/>/api/health"]
```

### Request Lifecycle

```text
Client Request
   ->
Express App
   ->
Security / Parsing / Rate Limit Middleware
   ->
Route Handler
   ->
Validation + Authentication Middleware
   ->
Controller
   ->
Prisma
   ->
PostgreSQL
   ->
Standard JSON Response { success, message, data }
```

---

## Frontend Wireframe

```text
+-----------------------------------------------------------------------------------+
| AUTH SCREEN                                                                       |
|-----------------------------------------------------------------------------------|
| PrimeTrade                         Operations cockpit                              |
| Run task delivery with a sharper control panel                                     |
| [ JWT ] [ RBAC ] [ CRUD ]                                                         |
|                                                                                   |
|                          +-------------------------------------+                  |
|                          | Login | Register                    |                  |
|                          |-------------------------------------|                  |
|                          | Email                               |                  |
|                          | Password                            |                  |
|                          | [ Sign In ]                         |                  |
|                          +-------------------------------------+                  |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
| DASHBOARD                                                                         |
|-----------------------------------------------------------------------------------|
| Sidebar                | Hero / Mission Board                                     |
| - Tasks                | "Execution overview"                                     |
| - Admin                | Role pill                                                |
| - API Docs             | [ Current View ] [ To Do ] [ In Progress ] [ Done ]      |
|                        |                                                           |
| User Card              | Filter chips: All / To Do / In Progress / Done           |
| Logout                 |                                                           |
|                        | +----------------+  +----------------+                    |
|                        | | Task Card      |  | Task Card      |                    |
|                        | | Title          |  | Title          |                    |
|                        | | Status Badge   |  | Status Badge   |                    |
|                        | | Description    |  | Description    |                    |
|                        | | Edit Delete    |  | Edit Delete    |                    |
|                        | +----------------+  +----------------+                    |
|                        |                                                           |
|                        | Pagination                                               |
+-----------------------------------------------------------------------------------+
```

---

## Setup

### 1. Prerequisites
- Node.js >= 18
- PostgreSQL running locally

### 2. Clone & Install
```bash
git clone https://github.com/anjalii40/Hiring-Assessment---Primetrade
cd "hiring assesment primetrade"
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```
Edit `.env`:
```env
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/primetrade_db?schema=public"
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 4. Run Database Migrations
```bash
npm run db:migrate
npm run db:generate
```

### 5. Start the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, returns JWT |
| GET | `/auth/me` | ✅ | Get current user |

### Tasks (CRUD)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/tasks` | ✅ | List tasks (users: own; admin: all) |
| GET | `/tasks/:id` | ✅ | Get task by ID |
| POST | `/tasks` | ✅ | Create task |
| PUT | `/tasks/:id` | ✅ | Update task (owner or admin) |
| DELETE | `/tasks/:id` | ✅ | Delete task (owner or admin) |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/users` | 🔒 Admin | List all users |
| PATCH | `/admin/users/:id/role` | 🔒 Admin | Promote/demote user |

### System
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/docs` | Swagger UI |

---

## Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Role-Based Access

| Permission | USER | ADMIN |
|---|---|---|
| See own tasks | ✅ | ✅ |
| See all users' tasks | ❌ | ✅ |
| Delete/edit any task | ❌ | ✅ |
| Access admin panel | ❌ | ✅ |

---

## Response Format

All responses follow this consistent structure:
```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

Error responses include:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## Scalability Notes

- **API Versioning**: All routes prefixed `/api/v1/` for backward-compatible evolution
- **Rate Limiting**: 100 req/15min globally; 20 req/15min on auth endpoints
- **Pagination**: All list endpoints support `?page=&limit=` query params
- **Modular Structure**: Routes → Controllers → Prisma (no business logic leaking between layers)
- **Future-ready**: Can extract `auth`, `tasks`, and `admin` into separate microservices
- **Caching**: Redis can be added to cache `GET /tasks` responses (TTL 60s per user)
- **Deployment**: Stateless API — scales horizontally behind a load balancer (e.g., Nginx + PM2 or Docker + K8s)

---

## Frontend

The backend serves the frontend automatically at `http://localhost:3000`:
- Register / Login with JWT
- View and manage your tasks (CRUD)
- Admin users can see all tasks and manage roles

> If you deploy the backend to another origin, update `CORS_ORIGIN` and the frontend origin accordingly.

---

## Project Structure

```
├── server.js              # Entry point
├── src/
│   ├── app.js             # Express app setup
│   ├── config/
│   │   ├── database.js    # Prisma client
│   │   └── swagger.js     # Swagger config
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── admin.controller.js
│   │   └── task.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── sanitize.middleware.js
│   │   └── validate.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── task.routes.js
│   │   └── admin.routes.js
│   └── validators/
│       ├── auth.validator.js
│       ├── admin.validator.js
│       └── task.validator.js
├── prisma/
│   └── schema.prisma      # DB schema
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── api.js         # API client
        └── app.js         # App logic
```
