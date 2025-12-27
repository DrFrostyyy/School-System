# School Information System

A comprehensive full-stack school information system focused on Admin and Teacher users, built with modern technologies and a clean, elegant design.

## Features

### Authentication & Role Management
- User login and logout
- Two roles: Admin and Teacher
- Role-Based Access Control (RBAC)
- Admin can create and manage user accounts (teachers) and reset passwords
- Secure password hashing with bcrypt

### Teacher Directory
- Admin can add, edit, and delete teacher profiles
- Fields: name, department, position, contact info, status
- Teachers can view the directory but not modify it

### Announcements Module
- Admin can create announcements with title, body, timestamp, optional attachment, and visibility scope
- Teachers can view announcements assigned to them
- File attachment support

### Document Repository
- Admin can upload documents
- Each document includes: title, description, category, uploaded by, upload date, and file attachment
- Teachers can view and download documents
- File-type and size validation

### Internal Messaging System
- Users can send messages to other users inside the system
- Each message has sender, recipient(s), subject, body, timestamp, read/unread status
- Users have Inbox and Sent folders
- Real-time unread count

### Dashboards
- Admin dashboard: teacher count, latest announcements, recent actions
- Teacher dashboard: announcements feed and message preview

### Security
- Protected routes by role
- User input validation
- Sanitized messaging and announcement content
- Restricted uploaded file types and size

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Lucide React (Icons)

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite (MVP - easily migratable to PostgreSQL)
- JWT for authentication
- bcryptjs for password hashing
- Multer for file uploads
- Express Validator + Zod for validation

## Design

- **Modern with Traditional Hints**: Clean, contemporary design with classic typography
- **Neutral Color Palette**: White, black, and gold color scheme
- **Smooth Animations**: Framer Motion animations for fluid user experience
- **Responsive Design**: Works seamlessly across all device sizes

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Backend Setup

1. **Navigate to server directory:**
```bash
cd server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database:**
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. **Start the development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Frontend Setup

1. **Navigate to project root:**
```bash
cd ..
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file (optional):**
```bash
# Create .env file in root directory
VITE_API_URL=http://localhost:3001/api
```

4. **Start the development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Default Credentials

After running the seed script, you can log in with:

- **Admin**: `admin@school.edu` / `admin123`
- **Teacher 1**: `teacher1@school.edu` / `teacher123`
- **Teacher 2**: `teacher2@school.edu` / `teacher123`

## Project Structure

```
.
├── server/                 # Backend application
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/   # Auth and validation middleware
│   │   ├── utils/         # Utilities (Prisma client, file upload)
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Database seed script
│   └── uploads/           # Uploaded files
├── src/                    # Frontend application
│   ├── components/        # Reusable components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts (Auth)
│   ├── utils/             # Utilities (API client)
│   └── App.tsx            # Main app component
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/users` - Create user (Admin only)
- `GET /api/auth/users` - Get users list (Admin only)
- `POST /api/auth/reset-password` - Reset password (Admin only)

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
- Password hashing with bcrypt (10 rounds)
- Role-based access control (RBAC)
- Input validation and sanitization
- File type and size validation
- SQL injection protection (Prisma)
- XSS protection (HTML sanitization)
- CORS configuration

## File Uploads

Uploaded files are stored in:
- Announcement attachments: `server/uploads/announcements/`
- Documents: `server/uploads/documents/`

Files are served statically at `/uploads/*`

### Allowed File Types
- Documents: PDF, DOC, DOCX, XLS, XLSX, TXT, JPEG, PNG, GIF
- Announcements: PDF, JPEG, PNG, GIF, DOC, DOCX

### File Size Limit
Default: 10MB (configurable via `MAX_FILE_SIZE` environment variable)

## Development

### Backend
```bash
cd server
npm run dev          # Start development server
npm run build        # Build for production
npm run prisma:studio # Open Prisma Studio (database GUI)
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Production Deployment

1. Build both frontend and backend
2. Set up environment variables
3. Run database migrations
4. Configure reverse proxy (nginx recommended)
5. Set up SSL certificates
6. Configure file storage (consider cloud storage for production)

## License

This project is for educational purposes.

## Contributing

This is an MVP version. Future enhancements could include:
- Student-facing features
- Real-time notifications
- Advanced reporting
- Calendar integration
- Grade management
- Attendance tracking
