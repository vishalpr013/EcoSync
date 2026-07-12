# EcoSync — AI-Powered ESG Management Platform

> **Built for the Odoo Hackathon** · EcoSphere Challenge

EcoSync is a full-stack enterprise SaaS platform that helps organizations measure, manage, and improve their Environmental, Social, and Governance (ESG) performance. It brings together carbon accounting, employee engagement, compliance tracking, and gamification into a single unified dashboard — all supercharged with an AI copilot.

---

## The Problem

Most organizations collect ESG-relevant data inside ERP systems, but turning that data into actionable sustainability insights requires manual effort, fragmented spreadsheets, and expensive consulting. There is no single tool that connects operational data to ESG reporting, engages employees in sustainability initiatives, and keeps governance teams audit-ready — all at once.

EcoSync solves exactly that.

---

## What EcoSync Does

EcoSync maps directly to the four pillars defined in the EcoSphere problem statement:

| Pillar | What it covers |
|---|---|
| 🌿 **Environmental** | Carbon transactions, emission factors, sustainability goals, department carbon tracking |
| 🤝 **Social** | CSR activities, employee participation, diversity metrics, evidence management |
| 🏛️ **Governance** | ESG policies, policy acknowledgements, audits, compliance issue tracking |
| 🎮 **Gamification** | Challenges, XP, auto-awarded badges, reward redemption, leaderboards |

On top of these, a **real-time ESG score** (Environmental 40% · Social 30% · Governance 30%, configurable) is computed per department and rolled up to an organization-wide score.

---

## Key Features

### Dashboard
A premium analytics dashboard showing the overall ESG score, pillar-level breakdowns, department rankings, recent carbon transactions, CSR participation rates, compliance status, and an employee leaderboard — all rendered with live Recharts visualizations.

### AI Copilot — EcoSync AI
An in-app AI assistant powered by **Google Gemini 2.0 Flash**, styled like a chat interface with full markdown rendering and streaming responses. It can:
- Answer questions about your organization's ESG data
- Generate executive ESG summaries
- Suggest carbon reduction strategies
- Identify compliance risks
- Generate CSR activity ideas
- Analyse department performance trends

### Reports
Generate Environmental, Social, Governance, and Executive ESG reports on demand. A **Custom Report Builder** lets users combine filters (department, employee, date range, challenge, ESG category) and export in **PDF**, **Excel**, or **CSV**.

### Role-Based Access Control (RBAC)
Five distinct roles with route-level protection on both frontend and backend:

| Role | Key Permissions |
|---|---|
| **Admin** | Full system access, user management, ESG configuration |
| **ESG Manager** | All module management, reports, AI Copilot |
| **Department Head** | Department dashboard, CSR approval, team reporting |
| **Employee** | CSR participation, challenges, reward redemption, badge collection |
| **Auditor** | Audit creation, compliance review, governance reports |

Unauthorized API requests return `HTTP 403`. Navigation menus adapt automatically based on the logged-in user's role.

### Business Logic (Non-Negotiable Rules)
- **Auto Emission Calculation** — when enabled, carbon transactions are derived automatically from linked operational records using the configured emission factor
- **Evidence Enforcement** — CSR participation cannot be approved without a proof file when the setting is active
- **Badge Auto-Award** — badges are assigned the moment an employee's XP or challenge completion count meets the unlock rule
- **Reward Redemption** — redeeming a reward deducts the corresponding points from the employee's balance and decrements stock
- **Compliance Ownership** — every compliance issue requires an assigned owner and a due date; overdue open issues are flagged and trigger notifications
- **Notification System** — in-app notifications for badge unlocks, CSR/challenge approvals, policy reminders, and compliance escalations

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite 8 | UI framework and build tooling |
| React Router v7 | Client-side routing and protected routes |
| Tailwind CSS v4 | Utility-first styling |
| Framer Motion | Smooth page and component animations |
| Recharts | Data visualization |
| React Hook Form | Form state and validation |
| Axios | HTTP client |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | Async REST API framework |
| SQLAlchemy 2 (async) | ORM with async engine |
| SQLite / aiosqlite | Default database (swappable with PostgreSQL) |
| Alembic | Database migrations |
| Pydantic v2 | Schema validation and serialization |
| PyJWT | JWT authentication |
| Google GenAI SDK | Gemini AI integration |
| ReportLab + openpyxl | PDF and Excel report generation |
| Uvicorn | ASGI server |

