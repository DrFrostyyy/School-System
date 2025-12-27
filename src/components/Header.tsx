import { motion } from 'framer-motion'
import { Bell, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { apiClient } from '../utils/api'

export default function Header() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const data = await apiClient.get<{ count: number }>('/messages/unread-count')
        setUnreadCount(data.count)
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    }

    if (user) {
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [user])

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
      className="bg-white border-b border-charcoal-200 shadow-sm"
    >
      <div className="px-8 py-4 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-smooth"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 text-charcoal-600 hover:text-gold-600 transition-smooth rounded-lg hover:bg-gold-50"
            onClick={() => window.location.href = '/messages'}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-charcoal-50 transition-smooth cursor-pointer"
          >
            <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {getInitials()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-charcoal-900">
                {user?.teacherProfile?.name || user?.email}
              </p>
              <p className="text-xs text-charcoal-500 capitalize">{user?.role}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}

