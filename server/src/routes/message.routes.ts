import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'
import { messageSchema, sanitizeHtml } from '../middleware/validation.middleware.js'

const router = express.Router()

// Get inbox messages
router.get('/inbox', authenticate, async (req: AuthRequest, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { recipientId: req.userId! },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(messages)
  } catch (error) {
    console.error('Get inbox error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get sent messages
router.get('/sent', authenticate, async (req: AuthRequest, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { senderId: req.userId! },
      include: {
        recipient: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(messages)
  } catch (error) {
    console.error('Get sent messages error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get unread count
router.get('/unread-count', authenticate, async (req: AuthRequest, res) => {
  try {
    const count = await prisma.message.count({
      where: {
        recipientId: req.userId!,
        read: false
      }
    })

    res.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single message
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        },
        recipient: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        }
      }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Check if user has access to this message
    if (message.senderId !== req.userId! && message.recipientId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Mark as read if user is recipient
    if (message.recipientId === req.userId! && !message.read) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          read: true,
          readAt: new Date()
        }
      })
      message.read = true
      message.readAt = new Date()
    }

    res.json(message)
  } catch (error) {
    console.error('Get message error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Send message
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const validatedData = messageSchema.parse(req.body)
    const sanitizedBody = sanitizeHtml(validatedData.body)

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: validatedData.recipientId }
    })

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' })
    }

    if (recipient.id === req.userId!) {
      return res.status(400).json({ error: 'Cannot send message to yourself' })
    }

    const message = await prisma.message.create({
      data: {
        subject: validatedData.subject,
        body: sanitizedBody,
        senderId: req.userId!,
        recipientId: validatedData.recipientId
      },
      include: {
        recipient: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        }
      }
    })

    res.status(201).json(message)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark message as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    if (message.recipientId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updatedMessage = await prisma.message.update({
      where: { id: req.params.id },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    res.json(updatedMessage)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Message not found' })
    }
    console.error('Mark read error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete message
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // User can only delete their own messages (sent or received)
    if (message.senderId !== req.userId! && message.recipientId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await prisma.message.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Message deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Message not found' })
    }
    console.error('Delete message error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get users list for messaging (Admin sees all, Teachers see all)
router.get('/users/list', authenticate, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.userId! } // Exclude current user
      },
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
    console.error('Get users list error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

