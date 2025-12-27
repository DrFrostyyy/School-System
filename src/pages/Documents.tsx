import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, FileText, Download, Calendar, User, Filter } from 'lucide-react'
import { apiClient } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

interface Document {
  id: string
  title: string
  description?: string
  category: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  createdAt: string
  uploader: {
    id: string
    email: string
    teacherProfile?: {
      name: string
    }
  }
}

export default function Documents() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    file: null as File | null
  })

  useEffect(() => {
    fetchDocuments()
    fetchCategories()
  }, [selectedCategory])

  const fetchDocuments = async () => {
    try {
      const url = selectedCategory ? `/documents?category=${selectedCategory}` : '/documents'
      const data = await apiClient.get<Document[]>(url)
      setDocuments(data)
    } catch (error: any) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await apiClient.get<string[]>('/documents/meta/categories')
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.role !== 'ADMIN' || !formData.file) return

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('file', formData.file)

      await apiClient.uploadFile('/documents', formDataToSend)
      setShowModal(false)
      setFormData({ title: '', description: '', category: '', file: null })
      fetchDocuments()
      fetchCategories()
    } catch (error: any) {
      console.error('Failed to upload document:', error)
      alert(error.message || 'Failed to upload document')
    }
  }

  const getFileUrl = (filePath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    return `${baseUrl}${filePath}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  if (isLoading) {
    return <div className="p-8">Loading documents...</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">
            Documents
          </h1>
          <p className="text-charcoal-600">View and download school documents</p>
        </div>
        {user?.role === 'ADMIN' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Upload Document</span>
          </motion.button>
        )}
      </motion.div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-charcoal-600" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-smooth"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gold-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-serif font-bold text-charcoal-900 mb-1 truncate">
                  {doc.title}
                </h3>
                <p className="text-xs text-charcoal-600 mb-2">{doc.category}</p>
              </div>
            </div>

            {doc.description && (
              <p className="text-sm text-charcoal-600 mb-4 line-clamp-2">
                {doc.description}
              </p>
            )}

            <div className="space-y-2 text-xs text-charcoal-500 mb-4">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                <span>{doc.uploader.teacherProfile?.name || doc.uploader.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="text-charcoal-400">
                {formatFileSize(doc.fileSize)}
              </div>
            </div>

            <a
              href={getFileUrl(doc.filePath)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gold-50 text-gold-700 rounded-lg hover:bg-gold-100 transition-smooth"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
          </motion.div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-12 text-charcoal-500">
          No documents found
        </div>
      )}

      {showModal && user?.role === 'ADMIN' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl"
          >
            <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-4">
              Upload Document
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  placeholder="e.g., Policies, Forms, Reports"
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  File *
                </label>
                <input
                  type="file"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  required
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-charcoal-200 rounded-lg hover:bg-charcoal-50 transition-smooth"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

