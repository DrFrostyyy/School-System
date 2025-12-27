import { motion } from 'framer-motion'
import { Users, BookOpen, GraduationCap, TrendingUp } from 'lucide-react'

const stats = [
  { label: 'Total Students', value: '1,234', icon: Users, color: 'bg-gold-500' },
  { label: 'Active Courses', value: '45', icon: BookOpen, color: 'bg-charcoal-800' },
  { label: 'Average Grade', value: '87.5%', icon: GraduationCap, color: 'bg-gold-500' },
  { label: 'Attendance Rate', value: '94.2%', icon: TrendingUp, color: 'bg-charcoal-800' },
]

const recentActivities = [
  { id: 1, action: 'New student enrolled', name: 'John Doe', time: '2 hours ago' },
  { id: 2, action: 'Grade updated', name: 'Mathematics - Class A', time: '4 hours ago' },
  { id: 3, action: 'Course created', name: 'Advanced Physics', time: '6 hours ago' },
  { id: 4, action: 'Attendance marked', name: 'Class 10B', time: '8 hours ago' },
]

export default function Dashboard() {
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
        <p className="text-charcoal-600">Welcome back! Here's an overview of your school.</p>
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
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm"
        >
          <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-4">
            Recent Activities
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-charcoal-50 transition-smooth"
              >
                <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal-900">{activity.action}</p>
                  <p className="text-xs text-charcoal-600">{activity.name}</p>
                </div>
                <span className="text-xs text-charcoal-500">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm"
        >
          <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {['Add Student', 'Create Course', 'Mark Attendance', 'View Reports'].map((action, index) => (
              <motion.button
                key={action}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 border border-charcoal-200 rounded-lg hover:border-gold-500 hover:bg-gold-50 transition-smooth text-left"
              >
                <p className="font-medium text-charcoal-900">{action}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

