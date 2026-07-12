# EcoSync — AI-Powered ESG Management Platform

EcoSync is a production-ready, enterprise-grade ESG (Environmental, Social, Governance) and sustainability tracking application built for the Odoo Hackathon. It helps organizations measure, audit, and improve sustainability by integrating carbon accounting, social activities, corporate policies, and employee gamification into one centralized ERP dashboard.

---

## 🚀 Key Features & Modules

### 1. Environmental (Carbon Accounting)
* **Emissions Ledger**: Log carbon transactions classified by category (Electricity, Fuel, Transport) and Scope (Scope 1, 2, 3).
* **Auto-Calculation**: Automatic conversion of physical metrics (e.g., kWh of electricity or liters of diesel) into metric tons of carbon equivalent ($t\text{CO}_2\text{e}$) using pre-seeded EPA/DEFRA emission factor indexes.
* **Goals & Profiles**: Track company-wide or department-specific reduction targets and maintain detailed ESG sustainability profiles for corporate products.

### 2. Social Impact (CSR & Diversity)
* **CSR Campaigns**: Manage volunteer activities and environmental initiatives (e.g., tree planting, cleanup drives).
* **Evidence Validation**: Enforces a strict business rule where employees must upload image/document evidence when requesting participation approval.
* **Diversity & Training**: Log diversity ratios and compliance training completion rates per department.

### 3. Corporate Governance (Compliance & Audits)
* **Policy Signatures**: Maintain a registry of corporate ESG policies with digital employee acknowledgments.
* **Safety Audits**: Schedule and record results of safety and regulatory audits.
* **Compliance Issues**: Registry of open compliance warnings, strictly enforcing and highlighting overdue deadlines.

### 4. Gamification (Engagement & Rewards)
* **Sustainability Challenges**: Join active challenges (e.g., "Zero Waste Week") to earn experience points (XP).
* **Earned Badges**: Auto-award badges (e.g., "Carbon Saver I") when employees cross XP or participation thresholds.
* **Rewards Catalog**: Store catalog where employees can redeem their XP for physical items (e.g., sustainable mugs) or benefits.

### 5. EcoSync AI Copilot
* **ESG Conversational Assistant**: A ChatGPT-like sidebar assistant supporting Markdown responses, quick suggestion prompts, and streaming output.
* **Session Persistence**: Persists user discussion threads and chat history in the sidebar using an in-memory session log on the backend.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (JavaScript), React Router v6, Tailwind CSS v4, Framer Motion (animations), Recharts (data visualizations), Axios (API client), Lucide Icons.
* **Backend**: FastAPI, SQLAlchemy 2.0 (asynchronous core), Uvicorn.
* **Database**: Local asynchronous SQLite (`sqlite+aiosqlite`) for zero-dependency local deployment.
* **Security**: JWT Authentication, Role-Based Access Control (RBAC).

---

## 🔐 Role-Based Access Control (RBAC)

The application seeds 5 pre-configured accounts (Password: **`password`**):

| Role | Demo Account | Permissions |
| :--- | :--- | :--- |
| **Admin** | `admin@ecosync.com` | Accesses global ESG configuration, adjusts coefficient weights, and manages user accounts and departments. |
| **ESG Manager** | `manager@ecosync.com` | Manages environmental ledger factors, configures sustainability goals, and creates CSR activities. |
| **Department Head** | `head@ecosync.com` | Reviews localized Manufacturing metrics and approves CSR participations. |
| **Employee** | `employee@ecosync.com` | Enrolls in challenges, uploads evidence files, signs active policies, and redeems store rewards. |
| **Auditor** | `auditor@ecosync.com` | Raises compliance issues, schedules audits, and views governance reports. |

---

## 🛠️ What Has Been Done

1. **Database Schema Refactoring**:
   - Transitioned database connectivity from Docker-dependent PostgreSQL to a local async SQLite database (`ecosync.db`).
   - Refactored PostgreSQL-specific UUID columns across all backend database models to use SQLAlchemy 2.0's native, cross-platform `Uuid` type mapping.
2. **Automated Seeding**:
   - Created [seed.py](file:///e:/EcoSync/backend/app/database/seed.py) to automatically seed all default configurations (ESG scoring weights coefficients), departments, user roles, emission factors, badges, and rewards.
   - Modified the server lifespan lifecycle to auto-generate the SQLite schema and run the seed script on boot.
3. **Python 3.14 Compatibility Fixes**:
   - Downgraded `bcrypt` to version `4.2.0` in the virtual environment to resolve a compatibility clash with `passlib` HMAC hashes.
4. **FastAPI Route Implementations**:
   - Created the `/ai/chat` streaming endpoint integrated with the official `google-genai` SDK.
   - Disabled synchronous logging middlewares that were buffering chunked server-sent events.
5. **Complete React Frontend Architecture**:
   - Built out all wrappers, custom hooks (`useAuth`, `useTheme`, `useApi`), global theme toggling (Dark/Light mode matching `.dark` selector), and charts layout widgets.
   - Implemented 10 interactive page components covering authentication, responsive dashboards, tabular lists, modals, and ChatUI.

---

## 🏃 How to Start the Project

### 1. Run the Backend API
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate the python virtual environment:
   * **PowerShell**:
     ```powershell
     .venv\Scripts\activate
     ```
   * **Git Bash / CMD**:
     ```bash
     source .venv/Scripts/activate
     ```
3. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

### 2. Run the Frontend App
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the Vite server:
   ```bash
   npm run dev
   ```
3. Open **`http://localhost:5173`** in your browser. Use the login selector cards to test each role's dashboard.

### 3. Add Your Gemini API Key
To enable live AI query generation in the ChatGPT Copilot:
1. Open [backend/.env](file:///e:/EcoSync/backend/.env#L5).
2. Paste your Gemini API key:
   ```env
   GEMINI_API_KEY="YOUR_KEY"
   ```
   *If no key is configured, the Copilot falls back to an interactive local demo simulator.*
