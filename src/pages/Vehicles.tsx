import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Battery, Calendar, Camera, FileText, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { mockVehicles, mockCustomers, mockRentals, type Vehicle } from '@/data/mockData'
import { useToast } from '@/hooks/use-toast'

const statusColors = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  rented: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  maintenance: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  reserved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
}

const statusLabels = {
  available: 'Có sẵn',
  rented: 'Đang thuê',
  maintenance: 'Bảo trì',
  reserved: 'Đã đặt'
}

const checklistItems = [
  'Kiểm tra ngoại thất xe',
  'Kiểm tra nội thất',
  'Kiểm tra hệ thống điện',
  'Kiểm tra lốp xe',
  'Kiểm tra đèn chiếu sáng',
  'Kiểm tra tài liệu xe'
]

export function Vehicles() {
  const [selectedTab, setSelectedTab] = useState('available')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [handoverChecklist, setHandoverChecklist] = useState<boolean[]>(new Array(checklistItems.length).fill(false))
  const { toast } = useToast()

  const filterVehicles = (status: string) => {
    if (status === 'available') return mockVehicles.filter(v => v.status === 'available')
    if (status === 'reserved') return mockVehicles.filter(v => v.status === 'reserved')
    if (status === 'rented') return mockVehicles.filter(v => v.status === 'rented')
    return mockVehicles
  }

  const handleCompleteHandover = () => {
    toast({
      title: "Hoàn tất bàn giao ✅",
      description: "Xe đã được bàn giao thành công cho khách hàng"
    })
    setSelectedVehicle(null)
    setHandoverChecklist(new Array(checklistItems.length).fill(false))
  }

  const EmptyState = ({ message, icon: Icon }: { message: string; icon: any }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <Icon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400 text-lg">{message}</p>
    </motion.div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý Giao - Nhận Xe</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Theo dõi và xử lý việc giao nhận xe cho khách hàng</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-1/2">
          <TabsTrigger value="available">Xe có sẵn</TabsTrigger>
          <TabsTrigger value="reserved">Xe đã đặt</TabsTrigger>
          <TabsTrigger value="rented">Xe đang thuê</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {filterVehicles('available').length === 0 ? (
                <EmptyState
                  message="Hiện tại không có xe nào sẵn sàng"
                  icon={Plus}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterVehicles('available').map((vehicle, index) => (
                    <motion.div
                      key={vehicle.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                    >
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <div className="relative">
                          <img
                            src={vehicle.image}
                            alt={vehicle.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-4 right-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[vehicle.status]}`}>
                              {statusLabels[vehicle.status]}
                            </span>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-bold text-xl text-gray-900 dark:text-white">{vehicle.name}</h3>
                              <p className="text-gray-600 dark:text-gray-400">Biển số: {vehicle.licensePlate}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Pin</span>
                                <span className="text-sm font-medium">{vehicle.batteryLevel}%</span>
                              </div>
                              <Progress value={vehicle.batteryLevel} className="h-2" />
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Bảo trì cuối:</span>
                              <span className="font-medium">{new Date(vehicle.lastMaintenance).toLocaleDateString('vi-VN')}</span>
                            </div>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  className="w-full bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500"
                                  onClick={() => setSelectedVehicle(vehicle)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Bàn giao xe
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Bàn giao xe: {selectedVehicle?.name}</DialogTitle>
                                  <DialogDescription>
                                    Hoàn tất checklist và bàn giao xe cho khách hàng
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-6 py-4">
                                  {/* Checklist */}
                                  <div>
                                    <h4 className="font-medium mb-4 flex items-center">
                                      <FileText className="h-5 w-5 mr-2 text-blue-600" />
                                      Checklist tình trạng xe
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {checklistItems.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                          <Checkbox
                                            checked={handoverChecklist[index]}
                                            onCheckedChange={(checked) => {
                                              const newChecklist = [...handoverChecklist]
                                              newChecklist[index] = checked as boolean
                                              setHandoverChecklist(newChecklist)
                                            }}
                                          />
                                          <span className="text-sm">{item}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Photo Upload */}
                                  <div>
                                    <h4 className="font-medium mb-4 flex items-center">
                                      <Camera className="h-5 w-5 mr-2 text-green-600" />
                                      Ảnh tình trạng xe
                                    </h4>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                      <p className="text-gray-600 dark:text-gray-400 mb-2">Chụp ảnh tình trạng xe</p>
                                      <Input type="file" accept="image/*" multiple className="max-w-xs mx-auto" />
                                    </div>
                                  </div>
                                  
                                  {/* Digital Signature */}
                                  <div>
                                    <h4 className="font-medium mb-4">Ký điện tử</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Chữ ký khách hàng</p>
                                        <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                          <span className="text-gray-400">Vùng ký</span>
                                        </div>
                                      </div>
                                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Chữ ký nhân viên</p>
                                        <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                          <span className="text-gray-400">Vùng ký</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Button
                                    onClick={handleCompleteHandover}
                                    disabled={handoverChecklist.filter(Boolean).length < checklistItems.length}
                                    className="w-full bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500"
                                  >
                                    Hoàn tất bàn giao
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </TabsContent>

        <TabsContent value="reserved" className="mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <EmptyState
              message="Chưa có xe nào được đặt trước"
              icon={Calendar}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="rented" className="mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterVehicles('rented').map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="relative">
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[vehicle.status]}`}>
                          {statusLabels[vehicle.status]}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{vehicle.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400">Biển số: {vehicle.licensePlate}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Pin</span>
                            <span className="text-sm font-medium">{vehicle.batteryLevel}%</span>
                          </div>
                          <Progress value={vehicle.batteryLevel} className="h-2" />
                        </div>
                        
                        <Button variant="outline" className="w-full">
                          Xem thông tin thuê
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}