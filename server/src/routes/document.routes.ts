import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js'
import { documentUpload, deleteFile } from '../utils/fileUpload.js'

const router = express.Router()

// Get all documents
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { category } = req.query

    const where: any = {}
    if (category) {
      where.category = category as string
    }

    const documents = await prisma.document.findMany({
      where,
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

    res.json(documents)
  } catch (error) {
    console.error('Get documents error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single document
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        }
      }
    })

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    res.json(document)
  } catch (error) {
    console.error('Get document error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload document (Admin only)
router.post('/', authenticate, requireRole(['ADMIN']), documentUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' })
    }

    const { title, description, category } = req.body

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' })
    }

    const document = await prisma.document.create({
      data: {
        title,
        description: description || null,
        category,
        filePath: `/uploads/documents/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.userId!
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        }
      }
    })

    res.status(201).json(document)
  } catch (error) {
    console.error('Upload document error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update document (Admin only)
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { title, description, category } = req.body

    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        category
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        }
      }
    })

    res.json(document)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Document not found' })
    }
    console.error('Update document error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete document (Admin only)
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id }
    })

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Delete file from filesystem
    deleteFile(document.filePath)

    await prisma.document.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Document deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Document not found' })
    }
    console.error('Delete document error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get document categories
router.get('/meta/categories', authenticate, async (req, res) => {
  try {
    const categories = await prisma.document.findMany({
      select: { category: true },
      distinct: ['category']
    })

    res.json(categories.map(c => c.category))
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

