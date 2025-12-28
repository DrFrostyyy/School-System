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
        orderBy: { createdAt: 'desc' }
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
        orderBy: { createdAt: 'desc' }
      })
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
      await prisma.announcementRecipient.updateMany({
        where: {
          announcementId: announcement.id,
          userId: req.userId!,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      })
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

// Update announcement (Admin only)
router.put('/:id', authenticate, requireRole(['ADMIN']), announcementUpload.single('attachment'), async (req: AuthRequest, res) => {
  try {
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: req.params.id }
    })

    if (!existingAnnouncement) {
      return res.status(404).json({ error: 'Announcement not found' })
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

// Delete announcement (Admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id }
    })

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' })
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

export default router

