# SwimSmart Tracker — Frontend

SwimSmart Tracker is a training log and performance insight tool for swimmers and coaches.  
This repository contains the **frontend application**, built with **React, Vite, TailwindCSS, and Recharts**.  

It provides a clean and intuitive interface for swimmers to log sessions, and for coaches to review training progress and workload.

---

## Project Vision

- **For swimmers**: a simple way to log sets, reps, times, and Rate of Perceived Exertion (RPE).  
- **For coaches**: access to swimmer logs, trends, and performance insights.  
- **For both**: CSV export and dashboards that turn raw training data into meaningful insights.

---

## Features

- Secure login with JWT authentication (via FastAPI backend).  
- Role-based access:
  - **Swimmers**: log sessions, track times, RPE, distances.  
  - **Coaches**: view athlete logs, leaderboards, and trends.  
- Protected routes and navigation depending on user role.  
- Session history tables with filtering.  
- Charts and graphs powered by **Recharts**.  
- CSV export for external analysis.  
- Responsive UI with **TailwindCSS** + **shadcn/ui** components.  

---

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, shadcn/ui, Recharts, Axios, React Router  
- **Backend**: [SwimSmart API](https://github.com/yourusername/swimsmart-backend) (FastAPI + PostgreSQL)  
- **Deployment**: Local dev via Vite, cloud deployment later  

---

## Setup (Development)

  ```bash
  # 1. Clone the repository
  git clone https://github.com/yourusername/swimsmart-frontend.git
  cd swimsmart-frontend

  # 2. Install dependencies
  npm install

  # 3. Create an .env file in the project root and set your API base URL
  # (create a new file called ".env" and add this line inside)
  VITE_API_URL=http://localhost:8000

  # 4. Start the development server
  npm run dev

  # 5. Open http://localhost:5173 in your browser
  ```

---

## Roadmap

Phase 1 – Scaffold + authentication shell ✅

Phase 2 – Login page and role-based redirects

Phase 3 – Session logging and history table

Phase 4 – Charts and CSV export

Phase 5 – Coach dashboard and performance summaries

---

## Contributing

This is currently a personal project, but feedback and suggestions are welcome.
Please open an issue to report bugs or propose features.