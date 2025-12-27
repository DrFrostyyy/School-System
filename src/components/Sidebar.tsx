import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  UserCheck,
  Megaphone,
  FileText,
  MessageSquare,
  LogOut,
} from 'lucide-react'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/teachers', icon: UserCheck, label: 'Teachers' },
  { path: '/announcements', icon: Megaphone, label: 'Announcements' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/messages', icon: MessageSquare, label: 'Messages' },
]

export default function Sidebar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-charcoal-900 text-white border-r border-gold-500/20 shadow-lg flex flex-col h-screen"
    >
      <div className="p-6 border-b border-gold-500/20">
        <h1 className="text-2xl font-serif font-bold text-gold-500">
          School System
        </h1>
        <p className="text-sm text-charcoal-400 mt-1">Information Management</p>
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        {menuItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth group ${
                isActive
                  ? 'bg-gold-500/20 text-gold-500 border-l-4 border-gold-500'
                  : 'text-charcoal-300 hover:bg-charcoal-800 hover:text-gold-400'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 w-full"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gold-500/20 space-y-2">
        <div className="px-4 py-2 text-xs text-charcoal-400">
          <div className="font-medium text-charcoal-300">{user?.email}</div>
          <div className="text-charcoal-500">{user?.role}</div>
        </div>
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-charcoal-300 hover:bg-charcoal-800 hover:text-gold-400 transition-smooth"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </motion.button>
        <div className="text-xs text-charcoal-500 text-center pt-2">
          © 2024 School Information System
        </div>
      </div>
    </motion.aside>
  )
}

