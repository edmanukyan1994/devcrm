# DevCRM

Premium CRM for web developers and their clients. Monolithic Node.js + React app designed for Railway deployment.

## Stack

- **Backend:** Express, Prisma, PostgreSQL, JWT auth, Multer uploads
- **Frontend:** React 19, Vite, Tailwind CSS v4, Shadcn-style UI
- **Deploy:** Single Railway service (API + static frontend)

## Features

- Role-based access: **Developer** (admin) and **Client**
- Projects scoped per client
- Kanban board for orders
- Task/edit tickets with priority, status, deadlines
- Comments chat per task
- Image & PDF attachments
- Timeline view for deadlines

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- PostgreSQL

### Setup

```bash
# Install dependencies
npm install
npm install --prefix client

# Configure environment
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET

# Push schema & seed demo data
npm run db:push
npx prisma db seed

# Run dev (API + frontend)
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

### Demo Accounts (after seed)

| Role      | Email              | Password      |
|-----------|--------------------|---------------|
| Developer | dev@devcrm.app     | developer123  |
| Client    | client@example.com | client123     |

## Railway Deployment

1. Create a new Railway project
2. Add **PostgreSQL** plugin
3. Connect this GitHub repository
4. Set environment variables:
   - `DATABASE_URL` — from Railway PostgreSQL
   - `JWT_SECRET` — long random string
   - `NODE_ENV=production`
5. Deploy — build runs `npm run build`, start runs migrations + server

Railway automatically provides `PORT`. The Express server serves the built React app in production.

## Project Structure

```
├── client/          # Vite + React frontend
├── server/          # Express API
├── prisma/          # Database schema & seed
├── uploads/         # File storage (local)
├── railway.json     # Railway config
└── package.json     # Root scripts
```

## API Overview

| Endpoint            | Description              |
|---------------------|--------------------------|
| POST /api/auth/*    | Login, register, profile |
| /api/projects       | Project CRUD             |
| /api/orders         | Orders + Kanban          |
| /api/tasks          | Task/edit tickets        |
| /api/comments       | Task comments            |
| /api/attachments    | File uploads             |
| /api/timeline       | Deadline calendar        |

## Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/devcrm.git
git branch -M main
git push -u origin main
```

## License

MIT
