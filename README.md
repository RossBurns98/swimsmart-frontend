SwimSmart Tracker — Frontend

SwimSmart Tracker is a training log and performance insight tool for swimmers and coaches.
This repository contains the frontend application, built with React, Vite, TailwindCSS, and Recharts.

It provides a clean and intuitive interface for swimmers to log sessions, and for coaches to review training progress and workload.

Project Vision

For swimmers: a simple way to log sets, reps, times, and Rate of Perceived Exertion (RPE).

For coaches: access to swimmer logs, trends, and performance insights.

For both: CSV export and dashboards that turn raw training data into meaningful insights.

Features

Secure login with JWT authentication (via FastAPI backend).

Role-based access:

Swimmers: log sessions, track times, RPE, distances.

Coaches: view athlete logs, leaderboards, and trends.

Protected routes and navigation depending on user role.

Session history tables with filtering.

Charts and graphs powered by Recharts.

CSV export for external analysis.

Responsive UI with TailwindCSS + shadcn/ui components.

Tech Stack

Frontend: React, Vite, TailwindCSS, shadcn/ui, Recharts, Axios, React Router

Backend: SwimSmart API
 (FastAPI + PostgreSQL)

Deployment: Local dev via Vite, cloud deployment later

Setup (Development)

Clone the repository:

git clone https://github.com/yourusername/swimsmart-frontend.git
cd swimsmart-frontend


Install dependencies:

npm install


Create an .env file in the project root and set your API base URL:

VITE_API_URL=http://localhost:8000


Start the development server:

npm run dev


Open http://localhost:5173
 in your browser.

Project Structure
src/
  api/          # Axios client for backend communication
  context/      # AuthContext for managing login state
  hooks/        # Reusable custom hooks
  router/       # ProtectedRoute and route definitions
  components/   # Shared UI components (Navbar, buttons, etc.)
  pages/        # Page-level components (Login, Dashboard, Coach, etc.)
  App.jsx       # App entry with routing
  main.jsx      # React entry point

Roadmap

Phase 1 – Scaffold + authentication shell ✅

Phase 2 – Login page and role-based redirects

Phase 3 – Session logging and history table

Phase 4 – Charts and CSV export

Phase 5 – Coach dashboard and performance summaries

Contributing

This is currently a personal project, but feedback and suggestions are welcome. Please open an issue to report bugs or propose features.