---

## Project Structure

```
EcoSync/
├── backend/
│   └── app/
│       ├── api/              # Route handlers (auth, environmental, social, governance,
│       │                     #   gamification, dashboard, reports, notifications, ai_copilot)
│       ├── core/             # Config, security (JWT/hashing), custom exceptions
│       ├── database/         # Async session, seed data
│       ├── middleware/       # Logging middleware
│       ├── models/           # SQLAlchemy ORM models
│       ├── repositories/     # Data access layer
│       ├── schemas/          # Pydantic request/response schemas
│       ├── services/         # Business logic layer
│       └── utils/            # Shared helpers
└── frontend/
    └── src/
        ├── components/       # Reusable UI components
        ├── context/          # React context (auth, theme)
        ├── hooks/            # Custom hooks
        ├── layouts/          # App shell, sidebar, nav
        ├── pages/            # Page-level components per module
        ├── routes/           # Route definitions + RBAC guards
        ├── services/         # Axios API service layer
        └── utils/            # Utility functions
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/EcoSync.git
cd EcoSync
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY and any other values

# Run the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Application
APP_NAME=EcoSync
APP_VERSION=1.0.0
DEBUG=True
API_PREFIX=/api/v1

# Database (SQLite by default, change to PostgreSQL URL for production)
DATABASE_URL=sqlite+aiosqlite:///./ecosync.db

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10

# Gemini AI (required for AI Copilot)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash

# ESG Score Weights (must sum to 100)
ENV_WEIGHT=40
SOCIAL_WEIGHT=30
GOV_WEIGHT=30
```

---

## Demo Accounts

The database is seeded automatically on first startup. Use these credentials to explore different roles:

| Role | Email | Password |
|---|---|---|
| Admin | admin@ecosync.com | admin123 |
| ESG Manager | esg@ecosync.com | esg123 |
| Department Head | head@ecosync.com | head123 |
| Employee | employee@ecosync.com | emp123 |
| Auditor | auditor@ecosync.com | audit123 |

---

## API Overview

All endpoints are prefixed with `/api/v1`.

| Module | Base Path |
|---|---|
| Authentication | `/api/v1/auth` |
| Admin | `/api/v1/admin` |
| Environmental | `/api/v1/environmental` |
| Social | `/api/v1/social` |
| Governance | `/api/v1/governance` |
| Gamification | `/api/v1/gamification` |
| Dashboard | `/api/v1/dashboard` |
| Reports | `/api/v1/reports` |
| Notifications | `/api/v1/notifications` |
| AI Copilot | `/api/v1/ai` |
| File Upload | `/api/v1/upload` |

Full interactive documentation is available at `/docs` (Swagger UI) and `/redoc` (ReDoc) when the backend is running.

---

## ESG Score Calculation

```
Department Environmental Score  →  based on carbon transactions vs. goals
Department Social Score         →  based on CSR participation and policy acknowledgements
Department Governance Score     →  based on audit results and open compliance issues

Department Total Score = (Environmental × 0.40) + (Social × 0.30) + (Governance × 0.30)

Organization ESG Score = weighted average of all Department Total Scores
```

Weights are configurable via **Settings → ESG Configuration** (Admin only).

---

## Architecture

EcoSync follows a clean layered architecture on the backend:

```
HTTP Request
     ↓
   Router (FastAPI)
     ↓
   Service (business logic)
     ↓
   Repository (data access)
     ↓
   SQLAlchemy Model (database)
```

This separation keeps business rules independent of the database and framework, making the codebase testable and easy to extend.

---

## Built With ❤️ for the Odoo Hackathon

EcoSync was designed and built as a submission for the **EcoSphere ESG Management Platform** challenge. It follows every requirement in the official problem statement while pushing beyond the basics with a polished enterprise UI, a fully functional AI assistant, and production-ready code architecture.

> *"Sustainability isn't a checkbox. It's a culture — and EcoSync helps build it."*
