import { motion } from 'framer-motion'
import { Plus, BookOpen, Users, Clock } from 'lucide-react'

const courses = [
  { id: 1, name: 'Mathematics', code: 'MATH101', students: 45, credits: 3, instructor: 'Dr. Smith' },
  { id: 2, name: 'English Literature', code: 'ENG201', students: 32, credits: 3, instructor: 'Prof. Johnson' },
  { id: 3, name: 'Physics', code: 'PHY301', students: 28, credits: 4, instructor: 'Dr. Williams' },
  { id: 4, name: 'Chemistry', code: 'CHEM201', students: 35, credits: 4, instructor: 'Dr. Brown' },
  { id: 5, name: 'History', code: 'HIST101', students: 40, credits: 3, instructor: 'Prof. Davis' },
]

export default function Courses() {
  return (
    <div className="space-y-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">
            Courses
          </h1>
          <p className="text-charcoal-600">Manage academic courses and curriculum</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Create Course</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-smooth"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gold-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="px-3 py-1 bg-charcoal-100 text-charcoal-700 rounded-full text-xs font-medium">
                {course.code}
              </span>
            </div>
            
            <h3 className="text-xl font-serif font-bold text-charcoal-900 mb-2">
              {course.name}
            </h3>
            <p className="text-sm text-charcoal-600 mb-4">Instructor: {course.instructor}</p>
            
            <div className="flex items-center gap-4 text-sm text-charcoal-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{course.students} students</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{course.credits} credits</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

