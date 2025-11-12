import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, Mail, Lock, Users, Shield, CheckCircle } from 'lucide-react'
import { FaMotorcycle } from 'react-icons/fa'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { login as loginApi, getProfile } from '@/api/auth'

interface LoginProps {
  onLogin: () => void
}

export function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { token, refreshToken } = await loginApi({ email, password })

      if (!token) {
        throw new Error('Không nhận được token xác thực')
      }

      // Store token temporarily to call profile API
      const tempStorage = rememberMe ? localStorage : sessionStorage
      tempStorage.setItem('accessToken', token)
      if (refreshToken) tempStorage.setItem('refreshToken', refreshToken)


      const profile = await getProfile()
      
      
      const userRole = profile.role.toLowerCase()
      if (!userRole.includes('staff')) {
        // Clear tokens if not staff
        tempStorage.removeItem('accessToken')
        tempStorage.removeItem('refreshToken')
        throw new Error(`Tài khoản không có quyền Nhân viên Trạm. Role hiện tại: ${profile.role}`)
      }

      
      toast({
        title: 'Thành công',
        description: 'Đăng nhập thành công! Chào mừng bạn quay trở lại!🎉',
        variant: 'success',
        duration: 3000,
      })
      onLogin()
    } catch (error) {
      toast({
        title: 'Đăng nhập thất bại',
        description: error instanceof Error ? error.message : 'Vui lòng kiểm tra lại thông tin',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-800 to-green-600 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          {/* Main Icon Section */}
          <motion.div
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
            className="relative mb-12"
          >
            <div className="relative">
              <FaMotorcycle className="h-40 w-40 drop-shadow-2xl" />
              <Zap className="absolute -top-2 -right-2 h-10 w-10 text-yellow-300 animate-pulse" />
            </div>
            
            {/* Floating icons around motorcycle */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -left-12 top-8"
            >
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Users className="h-7 w-7 text-white" />
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              className="absolute -right-12 top-12"
            >
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Shield className="h-7 w-7 text-white" />
              </div>
            </motion.div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center max-w-lg"
          >
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              EV Rental Staff
            </h1>
            <p className="text-xl text-green-100 mb-10 leading-relaxed">
              Hệ thống quản lý xe điện<br/>thông minh và bền vững
            </p>
            
            {/* Feature highlights */}
            <div className="space-y-4 text-left max-w-sm mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
              >
                <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0" />
                <span className="text-green-50 font-medium">Quản lý xe điện hiện đại</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
              >
                <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0" />
                <span className="text-green-50 font-medium">Theo dõi xe điện</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
              >
                <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0" />
                <span className="text-green-50 font-medium">Báo cáo xe điện</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      </motion.div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="flex justify-center mb-8"
            >
              <div className="p-4 bg-gradient-to-r from-green-800 to-green-600 rounded-2xl">
                <Zap className="h-12 w-12 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Đăng nhập
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Dành cho Nhân viên Trạm
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-gray-50 dark:bg-gray-700 border-0 focus-visible:ring-2 focus-visible:ring-green-500"
                    placeholder="Nhập email của bạn"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-gray-50 dark:bg-gray-700 border-0 focus-visible:ring-2 focus-visible:ring-green-500"
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang đăng nhập...</span>
                  </div>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </motion.form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
