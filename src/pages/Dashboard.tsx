import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, FileText, Megaphone, MessageSquare, TrendingUp } from 'lucide-react'
import { apiClient } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

interface DashboardData {
  role: string
  stats: {
    teacherCount?: number
    totalUsers?: number
    totalTeachers?: number
    totalAnnouncements?: number
    totalDocuments?: number
    unreadMessages?: number
  }
  latestAnnouncements?: Array<{
    id: string
    title: string
    createdAt: string
    creator: {
      teacherProfile?: { name: string }
      email: string
    }
  }>
  recentDocuments?: Array<{
    id: string
    title: string
    createdAt: string
  }>
  announcements?: Array<{
    id: string
    title: string
    body: string
    createdAt: string
    creator: {
      teacherProfile?: { name: string }
      email: string
    }
  }>
  recentMessages?: Array<{
    id: string
    subject: string
    body: string
    createdAt: string
    sender: {
      teacherProfile?: { name: string }
      email: string
    }
  }>
}

export default function Dashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const data = await apiClient.get<DashboardData>('/dashboard')
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>
  }

  if (!dashboardData) {
    return <div className="p-8">Failed to load dashboard</div>
  }

  const isAdmin = dashboardData.role === 'ADMIN'

  const stats = isAdmin
    ? [
        { label: 'Total Teachers', value: dashboardData.stats.totalTeachers || 0, icon: Users, color: 'bg-gold-500' },
        { label: 'Total Users', value: dashboardData.stats.totalUsers || 0, icon: Users, color: 'bg-charcoal-800' },
        { label: 'Announcements', value: dashboardData.stats.totalAnnouncements || 0, icon: Megaphone, color: 'bg-gold-500' },
        { label: 'Documents', value: dashboardData.stats.totalDocuments || 0, icon: FileText, color: 'bg-charcoal-800' },
      ]
    : [
        { label: 'Unread Messages', value: dashboardData.stats.unreadMessages || 0, icon: MessageSquare, color: 'bg-gold-500' },
        { label: 'Announcements', value: dashboardData.announcements?.length || 0, icon: Megaphone, color: 'bg-charcoal-800' },
      ]

  return (
    <div className="space-y-8 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">
          Dashboard
        </h1>
        <p className="text-charcoal-600">
          Welcome back{user?.teacherProfile?.name ? `, ${user.teacherProfile.name}` : ''}! Here's an overview.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-smooth"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-charcoal-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-charcoal-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isAdmin ? (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-charcoal-900">
                  Latest Announcements
                </h2>
                <Link to="/announcements" className="text-sm text-gold-600 hover:text-gold-700">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.latestAnnouncements && dashboardData.latestAnnouncements.length > 0 ? (
                  dashboardData.latestAnnouncements.map((announcement, index) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-charcoal-50 transition-smooth"
                    >
                      <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-charcoal-900">{announcement.title}</p>
                        <p className="text-xs text-charcoal-600">
                          {announcement.creator.teacherProfile?.name || announcement.creator.email} • {new Date(announcement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-charcoal-500">No announcements yet</p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-charcoal-900">
                  Recent Documents
                </h2>
                <Link to="/documents" className="text-sm text-gold-600 hover:text-gold-700">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.recentDocuments && dashboardData.recentDocuments.length > 0 ? (
                  dashboardData.recentDocuments.map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-charcoal-50 transition-smooth"
                    >
                      <FileText className="w-5 h-5 text-gold-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-charcoal-900">{doc.title}</p>
                        <p className="text-xs text-charcoal-600">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-charcoal-500">No documents yet</p>
                )}
              </div>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-charcoal-900">
                  Recent Announcements
                </h2>
                <Link to="/announcements" className="text-sm text-gold-600 hover:text-gold-700">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.announcements && dashboardData.announcements.length > 0 ? (
                  dashboardData.announcements.map((announcement, index) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      className="p-3 rounded-lg hover:bg-charcoal-50 transition-smooth"
                    >
                      <p className="text-sm font-medium text-charcoal-900 mb-1">{announcement.title}</p>
                      <p className="text-xs text-charcoal-600 line-clamp-2">{announcement.body}</p>
                      <p className="text-xs text-charcoal-500 mt-2">
                        {announcement.creator.teacherProfile?.name || announcement.creator.email} • {new Date(announcement.createdAt).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-charcoal-500">No announcements yet</p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-bold text-charcoal-900">
                  Recent Messages
                </h2>
                <Link to="/messages" className="text-sm text-gold-600 hover:text-gold-700">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.recentMessages && dashboardData.recentMessages.length > 0 ? (
                  dashboardData.recentMessages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      className="p-3 rounded-lg hover:bg-charcoal-50 transition-smooth"
                    >
                      <p className="text-sm font-medium text-charcoal-900 mb-1">{message.subject}</p>
                      <p className="text-xs text-charcoal-600 line-clamp-2">{message.body}</p>
                      <p className="text-xs text-charcoal-500 mt-2">
                        {message.sender.teacherProfile?.name || message.sender.email} • {new Date(message.createdAt).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-charcoal-500">No messages yet</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
