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
    // Admin has no sent messages (they can't send)
    if (req.userRole === 'ADMIN') {
      return res.json([])
    }

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
    // Admin cannot send messages
    if (req.userRole === 'ADMIN') {
      return res.status(403).json({ error: 'Admins cannot send messages. They can only receive messages from teachers.' })
    }

    const validatedData = messageSchema.parse(req.body)
    const sanitizedBody = sanitizeHtml(validatedData.body)

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: req.userId! }
    })

    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' })
    }

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

    // Teachers can send to other teachers and admin
    // Admin cannot send (already checked above)
    if (sender.role === 'TEACHER' && recipient.role !== 'TEACHER' && recipient.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Teachers can only send messages to other teachers or admin' })
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

// Get users list for messaging
router.get('/users/list', authenticate, async (req: AuthRequest, res) => {
  try {
    // Admin cannot send messages, so return empty list
    if (req.userRole === 'ADMIN') {
      return res.json([])
    }

    // Teachers can send to other teachers and admin
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.userId! }, // Exclude current user
        OR: [
          { role: 'TEACHER' },
          { role: 'ADMIN' }
        ]
      },
      select: {
        id: true,
        email: true,
        role: true,
        teacherProfile: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true
          }
        }
      }
    })

    console.log(`Found ${users.length} recipients for user ${req.userId}`)
    console.log('Recipients:', users.map(u => ({ email: u.email, role: u.role, name: u.teacherProfile?.name })))

    res.json(users)
  } catch (error) {
    console.error('Get users list error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all notifications (messages + announcements)
router.get('/notifications', authenticate, async (req: AuthRequest, res) => {
  try {
    // Get unread messages
    const unreadMessages = await prisma.message.findMany({
      where: {
        recipientId: req.userId!,
        read: false
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            teacherProfile: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get unread announcements
    let unreadAnnouncements: any[] = []
    
    if (req.userRole === 'ADMIN') {
      // Admin sees all recent announcements
      const announcements = await prisma.announcement.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              teacherProfile: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      unreadAnnouncements = announcements
    } else {
      // Teachers see unread announcements assigned to them
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: { teacherProfile: true }
      })

      if (user?.teacherProfile) {
        const announcements = await prisma.announcement.findMany({
          where: {
            OR: [
              { visibility: 'ALL' },
              {
                AND: [
                  { visibility: 'DEPARTMENT' },
                  { recipients: { some: { userId: req.userId! } } }
                ]
              }
            ]
          },
          include: {
            creator: {
              select: {
                id: true,
                email: true,
                teacherProfile: {
                  select: {
                    name: true
                  }
                }
              }
            },
            recipients: {
              where: { userId: req.userId! }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })

        // Filter to only unread announcements
        unreadAnnouncements = announcements.filter(ann => {
          const recipient = ann.recipients.find(r => r.userId === req.userId!)
          return !recipient || !recipient.read
        })
      }
    }

    // Format notifications
    const notifications = [
      ...unreadMessages.map(msg => ({
        id: msg.id,
        type: 'message' as const,
        title: msg.subject,
        body: msg.body.substring(0, 100) + (msg.body.length > 100 ? '...' : ''),
        from: msg.sender.teacherProfile?.name || msg.sender.email,
        createdAt: msg.createdAt,
        read: msg.read
      })),
      ...unreadAnnouncements.map(ann => ({
        id: ann.id,
        type: 'announcement' as const,
        title: ann.title,
        body: ann.body.substring(0, 100) + (ann.body.length > 100 ? '...' : ''),
        from: ann.creator.teacherProfile?.name || ann.creator.email,
        createdAt: ann.createdAt,
        read: ann.recipients?.[0]?.read || false
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const totalUnread = unreadMessages.length + unreadAnnouncements.length

    res.json({
      notifications,
      totalUnread,
      unreadMessages: unreadMessages.length,
      unreadAnnouncements: unreadAnnouncements.length
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

