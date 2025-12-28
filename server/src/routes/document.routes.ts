import express from 'express'
import prisma from '../utils/prisma.js'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware.js'
import { documentUpload, deleteFile } from '../utils/fileUpload.js'

const router = express.Router()

// Get all documents
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { category, folderId } = req.query

    const where: any = {}
    if (category) {
      where.category = category as string
    }
    if (folderId) {
      where.folderId = folderId as string
    } else if (folderId === '') {
      // If folderId is explicitly empty string, show documents without folders
      where.folderId = null
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
        },
        folder: {
          select: {
            id: true,
            name: true
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

// Upload document (Admin and Teachers)
router.post('/', authenticate, documentUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' })
    }

    const { title, description, category, folderId } = req.body

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' })
    }

    // Validate folder if provided
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      })
      if (!folder) {
        return res.status(400).json({ error: 'Folder not found' })
      }
    }

    const document = await prisma.document.create({
      data: {
        title,
        description: description || null,
        category,
        folderId: folderId || null,
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

// Update document (Admin can update any, Teachers can update their own)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const existingDocument = await prisma.document.findUnique({
      where: { id: req.params.id }
    })

    if (!existingDocument) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Check permissions: Admin can update any, Teachers can only update their own
    if (req.userRole !== 'ADMIN' && existingDocument.uploadedBy !== req.userId!) {
      return res.status(403).json({ error: 'You can only update your own documents' })
    }

    const { title, description, category, folderId } = req.body

    // Validate folder if provided
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      })
      if (!folder) {
        return res.status(400).json({ error: 'Folder not found' })
      }
    }

    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        category,
        folderId: folderId || null
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

// Delete document (Admin can delete any, Teachers can delete their own)
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id }
    })

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Check permissions: Admin can delete any, Teachers can only delete their own
    if (req.userRole !== 'ADMIN' && document.uploadedBy !== req.userId!) {
      return res.status(403).json({ error: 'You can only delete your own documents' })
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

// Create folder
router.post('/folders', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' })
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: req.userId!
      },
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

    res.status(201).json(folder)
  } catch (error) {
    console.error('Create folder error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all folders
router.get('/folders', authenticate, async (req: AuthRequest, res) => {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            teacherProfile: true
          }
        },
        _count: {
          select: {
            documents: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(folders)
  } catch (error) {
    console.error('Get folders error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update folder
router.put('/folders/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const existingFolder = await prisma.folder.findUnique({
      where: { id: req.params.id }
    })

    if (!existingFolder) {
      return res.status(404).json({ error: 'Folder not found' })
    }

    // Check permissions: Admin can update any, Teachers can only update their own
    if (req.userRole !== 'ADMIN' && existingFolder.createdBy !== req.userId!) {
      return res.status(403).json({ error: 'You can only update your own folders' })
    }

    const { name, description } = req.body

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' })
    }

    const folder = await prisma.folder.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      },
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

    res.json(folder)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Folder not found' })
    }
    console.error('Update folder error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete folder
router.delete('/folders/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            documents: true
          }
        }
      }
    })

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' })
    }

    // Check permissions: Admin can delete any, Teachers can only delete their own
    if (req.userRole !== 'ADMIN' && folder.createdBy !== req.userId!) {
      return res.status(403).json({ error: 'You can only delete your own folders' })
    }

    // Check if folder has documents
    if (folder._count.documents > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete folder with documents. Please move or delete documents first.' 
      })
    }

    await prisma.folder.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Folder deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Folder not found' })
    }
    console.error('Delete folder error:', error)
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

