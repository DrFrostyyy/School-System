import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js'
import { announcementSchema, sanitizeHtml } from '../middleware/validation.middleware.js'
import { announcementUpload, deleteFile } from '../utils/fileUpload.js'

const router = express.Router()

// URL validation helper
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (_) {
    return false
  }
}

// Get announcements (filtered by role and visibility)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { teacherProfile: true }
    })

    let announcements

    if (req.userRole === 'ADMIN') {
      // Admin sees all announcements
      announcements = await prisma.announcement.findMany({
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              teacherProfile: true
            }
          },
          recipients: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: [
          { pinned: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    } else {
      // Teachers see announcements assigned to them or ALL visibility
      const teacher = user?.teacherProfile
      if (!teacher) {
        return res.status(403).json({ error: 'Teacher profile not found' })
      }

      announcements = await prisma.announcement.findMany({
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
            where: { userId: req.userId! },
            include: {
              user: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: [
          { pinned: 'desc' },
          { createdAt: 'desc' }
        ]
      })

      // For teachers, also include read status in the response
      announcements = announcements.map(announcement => ({
        ...announcement,
        isRead: announcement.recipients.length > 0 && announcement.recipients[0]?.read === true,
        readAt: announcement.recipients.length > 0 ? announcement.recipients[0]?.readAt : null
      }))
    }

    res.json(announcements)
  } catch (error) {
    console.error('Get announcements error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single announcement
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        },
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                teacherProfile: true
              }
            }
          }
        }
      }
    })

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    // Mark as read if teacher is recipient
    if (req.userRole === 'TEACHER') {
      // Find or create recipient record
      let recipient = await prisma.announcementRecipient.findUnique({
        where: {
          announcementId_userId: {
            announcementId: announcement.id,
            userId: req.userId!
          }
        }
      })

      if (!recipient) {
        // Create recipient record if it doesn't exist
        await prisma.announcementRecipient.create({
          data: {
            announcementId: announcement.id,
            userId: req.userId!,
            read: true,
            readAt: new Date()
          }
        })
      } else if (!recipient.read) {
        // Update if not already read
        await prisma.announcementRecipient.update({
          where: {
            announcementId_userId: {
              announcementId: announcement.id,
              userId: req.userId!
            }
          },
          data: {
            read: true,
            readAt: new Date()
          }
        })
      }

      // Fetch updated announcement with read status
      const updatedAnnouncement = await prisma.announcement.findUnique({
        where: { id: req.params.id },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              teacherProfile: true
            }
          },
          recipients: {
            where: { userId: req.userId! },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  teacherProfile: true
                }
              }
            }
          }
        }
      })

      // Add read status to response
      const response: any = {
        ...updatedAnnouncement,
        isRead: updatedAnnouncement?.recipients[0]?.read === true,
        readAt: updatedAnnouncement?.recipients[0]?.readAt
      }

      return res.json(response)
    }

    res.json(announcement)
  } catch (error) {
    console.error('Get announcement error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create announcement (Admin and Teachers can create)
router.post('/', authenticate, announcementUpload.single('attachment'), async (req: AuthRequest, res) => {
  try {
    // Both Admin and Teachers can create announcements
    if (req.userRole !== 'ADMIN' && req.userRole !== 'TEACHER') {
      return res.status(403).json({ error: 'Only admins and teachers can create announcements' })
    }

    const validatedData = announcementSchema.parse({
      title: req.body.title,
      body: req.body.body,
      visibility: req.body.visibility || 'ALL',
      department: req.body.department
    })

    const sanitizedBody = sanitizeHtml(validatedData.body)
    const attachmentPath = req.file ? `/uploads/announcements/${req.file.filename}` : null
    const link = req.body.link || null

    // Validate URL if link is provided
    if (link && !isValidUrl(link)) {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: validatedData.title,
        body: sanitizedBody,
        attachment: attachmentPath,
        link: link,
        visibility: validatedData.visibility,
        createdBy: req.userId!
      }
    })

    // Create recipients based on visibility
    if (validatedData.visibility === 'ALL') {
      // Add all teachers as recipients (and admin if created by teacher)
      const teachers = await prisma.user.findMany({
        where: { 
          role: 'TEACHER',
          ...(req.userRole === 'TEACHER' ? { id: { not: req.userId! } } : {})
        }
      })

      // If teacher created it, also notify admin
      if (req.userRole === 'TEACHER') {
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
        if (admin) {
          teachers.push(admin)
        }
      }

      await prisma.announcementRecipient.createMany({
        data: teachers.map(teacher => ({
          announcementId: announcement.id,
          userId: teacher.id
        }))
      })
    } else if (validatedData.visibility === 'DEPARTMENT' && validatedData.department) {
      // Add teachers from specific department
      const teachers = await prisma.teacher.findMany({
        where: { department: validatedData.department },
        include: { user: true }
      })

      await prisma.announcementRecipient.createMany({
        data: teachers.map(teacher => ({
          announcementId: announcement.id,
          userId: teacher.userId
        }))
      })
    }

    const createdAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcement.id },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        }
      }
    })

    res.status(201).json(createdAnnouncement)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create announcement error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update announcement (Admin can edit any, Teachers can edit their own)
