import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, FileText, Download, Calendar, User, Filter, Search, Folder, FolderPlus, Edit, Trash2, X, Eye } from 'lucide-react'
import { apiClient } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import FilePreview from '../components/FilePreview'

interface Folder {
  id: string
  name: string
  description?: string
  createdAt: string
  createdBy: string
  creator: {
    id: string
    email: string
    teacherProfile?: {
      name: string
    }
  }
  _count?: {
    documents: number
  }
}

interface Document {
  id: string
  title: string
  description?: string
  category: string
  folderId?: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  createdAt: string
  uploadedBy: string
  uploader: {
    id: string
    email: string
    teacherProfile?: {
      name: string
    }
  }
  folder?: {
    id: string
    name: string
  }
}

export default function Documents() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [previewFile, setPreviewFile] = useState<{ url: string; fileName: string; mimeType: string } | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    folderId: '',
    file: null as File | null
  })
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchDocuments()
    fetchCategories()
    fetchFolders()

    // Listen for global search events
    const handleGlobalSearch = (e: CustomEvent) => {
      setSearchQuery(e.detail.query)
    }
    window.addEventListener('globalSearch', handleGlobalSearch as EventListener)
    return () => window.removeEventListener('globalSearch', handleGlobalSearch as EventListener)
  }, [selectedCategory, selectedFolder])

  const fetchDocuments = async () => {
    try {
      let url = '/documents'
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedFolder) params.append('folderId', selectedFolder)
      if (params.toString()) url += `?${params.toString()}`
      
      const data = await apiClient.get<Document[]>(url)
      setDocuments(data)
      setFilteredDocuments(data)
    } catch (error: any) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFolders = async () => {
    try {
      const data = await apiClient.get<Folder[]>('/documents/folders')
      setFolders(data)
    } catch (error) {
      console.error('Failed to fetch folders:', error)
    }
  }

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDocuments(documents)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = documents.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        (doc.description && doc.description.toLowerCase().includes(query)) ||
        doc.category.toLowerCase().includes(query) ||
        doc.uploader.teacherProfile?.name.toLowerCase().includes(query) ||
        doc.uploader.email.toLowerCase().includes(query)
      )
      setFilteredDocuments(filtered)
    }
  }, [searchQuery, documents])

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
    if ((user?.role !== 'ADMIN' && user?.role !== 'TEACHER') || !formData.file) return

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      if (formData.folderId) {
        formDataToSend.append('folderId', formData.folderId)
      }
      formDataToSend.append('file', formData.file)

      await apiClient.uploadFile('/documents', formDataToSend)
      setShowModal(false)
      setFormData({ title: '', description: '', category: '', folderId: '', file: null })
      fetchDocuments()
      fetchCategories()
    } catch (error: any) {
      console.error('Failed to upload document:', error)
      alert(error.message || 'Failed to upload document')
    }
  }

  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folderFormData.name.trim()) return

    try {
      if (editingFolder) {
        await apiClient.put(`/documents/folders/${editingFolder.id}`, folderFormData)
      } else {
        await apiClient.post('/documents/folders', folderFormData)
      }
      setShowFolderModal(false)
      setEditingFolder(null)
      setFolderFormData({ name: '', description: '' })
      fetchFolders()
    } catch (error: any) {
      console.error('Failed to save folder:', error)
      alert(error.message || 'Failed to save folder')
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? Documents in this folder will not be deleted, but will be moved to "No Folder".')) return

    try {
      await apiClient.delete(`/documents/folders/${folderId}`)
      fetchFolders()
      if (selectedFolder === folderId) {
        setSelectedFolder('')
      }
    } catch (error: any) {
      console.error('Failed to delete folder:', error)
      alert(error.message || 'Failed to delete folder')
    }
  }

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder)
    setFolderFormData({
      name: folder.name,
      description: folder.description || ''
    })
    setShowFolderModal(true)
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
        {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingFolder(null)
                setFolderFormData({ name: '', description: '' })
                setShowFolderModal(true)
              }}
              className="flex items-center gap-2 px-4 py-3 bg-charcoal-800 text-white rounded-lg hover:bg-charcoal-700 transition-smooth shadow-sm"
            >
              <FolderPlus className="w-5 h-5" />
              <span>New Folder</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Upload Document</span>
            </motion.button>
          </div>
        )}
      </motion.div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search documents by title, description, category, or uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-smooth"
          />
        </div>
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
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="">All Folders</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name} ({folder._count?.documents || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Folders View */}
      {folders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedFolder('')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-smooth ${
              selectedFolder === ''
                ? 'border-gold-500 bg-gold-50'
                : 'border-charcoal-200 hover:border-gold-300 hover:bg-charcoal-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder className="w-8 h-8 text-charcoal-400" />
              <div>
                <p className="font-semibold text-charcoal-900">All Documents</p>
                <p className="text-xs text-charcoal-500">{documents.length} documents</p>
              </div>
            </div>
          </motion.div>
          {folders.map((folder, index) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedFolder(folder.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-smooth relative group ${
                selectedFolder === folder.id
                  ? 'border-gold-500 bg-gold-50'
                  : 'border-charcoal-200 hover:border-gold-300 hover:bg-charcoal-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Folder className="w-8 h-8 text-gold-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal-900 truncate">{folder.name}</p>
                    <p className="text-xs text-charcoal-500">
                      {folder._count?.documents || 0} documents
                    </p>
                  </div>
                </div>
                {(user?.role === 'ADMIN' || folder.createdBy === user?.id) && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditFolder(folder)
                      }}
                      className="p-1 text-charcoal-400 hover:text-gold-600 transition-smooth"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFolder(folder.id)
                      }}
                      className="p-1 text-charcoal-400 hover:text-red-600 transition-smooth"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              {folder.description && (
                <p className="text-xs text-charcoal-600 line-clamp-1">{folder.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc, index) => (
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
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-charcoal-600">{doc.category}</p>
                  {doc.folder && (
                    <>
                      <span className="text-charcoal-300">•</span>
                      <div className="flex items-center gap-1 text-xs text-gold-600">
                        <Folder className="w-3 h-3" />
                        <span>{doc.folder.name}</span>
                      </div>
                    </>
                  )}
                </div>
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

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPreviewFile({
                  url: getFileUrl(doc.filePath),
                  fileName: doc.fileName,
                  mimeType: doc.mimeType
                })}
                className="flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-charcoal-50 text-charcoal-700 rounded-lg hover:bg-charcoal-100 transition-smooth"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </motion.button>
              <a
                href={getFileUrl(doc.filePath)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-gold-50 text-gold-700 rounded-lg hover:bg-gold-100 transition-smooth"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredDocuments.length === 0 && documents.length > 0 && (
        <div className="text-center py-12 text-charcoal-500">
          No documents found matching "{searchQuery}"
        </div>
      )}
      {documents.length === 0 && (
        <div className="text-center py-12 text-charcoal-500">
          No documents found
        </div>
      )}

      {showModal && (user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
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
                  Folder (Optional)
                </label>
                <select
                  value={formData.folderId}
                  onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="">No Folder</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
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

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-serif font-bold text-charcoal-900">
                {editingFolder ? 'Edit Folder' : 'Create Folder'}
              </h2>
              <button
                onClick={() => {
                  setShowFolderModal(false)
                  setEditingFolder(null)
                  setFolderFormData({ name: '', description: '' })
                }}
                className="p-2 text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFolderSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Folder Name *
                </label>
                <input
                  type="text"
                  value={folderFormData.name}
                  onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                  required
                  placeholder="e.g., Lesson Plans, Resources, Forms"
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={folderFormData.description}
                  onChange={(e) => setFolderFormData({ ...folderFormData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of this folder..."
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth"
                >
                  {editingFolder ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderModal(false)
                    setEditingFolder(null)
                    setFolderFormData({ name: '', description: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-charcoal-200 rounded-lg hover:bg-charcoal-50 transition-smooth"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {previewFile && (
        <FilePreview
          fileUrl={previewFile.url}
          fileName={previewFile.fileName}
          mimeType={previewFile.mimeType}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  )
}

