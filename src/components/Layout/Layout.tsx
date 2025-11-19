import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import FloatingChat from '../FloatingChat'

interface LayoutProps {
  children: ReactNode
  onLogout: () => void
}

export function Layout({ children, onLogout }: LayoutProps) {
  return (
    <>
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar onLogout={onLogout} />
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      {/* Floating Chatbot - appears on all pages - outside overflow container */}
      <FloatingChat />
    </>
  )
}