import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, MessageSquare, Megaphone, X, Moon, Sun } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useEffect, useState, useRef } from 'react'
import { apiClient } from '../utils/api'
import { useNavigate, useLocation } from 'react-router-dom'

interface Notification {
  id: string
  type: 'message' | 'announcement'
  title: string
  body: string
  from: string
  createdAt: string
  read: boolean
}

interface NotificationsResponse {
  notifications: Notification[]
  totalUnread: number
  unreadMessages: number
  unreadAnnouncements: number
}

export default function Header() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await apiClient.get<NotificationsResponse>('/messages/notifications')
        setNotifications(data.notifications)
        setUnreadCount(data.totalUnread)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [user])

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'message') {
      navigate('/messages')
    } else if (notification.type === 'announcement') {
      navigate('/announcements')
    }
    setShowNotifications(false)
  }

  const getInitials = () => {
    if (user?.teacherProfile?.name) {
      return user.teacherProfile.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email.charAt(0).toUpperCase() || 'U'
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-charcoal-900 border-b border-charcoal-200 dark:border-charcoal-700 shadow-sm"
    >
      <div className="px-8 py-4 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search across all pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  // Navigate to appropriate page based on current location
                  const query = searchQuery.trim().toLowerCase()
                  if (location.pathname === '/teachers') {
                    // Trigger search on teachers page
                    const event = new CustomEvent('globalSearch', { detail: { query } })
                    window.dispatchEvent(event)
                  } else if (location.pathname === '/announcements') {
                    const event = new CustomEvent('globalSearch', { detail: { query } })
                    window.dispatchEvent(event)
                  } else if (location.pathname === '/documents') {
                    const event = new CustomEvent('globalSearch', { detail: { query } })
                    window.dispatchEvent(event)
                  } else if (location.pathname === '/messages') {
                    const event = new CustomEvent('globalSearch', { detail: { query } })
                    window.dispatchEvent(event)
                  } else {
                    // Default: navigate to teachers page
                    navigate('/teachers')
                    setTimeout(() => {
                      const event = new CustomEvent('globalSearch', { detail: { query } })
                      window.dispatchEvent(event)
                    }, 100)
                  }
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-smooth"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 text-charcoal-600 dark:text-charcoal-300 hover:text-gold-600 dark:hover:text-gold-500 transition-smooth rounded-lg hover:bg-gold-50 dark:hover:bg-charcoal-800"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </motion.button>
          
          <div className="relative" ref={notificationRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 text-charcoal-600 dark:text-charcoal-300 hover:text-gold-600 dark:hover:text-gold-500 transition-smooth rounded-lg hover:bg-gold-50 dark:hover:bg-charcoal-800"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-96 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-lg shadow-xl z-50 max-h-[600px] overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-charcoal-200 dark:border-charcoal-700 flex items-center justify-between bg-charcoal-50 dark:bg-charcoal-900">
                    <h3 className="font-semibold text-charcoal-900 dark:text-charcoal-100">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 text-charcoal-400 dark:text-charcoal-500 hover:text-charcoal-600 dark:hover:text-charcoal-300 transition-smooth"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="overflow-y-auto max-h-[500px]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-charcoal-500 dark:text-charcoal-400">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-charcoal-300 dark:text-charcoal-600" />
                        <p>No new notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-charcoal-100">
                        {notifications.map((notification) => (
                          <motion.div
                            key={`${notification.type}-${notification.id}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 cursor-pointer hover:bg-charcoal-50 dark:hover:bg-charcoal-700 transition-smooth ${
                              !notification.read ? 'bg-gold-50/30 dark:bg-gold-900/20' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${
                                notification.type === 'message' 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-gold-100 text-gold-600'
                              }`}>
                                {notification.type === 'message' ? (
                                  <MessageSquare className="w-4 h-4" />
                                ) : (
                                  <Megaphone className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-sm font-semibold text-charcoal-900 dark:text-charcoal-100 truncate">
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <span className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0 mt-1"></span>
                                  )}
                                </div>
                                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mb-1 line-clamp-2">
                                  {notification.body}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-charcoal-500 dark:text-charcoal-500">
                                  <span>{notification.from}</span>
                                  <span>•</span>
                                  <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-charcoal-200 dark:border-charcoal-700 bg-charcoal-50 dark:bg-charcoal-900">
                      <button
                        onClick={() => {
                          navigate('/messages')
                          setShowNotifications(false)
                        }}
                        className="w-full text-sm text-gold-600 dark:text-gold-500 hover:text-gold-700 dark:hover:text-gold-400 font-medium transition-smooth"
                      >
                        View All Notifications
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-charcoal-50 dark:hover:bg-charcoal-800 transition-smooth cursor-pointer"
          >
            <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {getInitials()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-charcoal-900 dark:text-charcoal-100">
                {user?.teacherProfile?.name || user?.email}
              </p>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 capitalize">{user?.role}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}

