import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
  title: string
  userRole: 'admin' | 'tailor' | 'worker'
  userName?: string
}

export function Layout({ children, title, userRole, userName }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} />
      
      <div className="lg:ml-64">
        <Header title={title} userName={userName} />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}