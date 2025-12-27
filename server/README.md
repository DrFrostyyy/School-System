# School Information System - Backend

Backend API for the School Information System built with Node.js, Express, TypeScript, and Prisma.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (Admin/Teacher)
- **Teacher Directory**: CRUD operations for teacher profiles
- **Announcements**: Create, read, update, delete announcements with file attachments
- **Document Repository**: Upload, manage, and download documents
- **Internal Messaging**: Send and receive messages between users
- **Dashboards**: Role-specific dashboard data

## Tech Stack

- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite (for MVP, easily migratable to PostgreSQL)
- JWT for authentication
- bcryptjs for password hashing
- Multer for file uploads
- Express Validator + Zod for validation

## Setup

1. **Install dependencies:**
```bash
cd server
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Initialize database:**
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. **Create initial admin user:**
You'll need to create an admin user manually or use Prisma Studio:
```bash
npm run prisma:studio
```

Or create a seed script (recommended).

5. **Run development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/users` - Create user (Admin only)
- `POST /api/auth/reset-password` - Reset password (Admin only)
- `POST /api/auth/logout` - Logout

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get single teacher
- `POST /api/teachers` - Create teacher (Admin only)
- `PUT /api/teachers/:id` - Update teacher (Admin only)
- `DELETE /api/teachers/:id` - Delete teacher (Admin only)

### Announcements
- `GET /api/announcements` - Get announcements (filtered by role)
- `GET /api/announcements/:id` - Get single announcement
- `POST /api/announcements` - Create announcement (Admin only)
- `PUT /api/announcements/:id` - Update announcement (Admin only)
- `DELETE /api/announcements/:id` - Delete announcement (Admin only)

### Documents
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get single document
- `POST /api/documents` - Upload document (Admin only)
- `PUT /api/documents/:id` - Update document (Admin only)
- `DELETE /api/documents/:id` - Delete document (Admin only)
- `GET /api/documents/meta/categories` - Get document categories

### Messages
- `GET /api/messages/inbox` - Get inbox messages
- `GET /api/messages/sent` - Get sent messages
- `GET /api/messages/unread-count` - Get unread message count
- `GET /api/messages/:id` - Get single message
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark message as read
- `DELETE /api/messages/:id` - Delete message
- `GET /api/messages/users/list` - Get users list for messaging

### Dashboard
- `GET /api/dashboard` - Get dashboard data (role-specific)

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- File type and size validation
- SQL injection protection (Prisma)
- XSS protection (HTML sanitization)

## Database Schema

See `prisma/schema.prisma` for the complete database schema.

## File Uploads

Uploaded files are stored in the `uploads/` directory:
- Announcement attachments: `uploads/announcements/`
- Documents: `uploads/documents/`

Files are served statically at `/uploads/*`

## Environment Variables

- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT expiration time (default: 7d)
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `UPLOAD_DIR` - Upload directory path
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: 10MB)

