# Quick Setup Guide

## Step 1: Backend Setup

```bash
cd server
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The backend will run on `http://localhost:3001`

## Step 2: Frontend Setup

In a new terminal:

```bash
# From project root
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## Step 3: Login

Open `http://localhost:5173` and login with:

- **Admin**: `admin@school.edu` / `admin123`
- **Teacher**: `teacher1@school.edu` / `teacher123`

## Troubleshooting

### Backend errors about missing types
These are expected before running `npm install` in the server directory. They will resolve after installation.

### Database errors
Make sure you've run:
1. `npm run prisma:generate`
2. `npm run prisma:migrate`
3. `npm run prisma:seed`

### Port already in use
Change the port in `server/.env` or `vite.config.ts`

## Next Steps

1. Create additional users via the Admin panel
2. Upload documents and create announcements
3. Send messages between users
4. Customize the design and add features as needed

