import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Car, DollarSign, Users, Battery, TrendingUp, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { mockKPIData, mockChartData } from '@/data/mockData'
import { getProfile, ProfileResponse } from '@/api/auth'

const kpiCards = [
  {
    title: 'Xe có sẵn',
    value: mockKPIData.availableVehicles,
    icon: Car,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    darkBgColor: 'dark:bg-blue-900/20',
    change: '+2 từ hôm qua'
  },
  {
    title: 'Lượt giao/nhận',
    value: mockKPIData.todayHandovers,
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    darkBgColor: 'dark:bg-green-900/20',
    change: '+25% so với hôm qua'
  },
  {
    title: 'Doanh thu điểm',
    value: `${(mockKPIData.stationRevenue / 1000000).toFixed(1)}M`,
    icon: DollarSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    darkBgColor: 'dark:bg-purple-900/20',
    change: '+15% so với tuần trước'
  },
  {
    title: 'Xe đang thuê',
    value: mockKPIData.activeRentals,
    icon: Battery,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    darkBgColor: 'dark:bg-orange-900/20',
    change: '2 xe sẽ trả hôm nay'
  }
]

export function Dashboard() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await getProfile()
        if (!mounted) return
        setProfile(data)
      } catch {
        // ignore; keep mock metrics but no user name
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-green-800 to-green-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Xin chào, {profile?.fullname || 'Bạn'}! 👋
            </h1>
            <p className="text-green-100 text-lg">
              Chúc bạn một ngày làm việc hiệu quả
            </p>
          </div>
          <div className="text-right">
            <p className="text-green-100">Hôm nay</p>
            <p className="text-2xl font-bold">
              {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="group"
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {card.value}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {card.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bgColor} ${card.darkBgColor} group-hover:scale-110 transition-transform`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Lượt thuê theo giờ</span>
              </CardTitle>
              <CardDescription>
                Biểu đồ theo dõi lượt thuê trong ngày hôm nay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rentals"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications and Schedule */}
        <div className="space-y-6">
          {/* Quick Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Thông báo nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Xe cần bảo trì
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                    1 xe cần kiểm tra định kỳ
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Khách hàng mới
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    2 đơn đăng ký chờ xử lý
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Thanh toán thành công
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    3 giao dịch hoàn tất hôm nay
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Schedule */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Lịch trực ca</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ca sáng</span>
                  <span className="text-sm font-medium">06:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ca chiều</span>
                  <span className="text-sm font-medium text-green-600">14:00 - 22:00</span>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ Bạn đang trong ca làm việc
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Tiến độ ca làm
                  </p>
                  <Progress value={35} className="h-2" />
                  <p className="text-xs text-gray-400 mt-1">35% hoàn thành</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}