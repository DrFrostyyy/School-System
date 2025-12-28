import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js'
import { loginSchema, createUserSchema, handleValidationErrors } from '../middleware/validation.middleware.js'
import { profilePictureUpload, deleteFile } from '../utils/fileUpload.js'

const router = express.Router()

// Register (Public - creates TEACHER account)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, department, position, phone } = req.body

    // Validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' })
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' })
    }

    if (!department || !department.trim()) {
      return res.status(400).json({ error: 'Department is required' })
    }

    if (!position || !position.trim()) {
      return res.status(400).json({ error: 'Position is required' })
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    if (!phone.startsWith('+63')) {
      return res.status(400).json({ error: 'Phone number must start with +63' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with TEACHER role and teacher profile
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'TEACHER',
        teacherProfile: {
          create: {
            name: name.trim(),
            department: department.trim(),
            position: position.trim(),
            phone: phone.trim(),
            status: 'ACTIVE'
          }
        }
      },
      include: {
        teacherProfile: true
      }
    })

    // Generate token
    const jwtSecret = process.env.JWT_SECRET as string
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error' })
    }
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as string
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn }
    )

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        teacherProfile: user.teacherProfile
      }
    })
  } catch (error: any) {
    console.error('Register error:', error)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already registered' })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login
router.post('/login', loginSchema, handleValidationErrors, async (req: express.Request, res: express.Response) => {
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

    const jwtSecret = process.env.JWT_SECRET as string
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error' })
    }
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as string
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn }
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

// Update own profile (Teachers only, or Admin if they have a teacher profile)
router.put('/profile', authenticate, profilePictureUpload.single('profilePicture'), async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { teacherProfile: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Only teachers can update their profile (or admin if they have a teacher profile)
    if (user.role !== 'TEACHER' && !user.teacherProfile) {
      return res.status(403).json({ error: 'Only teachers can update their profile' })
    }

    const { name, department, position, phone } = req.body

    if (!name || !department || !position) {
      return res.status(400).json({ error: 'Name, department, and position are required' })
    }

    const updateData: any = {
      name: name.trim(),
      department: department.trim(),
      position: position.trim(),
      phone: phone ? phone.trim() : null
    }

    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture if exists
      if (user.teacherProfile?.profilePicture) {
        deleteFile(user.teacherProfile.profilePicture)
      }
      updateData.profilePicture = `/uploads/profiles/${req.file.filename}`
    }

    // Update or create teacher profile
    let teacherProfile
    if (user.teacherProfile) {
      teacherProfile = await prisma.teacher.update({
        where: { userId: req.userId! },
        data: updateData
      })
    } else {
      // Create teacher profile if it doesn't exist (for admin users)
      teacherProfile = await prisma.teacher.create({
        data: {
          userId: req.userId!,
          ...updateData
        }
      })
    }

    // Fetch updated user with profile
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        role: true,
        teacherProfile: true
      }
    })

    res.json(updatedUser)
  } catch (error: any) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Logout (client-side token removal, but we can track if needed)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

export default router

