import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  Car,
  UserCheck,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Calendar,
  FileText,
  FileSignature,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/context/SidebarContext'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Quản Lý Đặt Xe', href: '/bookings', icon: Calendar },
  // { name: 'Giao - Nhận Xe', href: '/vehicles', icon: Car },
  { name: 'Quản Lý Thuê Xe', href: '/rentals', icon: FileText },
  { name: 'Quản Lý Hợp Đồng', href: '/contracts', icon: FileSignature },
  { name: 'Báo Cáo Sự Cố', href: '/reports', icon: AlertTriangle },
  { name: 'Xác Thực KH', href: '/customers', icon: UserCheck },
  { name: 'Thanh Toán', href: '/payments', icon: CreditCard },
  { name: 'Quản Lý Xe', href: '/fleet', icon: Settings },
]

export function Sidebar() {
  const { collapsed, toggleSidebar, setCollapsed } = useSidebar()
  const location = useLocation()

  const expandSidebar = () => {
    if (collapsed) {
      setCollapsed(false)
    }
  }

  return (
    <motion.div
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      className={cn(
        'h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 shadow-lg flex flex-col',
        collapsed ? 'w-20' : 'w-72'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div 
            className={cn(
              'flex items-center cursor-pointer transition-all duration-200',
              collapsed ? 'justify-center w-full' : 'space-x-3'
            )}
            onClick={expandSidebar}
          >
            <div className="p-2.5 bg-gradient-to-r from-green-800 to-green-600 rounded-xl hover:from-green-700 hover:to-green-500 transition-all duration-200 hover:scale-105 shadow-md">
              <Zap className="h-6 w-6 text-white" />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">EV Rental</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Station Staff</p>
              </motion.div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Thu nhỏ menu"
            >
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-gradient-to-r from-green-800 to-green-600 text-white shadow-lg transform scale-[1.02]'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:transform hover:scale-[1.01]',
                  collapsed && 'justify-center px-3'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    'h-6 w-6 transition-all duration-200',
                    isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-green-600',
                    !collapsed && 'mr-4'
                  )}
                />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute right-2 w-1 h-6 bg-white rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleSidebar}
              className="w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Mở rộng menu"
            >
              <ChevronRight className="h-5 w-5 text-gray-500 mx-auto" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}