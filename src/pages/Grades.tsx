import { motion } from 'framer-motion'
import { TrendingUp, Download, Filter } from 'lucide-react'

const gradeData = [
  { student: 'John Doe', course: 'Mathematics', grade: 95, letter: 'A+' },
  { student: 'Jane Smith', course: 'English Literature', grade: 88, letter: 'A' },
  { student: 'Michael Johnson', course: 'Physics', grade: 92, letter: 'A' },
  { student: 'Emily Davis', course: 'Chemistry', grade: 85, letter: 'B+' },
  { student: 'David Wilson', course: 'History', grade: 90, letter: 'A-' },
]

export default function Grades() {
  return (
    <div className="space-y-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">
            Grades
          </h1>
          <p className="text-charcoal-600">View and manage student grades</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 border border-charcoal-200 rounded-lg hover:border-gold-500 hover:bg-gold-50 transition-smooth"
          >
            <Filter className="w-5 h-5" />
            <span>Filter</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 border border-charcoal-200 rounded-lg hover:border-gold-500 hover:bg-gold-50 transition-smooth"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-charcoal-200 rounded-lg shadow-sm p-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-charcoal-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                  Letter
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-200">
              {gradeData.map((item, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-charcoal-50 transition-smooth"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-charcoal-900">
                    {item.student}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-charcoal-600">
                    {item.course}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-charcoal-900">{item.grade}%</span>
                      <div className="w-24 h-2 bg-charcoal-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.grade}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="h-full bg-gold-500"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-gold-100 text-gold-700 rounded-full text-sm font-medium">
                      {item.letter}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

