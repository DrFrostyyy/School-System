import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, FileText, Calendar, User, Download, ExternalLink, Edit, Trash2, Pin, PinOff, Search, CheckCircle, Circle, Users } from 'lucide-react'
// @ts-ignore - react-quill doesn't have official types
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { apiClient } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

// Quill editor modules configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link'],
    ['clean']
  ],
}

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'color', 'background',
  'link'
]

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
  isRead?: boolean
  readAt?: string | null
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
    readAt?: string | null
    user: {
      id: string
      email: string
      teacherProfile?: {
        name: string
        department: string
      }
    }
  }>
}

interface EngagementMetrics {
  totalRecipients: number
  readCount: number
  unreadCount: number
  readPercentage: number
  readBy: Array<{
    user: {
      id: string
      email: string
      teacherProfile?: {
        name: string
        department: string
      }
    }
    readAt: string | null
  }>
  unreadBy: Array<{
    user: {
      id: string
      email: string
      teacherProfile?: {
        name: string
        department: string
      }
    }
  }>
}

export default function Announcements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null)
  const [showEngagementModal, setShowEngagementModal] = useState(false)
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

    // Listen for global search events
    const handleGlobalSearch = (e: CustomEvent) => {
      setSearchQuery(e.detail.query)
    }
    window.addEventListener('globalSearch', handleGlobalSearch as EventListener)
    return () => window.removeEventListener('globalSearch', handleGlobalSearch as EventListener)
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const data = await apiClient.get<Announcement[]>('/announcements')
      setAnnouncements(data)
      setFilteredAnnouncements(data)
    } catch (error: any) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAnnouncements(announcements)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = announcements.filter(announcement =>
        announcement.title.toLowerCase().includes(query) ||
        announcement.body.toLowerCase().includes(query) ||
        announcement.creator.teacherProfile?.name.toLowerCase().includes(query) ||
        announcement.creator.email.toLowerCase().includes(query) ||
        announcement.visibility.toLowerCase().includes(query)
      )
      setFilteredAnnouncements(filtered)
    }
  }, [searchQuery, announcements])

  const markAsRead = async (announcementId: string) => {
    try {
      await apiClient.patch(`/announcements/${announcementId}/read`, {})
      // Update local state
      setAnnouncements(prev => prev.map(ann => 
        ann.id === announcementId 
          ? { ...ann, isRead: true, readAt: new Date().toISOString() }
          : ann
      ))
      setFilteredAnnouncements(prev => prev.map(ann => 
        ann.id === announcementId 
          ? { ...ann, isRead: true, readAt: new Date().toISOString() }
          : ann
      ))
    } catch (error: any) {
      console.error('Failed to mark as read:', error)
    }
  }

  const fetchEngagementMetrics = async (announcementId: string) => {
    try {
      const metrics = await apiClient.get<EngagementMetrics>(`/announcements/${announcementId}/engagement`)
      setEngagementMetrics(metrics)
      setShowEngagementModal(true)
    } catch (error: any) {
      console.error('Failed to fetch engagement metrics:', error)
      alert(error.message || 'Failed to fetch engagement metrics')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.role !== 'ADMIN' && user?.role !== 'TEACHER') return

    // Validate body - check if it has actual content (not just empty HTML tags)
    const bodyText = formData.body.replace(/<[^>]*>/g, '').trim()
    if (!bodyText) {
      alert('Please enter announcement body content')
      return
    }

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-charcoal-200 rounded-lg p-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search announcements by title, content, creator, or visibility..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-smooth"
          />
        </div>
      </motion.div>

      <div className="space-y-4">
        {filteredAnnouncements.map((announcement, index) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-smooth ${
              announcement.pinned 
                ? 'border-gold-500 border-2 bg-gold-50/30' 
                : announcement.isRead === false && user?.role === 'TEACHER'
                ? 'border-charcoal-200 bg-charcoal-50/50'
                : 'border-charcoal-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {announcement.pinned && (
                    <Pin className="w-5 h-5 text-gold-500 fill-gold-500" />
                  )}
                  {user?.role === 'TEACHER' && (
                    <div title={announcement.isRead ? "Read" : "Unread"}>
                      {announcement.isRead ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gold-600" />
                      )}
                    </div>
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
                  {user?.role === 'TEACHER' && announcement.isRead && announcement.readAt && (
                    <span className="text-xs text-charcoal-500">
                      Read {new Date(announcement.readAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user?.role === 'TEACHER' && !announcement.isRead && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => markAsRead(announcement.id)}
                    className="px-3 py-1.5 text-xs bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth"
                    title="Mark as read"
                  >
                    Mark as Read
                  </motion.button>
                )}
                {(user?.role === 'ADMIN' || announcement.createdBy === user?.id) && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fetchEngagementMetrics(announcement.id)}
                    className="p-2 text-charcoal-400 hover:text-gold-600 transition-smooth"
                    title="View engagement"
                  >
                    <Users className="w-4 h-4" />
                  </motion.button>
                )}
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
              <div 
                className="text-charcoal-700 quill-content"
                dangerouslySetInnerHTML={{ __html: announcement.body }}
              />
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
                <div className="border border-charcoal-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gold-500">
                  <ReactQuill
                    theme="snow"
                    value={formData.body}
                    onChange={(value: string) => setFormData({ ...formData, body: value })}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Write your announcement..."
                    style={{ minHeight: '200px' }}
                  />
                </div>
                {!formData.body || formData.body.replace(/<[^>]*>/g, '').trim() === '' && (
                  <p className="text-xs text-red-500 mt-1">Body is required</p>
                )}
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

      {/* Engagement Metrics Modal */}
      {showEngagementModal && engagementMetrics && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-serif font-bold text-charcoal-900">
                Engagement Metrics
              </h2>
              <button
                onClick={() => {
                  setShowEngagementModal(false)
                  setEngagementMetrics(null)
                }}
                className="p-2 text-charcoal-400 hover:text-charcoal-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-charcoal-50 rounded-lg p-4">
                <p className="text-sm text-charcoal-600 mb-1">Total Recipients</p>
                <p className="text-2xl font-bold text-charcoal-900">{engagementMetrics.totalRecipients}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-charcoal-600 mb-1">Read</p>
                <p className="text-2xl font-bold text-green-600">{engagementMetrics.readCount}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-charcoal-600 mb-1">Unread</p>
                <p className="text-2xl font-bold text-red-600">{engagementMetrics.unreadCount}</p>
              </div>
              <div className="bg-gold-50 rounded-lg p-4">
                <p className="text-sm text-charcoal-600 mb-1">Read Rate</p>
                <p className="text-2xl font-bold text-gold-600">{engagementMetrics.readPercentage}%</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-charcoal-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Read By ({engagementMetrics.readBy.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {engagementMetrics.readBy.length > 0 ? (
                    engagementMetrics.readBy.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-charcoal-900">
                            {item.user.teacherProfile?.name || item.user.email}
                          </p>
                          {item.user.teacherProfile?.department && (
                            <p className="text-xs text-charcoal-600">{item.user.teacherProfile.department}</p>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-500">
                          {item.readAt ? new Date(item.readAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-charcoal-500">No one has read this announcement yet</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-charcoal-900 mb-3 flex items-center gap-2">
                  <Circle className="w-5 h-5 text-red-600" />
                  Unread By ({engagementMetrics.unreadBy.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {engagementMetrics.unreadBy.length > 0 ? (
                    engagementMetrics.unreadBy.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-charcoal-900">
                            {item.user.teacherProfile?.name || item.user.email}
                          </p>
                          {item.user.teacherProfile?.department && (
                            <p className="text-xs text-charcoal-600">{item.user.teacherProfile.department}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-charcoal-500">Everyone has read this announcement</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-charcoal-200">
              <button
                onClick={() => {
                  setShowEngagementModal(false)
                  setEngagementMetrics(null)
                }}
                className="w-full px-4 py-2 bg-charcoal-800 text-white rounded-lg hover:bg-charcoal-700 transition-smooth"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

