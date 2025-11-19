import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, Clock, Eye, Image as ImageIcon, RefreshCw, Search, AlertTriangle, FileText, X, Battery, Wrench, Car } from 'lucide-react'
import { getReports, getReportById, getReportStats, resolveReport, Report, GetReportsParams, ReportStats } from '@/api/reports'
import { useToast } from '@/hooks/use-toast'

// Helper function to format date - handles both ISO strings and pre-formatted strings
const formatDate = (dateValue: string | null | undefined, includeTime = false): string => {
  if (!dateValue) return 'Chưa cập nhật'
  
  // If it's already formatted (contains "/"), return as is
  if (typeof dateValue === 'string' && dateValue.includes('/')) {
    return dateValue
  }
  
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return 'Chưa cập nhật'
    
    if (includeTime) {
      return date.toLocaleString('vi-VN')
    }
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return 'Chưa cập nhật'
  }
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { TablePagination } from '@/components/ui/table-pagination'

export function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<GetReportsParams>({
    page: 1,
    limit: 9,
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 0,
  })
  const [statistics, setStatistics] = useState<ReportStats>({
    pending: 0,
    resolved: 0,
    total: 0,
    byType: [],
  })
  const { toast } = useToast()

  const fetchReports = useCallback(async (customFilters?: Partial<GetReportsParams>) => {
    try {
      setLoading(true)
      const params = {
        ...filters,
        ...customFilters,
      }
      const response = await getReports(params)
      setReports(response.data)
      setPagination(response.pagination)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể tải danh sách báo cáo',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  const fetchStats = useCallback(async () => {
    try {
      const response = await getReportStats()
      setStatistics(response.data)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể tải thống kê',
        variant: 'destructive',
        duration: 5000,
      })
    }
  }, [toast])

  useEffect(() => {
    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleItemsPerPageChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleFilterChange = (key: keyof GetReportsParams, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }))
  }

  const handleViewDetail = async (report: Report) => {
    try {
      setLoading(true)
      const response = await getReportById(report._id)
      setSelectedReport(response.data)
      setShowDetailModal(true)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể tải chi tiết báo cáo',
        variant: 'destructive',
        duration: 5000,
      })
      // Fallback to basic info
      setSelectedReport(report)
      setShowDetailModal(true)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800">
        <Clock className="w-3 h-3 mr-1" /> Chờ xử lý
      </Badge>
    }
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-300 dark:border-green-800">
      <CheckCircle className="w-3 h-3 mr-1" /> Đã xử lý
    </Badge>
  }

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      battery_issue: '🔋 Vấn đề pin',
      vehicle_breakdown: '🔧 Xe hỏng',
      accident: '⚠️ Tai nạn',
      other: '📋 Khác',
    }
    return labels[type] || '📋 Khác'
  }

  const filterReportsBySearch = (reportsList: Report[]) => {
    if (!searchTerm.trim()) return reportsList
    
    const searchLower = searchTerm.toLowerCase().trim()
    return reportsList.filter(report => 
      report.code.toLowerCase().includes(searchLower) ||
      report.vehicle_id.name.toLowerCase().includes(searchLower) ||
      report.vehicle_id.license_plate.toLowerCase().includes(searchLower) ||
      report.user_id.email.toLowerCase().includes(searchLower) ||
      report.user_id.phone.includes(searchLower)
    )
  }

  const filteredReports = filterReportsBySearch(reports)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Báo Cáo Sự Cố</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Quản lý và theo dõi các báo cáo sự cố từ khách hàng
          </p>
        </div>
        <Button 
          onClick={() => {
            fetchReports()
            fetchStats()
          }}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Statistics Cards - Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Chờ xử lý
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                {statistics.pending}
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">Cần xử lý ngay</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                Đã xử lý
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {statistics.resolved}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">Đã hoàn thành</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Tổng cộng
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {statistics.total}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Tất cả báo cáo</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Statistics Cards - By Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                Vấn đề pin
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <Battery className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {statistics.byType.find(t => t._id === 'battery_issue')?.count || 0}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">Báo cáo về pin</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
                Xe hỏng
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {statistics.byType.find(t => t._id === 'vehicle_breakdown')?.count || 0}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">Báo cáo hỏng hóc</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                Tai nạn
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                {statistics.byType.find(t => t._id === 'accident')?.count || 0}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">Báo cáo tai nạn</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter Section */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="🔍 Tìm kiếm theo mã BC, xe, biển số, khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 border-2 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium whitespace-nowrap">Lọc theo:</span>
                <Select 
                  value={filters.status || 'all'} 
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="w-[150px] border-2 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📋 Tất cả</SelectItem>
                    <SelectItem value="pending">⏳ Chờ xử lý</SelectItem>
                    <SelectItem value="resolved">✅ Đã xử lý</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={filters.issue_type || 'all'} 
                  onValueChange={(value) => handleFilterChange('issue_type', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="w-[180px] border-2 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📋 Tất cả loại</SelectItem>
                    <SelectItem value="battery_issue">🔋 Vấn đề pin</SelectItem>
                    <SelectItem value="vehicle_breakdown">🔧 Xe hỏng</SelectItem>
                    <SelectItem value="accident">⚠️ Tai nạn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Hiển thị {filteredReports.length} trong {pagination.total} báo cáo
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-16">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Đang tải danh sách báo cáo...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-16">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Không tìm thấy báo cáo nào
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Thử thay đổi bộ lọc để xem các báo cáo khác
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report, index) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                  {/* Header with gradient based on status */}
                  <div className={`h-2 ${
                    report.status === 'pending' 
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-600' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600'
                  }`} />
                  
                  <CardContent className="p-6 flex-1 flex flex-col">
                    {/* Report Code & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {report.code}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(report.createdAt)}
                        </p>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    {/* Issue Type */}
                    <div className="mb-4">
                      <Badge variant="outline" className="text-sm">
                        {getIssueTypeLabel(report.issue_type)}
                      </Badge>
                    </div>

                    {/* Vehicle Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Xe:</span>
                        <span className="text-gray-600 dark:text-gray-400">{report.vehicle_id.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Biển số:</span>
                        <span className="text-gray-600 dark:text-gray-400">{report.vehicle_id.license_plate}</span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">KH:</span>
                        <span className="text-gray-600 dark:text-gray-400 truncate">{report.user_id.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">SĐT:</span>
                        <span className="text-gray-600 dark:text-gray-400">{report.user_id.phone}</span>
                      </div>
                    </div>

                    {/* Description Preview */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-1">
                      {report.description}
                    </p>

                    {/* Images Count */}
                    {report.images && report.images.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <ImageIcon className="h-4 w-4" />
                        <span>{report.images.length} hình ảnh</span>
                      </div>
                    )}

                    {/* View Detail Button */}
                    <div className="mt-auto">
                      <Button
                        onClick={() => handleViewDetail(report)}
                        variant="outline"
                        className="w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-300 transition-all"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          <TablePagination
            currentPage={pagination.page}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedReport(null)
          }}
          onResolveSuccess={() => {
            fetchReports()
            fetchStats()
          }}
        />
      )}
    </motion.div>
  )
}

