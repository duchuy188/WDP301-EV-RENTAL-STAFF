import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Battery, Settings, Camera, Wrench, RefreshCw, ChevronLeft, ChevronRight, XCircle, FileText, CheckCircle, X, Eye, Edit, Save, Car, User, Calendar, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getStaffVehicles, updateVehicleBattery, reportVehicleMaintenance, updateVehicleStatus, type Vehicle } from '@/api/vehicles'
import { getMaintenanceReportsByStation, getMaintenanceReportById, updateMaintenanceReport, type MaintenanceReport } from '@/api/maintenance'
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
  
  // Maintenance reports states
  const [activeTab, setActiveTab] = useState<'vehicles' | 'maintenance'>('vehicles')
  const [maintenanceReports, setMaintenanceReports] = useState<MaintenanceReport[]>([])
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [selectedMaintenanceReport, setSelectedMaintenanceReport] = useState<MaintenanceReport | null>(null)
  const [showMaintenanceDetail, setShowMaintenanceDetail] = useState(false)
  const [maintenanceDetailLoading, setMaintenanceDetailLoading] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [updateFormData, setUpdateFormData] = useState({
    status: 'reported' as 'reported' | 'fixed',
    notes: ''
  })
  const [updateImages, setUpdateImages] = useState<File[]>([])
  const [updating, setUpdating] = useState(false)
  const [maintenancePagination, setMaintenancePagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [maintenanceFilters, setMaintenanceFilters] = useState({
    status: 'all' as 'all' | 'reported' | 'fixed'
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

  // Load maintenance reports from API
  const loadMaintenanceReports = useCallback(async () => {
    setMaintenanceLoading(true)
    try {
      const response = await getMaintenanceReportsByStation({
        page: maintenancePagination.page,
        limit: maintenancePagination.limit,
        status: maintenanceFilters.status === 'all' ? undefined : maintenanceFilters.status
      })
      
      setMaintenanceReports(response.data.reports)
      setMaintenancePagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      })
    } catch (error: unknown) {
      console.error('Maintenance Reports API Error:', error)
      const errorMessage = (error as Error)?.message || 'Lỗi khi tải báo cáo bảo trì'
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
      setMaintenanceReports([])
    } finally {
      setMaintenanceLoading(false)
    }
  }, [maintenancePagination.page, maintenancePagination.limit, maintenanceFilters, toast])

  // Load maintenance report detail by ID
  const loadMaintenanceReportDetail = useCallback(async (reportId: string) => {
    setMaintenanceDetailLoading(true)
    try {
      const response = await getMaintenanceReportById(reportId)
      setSelectedMaintenanceReport(response.data)
      setShowMaintenanceDetail(true)
    } catch (error: unknown) {
      console.error('Maintenance Report Detail API Error:', error)
      const errorMessage = (error as Error)?.message || 'Lỗi khi tải chi tiết báo cáo bảo trì'
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setMaintenanceDetailLoading(false)
    }
  }, [toast])

  // Update maintenance report
  const handleUpdateMaintenanceReport = useCallback(async () => {
    if (!selectedMaintenanceReport) return;
    
    setUpdating(true)
    try {
      const response = await updateMaintenanceReport(selectedMaintenanceReport._id, {
        status: updateFormData.status,
        notes: updateFormData.notes || undefined,
        images: updateImages.length > 0 ? updateImages : undefined
      })
      
      // Update the selected report with new data
      setSelectedMaintenanceReport(response.data)
      
      // Update the report in the list
      setMaintenanceReports(prev => prev.map(report => 
        report._id === selectedMaintenanceReport._id ? response.data : report
      ))
      
      // Reset form
      setUpdateFormData({ status: 'reported', notes: '' })
      setUpdateImages([])
      setShowUpdateForm(false)
      
      toast({
        title: "Cập nhật thành công ✅",
        description: response.message || "Trạng thái báo cáo bảo trì đã được cập nhật"
      })
    } catch (error: unknown) {
      console.error('Update Maintenance Report Error:', error)
      const errorMessage = (error as Error)?.message || 'Lỗi khi cập nhật báo cáo bảo trì'
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }, [selectedMaintenanceReport, updateFormData, updateImages, toast])

  // Initialize update form when opening
  const handleOpenUpdateForm = useCallback(() => {
    if (selectedMaintenanceReport) {
      setUpdateFormData({
        status: selectedMaintenanceReport.status,
        notes: selectedMaintenanceReport.notes || ''
      })
      setUpdateImages([])
      setShowUpdateForm(true)
    }
  }, [selectedMaintenanceReport])

  // Handle image upload for update form
  const handleUpdateImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    setUpdateImages(prev => [...prev, ...newFiles])
  }

  const removeUpdateImage = (index: number) => {
    setUpdateImages(prev => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    // Debug: Check token availability
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    console.log('Fleet: Token available:', !!token)
    console.log('Fleet: Token preview:', token ? `${token.substring(0, 20)}...` : 'No token')
    
    loadVehicles()
  }, [loadVehicles])

  useEffect(() => {
    if (activeTab === 'maintenance') {
      loadMaintenanceReports()
    }
  }, [activeTab, loadMaintenanceReports])

  useEffect(() => {
    if (activeTab === 'maintenance') {
      setMaintenancePagination(prev => ({ ...prev, page: 1 }))
      loadMaintenanceReports()
    }
  }, [maintenanceFilters, loadMaintenanceReports, activeTab])

  useEffect(() => {
    if (activeTab === 'maintenance') {
      loadMaintenanceReports()
    }
  }, [maintenancePagination.page, loadMaintenanceReports, activeTab])

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

  const getMaintenanceStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Đã báo cáo</Badge>
      case 'fixed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Đã sửa</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getMaintenanceStatusIcon = (status: string) => {
    switch (status) {
      case 'reported':
        return <FileText className="h-4 w-4 text-orange-600" />
      case 'fixed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý Xe và Bảo trì tại điểm</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Theo dõi tình trạng pin, bảo trì và sự cố xe</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={activeTab === 'vehicles' ? loadVehicles : loadMaintenanceReports}
            disabled={activeTab === 'vehicles' ? loading : maintenanceLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || maintenanceLoading) ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'vehicles' | 'maintenance')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Battery className="h-4 w-4" />
            Danh sách xe
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Báo cáo bảo trì
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-6">

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

        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          {/* Maintenance Reports Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Báo cáo bảo trì</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Theo dõi các báo cáo bảo trì xe tại trạm</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={maintenanceFilters.status} onValueChange={(value) => setMaintenanceFilters(prev => ({ ...prev, status: value as 'all' | 'reported' | 'fixed' }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="reported">Đã báo cáo</SelectItem>
                  <SelectItem value="fixed">Đã sửa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Maintenance Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng báo cáo
                  </CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{maintenancePagination.total}</div>
                  <p className="text-xs text-gray-500 mt-1">Báo cáo tại trạm</p>
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
                    Đã báo cáo
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {maintenanceReports.filter(r => r.status === 'reported').length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Cần xử lý</p>
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
                    Đã sửa
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {maintenanceReports.filter(r => r.status === 'fixed').length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Hoàn thành</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Maintenance Reports List */}
          {maintenanceLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : maintenanceReports.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <Wrench className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Chưa có báo cáo bảo trì</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                    Hiện tại chưa có báo cáo bảo trì nào tại trạm này. Các báo cáo mới sẽ xuất hiện ở đây.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {maintenanceReports.map((report, index) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Content */}
                        <div className="flex-1 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                {getMaintenanceStatusIcon(report.status)}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                  {report.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">#{report.code}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getMaintenanceStatusBadge(report.status)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadMaintenanceReportDetail(report._id)}
                                disabled={maintenanceDetailLoading}
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Chi tiết
                              </Button>
                            </div>
                          </div>

                          {/* Vehicle Info */}
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {report.vehicle_id ? `${report.vehicle_id.name} (${report.vehicle_id.license_plate})` : 'Không có thông tin xe'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">{report.reported_by.fullname}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(report.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(report.createdAt).toLocaleTimeString('vi-VN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          {report.description && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Mô tả sự cố</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                {report.description}
                              </p>
                            </div>
                          )}

                          {/* Images */}
                          {report.images && report.images.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Hình ảnh sự cố</h4>
                              <div className="flex gap-2 flex-wrap">
                                {report.images.slice(0, 4).map((image, index) => (
                                  <div key={index} className="relative group/image">
                                    <img
                                      src={image}
                                      alt={`Maintenance image ${index + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200 dark:border-gray-700"
                                      onClick={() => {
                                        setSelectedImage(image)
                                        setShowImageModal(true)
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                                      <Eye className="h-4 w-4 text-white opacity-0 group-hover/image:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ))}
                                {report.images.length > 4 && (
                                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-500 border-2 border-gray-200 dark:border-gray-700">
                                    +{report.images.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Maintenance Reports Pagination */}
          {maintenancePagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMaintenancePagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={maintenancePagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Trang {maintenancePagination.page} / {maintenancePagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMaintenancePagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={maintenancePagination.page === maintenancePagination.pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Maintenance Report Detail Modal */}
      <Dialog open={showMaintenanceDetail} onOpenChange={setShowMaintenanceDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Chi tiết báo cáo bảo trì
            </DialogTitle>
          </DialogHeader>
          
          {selectedMaintenanceReport && (
            <div className="space-y-6 py-4">
              {/* Header Info */}
              <div className="flex justify-between items-start p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedMaintenanceReport.code || 'N/A'}
                  </h2>
                  <div className="flex items-center gap-2">
                    {getMaintenanceStatusIcon(selectedMaintenanceReport.status)}
                    {getMaintenanceStatusBadge(selectedMaintenanceReport.status)}
                    <Badge variant="outline" className="text-sm">
                      🔧 Báo cáo bảo trì
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ngày tạo</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatDate(selectedMaintenanceReport.createdAt)}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleOpenUpdateForm}
                    className="flex items-center gap-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Edit className="h-4 w-4" />
                    Cập nhật trạng thái
                  </Button>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Thông tin người báo cáo
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Họ tên:</span>
                        <span className="font-medium">{selectedMaintenanceReport.reported_by.fullname || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Email:</span>
                        <span className="font-medium">{selectedMaintenanceReport.reported_by.email || 'N/A'}</span>
                      </div>
                      {selectedMaintenanceReport.reported_by.phone && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Số điện thoại:</span>
                          <span className="font-medium">{selectedMaintenanceReport.reported_by.phone}</span>
                        </div>
                      )}
                      {selectedMaintenanceReport.reported_by.role && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Vai trò:</span>
                          <span className="font-medium">{selectedMaintenanceReport.reported_by.role}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Car className="h-5 w-5 text-green-600" />
                      Thông tin xe
                    </h3>
                    <div className="space-y-2 text-sm">
                      {selectedMaintenanceReport.vehicle_id ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400">Biển số xe:</span>
                            <span className="font-bold text-lg text-green-600">{selectedMaintenanceReport.vehicle_id.license_plate || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Tên xe:</span>
                            <span className="font-medium">{selectedMaintenanceReport.vehicle_id.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Hãng:</span>
                            <span className="font-medium">{(selectedMaintenanceReport.vehicle_id as unknown as Record<string, string>)?.brand || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Model:</span>
                            <span className="font-medium">{(selectedMaintenanceReport.vehicle_id as unknown as Record<string, string>)?.model || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Năm sản xuất:</span>
                            <span className="font-medium">{(selectedMaintenanceReport.vehicle_id as unknown as Record<string, string>)?.year || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Màu sắc:</span>
                            <span className="font-medium">{(selectedMaintenanceReport.vehicle_id as unknown as Record<string, string>)?.color || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Loại xe:</span>
                            <span className="font-medium">{selectedMaintenanceReport.vehicle_id.type === 'scooter' ? 'Xe tay ga' : 'Xe máy'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <Car className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 dark:text-gray-400 italic">Không có thông tin xe</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {typeof selectedMaintenanceReport.station_id === 'object' && selectedMaintenanceReport.station_id && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Settings className="h-5 w-5 text-orange-600" />
                        Thông tin trạm
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Tên trạm:</span>
                          <span className="font-semibold">{selectedMaintenanceReport.station_id.name || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-500 dark:text-gray-400">Địa chỉ:</span>
                          <span className="font-medium text-right">{selectedMaintenanceReport.station_id.address || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Mã trạm:</span>
                          <span className="font-medium">{selectedMaintenanceReport.station_id.code || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Chi tiết báo cáo
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Tiêu đề:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedMaintenanceReport.title}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm block mb-2">Mô tả sự cố:</span>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-gray-900 dark:text-white leading-relaxed">
                            {selectedMaintenanceReport.description}
                          </p>
                        </div>
                      </div>
                      
                      {selectedMaintenanceReport.notes && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 text-sm block mb-2">Ghi chú:</span>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-gray-900 dark:text-white leading-relaxed">
                              {selectedMaintenanceReport.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      Thời gian
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Ngày tạo:</span>
                        <span className="font-medium">{formatDate(selectedMaintenanceReport.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Cập nhật cuối:</span>
                        <span className="font-medium">{formatDate(selectedMaintenanceReport.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedMaintenanceReport.images && selectedMaintenanceReport.images.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Camera className="h-5 w-5 text-red-600" />
                        Hình ảnh sự cố ({selectedMaintenanceReport.images.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedMaintenanceReport.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Maintenance image ${index + 1}`}
                              className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setSelectedImage(image)
                                setShowImageModal(true)
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                              <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Maintenance Report Modal */}
      <Dialog open={showUpdateForm} onOpenChange={setShowUpdateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Cập nhật trạng thái báo cáo bảo trì
            </DialogTitle>
            <DialogDescription>
              Cập nhật trạng thái và ghi chú cho báo cáo bảo trì
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Trạng thái mới
              </label>
              <Select 
                value={updateFormData.status} 
                onValueChange={(value) => setUpdateFormData(prev => ({ ...prev, status: value as 'reported' | 'fixed' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reported">Đã báo cáo</SelectItem>
                  <SelectItem value="fixed">Đã sửa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Ghi chú
              </label>
              <Textarea
                value={updateFormData.notes}
                onChange={(e) => setUpdateFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Nhập ghi chú về việc sửa chữa..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Ảnh sau khi sửa chữa (tùy chọn)
              </label>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpdateImageUpload}
                  className="cursor-pointer"
                />
                
                {updateImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {updateImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Update image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setSelectedImage(URL.createObjectURL(file))
                            setShowImageModal(true)
                          }}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeUpdateImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowUpdateForm(false)}
                disabled={updating}
              >
                Hủy
              </Button>
              <Button
                onClick={handleUpdateMaintenanceReport}
                disabled={updating}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                alt="Maintenance Image" 
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}