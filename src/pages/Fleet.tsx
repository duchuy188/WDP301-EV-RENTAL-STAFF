import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Battery, Settings, Camera, Wrench, RefreshCw, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getStaffVehicles, updateVehicleBattery, reportVehicleMaintenance, updateVehicleStatus, type Vehicle } from '@/api/vehicles'
import { useToast } from '@/hooks/use-toast'

export function Fleet() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [submittingReport, setSubmittingReport] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [statistics, setStatistics] = useState({
    available: 0,
    rented: 0,
    maintenance: 0,
    total: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'available' | 'rented' | 'maintenance' | 'draft',
    color: '',
    type: 'all' as 'all' | 'scooter' | 'motorcycle'
  })
  const { toast } = useToast()

  // Load vehicles from API
  const loadVehicles = useCallback(async () => {
    setLoading(true)
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) {
        throw new Error('Bạn cần đăng nhập để xem danh sách xe')
      }

      const response = await getStaffVehicles({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status === 'all' ? undefined : filters.status,
        color: filters.color || undefined,
        type: filters.type === 'all' ? undefined : filters.type
      })
      
      setVehicles(response.vehicles)
      setStatistics({
        available: response.statistics.available,
        rented: response.statistics.rented,
        maintenance: response.statistics.maintenance || 0,
        total: response.pagination.total
      })
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        pages: response.pagination.pages
      })
    } catch (error: unknown) {
      console.error('Vehicles API Error:', error)
      const errorMessage = (error as Error)?.message || 'Lỗi khi tải danh sách xe'
      
      // Check if it's an authentication error
      if (errorMessage.includes('token') || errorMessage.includes('Truy cập bị từ chối')) {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        // Optionally redirect to login
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        })
      }
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, filters, toast])

  useEffect(() => {
    // Debug: Check token availability
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    console.log('Fleet: Token available:', !!token)
    console.log('Fleet: Token preview:', token ? `${token.substring(0, 20)}...` : 'No token')
    
    loadVehicles()
  }, [loadVehicles])

  const handleUpdateBattery = async (vehicleId: string, newBatteryLevel: number) => {
    try {
      const response = await updateVehicleBattery(vehicleId, newBatteryLevel)
      
      // Update local state with the response from API
      setVehicles(prev => prev.map(vehicle => 
        vehicle._id === vehicleId 
          ? { ...vehicle, current_battery: response.vehicle.current_battery }
          : vehicle
      ))
      
      toast({
        title: "Cập nhật thành công ✅",
        description: response.message || "Mức pin xe đã được cập nhật"
      })
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || 'Không thể cập nhật mức pin xe'
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (vehicleId: string, newStatus: 'available' | 'rented' | 'maintenance' | 'draft', maintenanceReason?: string) => {
    try {
      const response = await updateVehicleStatus(vehicleId, newStatus, maintenanceReason)
      
      // Update local state with the response from API
      setVehicles(prev => prev.map(vehicle => 
        vehicle._id === vehicleId 
          ? { ...vehicle, status: response.vehicle.status }
          : vehicle
      ))
      
      toast({
        title: "Cập nhật thành công ✅",
        description: response.message || "Trạng thái xe đã được cập nhật"
      })
    } catch (error: unknown) {
      let errorMessage = 'Không thể cập nhật trạng thái xe'
      
      // Parse error message to show user-friendly text
      if (error instanceof Error) {
        const message = error.message
        
        // Handle specific error cases
        if (message.includes('Xe phải ở tình trạng kỹ thuật tốt trước khi đổi trạng thái thành available')) {
          errorMessage = 'Xe phải ở tình trạng kỹ thuật tốt trước khi chuyển sang trạng thái "Có sẵn". Vui lòng kiểm tra tình trạng kỹ thuật của xe.'
        } else if (message.includes('tình trạng kỹ thuật')) {
          errorMessage = 'Không thể thay đổi trạng thái do tình trạng kỹ thuật của xe không phù hợp.'
        } else if (message.includes('maintenance')) {
          errorMessage = 'Xe đang trong trạng thái bảo trì, không thể thay đổi trạng thái.'
        } else if (message.includes('rented')) {
          errorMessage = 'Xe đang được thuê, không thể thay đổi trạng thái.'
        } else if (message.includes('JSON')) {
          // Try to parse JSON error message
          try {
            const jsonMatch = message.match(/\{.*\}/)
            if (jsonMatch) {
              const errorData = JSON.parse(jsonMatch[0])
              if (errorData.message) {
                errorMessage = errorData.message
              }
            }
          } catch {
            errorMessage = message
          }
        } else {
          errorMessage = message
        }
      }
      
      toast({
        title: "Lỗi cập nhật trạng thái",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleReportIssue = async (reason: string, images: File[]) => {
    if (!selectedVehicle) return;
    
    setSubmittingReport(true)
    try {
      const response = await reportVehicleMaintenance(selectedVehicle._id, reason, images);
      
      // Update vehicle status to maintenance
      setVehicles(prev => prev.map(vehicle => 
        vehicle._id === selectedVehicle._id 
          ? { ...vehicle, status: 'maintenance' as const }
          : vehicle
      ))
      
      // Clear form data
      setUploadedImages([])
      
      toast({
        title: "Báo sự cố thành công ⚠️",
        description: response.message || "Sự cố đã được ghi nhận và chuyển đến bộ phận kỹ thuật"
      })
      setSelectedVehicle(null)
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || 'Không thể báo cáo sự cố'
      
      // Parse error message to show user-friendly text
      let friendlyMessage = errorMessage
      if (errorMessage.includes('Chỉ có thể báo cáo bảo trì xe đang available')) {
        friendlyMessage = 'Chỉ có thể báo cáo bảo trì cho xe đang có sẵn. Xe này hiện đang trong trạng thái bảo trì.'
      } else if (errorMessage.includes('maintenance')) {
        friendlyMessage = 'Xe này đang trong trạng thái bảo trì, không thể báo cáo thêm sự cố.'
      }
      
      toast({
        title: "Không thể báo cáo sự cố",
        description: friendlyMessage,
        variant: "destructive",
      })
    } finally {
      setSubmittingReport(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    setUploadedImages(prev => [...prev, ...newFiles])
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setShowImageModal(true)
  }

  const getBatteryColor = (level: number) => {
    if (level >= 60) return 'text-green-600'
    if (level >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Có sẵn</Badge>
      case 'rented':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Đang thuê</Badge>
      case 'maintenance':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Bảo trì</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Nháp</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý Xe tại điểm</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Theo dõi tình trạng pin, bảo trì và sự cố xe</p>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button 
            onClick={() => {
              const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
              console.log('Debug Token:', token)
              alert(`Token available: ${!!token}\nToken preview: ${token ? token.substring(0, 30) + '...' : 'No token'}`)
            }}
            variant="outline"
            size="sm"
          >
            Debug Token
          </Button> */}
          <Button 
            onClick={loadVehicles}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Xe có sẵn
              </CardTitle>
              <Battery className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{statistics.available}</div>
              <p className="text-xs text-gray-500 mt-1">Sẵn sàng cho thuê</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Đang thuê
              </CardTitle>
              <Settings className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{statistics.rented}</div>
              <p className="text-xs text-gray-500 mt-1">Xe đang được sử dụng</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cần bảo trì
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{statistics.maintenance}</div>
              <p className="text-xs text-gray-500 mt-1">Cần kiểm tra/sửa chữa</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng số xe
              </CardTitle>
              <Wrench className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{statistics.total}</div>
              <p className="text-xs text-gray-500 mt-1">Tất cả xe tại trạm</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter Section */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-medium whitespace-nowrap">Lọc theo:</span>
              <Select value={filters.status} onValueChange={(value) => {
                setFilters(prev => ({ ...prev, status: value as 'all' | 'available' | 'rented' | 'maintenance' | 'draft' }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}>
                <SelectTrigger className="w-[150px] border-2 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 Tất cả</SelectItem>
                  <SelectItem value="available">✅ Có sẵn</SelectItem>
                  <SelectItem value="rented">🛵 Đang thuê</SelectItem>
                  <SelectItem value="maintenance">🔧 Bảo trì</SelectItem>
                  <SelectItem value="draft">📝 Nháp</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.type} onValueChange={(value) => {
                setFilters(prev => ({ ...prev, type: value as 'all' | 'scooter' | 'motorcycle' }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}>
                <SelectTrigger className="w-[150px] border-2 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 Tất cả</SelectItem>
                  <SelectItem value="scooter">🛵 Xe tay ga</SelectItem>
                  <SelectItem value="motorcycle">🏍️ Xe máy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị {vehicles.length} trong {pagination.total} xe
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="text-center py-16">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Đang tải danh sách xe...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-16">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Không có xe nào
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.status !== 'all' 
                ? 'Thử thay đổi bộ lọc để xem các xe khác' 
                : 'Chưa có xe nào tại trạm của bạn'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle, index) => {
              return (
                <motion.div
                  key={vehicle._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Header with gradient based on status */}
                    <div className={`h-2 ${
                      vehicle.status === 'available' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      vehicle.status === 'rented' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      vehicle.status === 'maintenance' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      'bg-gradient-to-r from-gray-500 to-gray-600'
                    }`} />
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Vehicle Info */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{vehicle.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Biển số: {vehicle.license_plate}</p>
                          </div>
                          {getStatusBadge(vehicle.status)}
                        </div>

                        {/* Vehicle Details */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Hãng:</span>
                            <span className="text-sm font-medium">{vehicle.brand} {vehicle.model}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Năm:</span>
                            <span className="text-sm font-medium">{vehicle.year}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Màu:</span>
                            <span className="text-sm font-medium">{vehicle.color}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Loại:</span>
                            <span className="text-sm font-medium">{vehicle.type === 'scooter' ? 'Xe tay ga' : 'Xe máy'}</span>
                          </div>
                        </div>

                        {/* Battery Level */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Battery className={`h-4 w-4 ${getBatteryColor(vehicle.current_battery)}`} />
                              <span className="text-sm font-medium">Mức pin</span>
                            </div>
                            <span className={`text-sm font-bold ${getBatteryColor(vehicle.current_battery)}`}>
                              {vehicle.current_battery}%
                            </span>
                          </div>
                          <Progress value={vehicle.current_battery} className="h-3" />
                        </div>

                        {/* Technical Status */}
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Tình trạng kỹ thuật:</span>
                          <Badge variant="outline" className={
                            vehicle.technical_status === 'excellent' ? 'border-green-500 text-green-700' :
                            vehicle.technical_status === 'good' ? 'border-blue-500 text-blue-700' :
                            vehicle.technical_status === 'fair' ? 'border-yellow-500 text-yellow-700' :
                            'border-red-500 text-red-700'
                          }>
                            {vehicle.technical_status === 'excellent' ? 'Xuất sắc' :
                             vehicle.technical_status === 'good' ? 'Tốt' :
                             vehicle.technical_status === 'fair' ? 'Khá' : 'Kém'}
                          </Badge>
                        </div>

                        {/* Price */}
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Giá/ngày:</span>
                          <span className="font-bold text-green-600">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(vehicle.price_per_day)}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2 pt-2">
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
                                    defaultValue={vehicle.current_battery}
                                    className="w-full"
                                  />
                                </div>
                                <Button
                                  onClick={(e) => {
                                    const input = e.currentTarget.parentElement?.querySelector('input[type="number"]') as HTMLInputElement
                                    const batteryLevel = parseInt(input?.value || '0')
                                    if (batteryLevel >= 0 && batteryLevel <= 100) {
                                      handleUpdateBattery(vehicle._id, batteryLevel)
                                    } else {
                                      toast({
                                        title: "Lỗi",
                                        description: "Mức pin phải từ 0 đến 100%",
                                        variant: "destructive",
                                      })
                                    }
                                  }}
                                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                                >
                                  Cập nhật
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-300">
                                <Settings className="h-3 w-3 mr-1" />
                                Đổi trạng thái
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Đổi trạng thái: {vehicle.name}</DialogTitle>
                                <DialogDescription>
                                  Chọn trạng thái mới cho xe
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">Trạng thái hiện tại</label>
                                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    {getStatusBadge(vehicle.status)}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">Trạng thái mới</label>
                                  <Select 
                                    value={selectedStatus || vehicle.status} 
                                    onValueChange={setSelectedStatus}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="available">✅ Có sẵn</SelectItem>
                                      <SelectItem value="rented">🛵 Đang thuê</SelectItem>
                                      <SelectItem value="maintenance">🔧 Bảo trì</SelectItem>
                                      <SelectItem value="draft">📝 Nháp</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">Lý do bảo trì (nếu chọn bảo trì)</label>
                                  <Input
                                    id={`maintenance-reason-${vehicle._id}`}
                                    placeholder="Nhập lý do bảo trì..."
                                    className="w-full"
                                  />
                                </div>
                                
                                {/* Technical Status Warning */}
                                {vehicle.technical_status !== 'excellent' && vehicle.technical_status !== 'good' && (
                                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                        Lưu ý về tình trạng kỹ thuật
                                      </span>
                                    </div>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                      Tình trạng kỹ thuật hiện tại: <strong>{vehicle.technical_status === 'fair' ? 'Khá' : 'Kém'}</strong>. 
                                      Xe cần có tình trạng kỹ thuật "Tốt" hoặc "Xuất sắc" để chuyển sang trạng thái "Có sẵn".
                                    </p>
                                  </div>
                                )}
                                <Button
                                  onClick={() => {
                                    const newStatus = selectedStatus || vehicle.status
                                    const maintenanceReason = (document.getElementById(`maintenance-reason-${vehicle._id}`) as HTMLInputElement)?.value || ''
                                    
                                    if (newStatus === 'maintenance' && !maintenanceReason.trim()) {
                                      toast({
                                        title: "Lỗi",
                                        description: "Vui lòng nhập lý do bảo trì",
                                        variant: "destructive",
                                      })
                                      return
                                    }
                                    
                                    handleUpdateStatus(vehicle._id, newStatus as 'available' | 'rented' | 'maintenance' | 'draft', maintenanceReason || undefined)
                                    setSelectedStatus('')
                                  }}
                                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                                >
                                  Cập nhật trạng thái
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
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                    id="issue-description"
                                    placeholder="Mô tả chi tiết tình trạng xe, sự cố gặp phải..."
                                    className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-2">Hình ảnh sự cố</label>
                                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Chụp ảnh sự cố</p>
                                    <Input 
                                      id="issue-images"
                                      type="file" 
                                      accept="image/*" 
                                      multiple 
                                      className="max-w-xs mx-auto text-sm" 
                                      onChange={handleImageUpload}
                                    />
                                  </div>
                                  
                                  {/* Image Previews */}
                                  {uploadedImages.length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-xs font-medium mb-2 text-gray-600">Ảnh đã chọn:</p>
                                      <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                                        <div className="grid grid-cols-3 gap-2">
                                          {uploadedImages.map((image, index) => (
                                            <div key={index} className="relative group">
                                            <img
                                              src={URL.createObjectURL(image)}
                                              alt={`Preview ${index + 1}`}
                                              className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                              onClick={() => handleImageClick(URL.createObjectURL(image))}
                                            />
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                className="absolute top-0.5 right-0.5 h-4 w-4 p-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeImage(index)}
                                              >
                                                ×
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
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
                                  onClick={() => {
                                    const description = (document.getElementById('issue-description') as HTMLTextAreaElement)?.value || '';
                                    
                                    if (!description.trim()) {
                                      toast({
                                        title: "Lỗi",
                                        description: "Vui lòng nhập mô tả sự cố",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    
                                    handleReportIssue(description, uploadedImages);
                                  }}
                                  disabled={submittingReport}
                                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {submittingReport ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Đang gửi...
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Gửi báo cáo sự cố
                                    </>
                                  )}
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Trang <span className="font-bold text-gray-900 dark:text-white">{pagination.page}</span> / {pagination.pages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1 || loading}
                      className="border-2"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Trước
                    </Button>
                    <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                        {pagination.page} / {pagination.pages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages || loading}
                      className="border-2"
                    >
                      Sau
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setShowImageModal(false)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Incident Image" 
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}