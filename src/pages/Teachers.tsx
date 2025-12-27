import { motion } from 'framer-motion'
import { UserCheck, Mail, Phone, BookOpen } from 'lucide-react'

const teachers = [
  { id: 1, name: 'Dr. Smith', email: 'smith@school.edu', phone: '+1 234-567-8900', courses: 3, department: 'Mathematics' },
  { id: 2, name: 'Prof. Johnson', email: 'johnson@school.edu', phone: '+1 234-567-8901', courses: 2, department: 'English' },
  { id: 3, name: 'Dr. Williams', email: 'williams@school.edu', phone: '+1 234-567-8902', courses: 4, department: 'Science' },
  { id: 4, name: 'Dr. Brown', email: 'brown@school.edu', phone: '+1 234-567-8903', courses: 3, department: 'Science' },
  { id: 5, name: 'Prof. Davis', email: 'davis@school.edu', phone: '+1 234-567-8904', courses: 2, department: 'History' },
]

export default function Teachers() {
  return (
    <div className="space-y-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">
            Teachers
          </h1>
          <p className="text-charcoal-600">Manage faculty and staff information</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth shadow-sm"
        >
          <UserCheck className="w-5 h-5" />
          <span>Add Teacher</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher, index) => (
          <motion.div
            key={teacher.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-smooth"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {teacher.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-serif font-bold text-charcoal-900 mb-1">
                  {teacher.name}
                </h3>
                <p className="text-sm text-charcoal-600">{teacher.department}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-charcoal-600">
                <Mail className="w-4 h-4" />
                <span>{teacher.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-charcoal-600">
                <Phone className="w-4 h-4" />
                <span>{teacher.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-charcoal-600">
                <BookOpen className="w-4 h-4" />
                <span>{teacher.courses} courses</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

