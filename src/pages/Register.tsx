import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { GraduationCap } from 'lucide-react'
import { apiClient } from '../utils/api'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [phone, setPhone] = useState('+63')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { setUser, setToken } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Registration
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }

      if (!name.trim() || !department.trim() || !position.trim() || !phone.trim()) {
        setError('All fields are required')
        setIsLoading(false)
        return
      }

      if (!phone.startsWith('+63')) {
        setError('Phone number must start with +63')
        setIsLoading(false)
        return
      }

      const response = await apiClient.post<{ token: string; user: any }>('/auth/register', {
        email,
        password,
        name: name.trim(),
        department: department.trim(),
        position: position.trim(),
        phone: phone.trim()
      })

      // Set auth state
      setToken(response.token)
      setUser(response.user)
      apiClient.setToken(response.token)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">
            School System
          </h1>
          <p className="text-charcoal-600">Create a new account</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 mb-1">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-smooth"
              placeholder="your.email@school.edu"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-charcoal-700 mb-1">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-smooth"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-charcoal-700 mb-1">
              Department *
            </label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-smooth"
              placeholder="Mathematics"
            />
          </div>

          <div>
            <label htmlFor="position" className="block text-sm font-medium text-charcoal-700 mb-1">
              Position *
            </label>
            <input
              id="position"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
              className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-smooth"
              placeholder="Teacher"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-charcoal-700 mb-1">
              Phone *
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                const value = e.target.value
                // Ensure it starts with +63
                if (!value.startsWith('+63')) {
                  setPhone('+63' + value.replace(/^\+63/, ''))
                } else {
                  setPhone(value)
                }
              }}
              required
              className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-smooth"
              placeholder="+63 912 345 6789"
            />
            <p className="text-xs text-charcoal-500 mt-1">Format: +63 9XX XXX XXXX</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 mb-1">
              Password *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-smooth"
              placeholder="••••••••"
              minLength={8}
            />
            <p className="text-xs text-charcoal-500 mt-1">Must be at least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal-700 mb-1">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-smooth"
              placeholder="••••••••"
              minLength={8}
            />
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gold-500 text-white rounded-lg font-medium hover:bg-gold-600 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </motion.button>
        </form>

        <div className="mt-6 pt-6 border-t border-charcoal-200">
          <p className="text-sm text-charcoal-600 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-600 hover:text-gold-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

