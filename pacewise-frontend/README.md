# PaceWise Frontend

Modern dark-mode dashboard for **PaceWise** — a Strava activity analytics platform. Built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

## Screenshots

<!-- Add screenshots here after running the app, e.g.:
![Dashboard](docs/screenshot-dashboard.png)
![Performance](docs/screenshot-performance.png)
-->

*Screenshots: run `npm run dev` and capture the Dashboard, Performance, Training Load, and Activities pages.*

## Setup

1. **Install dependencies**
   ```bash
   cd pacewise-frontend
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

3. **Optional: connect to a real API**  
   Set `NEXT_PUBLIC_API_URL` to your PaceWise API base URL. If unset, the app uses mock data so the UI works standalone.

## Design decisions

- **Glassmorphism + industrial**  
  Cards use a glass style (`backdrop-blur`, low-opacity borders/surfaces) with corner brackets and monospace metrics for an industrial feel.

- **Color and glow**  
  Strava orange (`#FC4C02`) is the primary glow; indigo (`#6366f1`) is secondary. Holographic gradients (orange → rose → purple → indigo → cyan) are used for hero text and chart accents.

- **Typography**  
  Inter for UI, JetBrains Mono for all numeric/metric values so numbers align and feel consistent.

- **Animations**  
  Framer Motion handles page transitions, staggered card mount, KPI count-up, and hover states. Charts use Recharts with custom tooltips and gradient fills.

- **Data layer**  
  `lib/api.ts` exposes typed fetch functions. With no `NEXT_PUBLIC_API_URL`, it returns mock data that mirrors the dbt mart schemas so the frontend runs without a backend.

- **Client boundaries**  
  Only components that need interactivity (charts, sidebar, client data fetching) use `"use client"`; layout and static structure stay server-rendered where possible.
