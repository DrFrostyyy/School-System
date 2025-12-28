# School Information System

A full-stack school information system for Admin and Teacher users with a modern, elegant design.

## Features

- **Authentication**: Login/logout with role-based access (Admin & Teacher)
- **Teacher Directory**: Manage teacher profiles
- **Announcements**: Create and share announcements with rich text, attachments, and links
- **Documents**: Upload, organize, and share documents with folder support
- **Messaging**: Internal messaging system with threading and replies
- **Dashboards**: Role-specific dashboards with key metrics

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion  
**Backend:** Node.js, Express, TypeScript, Prisma, SQLite

## Quick Start

### Backend

```bash
cd server
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Backend runs on `http://localhost:3001`

### Frontend

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Default Credentials

- **Admin**: `admin@school.edu` / `admin123`
- **Teacher**: `teacher1@school.edu` / `teacher123`

## Project Structure

```
.
├── server/          # Backend (Express + Prisma)
├── src/            # Frontend (React + Vite)
└── README.md
```

## License

Educational purposes only.
