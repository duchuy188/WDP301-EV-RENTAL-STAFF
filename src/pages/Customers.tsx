import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle, XCircle, Eye, UserCheck, RefreshCw, Search, Filter, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { getPendingKyc, updateKycStatus, staffUploadIdentityCardFront, staffUploadIdentityCardBack, staffUploadLicense, type PendingKycUser } from '@/api/kyc'

export function Customers() {
  const [kycUsers, setKycUsers] = useState<PendingKycUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<PendingKycUser[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<PendingKycUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCriteria, setFilterCriteria] = useState('all')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [customerToReject, setCustomerToReject] = useState<string | null>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [uploadType, setUploadType] = useState<'front' | 'back' | 'license' | null>(null)
  const { toast } = useToast()

  // Load pending KYC requests
  const loadPendingKyc = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await getPendingKyc()
      setKycUsers(response.users || [])
      setFilteredUsers(response.users || [])
      setTotalCount(response.count || 0)
      toast({
        title: "Thành công",
        description: `Đã tải ${response.count || 0} yêu cầu KYC đang chờ xử lý`,
      })
    } catch (error: unknown) {
      console.error('KYC API Error:', error)
      // Xử lý trường hợp API trả về 304 hoặc lỗi khác
      setKycUsers([])
      setFilteredUsers([])
      setTotalCount(0)
      const errorMessage = (error as Error)?.message || 'Lỗi khi tải danh sách KYC'
      if (!errorMessage.includes('304')) {
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Filter and search logic
  const applyFilters = useCallback(() => {
    let filtered = [...kycUsers]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.fullname?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.identityCard?.includes(term) ||
        user.licenseNumber?.includes(term) ||
        user.identityName?.toLowerCase().includes(term) ||
        user.licenseName?.toLowerCase().includes(term)
      )
    }

    // Apply criteria filter
    switch (filterCriteria) {
      case 'low_accuracy':
        filtered = filtered.filter(user => {
          const idScore = user.identityOcr?.front?.overall_score ? parseFloat(user.identityOcr.front.overall_score) : 100
          const licenseScore = user.licenseOcr?.front?.overall_score ? parseFloat(user.licenseOcr.front.overall_score) : 100
          return idScore < 85 || licenseScore < 85
        })
        break
      case 'name_mismatch':
        filtered = filtered.filter(user => 
          user.identityName && user.licenseName && 
          user.identityName !== user.licenseName
        )
        break
      case 'incomplete_docs':
        filtered = filtered.filter(user => 
          !user.identityCardFrontUploaded || 
          !user.identityCardBackUploaded || 
          !user.licenseFrontUploaded
        )
        break
      case 'recent': {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        filtered = filtered.filter(user => 
          new Date(user.lastKycAt) > oneDayAgo
        )
        break
      }
      default:
        // 'all' - no additional filtering
        break
    }

    setFilteredUsers(filtered)
  }, [kycUsers, searchTerm, filterCriteria])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  useEffect(() => {
    loadPendingKyc()
  }, [loadPendingKyc])

  const handleVerifyCustomer = async (customerId: string, isApproved: boolean, reason?: string) => {
    try {
      // Find the customer to get userId
      const customer = kycUsers.find(user => user._id === customerId);
      if (!customer) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy thông tin khách hàng",
          variant: "destructive",
        });
        return;
      }

      const response = await updateKycStatus(customer.userId, isApproved, reason);
      
      // Remove from pending list if approved/rejected
      setKycUsers(prev => prev.filter(user => user._id !== customerId))
      setFilteredUsers(prev => prev.filter(user => user._id !== customerId))
      setTotalCount(prev => prev - 1)
      
      toast({
        title: isApproved ? "Xác thực thành công ✅" : "Đã từ chối xác thực ❌",
        description: response.message || (isApproved 
          ? "Khách hàng đã được xác thực và có thể thuê xe"
          : "Khách hàng cần cung cấp lại tài liệu")
      })
    } catch (error) {
      console.error('Update KYC status error:', error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái KYC. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  const handleRejectClick = (customerId: string) => {
    setCustomerToReject(customerId)
    setShowRejectDialog(true)
  }

  const handleRejectConfirm = async () => {
    if (customerToReject) {
      await handleVerifyCustomer(customerToReject, false, rejectionReason)
      setShowRejectDialog(false)
      setRejectionReason('')
      setCustomerToReject(null)
    }
  }

  const handleFileUpload = async (file: File, userId: string, type: 'front' | 'back' | 'license') => {
    if (!file) return;

    setUploadingFor(userId)
    setUploadType(type)

    try {
      let response;
      switch (type) {
        case 'front':
          response = await staffUploadIdentityCardFront(userId, file)
          break;
        case 'back':
          response = await staffUploadIdentityCardBack(userId, file)
          break;
        case 'license':
          response = await staffUploadLicense(userId, file)
          break;
      }

      toast({
        title: "Upload thành công ✅",
        description: response.message,
      })

      // Refresh the KYC list to get updated data
      loadPendingKyc()
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Lỗi upload",
        description: "Không thể tải lên tài liệu. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setUploadingFor(null)
      setUploadType(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Xác thực KYC</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kiểm tra và xác thực thông tin khách hàng - 
            <Badge variant="secondary" className="ml-1">
              {filteredUsers.length}/{totalCount} yêu cầu đang chờ
            </Badge>
          </p>
        </div>
        <Button 
          onClick={loadPendingKyc}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Tìm kiếm theo tên, email, CCCD, GPLX..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCriteria} onValueChange={setFilterCriteria}>
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Lọc theo tiêu chí" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả yêu cầu</SelectItem>
            <SelectItem value="low_accuracy">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                Độ chính xác thấp (&lt;85%)
              </div>
            </SelectItem>
            <SelectItem value="name_mismatch">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                Tên không khớp
              </div>
            </SelectItem>
            <SelectItem value="incomplete_docs">Tài liệu thiếu</SelectItem>
            <SelectItem value="recent">Gửi trong 24h</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-end">
          Hiển thị {filteredUsers.length} trong tổng số {totalCount} yêu cầu
        </div>
      </div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <span>Tải lên tài liệu cho khách hàng</span>
            </CardTitle>
            <CardDescription>
              Staff có thể tải lên tài liệu thay cho khách hàng khi cần thiết
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">CCCD mặt trước</p>
                <Input 
                  type="file" 
                  accept="image/*" 
                  className="max-w-xs mx-auto" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    const userId = prompt("Nhập userId của khách hàng:");
                    if (file && userId) {
                      handleFileUpload(file, userId, 'front');
                    }
                  }}
                  disabled={uploadingFor !== null}
                />
                {uploadingFor && uploadType === 'front' && (
                  <p className="text-sm text-blue-600 mt-2">Đang tải lên...</p>
                )}
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">CCCD mặt sau</p>
                <Input 
                  type="file" 
                  accept="image/*" 
                  className="max-w-xs mx-auto"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    const userId = prompt("Nhập userId của khách hàng:");
                    if (file && userId) {
                      handleFileUpload(file, userId, 'back');
                    }
                  }}
                  disabled={uploadingFor !== null}
                />
                {uploadingFor && uploadType === 'back' && (
                  <p className="text-sm text-blue-600 mt-2">Đang tải lên...</p>
                )}
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">Giấy phép lái xe (GPLX)</p>
                <Input 
                  type="file" 
                  accept="image/*" 
                  className="max-w-xs mx-auto"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    const userId = prompt("Nhập userId của khách hàng:");
                    if (file && userId) {
                      handleFileUpload(file, userId, 'license');
                    }
                  }}
                  disabled={uploadingFor !== null}
                />
                {uploadingFor && uploadType === 'license' && (
                  <p className="text-sm text-blue-600 mt-2">Đang tải lên...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KYC Pending List */}
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Đang tải danh sách KYC...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-300">
            {kycUsers.length === 0 ? 
              "Không có yêu cầu KYC nào đang chờ xử lý" : 
              "Không tìm thấy yêu cầu KYC nào khớp với bộ lọc"}
          </p>
          {kycUsers.length > 0 && filteredUsers.length === 0 && (
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={() => {
                setSearchTerm('')
                setFilterCriteria('all')
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((customer, index) => {
            // Calculate risk indicators
            const idAccuracy = customer.identityOcr?.front?.overall_score ? parseFloat(customer.identityOcr.front.overall_score) : 100
            const licenseAccuracy = customer.licenseOcr?.front?.overall_score ? parseFloat(customer.licenseOcr.front.overall_score) : 100
            const hasNameMismatch = customer.identityName && customer.licenseName && customer.identityName !== customer.licenseName
            const hasIncompleteDoc = !customer.identityCardFrontUploaded || !customer.identityCardBackUploaded || !customer.licenseFrontUploaded
            const isLowAccuracy = idAccuracy < 85 || licenseAccuracy < 85

            return (
            <motion.div
              key={customer._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {customer.fullname ? customer.fullname.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{customer.fullname || 'N/A'}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email || 'N/A'}</p>
                      </div>
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.5 + index * 0.1 }}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full text-xs">
                          <XCircle className="h-3 w-3" />
                          <span>Chờ duyệt KYC</span>
                        </div>
                        {(hasNameMismatch || hasIncompleteDoc || isLowAccuracy) && (
                          <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Cần kiểm tra</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">CCCD:</span>
                    <span className="font-medium">{customer.identityCard || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Số GPLX:</span>
                    <span className="font-medium">{customer.licenseNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Họ tên CCCD:</span>
                    <span className="font-medium text-xs">{customer.identityName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Ngày sinh:</span>
                    <span className="font-medium">{customer.identityDob || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Hạng GPLX:</span>
                    <span className="font-medium">
                      {customer.licenseClass ? (
                        <Badge variant="outline" className="text-xs">{customer.licenseClass}</Badge>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Ngày gửi:</span>
                    <span className="font-medium">{customer.lastKycAt ? new Date(customer.lastKycAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
                  </div>
                  
                  {/* OCR Accuracy Indicators */}
                  {customer.identityOcr?.front?.overall_score && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Độ chính xác OCR:</span>
                      <div className="flex items-center gap-1">
                        <span className={`font-medium text-xs ${
                          parseFloat(customer.identityOcr.front.overall_score) >= 95 ? 'text-green-600' :
                          parseFloat(customer.identityOcr.front.overall_score) >= 85 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {customer.identityOcr.front.overall_score}%
                        </span>
                        {parseFloat(customer.identityOcr.front.overall_score) < 85 && (
                          <Badge variant="destructive" className="text-xs">Cần kiểm tra</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Document Completeness */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tài liệu:</span>
                    <div className="flex gap-1">
                      <Badge variant={customer.identityCardFrontUploaded ? "default" : "secondary"} className="text-xs">
                        CCCD trước
                      </Badge>
                      <Badge variant={customer.identityCardBackUploaded ? "default" : "secondary"} className="text-xs">
                        CCCD sau
                      </Badge>
                      <Badge variant={customer.licenseFrontUploaded ? "default" : "secondary"} className="text-xs">
                        GPLX
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Thông tin KYC: {selectedCustomer?.fullname}</DialogTitle>
                        <DialogDescription>
                          Kiểm tra và xác thực thông tin khách hàng
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedCustomer && (
                        <div className="space-y-4 py-4">
                          {/* Data Verification Status */}
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Trạng thái xác thực dữ liệu
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Độ chính xác CCCD:</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`font-medium ${
                                    selectedCustomer.identityOcr?.front?.overall_score && 
                                    parseFloat(selectedCustomer.identityOcr.front.overall_score) >= 95 ? 'text-green-600' :
                                    selectedCustomer.identityOcr?.front?.overall_score && 
                                    parseFloat(selectedCustomer.identityOcr.front.overall_score) >= 85 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {selectedCustomer.identityOcr?.front?.overall_score || 'N/A'}%
                                  </span>
                                  {selectedCustomer.identityOcr?.front?.overall_score && 
                                   parseFloat(selectedCustomer.identityOcr.front.overall_score) < 85 && (
                                    <Badge variant="destructive" className="text-xs">Kiểm tra thủ công</Badge>
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Độ chính xác GPLX:</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`font-medium ${
                                    selectedCustomer.licenseOcr?.front?.overall_score && 
                                    parseFloat(selectedCustomer.licenseOcr.front.overall_score) >= 95 ? 'text-green-600' :
                                    selectedCustomer.licenseOcr?.front?.overall_score && 
                                    parseFloat(selectedCustomer.licenseOcr.front.overall_score) >= 85 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {selectedCustomer.licenseOcr?.front?.overall_score || 'N/A'}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Data Inconsistencies Warning */}
                            {(selectedCustomer.identityName !== selectedCustomer.licenseName && 
                              selectedCustomer.identityName && selectedCustomer.licenseName) && (
                              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                                  <XCircle className="h-4 w-4" />
                                  <span className="font-medium text-sm">Cảnh báo: Tên không khớp</span>
                                </div>
                                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                  Tên trên CCCD: <strong>{selectedCustomer.identityName}</strong> | 
                                  Tên trên GPLX: <strong>{selectedCustomer.licenseName}</strong>
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Information Cards */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* CCCD Information */}
                            <Card className="p-4">
                              <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400">Thông tin CCCD</h4>
                              <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Số CCCD:</span>
                                  <span className="col-span-2 font-medium break-all">{selectedCustomer.identityCard}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Họ tên:</span>
                                  <span className="col-span-2 font-medium">{selectedCustomer.identityName || selectedCustomer.fullname}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Ngày sinh:</span>
                                  <span className="col-span-2 font-medium">{selectedCustomer.identityDob}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Giới tính:</span>
                                  <span className="col-span-2 font-medium">{selectedCustomer.identitySex}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Quốc tích:</span>
                                  <span className="col-span-2 font-medium">{selectedCustomer.identityNationality}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Địa chỉ:</span>
                                  <span className="col-span-2 font-medium text-xs leading-relaxed">{selectedCustomer.identityAddress}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Ngày cấp:</span>
                                  <span className="col-span-2 font-medium">{selectedCustomer.identityIssueDate}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Nơi cấp:</span>
                                  <span className="col-span-2 font-medium text-xs leading-relaxed">{selectedCustomer.identityIssueLoc}</span>
                                </div>
                                {selectedCustomer.identityFeatures && (
                                  <div className="grid grid-cols-3 gap-2">
                                    <span className="text-gray-600 dark:text-gray-400">Đặc điểm:</span>
                                    <span className="col-span-2 font-medium text-xs leading-relaxed">{selectedCustomer.identityFeatures}</span>
                                  </div>
                                )}
                              </div>
                            </Card>
                            
                            {/* GPLX Information */}
                            <Card className="p-4">
                              <h4 className="font-medium mb-3 text-green-600 dark:text-green-400">Thông tin GPLX</h4>
                              <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Số GPLX:</span>
                                  <span className="col-span-2 font-medium">{selectedCustomer.licenseNumber}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Họ tên:</span>
                                  <span className="col-span-2 font-medium">{selectedCustomer.licenseName}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Ngày sinh:</span>
                                  <span className="col-span-2 font-medium">{selectedCustomer.licenseDob}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Hạng GPLX:</span>
                                  <div className="col-span-2 flex gap-1 flex-wrap">
                                    {selectedCustomer.licenseClass && (
                                      <Badge variant="outline" className="text-xs">{selectedCustomer.licenseClass}</Badge>
                                    )}
                                    {selectedCustomer.licenseClassList?.map((cls, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">{cls}</Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Địa chỉ:</span>
                                  <span className="col-span-2 font-medium text-xs leading-relaxed">{selectedCustomer.licenseAddress}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Nơi cấp:</span>
                                  <span className="col-span-2 font-medium text-xs leading-relaxed">{selectedCustomer.licensePlaceIssue}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-gray-600 dark:text-gray-400">Ngày cấp:</span>
                                  <span className="col-span-2 font-medium">{selectedCustomer.licenseIssueDate}</span>
                                </div>
                              </div>
                            </Card>
                          </div>
                            
                          {/* Document Images */}
                          <div>
                            <h4 className="font-medium mb-3">Tài liệu đã tải lên</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">CCCD mặt trước</span>
                                  {selectedCustomer.identityCardFrontUploaded ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                {selectedCustomer.identityCardFrontImage && (
                                  <img 
                                    src={selectedCustomer.identityCardFrontImage} 
                                    alt="CCCD mặt trước" 
                                    className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(selectedCustomer.identityCardFrontImage, '_blank')}
                                  />
                                )}
                              </Card>
                              <Card className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">CCCD mặt sau</span>
                                  {selectedCustomer.identityCardBackUploaded ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                {selectedCustomer.identityCardBackImage && (
                                  <img 
                                    src={selectedCustomer.identityCardBackImage} 
                                    alt="CCCD mặt sau" 
                                    className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(selectedCustomer.identityCardBackImage, '_blank')}
                                  />
                                )}
                              </Card>
                              <Card className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Giấy phép lái xe</span>
                                  {selectedCustomer.licenseFrontUploaded ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                {selectedCustomer.licenseImage && (
                                  <img 
                                    src={selectedCustomer.licenseImage} 
                                    alt="GPLX" 
                                    className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(selectedCustomer.licenseImage, '_blank')}
                                  />
                                )}
                              </Card>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              onClick={() => handleVerifyCustomer(selectedCustomer._id, true)}
                              className="flex-1 bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Duyệt KYC
                            </Button>
                            <Button
                              onClick={() => handleRejectClick(selectedCustomer._id)}
                              variant="destructive"
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Từ chối
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleVerifyCustomer(customer._id, true)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Duyệt
                    </Button>
                    <Button
                      onClick={() => handleRejectClick(customer._id)}
                      size="sm"
                      variant="destructive"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Từ chối
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
            )
          })}
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối xác thực KYC</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để khách hàng biết cách khắc phục
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Lý do từ chối:</label>
              <Textarea
                placeholder="Ví dụ: Hình ảnh CCCD không rõ nét, thông tin không khớp..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionReason('')
                setCustomerToReject(null)
              }}
            >
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}