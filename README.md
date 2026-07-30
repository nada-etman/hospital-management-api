# Hospital Management System API

A production-style REST API for managing a hospital: patients, doctors, departments, appointments, medical records and billing — built with Node.js, Express, Prisma and PostgreSQL.

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| ORM / DB | Prisma + PostgreSQL |
| Auth | JWT (access token) + httpOnly refresh-token cookie |
| Cache | Redis (optional, app degrades gracefully without it) |
| Validation | express-validator |
| Docs | Swagger / OpenAPI 3 (`swagger-jsdoc` + `swagger-ui-express`) |
| Logging | Winston (daily rotating files) + Morgan |
| Testing | Jest + Supertest |
| Containerization | Docker + docker-compose |
| CI | GitHub Actions |

## Features

- **Auth**: register + email verification, login, JWT access tokens, rotating refresh tokens (httpOnly cookie), forgot/reset password, logout.
- **RBAC**: role middleware (`ADMIN`, `DOCTOR`, `PATIENT`, `RECEPTIONIST`) guarding every sensitive route.
- **Patients / Doctors / Departments / Appointments / Medical Records / Billing**: full CRUD, each behind role checks.
- **Repository + Service layer** on the Patients module as the reference pattern for keeping controllers thin (recommended to replicate for other modules as the project grows).
- **Soft delete** on Users, Patients, and Doctors (`isDeleted` / `deletedAt`) instead of destructive deletes.
- **Double-booking protection**: appointment creation checks for existing PENDING/CONFIRMED appointments for the same doctor + time slot, wrapped in a Prisma `$transaction` with an audit-log entry.
- **Audit logging**: sensitive actions (e.g. deleting a patient) are recorded with actor, entity, and payload.
- **Consistent response envelope**: every response is `{ success, message, data, meta? }` / `{ success: false, message, errors? }`.
- **Centralized error handling**: typed error classes (`NotFoundError`, `ConflictError`, `ForbiddenError`, `UnauthorizedError`, `ValidationError`) plus Prisma error code translation (P2002/P2025/P2003).
- **Rate limiting**: global limiter + a stricter limiter on auth endpoints.
- **Pagination, search & filters**: unified pagination helper used across list endpoints.
- **Dashboard stats endpoint** for admins (counts, today's appointments, revenue, status breakdown).
- **API versioning**: everything lives under `/api/v1`, so breaking changes later go in `/api/v2` without touching v1.
- **Database indexes** on foreign keys and frequently filtered columns (`date`, `[doctorId, date]`, `status`, etc.).
- **Health check**: `/health` actually pings the database (and Redis, if configured) instead of just returning 200.
- **Image upload** middleware (Multer) for profile photos, served from `/uploads`.
- **Swagger UI** at `/api-docs`, generated from JSDoc comments on the routes — stays in sync with the code.
- **Docker Compose** stack: app + Postgres + Redis + pgAdmin.
- **GitHub Actions CI**: spins up Postgres, runs migrations, tests, and lint on every push/PR.
- **Seed script**: creates an admin, departments, doctors and patients from a real, cleaned Kaggle dataset (~55,000 patients + ~40,000 doctors) — falls back to Faker-generated data if the CSV isn't present.

## Project Structure

```
src/
├── config/        # env, db, logger, redis, swagger
├── controllers/    # thin HTTP layer
├── errors/         # typed AppError subclasses
├── middlewares/     # auth, roles, validation, rate limit, upload, audit, error handler
├── repositories/    # data-access layer (Patient module — pattern to extend)
├── services/        # business logic (Patient module — pattern to extend)
├── routes/v1/        # versioned routes + swagger annotations
├── utils/            # apiResponse, tokens, email, pagination
└── validators/        # express-validator rule sets
prisma/
├── schema.prisma
├── seed.js
└── data/              # raw + cleaned Kaggle CSV, clean-dataset.js, csv-utils.js
tests/
├── unit/
└── integration/
```

## Getting Started

```bash
git clone <your-repo-url>
cd hospital-management-api
npm install
cp .env.example .env.development   # fill in DATABASE_URL, JWT_SECRET, SMTP_*, etc.
npx prisma migrate dev --name init
npm run seed
npm run dev
```

The API is now at `http://localhost:5000/api/v1`, and interactive docs at `http://localhost:5000/api-docs`.

Default seeded logins (password for all: `Password123!`):
- `admin@hospital.com` (ADMIN)
- `reception@hospital.com` (RECEPTIONIST)
- Doctors and patients get random emails — check the seed log output, or query the DB / use Prisma Studio (`npx prisma studio`).

### Real-world data pipeline (Kaggle)

Patients aren't fake — they're seeded from the Kaggle ["Healthcare Dataset"](https://www.kaggle.com/datasets/prasad22/healthcare-dataset) (~55,000 records), run through a two-step pipeline:

1. **`npm run clean-data`** — reads `prisma/data/healthcare_dataset.csv` and writes `healthcare_dataset.clean.csv`, fixing real data-quality issues found in the raw file: 534 exact duplicate rows removed, 106 negative `Billing Amount` values corrected, and inconsistent name casing normalized (see `prisma/data/clean-dataset.js` for the exact rules).
2. **`npm run seed`** — maps the cleaned CSV onto the schema: `Patient` (name, age→dob, gender, blood type), `Doctor` (deduplicated from the `Doctor` column), `MedicalRecord` (condition, medication, test results), `Appointment` (admission date, status), and `Billing` (amount, status). Runs with bounded concurrency and progress logging since it's writing ~55,000 patients + ~40,000 doctors.

See `prisma/data/README.md` for the full breakdown.

### Docker

```bash
docker compose up --build
```

### Tests

```bash
npm test
```

## API Overview

All endpoints are prefixed with `/api/v1`.

| Module | Routes |
|---|---|
| Auth | `POST /auth/register`, `GET /auth/verify-email`, `POST /auth/login`, `POST /auth/refresh-token`, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Departments | `GET/POST /departments`, `GET/PUT/DELETE /departments/:id` |
| Doctors | `GET/POST /doctors`, `GET/PUT/DELETE /doctors/:id` |
| Patients | `GET/POST /patients`, `GET/PUT/DELETE /patients/:id` |
| Appointments | `GET/POST /appointments`, `GET /appointments/:id`, `PUT /appointments/:id/status`, `DELETE /appointments/:id` |
| Medical Records | `POST /records`, `GET /records/patient/:patientId`, `GET/PUT/DELETE /records/:id` |
| Billing | `GET/POST /billing`, `GET /billing/:id`, `PUT /billing/:id/status` |
| Stats | `GET /stats/dashboard` (Admin) |

Full request/response schemas are in Swagger (`/api-docs`).

## Notes on what was intentionally kept simple

To keep this a coherent, working codebase rather than a pile of half-wired ideas, a few "nice-to-have" extensions discussed during planning were **left out of this delivery** on purpose:
- **Full DB-driven RBAC (Role/Permission/RolePermission tables)** — the simpler role-array middleware (`checkRole('ADMIN', ...)`) is used instead. It's easy to swap in the DB-driven version later if you need per-permission granularity (e.g. a `NURSE` role with a custom permission set).
- **BullMQ background job queue** for emails — emails are sent inline (failures are logged, not thrown, so they won't break a request) via `nodemailer`. If email volume grows, wrapping `sendEmail` calls in a BullMQ queue is a clean follow-up.
- **Redis caching of list endpoints** — the Redis client is wired up and used by the health check, but response caching (e.g. for `/departments`) isn't applied yet; it's a good next step once you have real traffic patterns to justify it.

Adding these back in is mostly additive (new files + a few call-sites), not a rewrite — they were left out here to keep the delivered code fully working end-to-end rather than partially stubbed.
