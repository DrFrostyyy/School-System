import { motion } from 'framer-motion'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

const attendanceData = [
  { date: '2024-01-15', present: 45, absent: 5, late: 2, rate: 86.5 },
  { date: '2024-01-16', present: 48, absent: 2, late: 2, rate: 92.3 },
  { date: '2024-01-17', present: 47, absent: 3, late: 2, rate: 90.4 },
  { date: '2024-01-18', present: 46, absent: 4, late: 2, rate: 88.5 },
  { date: '2024-01-19', present: 49, absent: 1, late: 2, rate: 94.2 },
]

export default function Attendance() {
  return (
    <div className="space-y-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">
            Attendance
          </h1>
          <p className="text-charcoal-600">Track and manage student attendance</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth shadow-sm"
        >
          <Calendar className="w-5 h-5" />
          <span>Mark Attendance</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gold-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-charcoal-600">Total Present</p>
              <p className="text-2xl font-bold text-charcoal-900">235</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-charcoal-800 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-charcoal-600">Total Absent</p>
              <p className="text-2xl font-bold text-charcoal-900">15</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-charcoal-600 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-charcoal-600">Average Rate</p>
              <p className="text-2xl font-bold text-charcoal-900">90.4%</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-charcoal-200 rounded-lg shadow-sm"
      >
        <div className="p-6 border-b border-charcoal-200">
          <h2 className="text-xl font-serif font-bold text-charcoal-900">
            Recent Attendance Records
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-charcoal-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                  Absent
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                  Late
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                  Attendance Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-200">
              {attendanceData.map((record, index) => (
                <motion.tr
                  key={record.date}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                  className="hover:bg-charcoal-50 transition-smooth"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-charcoal-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-charcoal-600">
                    {record.present}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-charcoal-600">
                    {record.absent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-charcoal-600">
                    {record.late}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-charcoal-900">{record.rate}%</span>
                      <div className="w-32 h-2 bg-charcoal-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${record.rate}%` }}
                          transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                          className="h-full bg-gold-500"
                        />
                      </div>
                    </div>
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

