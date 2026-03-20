# TaskFlow Pro

A full-stack task and project management web application built for **COM5409 – Web Design and Programming** at the University of Greater Manchester.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (via Prisma ORM) |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Auth | JWT + bcrypt |
| API Docs | Swagger / OpenAPI |
| Testing | Jest · Supertest · React Testing Library · Playwright |

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** v20 or higher — https://nodejs.org
- **npm** v9 or higher (comes with Node.js)
- **PostgreSQL** v14 or higher — https://www.postgresql.org/download
- **Git** — https://git-scm.com

---

## Project Structure

```
taskflow-pro/
├── backend/                  # Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (User, Project, Task)
│   │   └── migrations/       # Auto-generated migration files
│   ├── src/
│   │   ├── config/           # Prisma client, Swagger setup
│   │   ├── controllers/      # Route handler logic
│   │   ├── middleware/       # Auth, error handler, logger
│   │   ├── routes/           # Express route definitions
│   │   ├── utils/            # Validators, sanitizers, JWT helpers
│   │   ├── app.ts            # Express app setup
│   │   └── index.ts          # Server entry point
│   ├── tests/                # Jest unit + integration tests
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React + TypeScript SPA
│   ├── src/
│   │   ├── api/              # Axios API call functions
│   │   ├── components/       # Reusable components + UI primitives
│   │   ├── context/          # AuthContext (global auth state)
│   │   ├── hooks/            # useProjects, useTasks custom hooks
│   │   ├── pages/            # Login, Register, Dashboard, ProjectDetail
│   │   └── types/            # TypeScript interfaces
│   ├── tests/                # React Testing Library tests
│   ├── package.json
│   └── vite.config.ts
├── e2e/                      # Playwright end-to-end tests
│   ├── auth.spec.ts
│   ├── tasks.spec.ts
│   └── helpers.ts
├── playwright.config.ts
└── README.md
```

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd taskflow-pro
```

### 2. Set up the backend

```bash
cd backend
npm install
```

### 3. Configure environment variables

```bash
cp ../.env.example .env
```

Open `.env` and fill in your values:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/taskflow_pro"
PORT=4000
NODE_ENV=development
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

> **Tip:** Create the PostgreSQL database first:
> ```sql
> CREATE DATABASE taskflow_pro;
> ```

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables (users, projects, tasks) in your database.

### 5. Generate the Prisma client

```bash
npx prisma generate
```

### 6. Set up the frontend

```bash
cd ../frontend
npm install
```

---

## Running the Application

### Start the backend (in one terminal)

```bash
cd backend
npm run dev
```

Backend runs at: **http://localhost:4000**
Swagger API docs at: **http://localhost:4000/api-docs**

### Start the frontend (in another terminal)

```bash
cd frontend
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Running Tests

### Backend: Unit tests (validators, sanitizers, JWT utils)

```bash
cd backend
npm test
```

### Backend: All tests with coverage report

```bash
cd backend
npm run test:coverage
```

### Frontend: React Testing Library component tests

```bash
cd frontend
npm test
```

### End-to-end tests (Playwright)

> Make sure both backend and frontend are running before executing E2E tests.

```bash
# From the root of the project
npx playwright test

# Run with browser UI visible (headed mode)
npx playwright test --headed

# Run only auth tests
npx playwright test e2e/auth.spec.ts

# View the HTML test report
npx playwright show-report
```

---

## API Documentation

Once the backend is running, visit:

```
http://localhost:4000/api-docs
```

All endpoints are documented with request/response schemas. Click **Authorize** and paste your JWT token (obtained from `POST /api/auth/login`) to test protected endpoints.

### Key endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register a new account |
| POST | `/api/auth/login` | No | Login and receive JWT |
| GET | `/api/auth/me` | Yes | Get current user profile |
| GET | `/api/projects` | Yes | List all your projects |
| POST | `/api/projects` | Yes | Create a project |
| GET | `/api/projects/:id` | Yes | Get project with tasks |
| PUT | `/api/projects/:id` | Yes | Update a project |
| DELETE | `/api/projects/:id` | Yes | Delete a project |
| GET | `/api/projects/:id/tasks` | Yes | List tasks in a project |
| POST | `/api/projects/:id/tasks` | Yes | Create a task |
| PUT | `/api/projects/:id/tasks/:taskId` | Yes | Update a task |
| DELETE | `/api/projects/:id/tasks/:taskId` | Yes | Delete a task |

---

## Security

This application implements the following security measures:

- **Passwords** hashed with bcrypt (12 salt rounds) — never stored in plaintext
- **JWT** tokens with configurable expiry for stateless authentication
- **Helmet.js** — sets secure HTTP response headers (X-Frame-Options, HSTS, etc.)
- **CORS** restricted to the frontend origin only
- **Rate limiting** — 100 req/15 min globally; 10 req/15 min on auth endpoints
- **Input validation** on all endpoints with meaningful error messages
- **Input sanitization** using the `xss` library against XSS attacks
- **Prisma ORM** parameterised queries prevent SQL injection
- **Generic auth error messages** to prevent user enumeration (OWASP A07)
- **Role-based access control** — ADMIN and USER roles enforced per route
- **Ownership checks** — users can only access/modify their own data

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | API port (default: 4000) |
| `NODE_ENV` | No | `development` or `production` |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `CORS_ORIGIN` | No | Allowed frontend origin (default: `http://localhost:5173`) |

---

## Available Scripts

### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Run all Jest tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:reset` | Reset database (⚠️ deletes all data) |

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run React Testing Library tests |
| `npm run test:coverage` | Run tests with coverage |

---

## AI Tools Declaration

As required by the assessment brief (Category B):

- **Claude (Anthropic)** was used to assist with: understanding module concepts, debugging TypeScript errors, and exploring approaches to certain implementation challenges.
- All design decisions, architecture choices, implementation code, and written analysis are the student's own work.
- All code was reviewed, understood, and can be fully explained and justified at the demo.

---

*COM5409 – Web Design and Programming · University of Greater Manchester · 2025/26*
