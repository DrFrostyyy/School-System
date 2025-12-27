import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, Mail, Phone, BookOpen, Plus, Edit, Trash2, X } from 'lucide-react'
import { apiClient } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

interface Teacher {
  id: string
  name: string
  department: string
  position: string
  phone?: string
  status: string
  user: {
    id: string
    email: string
    role: string
  }
}

interface User {
  id: string
  email: string
  role: string
}

export default function Teachers() {
  const { user } = useAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    department: '',
    position: '',
    phone: '',
    status: 'ACTIVE'
  })

  useEffect(() => {
    fetchTeachers()
    if (user?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [])

  const fetchTeachers = async () => {
    try {
      const data = await apiClient.get<Teacher[]>('/teachers')
      setTeachers(data)
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // Fetch users without teacher profiles (for creating new teachers)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Filter to only show users without teacher profiles
        setUsers(data.filter((u: User) => u.role === 'TEACHER'))
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.role !== 'ADMIN') return

    try {
      if (editingTeacher) {
        await apiClient.put(`/teachers/${editingTeacher.id}`, {
          name: formData.name,
          department: formData.department,
          position: formData.position,
          phone: formData.phone || undefined,
          status: formData.status
        })
      } else {
        await apiClient.post('/teachers', {
          userId: formData.userId,
          name: formData.name,
          department: formData.department,
          position: formData.position,
          phone: formData.phone || undefined,
          status: formData.status
        })
      }
      setShowModal(false)
      setEditingTeacher(null)
      setFormData({ userId: '', name: '', department: '', position: '', phone: '', status: 'ACTIVE' })
      fetchTeachers()
    } catch (error: any) {
      console.error('Failed to save teacher:', error)
      alert(error.message || 'Failed to save teacher')
    }
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      userId: teacher.user.id,
      name: teacher.name,
      department: teacher.department,
      position: teacher.position,
      phone: teacher.phone || '',
      status: teacher.status
    })
    setShowModal(true)
  }

  const handleDelete = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return

    try {
      await apiClient.delete(`/teachers/${teacherId}`)
      fetchTeachers()
    } catch (error: any) {
      console.error('Failed to delete teacher:', error)
      alert(error.message || 'Failed to delete teacher')
    }
  }

  const openCreateModal = () => {
    setEditingTeacher(null)
    setFormData({ userId: '', name: '', department: '', position: '', phone: '', status: 'ACTIVE' })
    setShowModal(true)
  }

  if (isLoading) {
    return <div className="p-8">Loading teachers...</div>
  }

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
        {user?.role === 'ADMIN' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Teacher</span>
          </motion.button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher, index) => (
          <motion.div
            key={teacher.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            className="bg-white border border-charcoal-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-smooth"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {teacher.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-serif font-bold text-charcoal-900 mb-1">
                    {teacher.name}
                  </h3>
                  <p className="text-sm text-charcoal-600">{teacher.department}</p>
                  <p className="text-xs text-charcoal-500">{teacher.position}</p>
                </div>
              </div>
              {user?.role === 'ADMIN' && (
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(teacher)}
                    className="p-2 text-charcoal-400 hover:text-gold-600 transition-smooth"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(teacher.id)}
                    className="p-2 text-charcoal-400 hover:text-red-600 transition-smooth"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-charcoal-600">
                <Mail className="w-4 h-4" />
                <span>{teacher.user.email}</span>
              </div>
              {teacher.phone && (
                <div className="flex items-center gap-3 text-sm text-charcoal-600">
                  <Phone className="w-4 h-4" />
                  <span>{teacher.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  teacher.status === 'ACTIVE' 
                    ? 'bg-gold-100 text-gold-700' 
                    : 'bg-charcoal-100 text-charcoal-700'
                }`}>
                  {teacher.status}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {teachers.length === 0 && (
        <div className="text-center py-12 text-charcoal-500">
          No teachers found
        </div>
      )}

      {showModal && user?.role === 'ADMIN' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-serif font-bold text-charcoal-900">
                {editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingTeacher(null)
                }}
                className="p-2 text-charcoal-400 hover:text-charcoal-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingTeacher && (
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    User Account *
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="">Select user</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Position *
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth"
                >
                  {editingTeacher ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTeacher(null)
                  }}
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