router.put('/:id', authenticate, announcementUpload.single('attachment'), async (req: AuthRequest, res) => {
  try {
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: req.params.id }
    })

    if (!existingAnnouncement) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    // Check permissions: Admin can edit any, Teachers can only edit their own
    if (req.userRole !== 'ADMIN' && existingAnnouncement.createdBy !== req.userId!) {
      return res.status(403).json({ error: 'You can only edit your own announcements' })
    }

    const validatedData = announcementSchema.partial().parse({
      title: req.body.title,
      body: req.body.body,
      visibility: req.body.visibility,
      department: req.body.department
    })

    const updateData: any = {}
    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.body) updateData.body = sanitizeHtml(validatedData.body)
    if (validatedData.visibility) updateData.visibility = validatedData.visibility

    if (req.body.link !== undefined) {
      const link = req.body.link || null
      if (link && !isValidUrl(link)) {
        return res.status(400).json({ error: 'Invalid URL format' })
      }
      updateData.link = link
    }

    if (req.file) {
      // Delete old attachment if exists
      if (existingAnnouncement.attachment) {
        deleteFile(existingAnnouncement.attachment)
      }
      updateData.attachment = `/uploads/announcements/${req.file.filename}`
    }

    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        }
      }
    })

    res.json(announcement)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Announcement not found' })
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Update announcement error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete announcement (Admin can delete any, Teachers can delete their own)
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id }
    })

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    // Check permissions: Admin can delete any, Teachers can only delete their own
    if (req.userRole !== 'ADMIN' && announcement.createdBy !== req.userId!) {
      return res.status(403).json({ error: 'You can only delete your own announcements' })
    }

    // Delete attachment if exists
    if (announcement.attachment) {
      deleteFile(announcement.attachment)
    }

    await prisma.announcement.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Announcement deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Announcement not found' })
    }
    console.error('Delete announcement error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Pin/Unpin announcement (Admin or creator can pin/unpin)
router.patch('/:id/pin', authenticate, async (req: AuthRequest, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id }
    })

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    // Only Admin or the creator can pin/unpin
    if (req.userRole !== 'ADMIN' && announcement.createdBy !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: { pinned: !announcement.pinned },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        }
      }
    })

    res.json(updatedAnnouncement)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Announcement not found' })
    }
    console.error('Pin announcement error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark announcement as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id }
    })

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    // Find or create recipient record
    let recipient = await prisma.announcementRecipient.findUnique({
      where: {
        announcementId_userId: {
          announcementId: req.params.id,
          userId: req.userId!
        }
      }
    })

    if (!recipient) {
      // Create recipient record if it doesn't exist
      recipient = await prisma.announcementRecipient.create({
        data: {
          announcementId: req.params.id,
          userId: req.userId!,
          read: true,
          readAt: new Date()
        }
      })
    } else if (!recipient.read) {
      // Update if not already read
      recipient = await prisma.announcementRecipient.update({
        where: {
          announcementId_userId: {
            announcementId: req.params.id,
            userId: req.userId!
          }
        },
        data: {
          read: true,
          readAt: new Date()
        }
      })
    }

    res.json({ message: 'Announcement marked as read', read: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Announcement not found' })
    }
    console.error('Mark as read error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get engagement metrics for an announcement (Admin or creator only)
router.get('/:id/engagement', authenticate, async (req: AuthRequest, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true
          }
        }
      }
    })

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    // Only Admin or creator can view engagement
    if (req.userRole !== 'ADMIN' && announcement.createdBy !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const recipients = await prisma.announcementRecipient.findMany({
      where: { announcementId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            teacherProfile: {
              select: {
                name: true,
                department: true
              }
            }
          }
        }
      },
      orderBy: { readAt: 'desc' }
    })

    const totalRecipients = recipients.length
    const readCount = recipients.filter(r => r.read).length
    const unreadCount = totalRecipients - readCount

    const readBy = recipients
      .filter(r => r.read)
      .map(r => ({
        user: r.user,
        readAt: r.readAt
      }))

    const unreadBy = recipients
      .filter(r => !r.read)
      .map(r => ({
        user: r.user
      }))

    res.json({
      totalRecipients,
      readCount,
      unreadCount,
      readPercentage: totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0,
      readBy,
      unreadBy
    })
  } catch (error) {
    console.error('Get engagement error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

