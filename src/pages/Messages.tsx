import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Inbox, Mail, Trash2, User, Clock } from 'lucide-react'
import { apiClient } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: string
  subject: string
  body: string
  read: boolean
  readAt?: string
  createdAt: string
  senderId: string
  recipientId: string
  sender?: {
    id: string
    email: string
    teacherProfile?: {
      name: string
      department: string
    }
  }
  recipient?: {
    id: string
    email: string
    teacherProfile?: {
      name: string
      department: string
    }
  }
}

interface User {
  id: string
  email: string
  teacherProfile?: {
    name: string
    department: string
  }
}

export default function Messages() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [showCompose, setShowCompose] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    recipientId: '',
    subject: '',
    body: ''
  })

  useEffect(() => {
    fetchUsers()
    if (activeTab === 'inbox') {
      fetchInbox()
    } else {
      fetchSent()
    }
  }, [activeTab])

  const fetchInbox = async () => {
    try {
      const data = await apiClient.get<Message[]>('/messages/inbox')
      setMessages(data)
    } catch (error) {
      console.error('Failed to fetch inbox:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSent = async () => {
    try {
      const data = await apiClient.get<Message[]>('/messages/sent')
      setMessages(data)
    } catch (error) {
      console.error('Failed to fetch sent messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await apiClient.get<User[]>('/messages/users/list')
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message)
    if (!message.read && activeTab === 'inbox') {
      try {
        await apiClient.patch(`/messages/${message.id}/read`)
        fetchInbox()
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.post('/messages', formData)
      setShowCompose(false)
      setFormData({ recipientId: '', subject: '', body: '' })
      if (activeTab === 'sent') {
        fetchSent()
      }
    } catch (error: any) {
      console.error('Failed to send message:', error)
      alert(error.message || 'Failed to send message')
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await apiClient.delete(`/messages/${messageId}`)
      if (activeTab === 'inbox') {
        fetchInbox()
      } else {
        fetchSent()
      }
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const getMessageSender = (message: Message) => {
    if (activeTab === 'inbox') {
      return message.sender?.teacherProfile?.name || message.sender?.email || 'Unknown'
    }
    return message.recipient?.teacherProfile?.name || message.recipient?.email || 'Unknown'
  }

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">
            Messages
          </h1>
          <p className="text-charcoal-600">Internal messaging system</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth shadow-sm"
        >
          <Send className="w-5 h-5" />
          <span>Compose</span>
        </motion.button>
      </motion.div>

      <div className="flex gap-4 border-b border-charcoal-200">
        <button
          onClick={() => {
            setActiveTab('inbox')
            setSelectedMessage(null)
          }}
          className={`px-4 py-2 font-medium transition-smooth ${
            activeTab === 'inbox'
              ? 'text-gold-600 border-b-2 border-gold-500'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            <span>Inbox</span>
            {activeTab === 'inbox' && messages.filter(m => !m.read).length > 0 && (
              <span className="px-2 py-0.5 bg-gold-500 text-white text-xs rounded-full">
                {messages.filter(m => !m.read).length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('sent')
            setSelectedMessage(null)
          }}
          className={`px-4 py-2 font-medium transition-smooth ${
            activeTab === 'sent'
              ? 'text-gold-600 border-b-2 border-gold-500'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Sent</span>
          </div>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-charcoal-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-charcoal-200 bg-charcoal-50">
            <h2 className="font-semibold text-charcoal-900">
              {activeTab === 'inbox' ? 'Inbox' : 'Sent Messages'}
            </h2>
          </div>
          <div className="divide-y divide-charcoal-200 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-charcoal-500">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-charcoal-500">No messages</div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => handleSelectMessage(message)}
                  className={`p-4 cursor-pointer hover:bg-charcoal-50 transition-smooth ${
                    selectedMessage?.id === message.id ? 'bg-gold-50' : ''
                  } ${!message.read && activeTab === 'inbox' ? 'font-semibold' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-900 truncate">
                        {getMessageSender(message)}
                      </p>
                      <p className="text-sm text-charcoal-600 truncate">{message.subject}</p>
                    </div>
                    {!message.read && activeTab === 'inbox' && (
                      <span className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0 ml-2"></span>
                    )}
                  </div>
                  <p className="text-xs text-charcoal-500 line-clamp-2">{message.body}</p>
                  <p className="text-xs text-charcoal-400 mt-2">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-charcoal-200 rounded-lg shadow-sm overflow-hidden">
          {selectedMessage ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-charcoal-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-serif font-bold text-charcoal-900 mb-2">
                      {selectedMessage.subject}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-charcoal-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{getMessageSender(selectedMessage)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="p-2 text-charcoal-400 hover:text-red-600 transition-smooth"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="prose max-w-none">
                  <p className="text-charcoal-700 whitespace-pre-wrap">{selectedMessage.body}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-charcoal-500">
              Select a message to view
            </div>
          )}
        </div>
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl"
          >
            <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-4">
              Compose Message
            </h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  To
                </label>
                <select
                  value={formData.recipientId}
                  onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="">Select recipient</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.teacherProfile?.name || u.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Message
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  required
                  rows={8}
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
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

