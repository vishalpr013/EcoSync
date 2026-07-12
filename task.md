# EcoSync — Task Tracker

## Phase 1 — Project Scaffolding & Infrastructure
- [x] Initialize Vite + React frontend project
- [x] Configure Tailwind CSS with custom design system
- [x] Initialize FastAPI backend project structure
- [x] Set up Docker Compose (PostgreSQL) (Substituted with asynchronous SQLite for developer testing)
- [x] Create backend core files (config, security, exceptions)
- [x] Create base model + all database models
- [x] Create all Pydantic schemas
- [x] Set up database session + Alembic
- [x] Create base repository
- [x] Configure environment variables (.env files)

## Phase 2 — Authentication & RBAC
- [x] JWT authentication (login, refresh, password hashing)
- [x] RBAC middleware with role decorators
- [x] Auth API routes
- [x] Frontend AuthContext + login page
- [x] Protected routes + role-adaptive sidebar
- [x] Seed demo accounts for all 5 roles

## Phase 3 — Master Data & Admin
- [ ] Departments CRUD (API + UI)
- [ ] Categories CRUD (API + UI)
- [ ] User management (API + UI)
- [ ] Settings page (ESG configuration toggles)
- [ ] Activity logging middleware

## Phase 4 — Environmental Module
- [ ] Emission Factors CRUD
- [ ] Carbon Transactions CRUD + auto-calculation
- [ ] Products + ESG Profiles
- [ ] Environmental Goals + progress tracking
- [ ] Environmental dashboard charts

## Phase 5 — Social Module
- [ ] CSR Activities CRUD
- [ ] Employee Participation (join, evidence, approval)
- [ ] Evidence requirement enforcement
- [ ] Diversity Metrics
- [ ] Training tracking

## Phase 6 — Governance Module
- [ ] ESG Policies CRUD + Acknowledgements
- [ ] Audits CRUD (full lifecycle)
- [ ] Compliance Issues (mandatory owner + due date)
- [ ] Overdue issue flagging

## Phase 7 — Gamification Module
- [ ] Challenges CRUD (full lifecycle)
- [ ] Challenge Participation
- [ ] XP system + Badge auto-award engine
- [ ] Rewards catalog + redemption
- [ ] Leaderboard

## Phase 8 — Scoring, Dashboard & Notifications
- [ ] Department + Overall ESG score engine
- [ ] Full dashboard (all role variants)
- [ ] Notification system (in-app)
- [ ] Real-time notification bell

## Phase 9 — Reports
- [ ] Environmental, Social, Governance, Executive reports
- [ ] Custom Report Builder
- [ ] Export engine (CSV, Excel, PDF)

## Phase 10 — AI Copilot (EcoSync AI)
- [ ] Gemini API integration
- [ ] AI conversation CRUD
- [ ] Streaming chat with markdown rendering
- [ ] Prompt templates (ESG Report, Carbon Reduction, etc.)
- [ ] ChatGPT-style UI

## Phase 11 — Polish & Deployment
- [ ] Dark/Light mode theming
- [ ] Responsive design pass
- [ ] Framer Motion animations
- [ ] Docker Compose production config
- [ ] README + documentation
