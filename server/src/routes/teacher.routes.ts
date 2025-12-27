import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js'
import { teacherSchema } from '../middleware/validation.middleware.js'

const router = express.Router()

// Get all teachers (Admin and Teachers can view)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(teachers)
  } catch (error) {
    console.error('Get teachers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single teacher
router.get('/:id', authenticate, async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    })

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' })
    }

    res.json(teacher)
  } catch (error) {
    console.error('Get teacher error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create teacher (Admin only)
router.post('/', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const validatedData = teacherSchema.parse(req.body)
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Check if user exists and is a teacher
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.role !== 'TEACHER') {
      return res.status(400).json({ error: 'User must have TEACHER role' })
    }

    // Check if teacher profile already exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { userId }
    })

    if (existingTeacher) {
      return res.status(400).json({ error: 'Teacher profile already exists for this user' })
    }

    const teacher = await prisma.teacher.create({
      data: {
        ...validatedData,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    })

    res.status(201).json(teacher)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create teacher error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update teacher (Admin only)
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const validatedData = teacherSchema.partial().parse(req.body)

    const teacher = await prisma.teacher.update({
      where: { id: req.params.id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    })

    res.json(teacher)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Teacher not found' })
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Update teacher error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete teacher (Admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    await prisma.teacher.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Teacher deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Teacher not found' })
    }
    console.error('Delete teacher error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

