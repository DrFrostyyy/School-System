import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, FileText, Calendar, User, Download, ExternalLink, Edit, Trash2, Pin, PinOff } from 'lucide-react'
import { apiClient } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

interface Announcement {
  id: string
  title: string
  body: string
  attachment?: string
  link?: string
  visibility: string
  pinned?: boolean
  createdAt: string
  createdBy: string
  creator: {
    id: string
    email: string
    teacherProfile?: {
      name: string
      department: string
    }
  }
  recipients?: Array<{
    read: boolean
    user: {
      id: string
      email: string
    }
  }>
}

export default function Announcements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    visibility: 'ALL',
    department: '',
    attachment: null as File | null,
    link: ''
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const data = await apiClient.get<Announcement[]>('/announcements')
      setAnnouncements(data)
    } catch (error: any) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.role !== 'ADMIN' && user?.role !== 'TEACHER') return

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('body', formData.body)
      formDataToSend.append('visibility', formData.visibility)
      if (formData.visibility === 'DEPARTMENT' && formData.department) {
        formDataToSend.append('department', formData.department)
      }
      if (formData.link) {
        formDataToSend.append('link', formData.link)
      }
      if (formData.attachment) {
        formDataToSend.append('attachment', formData.attachment)
      }

      if (editingAnnouncement) {
        await apiClient.uploadFile(`/announcements/${editingAnnouncement.id}`, formDataToSend, 'PUT')
      } else {
        await apiClient.uploadFile('/announcements', formDataToSend)
      }
      
      setShowModal(false)
      setEditingAnnouncement(null)
      setFormData({ title: '', body: '', visibility: 'ALL', department: '', attachment: null, link: '' })
      fetchAnnouncements()
    } catch (error: any) {
      console.error('Failed to save announcement:', error)
      alert(error.message || 'Failed to save announcement')
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      body: announcement.body,
      visibility: announcement.visibility,
      department: announcement.visibility === 'DEPARTMENT' ? announcement.visibility : '',
      attachment: null,
      link: announcement.link ?? ''
    })
    setShowModal(true)
  }

  const handleDelete = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      await apiClient.delete(`/announcements/${announcementId}`)
      fetchAnnouncements()
    } catch (error: any) {
      console.error('Failed to delete announcement:', error)
      alert(error.message || 'Failed to delete announcement')
    }
  }

  const handlePin = async (announcementId: string, pinned: boolean) => {
    try {
      await apiClient.patch(`/announcements/${announcementId}/pin`, { pinned })
      fetchAnnouncements()
    } catch (error: any) {
      console.error('Failed to pin/unpin announcement:', error)
      alert(error.message || 'Failed to update pin status')
    }
  }

  const getAttachmentUrl = (attachment?: string) => {
    if (!attachment) return null
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    return `${baseUrl}${attachment}`
  }

  if (isLoading) {
    return <div className="p-8">Loading announcements...</div>
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
            Announcements
          </h1>
          <p className="text-charcoal-600">View and manage school announcements</p>
        </div>
        {user && (user.role === 'ADMIN' || user.role === 'TEACHER') && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingAnnouncement(null)
              setFormData({ title: '', body: '', visibility: 'ALL', department: '', attachment: null, link: '' })
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Create Announcement</span>
          </motion.button>
        )}
      </motion.div>

      <div className="space-y-4">
        {announcements.map((announcement, index) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-smooth ${
              announcement.pinned 
                ? 'border-gold-500 border-2 bg-gold-50/30' 
                : 'border-charcoal-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {announcement.pinned && (
                    <Pin className="w-5 h-5 text-gold-500 fill-gold-500" />
                  )}
                  <h3 className="text-xl font-serif font-bold text-charcoal-900">
                    {announcement.title}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-charcoal-600 mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{announcement.creator.teacherProfile?.name || announcement.creator.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="px-2 py-1 bg-charcoal-100 text-charcoal-700 rounded text-xs">
                    {announcement.visibility}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(user?.role === 'ADMIN' || announcement.createdBy === user?.id) && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-charcoal-400 hover:text-gold-600 transition-smooth"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-charcoal-400 hover:text-red-600 transition-smooth"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </>
                )}
                {user?.role === 'ADMIN' && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePin(announcement.id, !announcement.pinned)}
                    className={`p-2 transition-smooth ${
                      announcement.pinned
                        ? 'text-gold-600 hover:text-gold-700'
                        : 'text-charcoal-400 hover:text-gold-600'
                    }`}
                    title={announcement.pinned ? 'Unpin' : 'Pin'}
                  >
                    {announcement.pinned ? (
                      <Pin className="w-4 h-4 fill-current" />
                    ) : (
                      <PinOff className="w-4 h-4" />
                    )}
                  </motion.button>
                )}
              </div>
            </div>
            
            <div className="prose max-w-none mb-4">
              <p className="text-charcoal-700 whitespace-pre-wrap">{announcement.body}</p>
            </div>

            {announcement.attachment && getAttachmentUrl(announcement.attachment) && (
              <div className="mt-4 pt-4 border-t border-charcoal-200">
                <a
                  href={getAttachmentUrl(announcement.attachment) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 transition-smooth"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Attachment</span>
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}

            {announcement.link && (
              <div className="mt-4 pt-4 border-t border-charcoal-200">
                <a
                  href={announcement.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 transition-smooth"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Link</span>
                </a>
              </div>
            )}
          </motion.div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12 text-charcoal-500">
            No announcements yet
          </div>
        )}
      </div>

      {showModal && (user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-4">
              {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Title
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
                  Body
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Link/URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Link/URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="ALL">All Teachers</option>
                  <option value="DEPARTMENT">Specific Department</option>
                </select>
              </div>
              {formData.visibility === 'DEPARTMENT' && (
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Attachment (Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => setFormData({ ...formData, attachment: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                <p className="text-xs text-charcoal-500 mt-1">
                  Accepted: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth"
                >
                  {editingAnnouncement ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingAnnouncement(null)
                    setFormData({ title: '', body: '', visibility: 'ALL', department: '', attachment: null, link: '' })
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
    </div>
  )
}

