import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Inbox, Mail, Trash2, User, Search, Reply, MessageSquare } from 'lucide-react'
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
  parentMessageId?: string | null
  threadId?: string | null
  unreadCount?: number
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
  parentMessage?: {
    id: string
    subject: string
  }
}

interface User {
  id: string
  email: string
  role?: string
  teacherProfile?: {
    name: string
    department: string
  }
}

export default function Messages() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')
  
  // Admin can only view inbox
  useEffect(() => {
    if (user?.role === 'ADMIN' && activeTab === 'sent') {
      setActiveTab('inbox')
    }
  }, [user, activeTab])
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [showThread, setShowThread] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [showCompose, setShowCompose] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [formData, setFormData] = useState({
    recipientId: '',
    subject: '',
    body: ''
  })

  useEffect(() => {
    if (activeTab === 'inbox') {
      fetchInbox()
    } else if (activeTab === 'sent' && user?.role !== 'ADMIN') {
      fetchSent()
    }
  }, [activeTab, user])

  // Fetch users separately when component mounts (for teachers)
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      fetchUsers()
    }

    // Listen for global search events
    const handleGlobalSearch = (e: CustomEvent) => {
      setSearchQuery(e.detail.query)
    }
    window.addEventListener('globalSearch', handleGlobalSearch as EventListener)
    return () => window.removeEventListener('globalSearch', handleGlobalSearch as EventListener)
  }, [user])

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
      if (user?.role === 'ADMIN') {
        setMessages([])
        return
      }
      const data = await apiClient.get<Message[]>('/messages/sent')
      setMessages(data)
    } catch (error) {
      console.error('Failed to fetch sent messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    if (user?.role === 'ADMIN') {
      setUsers([])
      return
    }
    setLoadingUsers(true)
    try {
      const data = await apiClient.get<User[]>('/messages/users/list')
      setUsers(data)
      console.log('Fetched users:', data) // Debug log
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      alert(error.message || 'Failed to load recipients. Please try again.')
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMessages(messages)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = messages.filter(message =>
        message.subject.toLowerCase().includes(query) ||
        message.body.toLowerCase().includes(query) ||
        message.sender?.teacherProfile?.name.toLowerCase().includes(query) ||
        message.sender?.email.toLowerCase().includes(query) ||
        message.recipient?.teacherProfile?.name.toLowerCase().includes(query) ||
        message.recipient?.email.toLowerCase().includes(query)
      )
      setFilteredMessages(filtered)
    }
  }, [searchQuery, messages])

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message)
    setShowThread(true)
    
    // Fetch thread messages
    try {
      const threadData = await apiClient.get<Message[]>(`/messages/${message.id}/thread`)
      setThreadMessages(threadData)
    } catch (error) {
      console.error('Failed to fetch thread:', error)
      // Fallback to single message
      setThreadMessages([message])
    }

    if (!message.read && activeTab === 'inbox') {
      try {
        await apiClient.patch(`/messages/${message.id}/read`)
        fetchInbox()
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyingTo || !replyBody.trim()) return

    try {
      await apiClient.post(`/messages/${replyingTo.id}/reply`, { body: replyBody })
      setReplyBody('')
      setReplyingTo(null)
      
      // Refresh thread
      if (selectedMessage) {
        const threadData = await apiClient.get<Message[]>(`/messages/${selectedMessage.id}/thread`)
        setThreadMessages(threadData)
      }
      
      // Refresh inbox/sent
      if (activeTab === 'inbox') {
        fetchInbox()
      } else {
        fetchSent()
      }
    } catch (error: any) {
      console.error('Failed to send reply:', error)
      alert(error.message || 'Failed to send reply')
    }
  }

  const markThreadAsRead = async (threadId: string) => {
    try {
      await apiClient.patch(`/messages/thread/${threadId}/read`)
      if (activeTab === 'inbox') {
        fetchInbox()
      }
      // Refresh thread
      if (selectedMessage) {
        const threadData = await apiClient.get<Message[]>(`/messages/${selectedMessage.id}/thread`)
        setThreadMessages(threadData)
      }
    } catch (error) {
      console.error('Failed to mark thread as read:', error)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.role === 'ADMIN') {
      alert('Admins cannot send messages. They can only receive messages from teachers.')
      return
    }
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

  const getMessageRecipient = (message: Message) => {
    if (activeTab === 'inbox') {
      return message.recipient?.teacherProfile?.name || message.recipient?.email || 'Unknown'
    }
    // For sent messages, check if recipient has teacherProfile (if not, likely admin)
    if (!message.recipient?.teacherProfile) {
      return 'Admin'
    }
    return message.recipient.teacherProfile.name || message.recipient.email || 'Unknown'
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
          <p className="text-charcoal-600">
            {user?.role === 'ADMIN' 
              ? 'You can only receive messages from teachers' 
              : 'Internal messaging system'}
          </p>
        </div>
        {user?.role !== 'ADMIN' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowCompose(true)
            // Fetch users when opening compose modal
            if (user?.role !== 'ADMIN') {
              fetchUsers()
            }
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth shadow-sm"
        >
          <Send className="w-5 h-5" />
          <span>Compose</span>
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
            placeholder="Search messages by subject, content, sender, or recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-smooth"
          />
        </div>
      </motion.div>

      <div className="flex gap-4 border-b border-charcoal-200">
        <button
            onClick={() => {
              setActiveTab('inbox')
              setSelectedMessage(null)
              setShowThread(false)
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
        {user?.role !== 'ADMIN' && (
          <button
            onClick={() => {
              setActiveTab('sent')
              setSelectedMessage(null)
              setShowThread(false)
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
        )}
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
            ) : filteredMessages.length === 0 && messages.length > 0 ? (
              <div className="p-8 text-center text-charcoal-500">No messages found matching "{searchQuery}"</div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-charcoal-500">No messages</div>
            ) : (
              filteredMessages.map((message) => (
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-charcoal-900 truncate">
                          {getMessageSender(message)}
                        </p>
                        {message.unreadCount && message.unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-gold-500 text-white text-xs rounded-full">
                            {message.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-charcoal-600 truncate">{message.subject}</p>
                      {message.parentMessageId && (
                        <p className="text-xs text-charcoal-400 flex items-center gap-1 mt-1">
                          <MessageSquare className="w-3 h-3" />
                          Reply
                        </p>
                      )}
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
          {selectedMessage && showThread ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-charcoal-200 bg-charcoal-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-serif font-bold text-charcoal-900 mb-2">
                      {selectedMessage.subject.replace(/^Re: /, '')}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-charcoal-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          {activeTab === 'inbox' 
                            ? getMessageSender(selectedMessage)
                            : getMessageRecipient(selectedMessage)}
                        </span>
                      </div>
                      {threadMessages.length > 1 && (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>{threadMessages.length} messages</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.role !== 'ADMIN' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setReplyingTo(selectedMessage)
                          setReplyBody('')
                        }}
                        className="p-2 text-charcoal-400 hover:text-gold-600 transition-smooth"
                        title="Reply"
                      >
                        <Reply className="w-5 h-5" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="p-2 text-charcoal-400 hover:text-red-600 transition-smooth"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {threadMessages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      msg.senderId === user?.id
                        ? 'bg-gold-50 border-gold-200 ml-8'
                        : 'bg-charcoal-50 border-charcoal-200 mr-8'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-charcoal-900">
                            {msg.senderId === user?.id
                              ? 'You'
                              : getMessageSender(msg)}
                          </span>
                          {msg.parentMessageId && (
                            <span className="text-xs text-charcoal-400 flex items-center gap-1">
                              <Reply className="w-3 h-3" />
                              Reply
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-500">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-charcoal-700 whitespace-pre-wrap mt-2">{msg.body}</p>
                  </motion.div>
                ))}
              </div>
              
              {/* Reply Form */}
              {replyingTo && user?.role !== 'ADMIN' && (
                <div className="p-6 border-t border-charcoal-200 bg-charcoal-50">
                  <form onSubmit={handleReply} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-1">
                        Reply
                      </label>
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                        placeholder="Type your reply..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth"
                      >
                        Send Reply
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyBody('')
                        }}
                        className="px-4 py-2 border border-charcoal-200 rounded-lg hover:bg-charcoal-50 transition-smooth"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : selectedMessage ? (
            <div className="h-full flex items-center justify-center text-charcoal-500">
              Loading conversation...
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
                  disabled={loadingUsers}
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-charcoal-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingUsers ? 'Loading recipients...' : 'Select recipient'}
                  </option>
                  {users.length === 0 && !loadingUsers ? (
                    <option value="" disabled>No recipients available</option>
                  ) : (
                    users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.teacherProfile?.name || u.email} {u.role === 'ADMIN' ? '(Admin)' : ''}
                      </option>
                    ))
                  )}
                </select>
                {users.length === 0 && !loadingUsers && (
                  <p className="text-xs text-charcoal-500 mt-1">
                    No recipients available. Make sure there are other teachers or admin in the system.
                  </p>
                )}
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