// Report Detail Modal Component
interface ReportDetailModalProps {
  report: Report
  open: boolean
  onClose: () => void
  onResolveSuccess: () => void
}

function ReportDetailModal({ report, open, onClose, onResolveSuccess }: ReportDetailModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showResolveForm, setShowResolveForm] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolving, setResolving] = useState(false)
  const { toast } = useToast()

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      battery_issue: '🔋 Vấn đề pin',
      vehicle_breakdown: '🔧 Xe hỏng',
      accident: '⚠️ Tai nạn',
      other: '📋 Khác',
    }
    return labels[type] || '📋 Khác'
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Chi tiết báo cáo: {report.code}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Status and Type */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Trạng thái</div>
                  <div className="flex items-center gap-2">
                    {report.status === 'resolved' ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-gray-900 dark:text-white">Đã xử lý</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-gray-900 dark:text-white">Chờ xử lý</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Loại sự cố</div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getIssueTypeLabel(report.issue_type)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vehicle Info */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  🛵 Thông tin xe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Tên xe</div>
                    <div className="font-medium text-gray-900 dark:text-white">{report.vehicle_id.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Biển số</div>
                    <div className="font-medium text-gray-900 dark:text-white">{report.vehicle_id.license_plate}</div>
                  </div>
                </div>
                {(report.vehicle_id.brand || report.vehicle_id.model) && (
                  <div className="grid grid-cols-2 gap-4">
                    {report.vehicle_id.brand && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Hãng</div>
                        <div className="font-medium text-gray-900 dark:text-white">{report.vehicle_id.brand}</div>
                      </div>
                    )}
                    {report.vehicle_id.model && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Model</div>
                        <div className="font-medium text-gray-900 dark:text-white">{report.vehicle_id.model}</div>
                      </div>
                    )}
                  </div>
                )}
                {(report.vehicle_id.color || report.vehicle_id.type) && (
                  <div className="grid grid-cols-2 gap-4">
                    {report.vehicle_id.color && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Màu sắc</div>
                        <div className="font-medium text-gray-900 dark:text-white">{report.vehicle_id.color}</div>
                      </div>
                    )}
                    {report.vehicle_id.type && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Loại xe</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {report.vehicle_id.type === 'scooter' ? '🛵 Xe tay ga' : '🏍️ Xe máy'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {(report.vehicle_id.current_battery !== undefined || report.vehicle_id.current_mileage !== undefined) && (
                  <div className="grid grid-cols-2 gap-4">
                    {report.vehicle_id.current_battery !== undefined && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Pin hiện tại</div>
                        <div className="font-medium text-gray-900 dark:text-white">🔋 {report.vehicle_id.current_battery}%</div>
                      </div>
                    )}
                    {report.vehicle_id.current_mileage !== undefined && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Số km</div>
                        <div className="font-medium text-gray-900 dark:text-white">{report.vehicle_id.current_mileage} km</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  👤 Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.user_id.avatar && (
                  <div className="flex justify-center mb-3">
                    <img 
                      src={report.user_id.avatar} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-full object-cover border-4 border-purple-200 dark:border-purple-700"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                    <div className="font-medium text-gray-900 dark:text-white break-all">{report.user_id.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Số điện thoại</div>
                    <div className="font-medium text-gray-900 dark:text-white">{report.user_id.phone}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Station Info */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  📍 Thông tin trạm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Tên trạm</div>
                  <div className="font-medium text-gray-900 dark:text-white">{report.station_id.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Địa chỉ</div>
                  <div className="font-medium text-gray-900 dark:text-white">{report.station_id.address}</div>
                </div>
                {report.station_id.phone && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Số điện thoại</div>
                    <div className="font-medium text-gray-900 dark:text-white">📞 {report.station_id.phone}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rental Info */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  📋 Thông tin thuê xe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Mã thuê xe</div>
                    <div className="font-medium text-gray-900 dark:text-white">{report.rental_id.code}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Trạng thái thuê</div>
                    {report.rental_id.status === 'active' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Đang thuê</span>
                      </div>
                    ) : (
                      <div className="font-medium text-gray-900 dark:text-white">
                        {report.rental_id.status || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
                {report.rental_id.actual_start_time && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Thời gian bắt đầu</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatDate(report.rental_id.actual_start_time, true)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Info */}
            {typeof report.booking_id === 'object' && (
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    📅 Thông tin đặt xe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Mã đặt xe</div>
                      <div className="font-medium text-gray-900 dark:text-white">{report.booking_id.code}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Tổng tiền</div>
                      <div className="font-medium text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(report.booking_id.total_price)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Ngày bắt đầu</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatDate(report.booking_id.start_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Ngày kết thúc</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatDate(report.booking_id.end_date)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Tiền đặt cọc</div>
                    <div className="font-medium text-blue-600 dark:text-blue-400">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(report.booking_id.deposit_amount)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  📝 Mô tả sự cố
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {report.description}
                </p>
              </CardContent>
            </Card>

            {/* Images */}
            {report.images && report.images.length > 0 && (
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Hình ảnh ({report.images.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {report.images.map((image, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImage(image)}
                        className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500"
                      >
                        <img
                          src={image}
                          alt={`Hình ảnh ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resolution Info */}
            {report.status === 'resolved' && (
              <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-900 dark:text-green-100">
                    <CheckCircle className="h-5 w-5" />
                    Thông tin xử lý
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.resolution_notes && (
                    <div>
                      <div className="text-sm text-green-700 dark:text-green-300">Ghi chú xử lý</div>
                      <div className="font-medium text-green-900 dark:text-green-100 whitespace-pre-wrap">
                        {report.resolution_notes}
                      </div>
                    </div>
                  )}
                  {report.resolved_by && report.resolved_by.email && (
                    <div>
                      <div className="text-sm text-green-700 dark:text-green-300">Người xử lý</div>
                      <div className="font-medium text-green-900 dark:text-green-100">
                        {report.resolved_by.email}
                      </div>
                    </div>
                  )}
                  {report.resolved_at && (
                    <div>
                      <div className="text-sm text-green-700 dark:text-green-300">Thời gian xử lý</div>
                      <div className="font-medium text-green-900 dark:text-green-100">
                        {formatDate(report.resolved_at, true)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Ngày tạo</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatDate(report.createdAt, true)}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Cập nhật lần cuối</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatDate(report.updatedAt, true)}
                </div>
              </div>
            </div>
          </div>

          {/* Resolve Form */}
          {report.status === 'pending' && showResolveForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 shadow-lg">
                <CardHeader className="pb-4 border-b border-green-200 dark:border-green-700/50">
                  <CardTitle className="text-xl flex items-center gap-3 text-green-900 dark:text-green-100">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold">Giải quyết báo cáo</div>
                      <div className="text-sm font-normal text-green-700 dark:text-green-300">
                        Vui lòng nhập thông tin chi tiết về cách giải quyết
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="resolution_notes"
                      className="text-base font-semibold text-green-900 dark:text-green-100 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-5 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                      Ghi chú giải quyết
                      <span className="text-red-500 text-lg">*</span>
                    </Label>
                    <Textarea
                      id="resolution_notes"
                      placeholder="Mô tả chi tiết về cách bạn đã giải quyết sự cố này... (VD: Đã thay thế pin, sửa chữa bộ phận hỏng, thực hiện bảo trì,...)"
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={5}
                      className="resize-none border-2 border-green-300 dark:border-green-700 focus:border-green-500 dark:focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-all duration-200 text-base"
                    />
                    <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 p-3 rounded-lg border border-green-200 dark:border-green-700/50">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Lưu ý:</span> Ghi chú này sẽ được lưu vào hệ thống và có thể được xem lại sau này. Vui lòng cung cấp thông tin rõ ràng và đầy đủ.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {report.status === 'pending' && (
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              {!showResolveForm ? (
                <Button
                  onClick={() => setShowResolveForm(true)}
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Giải quyết
                </Button>
              ) : (
                <>
                  <Button
                      onClick={() => {
                        setShowResolveForm(false)
                        setResolutionNotes('')
                      }}
                      variant="outline"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!resolutionNotes.trim()) {
                          toast({
                            title: 'Lỗi',
                            description: 'Vui lòng nhập ghi chú giải quyết',
                            variant: 'destructive',
                            duration: 3000,
                          })
                          return
                        }

                        try {
                          setResolving(true)
                          const response = await resolveReport(report._id, {
                            resolution_notes: resolutionNotes,
                          })

                          toast({
                            title: 'Thành công',
                            description: response.message || 'Đã giải quyết báo cáo thành công',
                            variant: 'success',
                            duration: 3000,
                          })

                          // Close modal and refresh data
                          onClose()
                          onResolveSuccess()
                        } catch (error) {
                          toast({
                            title: 'Lỗi',
                            description: error instanceof Error ? error.message : 'Không thể giải quyết báo cáo',
                            variant: 'destructive',
                            duration: 5000,
                          })
                        } finally {
                          setResolving(false)
                        }
                      }}
                      disabled={resolving || !resolutionNotes.trim()}
                      className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                    >
                      {resolving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Xác nhận giải quyết
                        </>
                      )}
                    </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
