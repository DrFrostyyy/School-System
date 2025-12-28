import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Save, Upload, X } from 'lucide-react'
import { apiClient } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    position: '',
    phone: ''
  })
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null)

  useEffect(() => {
    if (user?.teacherProfile) {
      setFormData({
        name: user.teacherProfile.name || '',
        department: user.teacherProfile.department || '',
        position: user.teacherProfile.position || '',
        phone: user.teacherProfile.phone || ''
      })
      if (user.teacherProfile.profilePicture) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        setCurrentProfilePicture(`${baseUrl}${user.teacherProfile.profilePicture}`)
      }
    }
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      // Validate file size (5MB)
      if (file.size > 5242880) {
        alert('Image size must be less than 5MB')
        return
      }
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeProfilePicture = () => {
    setProfilePicture(null)
    setPreview(null)
  }

  const getProfilePictureUrl = () => {
    if (preview) return preview
    if (currentProfilePicture) return currentProfilePicture
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('department', formData.department)
      formDataToSend.append('position', formData.position)
      if (formData.phone) {
        formDataToSend.append('phone', formData.phone)
      }
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture)
      }

      const updatedUser = await apiClient.uploadFile('/auth/profile', formDataToSend, 'PUT')
      
      // Update auth context with new user data
      setUser(updatedUser)
      
      // Reset form
      setProfilePicture(null)
      setPreview(null)
      
      alert('Profile updated successfully!')
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      alert(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div className="p-8">Loading...</div>
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
            My Profile
          </h1>
          <p className="text-charcoal-600">Manage your profile information</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-charcoal-200 rounded-lg p-8 shadow-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-6 pb-6 border-b border-charcoal-200">
            <div className="relative">
              {getProfilePictureUrl() ? (
                <div className="relative">
                  <img
                    src={getProfilePictureUrl() || ''}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gold-500"
                  />
                  {preview && (
                    <button
                      type="button"
                      onClick={removeProfilePicture}
                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-smooth"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-charcoal-200 flex items-center justify-center border-4 border-gold-500">
                  <User className="w-16 h-16 text-charcoal-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-charcoal-500">
                  JPG, PNG, GIF or WEBP. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-smooth"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 border border-charcoal-300 rounded-lg bg-charcoal-50 text-charcoal-500 cursor-not-allowed"
              />
              <p className="text-xs text-charcoal-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-smooth"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Position *
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-smooth"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-smooth"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={user.role}
                disabled
                className="w-full px-4 py-2 border border-charcoal-300 rounded-lg bg-charcoal-50 text-charcoal-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-charcoal-200">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-smooth shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

