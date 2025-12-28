import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-charcoal-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-8 bg-charcoal-50 dark:bg-charcoal-900">
          {children}
        </main>
      </div>
    </div>
  )
}

