import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { mockStaff, mockNotifications } from '@/data/mockData'
import { useToast } from '@/hooks/use-toast'

interface TopBarProps {
  onLogout: () => void
}

export function TopBar({ onLogout }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

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

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
    >
      <div className="flex items-center justify-between px-6 h-full">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm xe, khách hàng..."
              className="pl-10 bg-gray-50 dark:bg-gray-800 border-0 focus-visible:ring-1 focus-visible:ring-green-500"
            />
          </div>
        </div>

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
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {mockNotifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                    <p className="text-xs text-gray-400">{notification.time}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={mockStaff.avatar}
                  alt={mockStaff.name}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{mockStaff.name}</p>
                  <p className="text-xs text-gray-500">{mockStaff.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Hồ sơ
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Cài đặt
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