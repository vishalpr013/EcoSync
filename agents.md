Firstly analyze the ecosphere pdf to get the problem statement
You are a Staff Software Engineer, Senior UI/UX Designer, Database Architect, and AI Engineer.

Build a production-ready enterprise SaaS application called:

# EcoSync
### AI-Powered ESG Management Platform

## Project Overview

EcoSync is an Enterprise ESG (Environmental, Social, Governance) platform built for the Odoo Hackathon.

The goal is to help organizations measure, manage, and improve sustainability by integrating Environmental, Social, Governance, and Gamification modules into one centralized ERP platform.

Do NOT build a basic CRUD application. Build a polished enterprise-grade SaaS similar to Microsoft Sustainability Manager, SAP Sustainability Control Tower, Salesforce Net Zero Cloud, or Odoo Enterprise.

The application must strictly follow the official Odoo problem statement before adding any AI enhancements.

---

# Tech Stack

Frontend
- React.js (JavaScript)
- React Router
- Tailwind CSS
- Axios
- React Hook Form
- Framer Motion
- Recharts
- Lucide Icons

Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- Pydantic v2
- JWT Authentication
- RBAC
- REST APIs

Other
- Docker
- Docker Compose
- Git
- Environment Variables

---

# Core Modules

### Environmental
- Emission Factors
- Carbon Accounting
- Carbon Transactions
- Auto Emission Calculation
- Product ESG Profile
- Sustainability Goals
- Department Carbon Tracking
- Carbon Reports

### Social
- CSR Activities
- Employee Participation
- Diversity Metrics
- Training
- Employee Engagement
- Evidence Upload

### Governance
- ESG Policies
- Policy Acknowledgements
- Audits
- Compliance Issues
- Governance Reports

### Gamification
- Challenges
- XP
- Badges
- Rewards
- Reward Redemption
- Leaderboards

---

# Master Data

Departments

Categories

Emission Factors

Products

Environmental Goals

Policies

Badges

Rewards

---

# Transactional Data

Carbon Transactions

CSR Activities

Employee Participation

Challenge Participation

Audits

Compliance Issues

Policy Acknowledgements

Department Scores

Notifications

Activity Logs

---

# Dashboard

Build a premium dashboard showing

Overall ESG Score

Environmental Score

Social Score

Governance Score

Department Rankings

Carbon Emissions

CSR Participation

Compliance Status

Leaderboards

Recent Activities

Beautiful charts using Recharts.

---

# Reports

Generate

Environmental Report

Social Report

Governance Report

Executive ESG Report

Custom Report Builder

Support filters

Department

Employee

Date Range

Challenge

ESG Category

Export CSV, Excel, and PDF.

---

# Mandatory Business Rules

Implement all required business logic.

- Auto emission calculation
- Evidence required before CSR approval
- Badge auto-award
- Reward redemption deducts XP
- Compliance Issues require owner and due date
- Notifications for all important events
- Department ESG Score
- Overall ESG Score = Environmental 40%, Social 30%, Governance 30% (configurable)

---

# AI Module (Main Differentiator)

Create an AI Copilot called **EcoSync AI**.

Features

- ESG Chat Assistant
- Executive ESG Report Generator
- Sustainability Recommendations
- Carbon Reduction Suggestions
- Compliance Summary
- CSR Idea Generator
- ESG Risk Detection
- Department Performance Analysis
- Natural Language Search

The AI page should look like ChatGPT with conversation history, markdown rendering, and streaming responses.

---

# UI/UX

Design should feel like Stripe + Linear + Odoo Enterprise.

Requirements

- Responsive
- Modern
- Dark & Light Mode
- Glassmorphism where appropriate
- Tailwind only
- Beautiful dashboards
- Smooth animations
- Premium tables
- Reusable components
- Professional typography

---

# Project Structure

frontend/
src/
components/
pages/
layouts/
hooks/
services/
context/
routes/

backend/
app/
api/
models/
schemas/
services/
repositories/
database/
core/
middleware/
utils/
ai/

---

# Authentication & Role-Based Access Control (RBAC)

Implement a single authentication system with JWT authentication.

There should be ONE login page and ONE user table.

Users are assigned roles by the Admin. Do NOT create separate login systems for different roles.

Roles:

1. Admin
- Full system access
- Manage users
- Assign roles
- Manage departments
- Configure ESG settings
- Manage emission factors
- Manage categories
- Manage rewards & badges
- Access all reports
- View organization analytics

2. ESG Manager
- Manage Environmental, Social & Governance modules
- Create sustainability goals
- Manage CSR activities
- Review department performance
- Manage challenges
- View reports
- Use AI Copilot

3. Department Head
- View department dashboard
- Approve CSR participation
- Monitor employee ESG performance
- View department reports
- View leaderboard

4. Employee
- View personal dashboard
- Participate in CSR activities
- Join sustainability challenges
- Upload evidence
- Redeem rewards
- View badges
- Acknowledge policies
- Use AI Copilot

5. Auditor
- Create audits
- Review compliance
- Raise compliance issues
- Close audits
- Generate governance reports

Implement Role-Based Route Protection on both frontend and backend.

Users should only see pages they have permission to access.

Unauthorized API requests must return HTTP 403.

Navigation menu should automatically change based on user role.

Create demo accounts for every role so the application can be demonstrated easily.

# Development Rules

- Use Clean Architecture.
- Use Service + Repository pattern.
- Use reusable components.
- Proper validation.
- Pagination.
- Search.
- Filtering.
- Error handling.
- Modular code.
- No duplicated logic.
- Production-ready code only.

---

# IMPORTANT

Do NOT generate the entire project at once.

Work step-by-step.

Start by generating:

1. Complete system architecture
2. Database schema
3. Folder structure
4. ER Diagram
5. API endpoints
6. UI wireframes
7. Development roadmap

Wait for approval before writing implementation code.

Each generated file should be complete, production-ready, and modular.



the final produc t must be within the constraints of ecosphere pdf