# School Information System

full-stack school info system for admin & teacher users. clean modern design.

## tech stack

- frontend: react, typescript, vite, tailwind css, framer motion
- backend: node.js, express, typescript, prisma, sqlite

## features

- auth with role-based access (admin & teacher)
- teacher directory management
- announcements with rich text, attachments, links
- document upload & organization with folders
- internal messaging with threading
- role-specific dashboards with metrics

## quick setup

### backend

```bash
cd server
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

backend runs at `http://localhost:3001`

### frontend

```bash
npm install
npm run dev
```

frontend runs at `http://localhost:5173`

## default credentials

- admin: `admin@school.edu` / `admin123`
- teacher: `teacher1@school.edu` / `teacher123`

## project structure

```
.
├── server/          # backend (express + prisma)
├── src/            # frontend (react + vite)
└── README.md
```

## license

educational purposes only.

