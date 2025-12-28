import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { GraduationCap } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
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
        className="bg-white dark:bg-charcoal-800 rounded-lg shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 dark:text-charcoal-100 mb-2">
            School System
          </h1>
          <p className="text-charcoal-600 dark:text-charcoal-400">Sign in to your account</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-smooth"
              placeholder="your.email@school.edu"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-charcoal-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-700 text-charcoal-900 dark:text-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-smooth"
              placeholder="••••••••"
            />
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gold-500 text-white rounded-lg font-medium hover:bg-gold-600 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </form>

        <div className="mt-6 pt-6 border-t border-charcoal-200 dark:border-charcoal-700">
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold-600 dark:text-gold-500 hover:text-gold-700 dark:hover:text-gold-400 font-medium">
              Register here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

