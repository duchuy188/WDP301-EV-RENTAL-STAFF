import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/hooks/use-toast'
import { useProfile } from '@/contexts/ProfileContext'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/contexts/NotificationContext'

interface TopBarProps {
  onLogout: () => void
}

export function TopBar({ onLogout }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { notifications, unreadCount, markAllAsRead } = useNotifications()

  const handleLogout = () => {
    toast({
      title: "Đã đăng xuất thành công ✅",
      description: "Hẹn gặp lại bạn lần sau!"
    })
    // Clear stored tokens
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
    setTimeout(onLogout, 1000)
  }

  // Đánh dấu tất cả đã đọc khi mở dropdown
  const handleNotificationsOpen = (open: boolean) => {
    setShowNotifications(open)
    if (open) {
      markAllAsRead()
    }
  }

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
    >
      <div className="flex items-center justify-between px-6 h-full">
        {/* Spacer (search removed) */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <div className="flex items-center space-x-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
            <Moon className="h-4 w-4 text-blue-500" />
          </div>

          {/* Notifications */}
          <DropdownMenu open={showNotifications} onOpenChange={handleNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <DropdownMenuLabel>
                Thông báo {unreadCount > 0 && `(${unreadCount} mới)`}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Không có thông báo mới
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className={`p-4 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => {
                      if (notification.bookingId) {
                        navigate('/bookings');
                      }
                    }}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">{notification.time}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 p-0 overflow-hidden rounded-full ring-1 ring-gray-300 dark:ring-gray-600 transition-colors"
              >
                {profile?.avatar ? (
                  <img
                    className="h-9 w-9 rounded-full object-cover"
                    src={profile.avatar}
                    alt={profile.fullname}
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {(profile?.fullname || 'U').charAt(0)}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.fullname || 'Người dùng'}</p>
                  <p className="text-xs text-gray-500">{profile?.email || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Hồ sơ
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  )
}