import { Request, Response, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

// Validation schemas
export const loginSchema = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]

export const createUserSchema = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['ADMIN', 'TEACHER']).withMessage('Role must be ADMIN or TEACHER'),
]

export const teacherSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  visibility: z.enum(['ALL', 'DEPARTMENT']).default('ALL'),
  department: z.string().optional(),
})

export const messageSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Message body is required'),
})

export const sanitizeHtml = (text: string): string => {
  // Use DOMPurify for comprehensive HTML sanitization
  // Allows safe HTML tags (h1-h6, p, ul, ol, li, strong, em, u, a, etc.)
  // while removing dangerous content (scripts, event handlers, etc.)
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's', 'strike',
      'ul', 'ol', 'li',
      'a',
      'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
    ALLOW_DATA_ATTR: false
  })
}

