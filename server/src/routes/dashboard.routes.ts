import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = express.Router()

// Get dashboard data
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.userRole === 'ADMIN') {
      // Admin dashboard
      const teacherCount = await prisma.teacher.count({
        where: { status: 'ACTIVE' }
      })

      const latestAnnouncements = await prisma.announcement.findMany({
        take: 5,
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              teacherProfile: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      const recentDocuments = await prisma.document.findMany({
        take: 5,
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              teacherProfile: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      const totalUsers = await prisma.user.count()
      const totalTeachers = await prisma.teacher.count()
      const totalAnnouncements = await prisma.announcement.count()
      const totalDocuments = await prisma.document.count()

      res.json({
        role: 'ADMIN',
        stats: {
          teacherCount,
          totalUsers,
          totalTeachers,
          totalAnnouncements,
          totalDocuments
        },
        latestAnnouncements,
        recentDocuments
      })
    } else {
      // Teacher dashboard
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: { teacherProfile: true }
      })

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
              teacherProfile: true
            }
          },
          recipients: {
            where: { userId: req.userId! }
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })

      const unreadMessages = await prisma.message.count({
        where: {
          recipientId: req.userId!,
          read: false
        }
      })

      const recentMessages = await prisma.message.findMany({
        where: { recipientId: req.userId! },
        take: 5,
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

      res.json({
        role: 'TEACHER',
        stats: {
          unreadMessages
        },
        announcements,
        recentMessages
      })
    }
  } catch (error) {
    console.error('Get dashboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

