import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Battery, Settings, Camera, Wrench, RefreshCw, Eye, Calendar, MapPin, Phone, Mail, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getStaffVehicles, reportVehicleMaintenance, getStaffVehicleById, type Vehicle, type VehicleDetail } from '@/api/vehicles'
import { getMaintenanceReports, getMaintenanceReportById, updateMaintenanceReport, type MaintenanceReport, type MaintenanceReportDetail } from '@/api/maintenance'
import { useToast } from '@/hooks/use-toast'
import { TablePagination } from '@/components/ui/table-pagination'

export function Fleet() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehicleDetail, setVehicleDetail] = useState<VehicleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [submittingReport, setSubmittingReport] = useState(false)
  const [maintenanceType, setMaintenanceType] = useState<'low_battery' | 'poor_condition'>('poor_condition')
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [statistics, setStatistics] = useState({
    available: 0,
    rented: 0,
    maintenance: 0,
    reserved: 0,
    total: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0
  });

  const handleItemsPerPageChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    loadVehicles(1, newLimit);
  };
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'available' | 'rented' | 'maintenance' | 'reserved',
    color: '',
    type: 'all' as 'all' | 'scooter' | 'motorcycle',
    search: ''
  })
  
  // Maintenance states
  const [activeTab, setActiveTab] = useState<'vehicles' | 'maintenance'>('vehicles')
  const [maintenanceReports, setMaintenanceReports] = useState<MaintenanceReport[]>([])
  const [selectedReport, setSelectedReport] = useState<MaintenanceReportDetail | null>(null)
  const [loadingReports, setLoadingReports] = useState(false)
  const [showMaintenanceDetail, setShowMaintenanceDetail] = useState(false)
  const [updatingReport, setUpdatingReport] = useState(false)
  const [batteryLevel, setBatteryLevel] = useState(80)
  const [newStatus, setNewStatus] = useState<'in_progress' | 'fixed'>('in_progress')
  const [maintenancePagination, setMaintenancePagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0
  });

  const handleMaintenanceItemsPerPageChange = (newLimit: number) => {
    setMaintenancePagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    loadMaintenanceReports(1, newLimit);
  };
  const [maintenanceFilters, setMaintenanceFilters] = useState({
    status: 'all',
    search: ''
  })
  const [maintenanceStats, setMaintenanceStats] = useState({
    reported: 0,
    in_progress: 0,
    fixed: 0,
    total: 0
  })
  
  const { toast } = useToast()

  // Load vehicles from API
  const loadVehicles = useCallback(async (page?: number, limit?: number) => {
    setLoading(true)
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) {
        throw new Error('Bạn cần đăng nhập để xem danh sách xe')
      }

      const pageToLoad = page !== undefined ? page : pagination.page;
      const limitToLoad = limit !== undefined ? limit : pagination.limit;

      const response = await getStaffVehicles({
        page: pageToLoad,
        limit: limitToLoad,
        status: filters.status === 'all' ? undefined : filters.status,
        color: filters.color || undefined,
        type: filters.type === 'all' ? undefined : filters.type
      })
      
      setVehicles(response.vehicles)
      setStatistics({
        available: response.statistics.available,
        rented: response.statistics.rented,
        maintenance: response.statistics.maintenance || 0,
        reserved: response.statistics.reserved || 0,
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
          duration: 3000,
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
          duration: 3000,
        })
      }
      setVehicles([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, toast])

  // Load maintenance reports
  const loadMaintenanceReports = useCallback(async (page?: number, limit?: number) => {
    try {
      setLoadingReports(true)
      const pageToLoad = page !== undefined ? page : maintenancePagination.page;
      const limitToLoad = limit !== undefined ? limit : maintenancePagination.limit;
      
      const response = await getMaintenanceReports({
        page: pageToLoad,
        limit: limitToLoad,
        status: maintenanceFilters.status
      })
      
      setMaintenanceReports(response.data.reports)
      setMaintenancePagination(prev => ({
        ...prev,
        page: pageToLoad,
        limit: limitToLoad,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }))
      
      // Calculate statistics from all reports
      const allReportsResponse = await getMaintenanceReports({
        page: 1,
        limit: 100,
        status: 'all'
      })
      
      const stats = allReportsResponse.data.reports.reduce((acc, report) => {
        acc.total++
        if (report.status === 'reported') acc.reported++
        if (report.status === 'in_progress') acc.in_progress++
        if (report.status === 'fixed') acc.fixed++
        return acc
      }, { reported: 0, in_progress: 0, fixed: 0, total: 0 })
      
      setMaintenanceStats(stats)
      
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || "Không thể tải danh sách báo cáo"
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setLoadingReports(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maintenanceFilters.status, toast])

  // View maintenance detail
  const handleViewMaintenanceDetail = async (reportId: string) => {
    try {
      const response = await getMaintenanceReportById(reportId)
      setSelectedReport(response.data)
      setBatteryLevel(response.data.vehicle_id?.current_battery || 80)
      setNewStatus(response.data.status === 'fixed' ? 'fixed' : 'in_progress')
      setShowMaintenanceDetail(true)
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || "Không thể tải chi tiết báo cáo"
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: errorMessage,
        duration: 5000,
      })
    }
  }

  // Update maintenance status
  const handleUpdateMaintenanceStatus = async () => {
    if (!selectedReport) return
    
    try {
      setUpdatingReport(true)
      
      await updateMaintenanceReport(selectedReport._id, {
        status: newStatus,
        battery_level: newStatus === 'fixed' ? batteryLevel : undefined
      })
      
      toast({
        title: "Thành công",
        description: `Đã cập nhật trạng thái báo cáo thành công`,
        variant: "success",
        duration: 5000,
      })
      
      setShowMaintenanceDetail(false)
      loadMaintenanceReports()
      loadVehicles() // Refresh vehicle list to update battery
      
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || "Không thể cập nhật báo cáo"
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setUpdatingReport(false)
    }
  }

  // Get maintenance status badge
  const getMaintenanceStatusBadge = (status: string) => {
    const badges = {
      reported: <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Chờ xử lý</Badge>,
      in_progress: <Badge className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Đang xử lý</Badge>,
      fixed: <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Đã xong</Badge>,
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  useEffect(() => {
    // Debug: Check token availability
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    console.log('Fleet: Token available:', !!token)
    console.log('Fleet: Token preview:', token ? `${token.substring(0, 20)}...` : 'No token')
    
    loadVehicles()
  }, [loadVehicles])

  // Load maintenance reports when tab changes
  useEffect(() => {
    if (activeTab === 'maintenance') {
      loadMaintenanceReports()
    }
  }, [activeTab, loadMaintenanceReports])


  const handleReportIssue = async (reason: string, images: File[], maintenance_type: 'low_battery' | 'poor_condition') => {
    if (!selectedVehicle) return;
    
    // Validate low_battery type
    if (maintenance_type === 'low_battery' && selectedVehicle.current_battery >= 50) {
      toast({
        title: "Lỗi xác thực",
        description: `Chỉ được báo cáo low_battery khi pin < 50%. Pin hiện tại: ${selectedVehicle.current_battery}%`,
        variant: "destructive",
        duration: 4000,
      })
      return;
    }
    
    setSubmittingReport(true)
    try {
      const response = await reportVehicleMaintenance(selectedVehicle._id, reason, images, maintenance_type);
      
      // Update vehicle status to maintenance
      setVehicles(prev => prev.map(vehicle => 
        vehicle._id === selectedVehicle._id 
          ? { ...vehicle, status: 'maintenance' as const }
          : vehicle
      ))
      
      // Clear form data
      setUploadedImages([])
      setMaintenanceType('poor_condition')
      
      const successTitle = maintenance_type === 'low_battery' 
        ? "Báo cáo pin yếu thành công 🔋" 
        : "Báo cáo bảo trì thành công ⚠️"
      
      toast({
        title: successTitle,
        description: response.message || "Sự cố đã được ghi nhận và chuyển đến bộ phận kỹ thuật",
        variant: "success",
        duration: 3000,
      })
      
      // Close dialog and reset
      setIsReportDialogOpen(false)
      setSelectedVehicle(null)
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || 'Không thể báo cáo sự cố'
      
      // Parse error message to show user-friendly text
      let friendlyMessage = errorMessage
      if (errorMessage.includes('Chỉ có thể báo cáo bảo trì xe đang available')) {
        friendlyMessage = 'Chỉ có thể báo cáo bảo trì cho xe đang có sẵn. Xe này hiện đang trong trạng thái khác.'
      } else if (errorMessage.includes('maintenance')) {
        friendlyMessage = 'Xe này đang trong trạng thái bảo trì, không thể báo cáo thêm sự cố.'
      } else if (errorMessage.includes('Pin hiện tại')) {
        friendlyMessage = errorMessage // Show the battery validation error from API
      }
      
      toast({
        title: "Không thể báo cáo sự cố",
        description: friendlyMessage,
        variant: "destructive",
        duration: 4000,
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

  const handleViewDetail = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setLoadingDetail(true)
    setShowDetailModal(true)
    
    try {
      const response = await getStaffVehicleById(vehicle._id)
      setVehicleDetail(response.vehicle)
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || 'Không thể tải thông tin chi tiết xe'
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoadingDetail(false)
    }
  }

  const getBatteryColor = (level: number) => {
    if (level >= 60) return 'text-green-600'
    if (level >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filterVehiclesBySearch = (vehiclesList: Vehicle[]) => {
    if (!filters.search) return vehiclesList;
    const searchLower = filters.search.toLowerCase();
    return vehiclesList.filter(vehicle => 
      vehicle.license_plate.toLowerCase().includes(searchLower) ||
      vehicle.name.toLowerCase().includes(searchLower) ||
      vehicle.brand.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower)
    );
  }



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Có sẵn</Badge>
      case 'rented':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Đang thuê</Badge>
      case 'reserved':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Đang đặt trước</Badge>
      case 'maintenance':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Bảo trì</Badge>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý xe tại điểm</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Theo dõi tình trạng pin, bảo trì và sự cố xe</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => activeTab === 'vehicles' ? loadVehicles() : loadMaintenanceReports()}
            disabled={loading || loadingReports}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || loadingReports) ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'vehicles' | 'maintenance')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Danh sách xe
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Báo cáo bảo trì
            {maintenanceStats.reported > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{maintenanceStats.reported}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: VEHICLES */}
        <TabsContent value="vehicles" className="space-y-6 mt-6">
      {/* Vehicle Management Section */}
      <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                Đã duyệt
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Battery className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{statistics.available}</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">Sẵn sàng cho thuê</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                Bị từ chối
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">{statistics.rented}</div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">Xe đang được sử dụng</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Đang chờ
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">{statistics.reserved}</div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">Xe đã được đặt trước</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Tổng cộng
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{statistics.total}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Tất cả xe tại trạm</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                Cần bảo trì
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{statistics.maintenance}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">Cần kiểm tra/sửa chữa</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter Section */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium whitespace-nowrap">Lọc theo:</span>
              <Select value={filters.status} onValueChange={(value) => {
                setFilters(prev => ({ ...prev, status: value as 'all' | 'available' | 'rented' | 'maintenance' | 'reserved' }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}>
                <SelectTrigger className="w-[150px] border-2 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 Tất cả</SelectItem>
                  <SelectItem value="available">✅ Có sẵn</SelectItem>
                  <SelectItem value="rented">🛵 Đang thuê</SelectItem>
                  <SelectItem value="reserved">📅 Đang đặt trước</SelectItem>
                  <SelectItem value="maintenance">🔧 Bảo trì</SelectItem>
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
              
              <Input
                placeholder="🔍 Tìm kiếm..."
                value={filters.search}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="w-[400px] border-2 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Hiển thị {filterVehiclesBySearch(vehicles).length} trong {pagination.total} xe
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
      ) : (() => {
        // Filter vehicles based on search term
        const filteredVehicles = filterVehiclesBySearch(vehicles);
        
        return filteredVehicles.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-16">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Không tìm thấy xe nào
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {filters.search 
                  ? `Không tìm thấy xe phù hợp với "${filters.search}"` 
                  : filters.status !== 'all' 
                    ? 'Thử thay đổi bộ lọc để xem các xe khác' 
                    : 'Chưa có xe nào tại trạm của bạn'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle, index) => {
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
                      vehicle.status === 'reserved' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
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
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                            onClick={() => handleViewDetail(vehicle)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Chi tiết
                          </Button>
                          <Dialog 
                            open={isReportDialogOpen && selectedVehicle?._id === vehicle._id}
                            onOpenChange={(open) => {
                              if (!submittingReport) {
                                setIsReportDialogOpen(open)
                                if (!open) {
                                  setSelectedVehicle(null)
                                  setUploadedImages([])
                                  setMaintenanceType('poor_condition')
                                }
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                onClick={() => {
                                  setSelectedVehicle(vehicle)
                                  setIsReportDialogOpen(true)
                                }}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Báo sự cố
                              </Button>
                            </DialogTrigger>
                            <DialogContent 
                              className="max-w-2xl max-h-[90vh] overflow-y-auto"
                              onInteractOutside={(e) => {
                                if (submittingReport) e.preventDefault();
                              }}
                              onEscapeKeyDown={(e) => {
                                if (submittingReport) e.preventDefault();
                              }}
                            >
                              <DialogHeader>
                                <DialogTitle>Báo cáo bảo trì: {selectedVehicle?.name}</DialogTitle>
                                <DialogDescription>
                                  Chọn loại bảo trì, mô tả chi tiết và đính kèm hình ảnh
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6 py-4">
                                {/* Vehicle Info Banner */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">Pin hiện tại:</span>
                                    <span className={`font-semibold ${getBatteryColor(selectedVehicle?.current_battery || 0)}`}>
                                      {selectedVehicle?.current_battery}%
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-gray-700 dark:text-gray-300">Trạng thái:</span>
                                    <span className="font-medium">{getStatusBadge(selectedVehicle?.status || '')}</span>
                                  </div>
                                </div>

                                {/* Maintenance Type Selection */}
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Loại bảo trì <span className="text-red-500">*</span>
                                  </label>
                                  <Select 
                                    value={maintenanceType} 
                                    onValueChange={(value) => setMaintenanceType(value as 'low_battery' | 'poor_condition')}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Chọn loại bảo trì" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="poor_condition">
                                        <div className="flex items-center gap-2">
                                          <Wrench className="h-4 w-4 text-red-600" />
                                          <div className="text-left">
                                            <div className="font-medium">Xe hỏng hóc (Poor Condition)</div>
                                            <div className="text-xs text-gray-500">Cần Admin duyệt - Mặc định</div>
                                          </div>
                                        </div>
                                      </SelectItem>
                                      <SelectItem 
                                        value="low_battery"
                                        disabled={selectedVehicle ? selectedVehicle.current_battery >= 50 : false}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Battery className="h-4 w-4 text-yellow-600" />
                                          <div className="text-left">
                                            <div className="font-medium">Pin yếu (Low Battery)</div>
                                            <div className="text-xs text-gray-500">
                                              {selectedVehicle && selectedVehicle.current_battery >= 50 
                                                ? `Chỉ dùng khi pin < 50% (hiện tại: ${selectedVehicle.current_battery}%)`
                                                : 'Staff tự fix được - Chỉ khi pin < 50%'
                                              }
                                            </div>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {maintenanceType === 'low_battery' && (
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                                      <Battery className="h-3 w-3" />
                                      Staff có thể tự sạc pin và đưa xe vào hoạt động sau khi xử lý
                                    </p>
                                  )}
                                  {maintenanceType === 'poor_condition' && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                      <Wrench className="h-3 w-3" />
                                      Cần Admin xem xét và duyệt trước khi xe có thể hoạt động lại
                                    </p>
                                  )}
                                </div>

                                {/* Description */}
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Mô tả sự cố <span className="text-red-500">*</span>
                                  </label>
                                  <textarea
                                    id="issue-description"
                                    placeholder={
                                      maintenanceType === 'low_battery' 
                                        ? "VD: Pin còn 40%, cần sạc trước khi cho thuê" 
                                        : "Mô tả chi tiết tình trạng xe, sự cố gặp phải..."
                                    }
                                    className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                  />
                                </div>
                                
                                {/* Images */}
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
                                        duration: 3000,
                                      });
                                      return;
                                    }
                                    
                                    handleReportIssue(description, uploadedImages, maintenanceType);
                                  }}
                                  disabled={submittingReport}
                                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {submittingReport ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Đang gửi...
                                    </>
                                  ) : maintenanceType === 'low_battery' ? (
                                    <>
                                      <Battery className="h-4 w-4 mr-2" />
                                      Báo cáo pin yếu
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Gửi báo cáo bảo trì
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
          {pagination.total > 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <TablePagination
                  currentPage={pagination.page}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={(page) => loadVehicles(page)}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  disabled={loading}
                  itemsPerPageOptions={[5, 10, 20, 50]}
                />
              </CardContent>
            </Card>
          )}
        </div>
        );
      })()}
          </div>
        </TabsContent>

        {/* TAB 2: MAINTENANCE */}
        <TabsContent value="maintenance" className="space-y-6 mt-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Chờ xử lý</CardTitle>
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">{maintenanceStats.reported}</div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">Báo cáo mới</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Đang xử lý</CardTitle>
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-md">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">{maintenanceStats.in_progress}</div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">Đang sửa chữa</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Đã xong</CardTitle>
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{maintenanceStats.fixed}</div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">Hoàn thành</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Tổng số</CardTitle>
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{maintenanceStats.total}</div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Tất cả báo cáo</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Select value={maintenanceFilters.status} onValueChange={(value) => {
                  setMaintenanceFilters({...maintenanceFilters, status: value})
                  setMaintenancePagination(prev => ({ ...prev, page: 1 }))
                }}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="reported">Chờ xử lý</SelectItem>
                    <SelectItem value="in_progress">Đang xử lý</SelectItem>
                    <SelectItem value="fixed">Đã xong</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Tìm theo tên xe..."
                  value={maintenanceFilters.search}
                  onChange={(e) => setMaintenanceFilters({...maintenanceFilters, search: e.target.value})}
                  className="max-w-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          {loadingReports ? (
            <div className="text-center py-16">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-lg text-gray-600">Đang tải...</p>
            </div>
          ) : maintenanceReports.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-16 text-center text-muted-foreground">
                Không có báo cáo nào
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {maintenanceReports
                .filter(r => !maintenanceFilters.search || r.vehicle_id?.name.toLowerCase().includes(maintenanceFilters.search.toLowerCase()))
                .map((report, index) => (
                  <motion.div
                    key={report._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      {/* Header with gradient based on status */}
                      <div className={`h-2 ${
                        report.status === 'fixed' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        report.status === 'in_progress' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                        report.status === 'reported' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        'bg-gradient-to-r from-gray-500 to-gray-600'
                      }`} />
                      
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Report Info */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                {report.vehicle_id?.name}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Biển số: {report.vehicle_id?.license_plate}
                              </p>
                            </div>
                            {getMaintenanceStatusBadge(report.status)}
                          </div>

                          {/* Report Details */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Mã báo cáo:</span>
                              <span className="text-sm font-medium">{report.code}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
                              <span className="text-sm font-medium">{report.vehicle_id?.model}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Loại:</span>
                              <span className="text-sm font-medium">
                                {report.maintenance_type === 'low_battery' ? '🔋 Pin yếu' : '🔧 Kỹ thuật'}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Mô tả:</span>
                              <span className="text-sm font-medium line-clamp-2">{report.title}</span>
                            </div>
                          </div>

                          {/* Battery Level */}
                          {report.vehicle_id && 'current_battery' in report.vehicle_id && typeof report.vehicle_id.current_battery === 'number' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Battery className={`h-4 w-4 ${getBatteryColor(report.vehicle_id.current_battery)}`} />
                                  <span className="text-sm font-medium">Mức pin</span>
                                </div>
                                <span className={`text-sm font-bold ${getBatteryColor(report.vehicle_id.current_battery)}`}>
                                  {report.vehicle_id.current_battery}%
                                </span>
                              </div>
                              <Progress value={report.vehicle_id.current_battery} className="h-3" />
                            </div>
                          )}

                          {/* Reported Info */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Người báo:</span>
                            <span className="font-medium">{report.reported_by.fullname}</span>
                          </div>

                          {/* Time */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Thời gian:</span>
                            <span className="font-medium text-xs">
                              {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>

                          {/* Action Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                            onClick={() => handleViewMaintenanceDetail(report._id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Chi tiết
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          )}

          {/* Pagination */}
          {maintenancePagination.total > 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <TablePagination
                  currentPage={maintenancePagination.page}
                  totalItems={maintenancePagination.total}
                  itemsPerPage={maintenancePagination.limit}
                  onPageChange={(page) => loadMaintenanceReports(page)}
                  onItemsPerPageChange={handleMaintenanceItemsPerPageChange}
                  disabled={loadingReports}
                  itemsPerPageOptions={[5, 10, 20, 50]}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Vehicle Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {loadingDetail ? 'Đang tải...' : `Chi tiết xe: ${selectedVehicle?.name}`}
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết và lịch sử xe
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mr-3" />
              <span className="text-lg text-gray-600">Đang tải thông tin chi tiết...</span>
            </div>
          ) : vehicleDetail ? (
            <div className="space-y-6 py-4">
              {/* Vehicle Images */}
              {vehicleDetail.images && vehicleDetail.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Hình ảnh xe</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {vehicleDetail.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`${vehicleDetail.name} - ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleImageClick(image)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên xe:</span>
                      <span className="font-medium">{vehicleDetail.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biển số:</span>
                      <span className="font-medium">{vehicleDetail.license_plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hãng:</span>
                      <span className="font-medium">{vehicleDetail.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{vehicleDetail.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Năm sản xuất:</span>
                      <span className="font-medium">{vehicleDetail.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Màu sắc:</span>
                      <span className="font-medium">{vehicleDetail.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loại xe:</span>
                      <span className="font-medium">
                        {vehicleDetail.type === 'scooter' ? 'Xe tay ga' : 'Xe máy'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      {getStatusBadge(vehicleDetail.status)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thông tin kỹ thuật</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dung lượng pin:</span>
                      <span className="font-medium">{vehicleDetail.battery_capacity} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mức pin hiện tại:</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${getBatteryColor(vehicleDetail.current_battery)}`}>
                          {vehicleDetail.current_battery}%
                        </span>
                        <Progress value={vehicleDetail.current_battery} className="w-16 h-2" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tầm hoạt động tối đa:</span>
                      <span className="font-medium">{vehicleDetail.max_range} km</span>
                    </div>
                    {vehicleDetail.current_mileage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số km hiện tại:</span>
                        <span className="font-medium">{vehicleDetail.current_mileage.toLocaleString()} km</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tình trạng kỹ thuật:</span>
                      <Badge variant="outline" className={
                        vehicleDetail.technical_status === 'excellent' ? 'border-green-500 text-green-700' :
                        vehicleDetail.technical_status === 'good' ? 'border-blue-500 text-blue-700' :
                        vehicleDetail.technical_status === 'fair' ? 'border-yellow-500 text-yellow-700' :
                        'border-red-500 text-red-700'
                      }>
                        {vehicleDetail.technical_status === 'excellent' ? 'Xuất sắc' :
                         vehicleDetail.technical_status === 'good' ? 'Tốt' :
                         vehicleDetail.technical_status === 'fair' ? 'Khá' : 'Kém'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Có biển số:</span>
                      <span className="font-medium">
                        {vehicleDetail.has_license_plate ? 'Có' : 'Không'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pricing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin giá cả</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá thuê/ngày:</span>
                      <span className="font-bold text-green-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(vehicleDetail.price_per_day)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tỷ lệ cọc:</span>
                      <span className="font-medium">{vehicleDetail.deposit_percentage}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Station Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Thông tin trạm
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã trạm:</span>
                    <span className="font-medium">{vehicleDetail.station_id.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên trạm:</span>
                    <span className="font-medium">{vehicleDetail.station_id.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Địa chỉ:</span>
                    <span className="font-medium">{vehicleDetail.station_id.address}</span>
                  </div>
                  {vehicleDetail.station_id.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số điện thoại:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {vehicleDetail.station_id.phone}
                      </span>
                    </div>
                  )}
                  {vehicleDetail.station_id.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {vehicleDetail.station_id.email}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Staff Information */}
              {vehicleDetail.created_by && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thông tin người tạo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên:</span>
                      <span className="font-medium">{vehicleDetail.created_by.fullname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{vehicleDetail.created_by.email}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Thời gian
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {vehicleDetail.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày tạo:</span>
                      <span className="font-medium">
                        {(() => {
                          try {
                            // Parse format "dd/mm/yyyy hh:mm:ss" to Date
                            const dateStr = vehicleDetail.createdAt;
                            const [datePart] = dateStr.split(' ');
                            const [day, month, year] = datePart.split('/');
                            
                            const date = new Date(
                              parseInt(year), 
                              parseInt(month) - 1, 
                              parseInt(day)
                            );
                            
                            return date.toLocaleDateString('vi-VN');
                          } catch {
                            return vehicleDetail.createdAt; // Fallback to original string
                          }
                        })()}
                      </span>
                    </div>
                  )}
                  {vehicleDetail.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cập nhật lần cuối:</span>
                      <span className="font-medium">
                        {(() => {
                          try {
                            // Parse format "dd/mm/yyyy hh:mm:ss" to Date
                            const dateStr = vehicleDetail.updatedAt;
                            const [datePart] = dateStr.split(' ');
                            const [day, month, year] = datePart.split('/');
                            
                            const date = new Date(
                              parseInt(year), 
                              parseInt(month) - 1, 
                              parseInt(day)
                            );
                            
                            return date.toLocaleDateString('vi-VN');
                          } catch {
                            return vehicleDetail.updatedAt; // Fallback to original string
                          }
                        })()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái hoạt động:</span>
                    <Badge variant={vehicleDetail.is_active ? "default" : "destructive"}>
                      {vehicleDetail.is_active ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không thể tải thông tin chi tiết xe</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
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

      {/* Maintenance Detail Dialog */}
      <Dialog open={showMaintenanceDetail} onOpenChange={setShowMaintenanceDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Battery className="w-5 h-5" />
              Chi Tiết Báo Cáo Bảo Trì
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4 py-4">
              {/* Vehicle Info */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Thông tin xe</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Tên xe: <span className="font-medium">{selectedReport.vehicle_id?.name}</span></div>
                  <div>Model: <span className="font-medium">{selectedReport.vehicle_id?.model}</span></div>
                  <div>Biển số: <span className="font-medium">{selectedReport.vehicle_id?.license_plate}</span></div>
                  <div>Pin hiện tại: <span className="font-medium">{selectedReport.vehicle_id?.current_battery}%</span></div>
                </div>
              </div>

              {/* Report Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã báo cáo:</span>
                  <span className="font-medium">{selectedReport.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  {getMaintenanceStatusBadge(selectedReport.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loại bảo trì:</span>
                  <span className="font-medium">
                    {selectedReport.maintenance_type === 'low_battery' ? '🔋 Pin yếu' : '🔧 Kỹ thuật'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mô tả:</span>
                  <p className="mt-1 p-2 bg-muted rounded">{selectedReport.description}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Người báo:</span>
                  <span className="font-medium">{selectedReport.reported_by.fullname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thời gian:</span>
                  <span>{new Date(selectedReport.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              {/* Update Status */}
              {selectedReport.status !== 'fixed' && selectedReport.maintenance_type === 'low_battery' && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Cập nhật trạng thái
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Trạng thái mới</label>
                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as 'in_progress' | 'fixed')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress">Đang xử lý</SelectItem>
                        <SelectItem value="fixed">Đã hoàn thành</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newStatus === 'fixed' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Mức pin sau khi sạc <span className="text-red-500">*</span> (phải ≥ 80%)
                      </label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={batteryLevel}
                          onChange={(e) => {
                            const value = Number(e.target.value)
                            if (value >= 0 && value <= 100) {
                              setBatteryLevel(value)
                            } else if (e.target.value === '') {
                              setBatteryLevel(0)
                            }
                          }}
                          className="w-24"
                        />
                        <span className="text-sm font-medium">%</span>
                        <Progress value={batteryLevel} className="flex-1" />
                      </div>
                      {batteryLevel < 80 && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Pin phải đạt ít nhất 80% để hoàn thành
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Info for non-low-battery reports */}
              {selectedReport.maintenance_type !== 'low_battery' && selectedReport.status !== 'fixed' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Chỉ Admin mới có thể xử lý báo cáo kỹ thuật này
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMaintenanceDetail(false)}>
              Đóng
            </Button>
            {selectedReport?.status !== 'fixed' && selectedReport?.maintenance_type === 'low_battery' && (
              <Button 
                onClick={handleUpdateMaintenanceStatus} 
                disabled={updatingReport || (newStatus === 'fixed' && batteryLevel < 80)}
              >
                {updatingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Cập nhật
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}