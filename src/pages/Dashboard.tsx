import { motion } from 'framer-motion'
import { DollarSign, Users, Battery, TrendingUp, Clock, RefreshCw } from 'lucide-react'
import { FaMotorcycle } from 'react-icons/fa'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useProfile } from '@/contexts/ProfileContext'
import { useDashboardKPI } from '@/hooks/useDashboardKPI'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useDashboardChart } from '@/hooks/useDashboardChart'
import { useDashboardShift } from '@/hooks/useDashboardShift'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const kpiCardsConfig = [
  {
    title: 'Xe có sẵn',
    dataKey: 'availableVehicles' as const,
    changeKey: 'availableVehiclesChange' as const,
    icon: FaMotorcycle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    darkBgColor: 'dark:bg-blue-900/20',
  },
  {
    title: 'Lượt giao/nhận',
    dataKey: 'todayHandovers' as const,
    changeKey: 'handoversChange' as const,
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    darkBgColor: 'dark:bg-green-900/20',
  },
  {
    title: 'Doanh thu điểm',
    dataKey: 'stationRevenue' as const,
    changeKey: 'revenueChange' as const,
    icon: DollarSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    darkBgColor: 'dark:bg-purple-900/20',
    formatValue: (val: number) => `${val.toLocaleString('vi-VN')}đ`
  },
  {
    title: 'Xe đang thuê',
    dataKey: 'activeRentals' as const,
    changeKey: 'rentalsChange' as const,
    icon: Battery,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    darkBgColor: 'dark:bg-orange-900/20',
  }
]

export function Dashboard() {
  const { profile } = useProfile()
  const { data: kpiData, isLoading: kpiLoading, refetch: refetchKPI } = useDashboardKPI()
  const { data: statsData, isLoading: statsLoading } = useDashboardStats()
  const { data: chartData, isLoading: chartLoading } = useDashboardChart()
  const { morningShift, afternoonShift, currentShift, progress } = useDashboardShift()

  const isLoading = kpiLoading || statsLoading || chartLoading

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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetchKPI()}
              disabled={isLoading}
              className="text-white hover:bg-white/20"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <div className="text-right">
              <p className="text-green-100">Hôm nay</p>
              <p className="text-2xl font-bold">
                {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCardsConfig.map((card, index) => {
          const gradientMap = {
            'text-blue-600': {
              cardBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50',
              iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
              textGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600',
              textColor: 'text-blue-700 dark:text-blue-400'
            },
            'text-green-600': {
              cardBg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50',
              iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
              textGradient: 'bg-gradient-to-r from-green-600 to-emerald-600',
              textColor: 'text-green-700 dark:text-green-400'
            },
            'text-purple-600': {
              cardBg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50',
              iconBg: 'bg-gradient-to-br from-purple-500 to-pink-600',
              textGradient: 'bg-gradient-to-r from-purple-600 to-pink-600',
              textColor: 'text-purple-700 dark:text-purple-400'
            },
            'text-orange-600': {
              cardBg: 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50',
              iconBg: 'bg-gradient-to-br from-orange-500 to-red-600',
              textGradient: 'bg-gradient-to-r from-orange-600 to-red-600',
              textColor: 'text-orange-700 dark:text-orange-400'
            }
          };
          
          const colors = gradientMap[card.color as keyof typeof gradientMap];
          
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${colors.cardBg}`}>
                <CardContent className="p-6">
                  {kpiLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium mb-1 ${colors.textColor}`}>
                          {card.title}
                        </p>
                        <p className={`text-3xl font-bold mb-1 bg-clip-text text-transparent ${colors.textGradient}`}>
                          {kpiData ? (
                            card.formatValue 
                              ? card.formatValue(kpiData[card.dataKey])
                              : kpiData[card.dataKey]
                          ) : '-'}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                          {kpiData?.[card.changeKey] || 'Đang tải...'}
                        </p>
                      </div>
                      <div className={`h-12 w-12 rounded-xl ${colors.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
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
              {chartLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Đang tải dữ liệu biểu đồ...</p>
                  </div>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
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
              )}
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
                {statsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <>
                    {statsData && statsData.maintenanceVehicles > 0 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Xe cần bảo trì
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                          {statsData.maintenanceVehicles} xe cần kiểm tra định kỳ
                        </p>
                      </div>
                    )}
                    {statsData && statsData.pendingBookings > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Đơn đặt xe mới
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                          {statsData.pendingBookings} đơn chờ xử lý
                        </p>
                      </div>
                    )}
                    {statsData && statsData.completedPaymentsToday > 0 && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Thanh toán thành công
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                          {statsData.completedPaymentsToday} giao dịch hoàn tất hôm nay
                        </p>
                      </div>
                    )}
                    {statsData && statsData.maintenanceVehicles === 0 && statsData.pendingBookings === 0 && statsData.completedPaymentsToday === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Không có thông báo mới
                      </div>
                    )}
                  </>
                )}
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
                {/* Ca sáng */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {morningShift.name}
                  </span>
                  <span className={`text-sm font-medium ${morningShift.isActive ? 'text-green-600' : ''}`}>
                    {morningShift.start} - {morningShift.end}
                  </span>
                </div>
                
                {/* Ca chiều */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {afternoonShift.name}
                  </span>
                  <span className={`text-sm font-medium ${afternoonShift.isActive ? 'text-green-600' : ''}`}>
                    {afternoonShift.start} - {afternoonShift.end}
                  </span>
                </div>
                
                {/* Status */}
                {currentShift ? (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      ✓ Bạn đang trong {currentShift.name.toLowerCase()}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ngoài giờ làm việc
                    </p>
                  </div>
                )}
                
                {/* Progress bar - only show during shift */}
                {currentShift && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Tiến độ ca làm
                    </p>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-gray-400 mt-1">
                      {Math.round(progress)}% hoàn thành
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}