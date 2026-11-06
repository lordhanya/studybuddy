# StudyBuddy

Lightweight, professional academic progress tracking and collaboration platform. Built for students preparing for entrance examinations (first workspace: GATE 2027 CS), but exam-agnostic by design — supports any entrance exam, university syllabus, semester, or personal learning roadmap.

## Tech Stack

**Frontend:** React + Vite + Tailwind CSS + shadcn/ui + React Router + Lucide icons  
**Backend/API:** Vercel Functions (serverless)  
**Database:** Neon PostgreSQL  
**ORM:** Prisma  
**Auth:** Custom (bcryptjs + HTTP-only secure session cookies)  
**Hosting:** Vercel (frontend + API functions)

## Project Structure

```
studybuddy/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/ui/   # shadcn-style UI components
│   │   ├── contexts/        # AuthContext
│   │   ├── layouts/         # AppLayout, AuthLayout
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API service layer
│   │   ├── App.jsx          # Router
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── api/                    # Vercel Functions (serverless backend)
│   ├── auth/               # register, login, logout, me
│   ├── groups/             # list, create, join
│   ├── workspaces/         # CRUD for workspaces
│   ├── syllabus/           # subjects, chapters, topics
│   ├── progress/           # topic progress + summary
│   ├── activities/         # feed, reactions, comments
│   ├── dashboard/          # aggregated dashboard stats
│   ├── goals/              # CRUD for goals
│   ├── sessions/           # study sessions
│   ├── tests/              # mock tests
│   ├── leaderboard/        # member comparison
│   ├── analytics/          # personal analytics
│   └── lib/                # prisma, auth, middleware
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Migration SQL
├── vercel.json             # Vercel deployment config
├── .env.example            # Environment variable template
└── package.json            # Root (Prisma + bcryptjs)
```

## Features (Phases 1–5 Complete)

- **Authentication:** Register, login, logout, session cookies (HTTP-only, 7-day expiry)
- **Study Groups:** Create groups, join via invite code, multiple members
- **Workspaces:** Create workspaces within groups (exam type + year)
- **Syllabus Tracker:** Workspace → Subject → Chapter → Topic hierarchy, fully user-configurable (add subjects, chapters, and topics from the UI); update topic status (Not started / In progress / Completed / Needs revision); completion % per user
- **Dashboard:** Aggregated completion, topics completed, study hours, weekly sessions, and recent activity
- **Progress Summary:** Per-user completion, topics completed, study hours, weekly consistency
- **Activity Feed:** Post daily updates, topic/chapter completions, study sessions, mock results; emoji reactions; comments
- **Study Goals:** Create daily/weekly/custom goals; track completion status
- **Study Sessions:** Log sessions with duration; view history
- **Mock Tests:** Record test results; view performance history
- **Leaderboard:** Compare members by composite score (completion 40% + hours 20% + weekly 20% + mock avg 20%); sortable by individual metrics
- **Analytics:** Daily study hours (30 days), subject-wise completion, mock test trend
- **Dark/Light theme:** Persisted to localStorage

## Local Development

### Prerequisites
- Node.js 18+
- npm

### 1. Install dependencies

```bash
# Root (Prisma + bcryptjs)
npm install

# Client (React + Vite + Tailwind)
cd client && npm install
cd ..
```

### 2. Configure environment

Copy `.env.example` to `.env` and set your Neon `DATABASE_URL`:

```bash
cp .env.example .env
```

Edit `.env` with your Neon connection string:

```
DATABASE_URL="postgresql://neondb_owner:<password>@<host>/<db>?sslmode=require"
VITE_API_BASE=""
NODE_ENV=development
```

### 3. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Neon
npm run db:push
```

### 4. Start the frontend dev server

```bash
# From the repository root, run both the Vite frontend and the API functions
npx vercel dev
```

This serves the app at `http://localhost:3000` with `/api/*` backed by the serverless functions.

To work on UI only (API calls will fail locally), run:

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

> **Note:** The API functions (`api/`) are Vercel Functions and require the Vercel CLI (`vercel dev`) or a Vercel deployment to run. Plain Vite dev serves only the frontend, so API calls return HTML and fail.

## Deployment (Vercel + Neon)

### 1. Database (Neon)
- Create a database in your Neon project (e.g., `studybuddy`)
- Copy the connection string from Neon Console

### 2. Deploy to Vercel
- Connect your GitHub repository to Vercel
- Add these Environment Variables in Vercel Project Settings:
  - `DATABASE_URL` = your Neon connection string
  - `VITE_API_BASE` = "" (empty, API functions are on the same origin)
  - `NODE_ENV` = `production`
- Vercel will install root + client dependencies, run `prisma generate`, and build the client
- `vercel.json` rewrites non-API routes to the SPA and leaves `/api/*` handled by the serverless functions
- Prisma Client is generated for both the local platform and Vercel's `rhel-openssl-3.0.x` runtime

### 3. Database Migrations
- Run `npm run db:push` against your Neon production database to create tables
- Or run the SQL in `prisma/migrations/0001_init.sql` via Neon SQL Editor

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `VITE_API_BASE` | No | API base URL (empty when same origin) |
| `NODE_ENV` | No | `development` or `production` |

## Security

- Passwords hashed with bcryptjs (12 rounds) — never stored plain-text
- Session cookies are HTTP-only, Secure (production only), SameSite=Lax
- All API endpoints protected by authentication middleware
- Group/workspace membership verified before data access
- No password reset, email verification, or social login (by design)

## License

MIT