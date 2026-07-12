# EcoSync — Frontend Implementation Walkthrough

We have successfully scaffolded and implemented the complete React + Tailwind CSS frontend for **EcoSync** (AI-Powered ESG Management Platform).

---

## 1. Core Scaffolding & Infrastructure

- **Vite Configuration**: Updated [vite.config.js](file:///e:/EcoSync/frontend/vite.config.js) to import and register the `@tailwindcss/vite` plugin for native CSS-based compilation.
- **Tailwind Integration**: Configured [index.css](file:///e:/EcoSync/frontend/src/index.css) to import Tailwind CSS v4 directives and mapped theme variables to class-based overrides (`.dark`).
- **Axios Client**: Developed [api.js](file:///e:/EcoSync/frontend/src/services/api.js) to append authentication tokens in requests and intercept 401 token refreshes.

---

## 2. Shared Services & Global State

- **Auth Service**: Created [authService.js](file:///e:/EcoSync/frontend/src/services/authService.js) to coordinate login, profile verification, and token clearance.
- **ESG Modules Service**: Created [esgService.js](file:///e:/EcoSync/frontend/src/services/esgService.js) for Environmental (Ledger, Indexes, Goals, Profiles), Social (Campaigns, Evidence uploads), and Governance (Policies, Audits, Issues).
- **Gamification Service**: Created [gamificationService.js](file:///e:/EcoSync/frontend/src/services/gamificationService.js) for Challenges, Badges, Rewards store, and Leaderboards.
- **Dashboard & Reports Service**: Created [dashboardService.js](file:///e:/EcoSync/frontend/src/services/dashboardService.js) for layout metrics, notification alerts, and PDF/Excel/CSV exports.
- **AI Copilot Service**: Created [aiService.js](file:///e:/EcoSync/frontend/src/services/aiService.js) supporting text chat stream readers.
- **Global Context Provider**: Developed [AppContext.jsx](file:///e:/EcoSync/frontend/src/context/AppContext.jsx) managing Auth, dark theme, and notification polling.

---

## 3. Custom Hooks

- [useAuth.js](file:///e:/EcoSync/frontend/src/hooks/useAuth.js) - Role validation helpers (`isAdmin`, `isEsgManager`, etc.) and route protection decorators.
- [useTheme.js](file:///e:/EcoSync/frontend/src/hooks/useTheme.js) - Color scheme switching.
- [useNotifications.js](file:///e:/EcoSync/frontend/src/hooks/useNotifications.js) - User notification bindings.
- [useApi.js](file:///e:/EcoSync/frontend/src/hooks/useApi.js) - Request loading/error trackers, debouncers, and pagination states.

---

## 4. Reusable Premium UI Components

- [FormControls.jsx](file:///e:/EcoSync/frontend/src/components/ui/FormControls.jsx) - Custom buttons, floating text inputs, select dropdowns, searchbars, and drag-and-drop evidence file uploaders.
- [DataDisplay.jsx](file:///e:/EcoSync/frontend/src/components/ui/DataDisplay.jsx) - Cards, badges, status indicators, paginated data tables, and empty list visualizers.
- [Overlays.jsx](file:///e:/EcoSync/frontend/src/components/ui/Overlays.jsx) - Modal dialog popups, fullscreen/in-line spinners, filter panels, and floating toasts.
- [Charts.jsx](file:///e:/EcoSync/frontend/src/components/ui/Charts.jsx) - Recharts integrations (ESGScoreGauge, EmissionsChart Area, DeptRanking Bar, PieBreakdown Donut, and TrendChart Line).

---

## 5. Responsive Layouts & Routing

- [Sidebar.jsx](file:///e:/EcoSync/frontend/src/components/layout/Sidebar.jsx) - Collapsible side navigator filtering items by role.
- [Topbar.jsx](file:///e:/EcoSync/frontend/src/components/layout/Topbar.jsx) - Profile dropdown, notification list bell, and theme switch triggers.
- [MainLayout.jsx](file:///e:/EcoSync/frontend/src/layouts/MainLayout.jsx) - Outer skeleton framing the sidebar and content views.
- [AuthLayout.jsx](file:///e:/EcoSync/frontend/src/layouts/AuthLayout.jsx) - Skeleton framing the login box.
- [AppRouter.jsx](file:///e:/EcoSync/frontend/src/routes/AppRouter.jsx) - Protected route selectors validating role access.

---

## 6. Page Components

- [LoginPage.jsx](file:///e:/EcoSync/frontend/src/pages/LoginPage.jsx) - Login cards with credentials inputs and a demo accounts quick-selector.
- [DashboardPage.jsx](file:///e:/EcoSync/frontend/src/pages/DashboardPage.jsx) - Main stats view tailored automatically by user role.
- [EnvironmentalPage.jsx](file:///e:/EcoSync/frontend/src/pages/EnvironmentalPage.jsx) - Ledger logs, reduction goals, emission indexes, and goods profiles.
- [SocialPage.jsx](file:///e:/EcoSync/frontend/src/pages/SocialPage.jsx) - CSR campaigns, participations, evidence validation, and diversity indexes.
- [GovernancePage.jsx](file:///e:/EcoSync/frontend/src/pages/GovernancePage.jsx) - ESG policy acknowledgements, audits calendar, and overdue compliance logs.
- [GamificationPage.jsx](file:///e:/EcoSync/frontend/src/pages/GamificationPage.jsx) - Challenges list, unlockable badges, rewards store, and leaderboards.
- [ReportsPage.jsx](file:///e:/EcoSync/frontend/src/pages/ReportsPage.jsx) - Filter forms and file format exporters (CSV, Excel, PDF).
- [AICopilotPage.jsx](file:///e:/EcoSync/frontend/src/pages/AICopilotPage.jsx) - AI Chat interface wrapping [ChatUI.jsx](file:///e:/EcoSync/frontend/src/components/ai/ChatUI.jsx).
- [AdminPage.jsx](file:///e:/EcoSync/frontend/src/pages/AdminPage.jsx) - Corporate users directories, department structural units, and global settings.
- [NotFoundPage.jsx](file:///e:/EcoSync/frontend/src/pages/NotFoundPage.jsx) - Error fallback screen.

---

## Verification Summary

We compiled a production bundle of the React frontend locally to verify correctness:
```bash
npm run build
```
The build completed successfully in **1.16s** without any compilation warnings or errors, outputting a consolidated bundle under `dist/`.

---

## 7. Backend & Local Database Setup (SQLite Transition)

To support seamless local developer testing without requiring a running Docker PostgreSQL instance, we transitioned the database configuration:
- **Asynchronous SQLite**: Configured a local `ecosync.db` database using `sqlite+aiosqlite`.
- **Database Models & Cross-Platform GUID**: Refactored the core PostgreSQL UUID column mappings across all model files to use a custom `GUID` type decorator ([base.py](file:///e:/EcoSync/backend/app/models/base.py)). This decorator automatically handles translating text strings (from JWT payloads) and UUID objects (from default database factories) transparently across both PostgreSQL and SQLite, preventing the `StatementError: 'str' object has no attribute 'hex'` crash.
- **Passlib & Python 3.14 Compatibility**: Downgraded `bcrypt` to version `4.2.0` in the virtual environment to prevent a known compatibility issue where newer `bcrypt` versions raise length validation errors during HMAC hashes.
- **Auto-Initialization & Seeding**: Modified `lifespan` in [main.py](file:///e:/EcoSync/backend/app/main.py) to automatically run metadata table creation and invoke the database seeder [seed.py](file:///e:/EcoSync/backend/app/database/seed.py) on startup.

### Seeded Demo Accounts
All seeded accounts share the password **`password`**:
* **Admin**: `admin@ecosync.com` (full organization and weights dashboard access)
* **ESG Manager**: `manager@ecosync.com` (module campaigns, challenges, and goals config)
* **Department Head**: `head@ecosync.com` (assigned to `Manufacturing`, monitors employee participation)
* **Employee**: `employee@ecosync.com` (assigned to `Manufacturing`, joins challenges, logs evidence, claims rewards)
* **Auditor**: `auditor@ecosync.com` (manages audits and opens compliance warnings)

---

## 8. Troubleshooting & Performance Tweaks

- **AdminPage Rendering Crash Fixed**: Resolved a React runtime `ReferenceError: mockUsers is not defined` crash in the Administration panel by adding the static `mockUsers` list configuration to [AdminPage.jsx](file:///e:/EcoSync/frontend/src/pages/AdminPage.jsx).
- **Streaming Response Middleware Bypass**: Starlette's `BaseHTTPMiddleware` buffers response streams. We bypassed the custom request-response logging middleware in [main.py](file:///e:/EcoSync/backend/app/main.py) to allow FastAPI `StreamingResponse` events to reach the browser in real-time.
- **In-Memory Chat Log & Thread Persistence**: Added an in-memory session database store for conversation and message threads in [ai_copilot.py](file:///e:/EcoSync/backend/app/api/ai_copilot.py) to persist conversation histories during employee/manager chats. This prevents the React post-stream sync (`fetchMessages`) from wiping out the message window.
- **Docker Clean-Up**: Removed `docker-compose.yml` and `backend/Dockerfile` to transition the project into a pure local execution ecosystem.

---

## 9. How to Start the Project

### Start the Backend API
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   * **PowerShell**:
     ```powershell
     .venv\Scripts\activate
     ```
   * **CMD / Git Bash**:
     ```bash
     source .venv/Scripts/activate
     ```
3. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

### Start the Frontend Dev Server
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Run the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser. Use the quick-select buttons on the Login page to seamlessly toggle between the 5 seeded roles.


