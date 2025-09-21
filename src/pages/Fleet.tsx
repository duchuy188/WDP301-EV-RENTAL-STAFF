import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Battery, Settings, Camera, Wrench } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { mockVehicles, type Vehicle } from '@/data/mockData'
import { useToast } from '@/hooks/use-toast'

export function Fleet() {
  const [vehicles, setVehicles] = useState(mockVehicles)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const { toast } = useToast()

  const handleUpdateBattery = (vehicleId: string, newBatteryLevel: number) => {
    setVehicles(prev => prev.map(vehicle => 
      vehicle.id === vehicleId 
        ? { ...vehicle, batteryLevel: newBatteryLevel }
        : vehicle
    ))
    
    toast({
      title: "Cập nhật thành công ✅",
      description: "Mức pin xe đã được cập nhật"
    })
  }

  const handleReportIssue = () => {
    toast({
      title: "Báo sự cố thành công ⚠️",
      description: "Sự cố đã được ghi nhận và chuyển đến bộ phận kỹ thuật"
    })
    setSelectedVehicle(null)
  }

  const getBatteryColor = (level: number) => {
    if (level >= 60) return 'text-green-600'
    if (level >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBatteryBgColor = (level: number) => {
    if (level >= 60) return 'bg-green-100 dark:bg-green-900/20'
    if (level >= 30) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  const getStatusInfo = (vehicle: Vehicle) => {
    if (vehicle.status === 'maintenance') {
      return {
        text: 'Cần bảo trì',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        icon: Wrench
      }
    }
    return {
      text: 'Hoạt động bình thường',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      icon: Settings
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý Xe tại điểm</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Theo dõi tình trạng pin, bảo trì và sự cố xe</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Battery className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pin trung bình</p>
                  <p className="text-xl font-bold">67%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Xe hoạt động</p>
                  <p className="text-xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cần bảo trì</p>
                  <p className="text-xl font-bold">1</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Wrench className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số xe</p>
                  <p className="text-xl font-bold">4</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle, index) => {
          const statusInfo = getStatusInfo(vehicle)
          
          return (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} flex items-center space-x-1`}>
                      <statusInfo.icon className="h-3 w-3" />
                      <span>{statusInfo.text}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white">{vehicle.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400">Biển số: {vehicle.licensePlate}</p>
                    </div>

                    {/* Battery Level */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Battery className={`h-4 w-4 ${getBatteryColor(vehicle.batteryLevel)}`} />
                          <span className="text-sm font-medium">Mức pin</span>
                        </div>
                        <span className={`text-sm font-bold ${getBatteryColor(vehicle.batteryLevel)}`}>
                          {vehicle.batteryLevel}%
                        </span>
                      </div>
                      <Progress value={vehicle.batteryLevel} className="h-3" />
                    </div>

                    {/* Last Maintenance */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Bảo trì cuối:</span>
                      <span className="font-medium">{new Date(vehicle.lastMaintenance).toLocaleDateString('vi-VN')}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300">
                            <Battery className="h-3 w-3 mr-1" />
                            Cập nhật pin
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cập nhật mức pin: {vehicle.name}</DialogTitle>
                            <DialogDescription>
                              Nhập mức pin hiện tại của xe
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Mức pin (%)</label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={vehicle.batteryLevel}
                                className="w-full"
                              />
                            </div>
                            <Button
                              onClick={() => handleUpdateBattery(vehicle.id, 85)}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                            >
                              Cập nhật
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                            onClick={() => setSelectedVehicle(vehicle)}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Báo sự cố
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Báo sự cố: {selectedVehicle?.name}</DialogTitle>
                            <DialogDescription>
                              Mô tả chi tiết sự cố và đính kèm hình ảnh nếu có
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Mô tả sự cố</label>
                              <textarea
                                placeholder="Mô tả chi tiết tình trạng xe, sự cố gặp phải..."
                                className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">Hình ảnh sự cố</label>
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400 mb-2">Chụp ảnh sự cố</p>
                                <Input type="file" accept="image/*" multiple className="max-w-xs mx-auto" />
                              </div>
                            </div>
                            
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Lưu ý quan trọng:</h4>
                              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                                <li>• Xe sẽ được chuyển sang trạng thái "Bảo trì" sau khi báo cáo</li>
                                <li>• Bộ phận kỹ thuật sẽ được thông báo ngay lập tức</li>
                                <li>• Không cho thuê xe này cho đến khi sửa chữa xong</li>
                              </ul>
                            </div>
                            
                            <Button
                              onClick={handleReportIssue}
                              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Gửi báo cáo sự cố
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}