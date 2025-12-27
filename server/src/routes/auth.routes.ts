import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js'
import { loginSchema, createUserSchema, handleValidationErrors } from '../middleware/validation.middleware.js'

const router = express.Router()

// Login
router.post('/login', loginSchema, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
      include: { teacherProfile: true }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        teacherProfile: user.teacherProfile
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { teacherProfile: true },
      select: {
        id: true,
        email: true,
        role: true,
        teacherProfile: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create user (Admin only)
router.post('/users', authenticate, requireRole(['ADMIN']), createUserSchema, handleValidationErrors, async (req: AuthRequest, res) => {
  try {
    const { email, password, role } = req.body

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    res.status(201).json(user)
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Reset password (Admin only)
router.post('/reset-password', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { userId, newPassword } = req.body

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    res.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get users list (Admin only)
router.get('/users', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        teacherProfile: true
      },
      select: {
        id: true,
        email: true,
        role: true,
        teacherProfile: true
      }
    })

    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Logout (client-side token removal, but we can track if needed)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

export default router

