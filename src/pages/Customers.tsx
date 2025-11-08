import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle, XCircle, Eye, UserCheck, RefreshCw, Search, Filter, AlertTriangle, Users, UserX, Clock, ArrowUpDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { getPendingKyc, updateKycStatus, staffUploadIdentityCardFront, staffUploadIdentityCardBack, staffUploadLicense, staffUploadLicenseFront, staffUploadLicenseBack, getUsersNotSubmittedKyc, getCompletedKyc, type PendingKycUser, type UserNotSubmittedKyc, type CompletedKycUser } from '@/api/kyc'
import { TablePagination } from '@/components/ui/table-pagination'

export function Customers() {
  // KYC Pending states
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
  const [uploadType, setUploadType] = useState<'front' | 'back' | 'license' | 'license-front' | 'license-back' | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  
  // Selected files (not yet uploaded) - thêm state để lưu file đã chọn
  const [selectedFiles, setSelectedFiles] = useState<{
    front: File | null
    back: File | null
    'license-front': File | null
    'license-back': File | null
  }>({
    front: null,
    back: null,
    'license-front': null,
    'license-back': null
  })

  // Pagination for KYC Pending (client-side) - hiển thị 6 cards mỗi trang
  const [pendingPage, setPendingPage] = useState(1)
  const [pendingLimit, setPendingLimit] = useState(6)
  
  const handlePendingItemsPerPageChange = (newLimit: number) => {
    setPendingLimit(newLimit);
    setPendingPage(1);
  };

  // Users Not Submitted KYC states
  const [notSubmittedUsers, setNotSubmittedUsers] = useState<UserNotSubmittedKyc[]>([])
  const [notSubmittedLoading, setNotSubmittedLoading] = useState(false)
  const [notSubmittedSearch, setNotSubmittedSearch] = useState('')
  const [notSubmittedKycStatus, setNotSubmittedKycStatus] = useState<'all' | 'not_submitted' | 'rejected'>('all')
  const [notSubmittedSortBy, setNotSubmittedSortBy] = useState<'createdAt' | 'lastLoginAt' | 'fullname'>('createdAt')
  const [notSubmittedSortOrder, setNotSubmittedSortOrder] = useState<'asc' | 'desc'>('desc')
  const [notSubmittedPagination, setNotSubmittedPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [notSubmittedStats, setNotSubmittedStats] = useState({
    total: 0,
    notSubmitted: 0,
    rejected: 0
  })
  const [selectedUserForUpload, setSelectedUserForUpload] = useState<UserNotSubmittedKyc | null>(null)
  const [showUserInfoDialog, setShowUserInfoDialog] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showCustomerDetailDialog, setShowCustomerDetailDialog] = useState(false)

  // Tab management
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedUserIdForUpload, setSelectedUserIdForUpload] = useState<string | null>(null)

  // Completed KYC states
  const [completedKycUsers, setCompletedKycUsers] = useState<CompletedKycUser[]>([])
  const [completedLoading, setCompletedLoading] = useState(false)
  const [completedSearch, setCompletedSearch] = useState('')
  const [completedSortBy, setCompletedSortBy] = useState<'approvedAt' | 'lastUpdatedAt' | 'identityName' | 'identityCard' | 'licenseNumber'>('approvedAt')
  const [completedSortOrder, setCompletedSortOrder] = useState<'asc' | 'desc'>('desc')
  const [completedPagination, setCompletedPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 20
  })
  const [completedStats, setCompletedStats] = useState({
    approved: 0,
    rejected: 0,
    pending: 0,
    total: 0
  })
  
  // Pagination for Not Submitted tab (client-side) - hiển thị 6 cards mỗi trang
  const [notSubmittedPageClient, setNotSubmittedPageClient] = useState(1)
  const [notSubmittedLimitClient, setNotSubmittedLimitClient] = useState(6)
  
  const handleNotSubmittedItemsPerPageChange = (newLimit: number) => {
    setNotSubmittedLimitClient(newLimit);
    setNotSubmittedPageClient(1);
  };

  const { toast } = useToast()

  // Navigate to KYC pending tab with User ID
  const handleNavigateToKycPending = (userId: string) => {
    setSelectedUserIdForUpload(userId)
    setActiveTab('pending')
    setShowUserInfoDialog(false)
    toast({
      title: "✅ Đã chuyển tab",
      description: "Đã chuyển sang tab KYC Đang chờ duyệt với User ID đã chọn",
      duration: 3000,
    })
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setShowImageModal(true)
  }

  // Handle file selection (chỉ lưu file, chưa upload)
  const handleFileSelect = (file: File, type: 'front' | 'back' | 'license-front' | 'license-back') => {
    if (!selectedUserIdForUpload) {
      setActiveTab('not-submitted');
      toast({
        title: "⚠️ Chưa chọn user",
        description: "Vui lòng chọn user từ tab 'Chưa submit KYC' trước khi chọn tài liệu",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file
    }));
    
    toast({
      title: "✅ Đã chọn file",
      description: "Bấm nút 'Upload ảnh' để tải lên",
      duration: 3000,
    });
  }

  // Handle upload with selected file
  const handleUploadSelectedFile = async (type: 'front' | 'back' | 'license-front' | 'license-back') => {
    const file = selectedFiles[type];
    
    if (!file) {
      toast({
        title: "⚠️ Chưa chọn file",
        description: "Vui lòng chọn file trước khi upload",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (!selectedUserIdForUpload) {
      toast({
        title: "⚠️ Chưa chọn user",
        description: "Vui lòng chọn user trước khi upload",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    await handleFileUpload(file, selectedUserIdForUpload, type);
    
    // Clear selected file after successful upload
    setSelectedFiles(prev => ({
      ...prev,
      [type]: null
    }));
  }

  // Load completed KYC requests
  const loadCompletedKyc = useCallback(async () => {
    setCompletedLoading(true)
    try {
      const response = await getCompletedKyc({
        page: completedPagination.currentPage,
        limit: completedPagination.itemsPerPage,
        search: completedSearch || undefined,
        sortBy: completedSortBy,
        sortOrder: completedSortOrder
      })
      
      setCompletedKycUsers(response.data.kycs)
      setCompletedPagination(response.data.pagination)
      setCompletedStats(response.data.stats)
      
    } catch (error: unknown) {
      console.error('Completed KYC API Error:', error)
      setCompletedKycUsers([])
      const errorMessage = (error as {response?: {data?: {message?: string}}, message?: string})?.response?.data?.message || 
                          (error as Error)?.message || 
                          'Lỗi khi tải danh sách KYC đã duyệt'
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setCompletedLoading(false)
    }
  }, [completedPagination.currentPage, completedPagination.itemsPerPage, completedSearch, completedSortBy, completedSortOrder, toast])

  const handleCompletedSearch = () => {
    setCompletedPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handleCompletedItemsPerPageChange = (newLimit: number) => {
    setCompletedPagination(prev => ({ 
      ...prev, 
      itemsPerPage: newLimit, 
      currentPage: 1 
    }))
  }

  // Load users who haven't submitted KYC
  const loadUsersNotSubmittedKyc = useCallback(async () => {
    setNotSubmittedLoading(true)
    try {
      const response = await getUsersNotSubmittedKyc({
        page: notSubmittedPagination.page,
        limit: notSubmittedPagination.limit,
        search: notSubmittedSearch || undefined,
        kycStatus: notSubmittedKycStatus,
        sortBy: notSubmittedSortBy,
        sortOrder: notSubmittedSortOrder
      })
      
      setNotSubmittedUsers(response.data.users)
      setNotSubmittedPagination(response.data.pagination)
      setNotSubmittedStats(response.data.stats)
      
    } catch (error: unknown) {
      console.error('Users Not Submitted KYC API Error:', error)
      setNotSubmittedUsers([])
      const errorMessage = (error as {response?: {data?: {message?: string}}, message?: string})?.response?.data?.message || 
                          (error as Error)?.message || 
                          'Lỗi khi tải danh sách users chưa submit KYC'
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setNotSubmittedLoading(false)
    }
  }, [notSubmittedPagination.page, notSubmittedPagination.limit, notSubmittedSearch, notSubmittedKycStatus, notSubmittedSortBy, notSubmittedSortOrder, toast])

  const handleNotSubmittedSearch = () => {
    setNotSubmittedPagination(prev => ({ ...prev, page: 1 }))
  }

  useEffect(() => {
    loadUsersNotSubmittedKyc()
  }, [loadUsersNotSubmittedKyc])

  useEffect(() => {
    loadCompletedKyc()
  }, [loadCompletedKyc])

  // Load pending KYC requests
  const loadPendingKyc = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await getPendingKyc()
      setKycUsers(response.users || [])
      setFilteredUsers(response.users || [])
      setTotalCount(response.count || 0)
    } catch (error: unknown) {
      console.error('KYC API Error:', error)
      // Xử lý trường hợp API trả về 304 hoặc lỗi khác
      setKycUsers([])
      setFilteredUsers([])
      setTotalCount(0)
      const errorMessage = (error as {response?: {data?: {message?: string}}, message?: string})?.response?.data?.message || 
                          (error as Error)?.message || 
                          'Lỗi khi tải danh sách KYC'
      if (!errorMessage.includes('304')) {
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
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
          !user.licenseFrontUploaded ||
          !user.licenseBackUploaded
        )
        break
      case 'recent': {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        filtered = filtered.filter(user => {
          const userDate = new Date(user.lastUpdatedAt || user.lastKycAt || user.updatedAt)
          // Convert to UTC for comparison
          const userDateUTC = new Date(userDate.getTime() + userDate.getTimezoneOffset() * 60000)
          return userDateUTC > oneDayAgo
        })
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

  // Reset về trang 1 khi thay đổi filter/search
  useEffect(() => {
    setPendingPage(1)
  }, [filteredUsers.length])

  // Tính toán cards hiển thị cho trang hiện tại
  const paginatedFilteredUsers = useMemo(() => {
    const startIndex = (pendingPage - 1) * pendingLimit
    return filteredUsers.slice(startIndex, startIndex + pendingLimit)
  }, [filteredUsers, pendingPage, pendingLimit])

  const pendingTotalPages = Math.ceil(filteredUsers.length / pendingLimit) || 1

  const handlePendingPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pendingTotalPages) {
      setPendingPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Reset về trang 1 khi thay đổi filter/search cho Not Submitted tab
  useEffect(() => {
    setNotSubmittedPageClient(1)
  }, [notSubmittedUsers.length])

  // Tính toán cards hiển thị cho trang hiện tại (Not Submitted)
  const paginatedNotSubmittedUsers = useMemo(() => {
    const startIndex = (notSubmittedPageClient - 1) * notSubmittedLimitClient
    return notSubmittedUsers.slice(startIndex, startIndex + notSubmittedLimitClient)
  }, [notSubmittedUsers, notSubmittedPageClient, notSubmittedLimitClient])

  const notSubmittedTotalPagesClient = Math.ceil(notSubmittedUsers.length / notSubmittedLimitClient) || 1

  const handleNotSubmittedPageClientChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= notSubmittedTotalPagesClient) {
      setNotSubmittedPageClient(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleVerifyCustomer = async (customerId: string, isApproved: boolean, reason?: string) => {
    setIsVerifying(true);
    try {
      // Find the customer to get userId
      const customer = kycUsers.find(user => user._id === customerId);
      if (!customer) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy thông tin khách hàng",
          variant: "destructive",
          duration: 3000,
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
          : "Khách hàng cần cung cấp lại tài liệu"),
        duration: 3000,
      })
    } catch (error: unknown) {
      console.error('Update KYC status error:', error)
      const errorMessage = (error as {response?: {data?: {message?: string}}, message?: string})?.response?.data?.message || 
                          (error as Error)?.message || 
                          "Không thể cập nhật trạng thái KYC. Vui lòng thử lại."
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsVerifying(false);
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

  const handleFileUpload = async (file: File, userId: string, type: 'front' | 'back' | 'license' | 'license-front' | 'license-back') => {
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
        case 'license-front':
          response = await staffUploadLicenseFront(userId, file)
          break;
        case 'license-back':
          response = await staffUploadLicenseBack(userId, file)
          break;
      }

      toast({
        title: "Upload thành công ✅",
        description: response.message,
        duration: 3000,
      })

      // Refresh the KYC list to get updated data
      loadPendingKyc()
    } catch (error: unknown) {
      console.error('Upload error:', error)
      const errorMessage = (error as {response?: {data?: {message?: string}}, message?: string})?.response?.data?.message || 
                          (error as Error)?.message || 
                          "Không thể tải lên tài liệu. Vui lòng thử lại."
      toast({
        title: "Lỗi upload",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setUploadingFor(null)
      setUploadType(null)
    }
  }

  return (
    <>
      {/* Global Blocking Overlay - Block tất cả interaction bao gồm sidebar */}
      {(uploadingFor !== null || isVerifying) && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-[9999] flex items-center justify-center cursor-not-allowed"
          style={{ 
            pointerEvents: 'all'
          }}
        >
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4 max-w-md mx-4">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {uploadingFor !== null ? 'Đang upload ảnh...' : 'Đang xử lý...'}
            </p>
            {uploadingFor !== null && uploadType && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {uploadType === 'front' ? '🪪 CCCD mặt trước' :
                 uploadType === 'back' ? '🪪 CCCD mặt sau' :
                 uploadType === 'license-front' ? '🏍️ GPLX mặt trước' :
                 uploadType === 'license-back' ? '🏍️ GPLX mặt sau' : ''}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Vui lòng không đóng cửa sổ hoặc chuyển trang
            </p>
          </div>
        </div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý KYC</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Quản lý xác thực và theo dõi trạng thái KYC của khách hàng
            </p>
          </div>
        </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          // Block tab switching khi đang upload hoặc verify
          if (uploadingFor === null && !isVerifying) {
            setActiveTab(value);
          } else {
            toast({
              title: "⚠️ Đang xử lý",
              description: uploadingFor !== null 
                ? "Vui lòng đợi quá trình upload hoàn tất" 
                : "Vui lòng đợi quá trình xác thực hoàn tất",
              variant: "destructive",
              duration: 3000,
            });
          }
        }} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="pending" 
            className="flex items-center gap-2"
            disabled={uploadingFor !== null || isVerifying}
          >
            <UserCheck className="h-4 w-4" />
            KYC Đang chờ duyệt
            <Badge variant="secondary" className="ml-1">
              {filteredUsers.length}/{totalCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="flex items-center gap-2"
            disabled={uploadingFor !== null || isVerifying}
          >
            <CheckCircle className="h-4 w-4" />
            KYC Đã duyệt
            <Badge variant="default" className="ml-1">
              {completedStats.approved}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="not-submitted" 
            className="flex items-center gap-2"
            disabled={uploadingFor !== null || isVerifying}
          >
            <UserX className="h-4 w-4" />
            Chưa submit KYC
            <Badge variant="destructive" className="ml-1">
              {notSubmittedStats.total}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* KYC Pending Tab */}
        <TabsContent value="pending" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Xác thực KYC</h2>
            <Button 
              onClick={loadPendingKyc}
              disabled={isLoading || uploadingFor !== null || isVerifying}
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

          {/* Selected User ID Indicator */}
          {selectedUserIdForUpload && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          User đã chọn để upload:
                        </p>
                        <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                          {(() => {
                            const selectedUser = notSubmittedUsers.find(user => user.id === selectedUserIdForUpload);
                            return selectedUser ? (selectedUser.fullname || selectedUser.email || 'N/A') : selectedUserIdForUpload;
                          })()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUserIdForUpload(null)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* CCCD Front */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    {selectedFiles.front ? (
                      // Preview ảnh đã chọn
                      <div className="space-y-3">
                        <img 
                          src={URL.createObjectURL(selectedFiles.front)} 
                          alt="CCCD mặt trước preview" 
                          className="w-full h-32 object-cover rounded-lg border-2 border-blue-400"
                        />
                        <p className="text-sm font-medium text-blue-600">✅ Đã chọn file</p>
                        <p className="text-xs text-gray-500 truncate">{selectedFiles.front.name}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUploadSelectedFile('front')}
                            disabled={uploadingFor !== null}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            {uploadingFor && uploadType === 'front' ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Đang upload...
                              </>
                            ) : (
                              <>
                                <Upload className="h-3 w-3 mr-1" />
                                Upload ảnh
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedFiles(prev => ({ ...prev, front: null }))}
                            disabled={uploadingFor !== null}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Chọn file
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-1 font-semibold">🪪 CCCD</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">Mặt trước</p>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="max-w-xs mx-auto"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileSelect(file, 'front');
                            }
                          }}
                          disabled={uploadingFor !== null}
                        />
                      </>
                    )}
                  </div>

                  {/* CCCD Back */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    {selectedFiles.back ? (
                      // Preview ảnh đã chọn
                      <div className="space-y-3">
                        <img 
                          src={URL.createObjectURL(selectedFiles.back)} 
                          alt="CCCD mặt sau preview" 
                          className="w-full h-32 object-cover rounded-lg border-2 border-blue-400"
                        />
                        <p className="text-sm font-medium text-blue-600">✅ Đã chọn file</p>
                        <p className="text-xs text-gray-500 truncate">{selectedFiles.back.name}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUploadSelectedFile('back')}
                            disabled={uploadingFor !== null}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            {uploadingFor && uploadType === 'back' ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Đang upload...
                              </>
                            ) : (
                              <>
                                <Upload className="h-3 w-3 mr-1" />
                                Upload ảnh
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedFiles(prev => ({ ...prev, back: null }))}
                            disabled={uploadingFor !== null}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Chọn file
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-1 font-semibold">🪪 CCCD</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">Mặt sau</p>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="max-w-xs mx-auto"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileSelect(file, 'back');
                            }
                          }}
                          disabled={uploadingFor !== null}
                        />
                      </>
                    )}
                  </div>

                  {/* License Front */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                    {selectedFiles['license-front'] ? (
                      // Preview ảnh đã chọn
                      <div className="space-y-3">
                        <img 
                          src={URL.createObjectURL(selectedFiles['license-front'])} 
                          alt="GPLX mặt trước preview" 
                          className="w-full h-32 object-cover rounded-lg border-2 border-purple-400"
                        />
                        <p className="text-sm font-medium text-purple-600">✅ Đã chọn file</p>
                        <p className="text-xs text-gray-500 truncate">{selectedFiles['license-front'].name}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUploadSelectedFile('license-front')}
                            disabled={uploadingFor !== null}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                          >
                            {uploadingFor && uploadType === 'license-front' ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Đang upload...
                              </>
                            ) : (
                              <>
                                <Upload className="h-3 w-3 mr-1" />
                                Upload ảnh
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedFiles(prev => ({ ...prev, 'license-front': null }))}
                            disabled={uploadingFor !== null}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Chọn file
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-1 font-semibold">🏍️ GPLX</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">Mặt trước</p>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="max-w-xs mx-auto"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileSelect(file, 'license-front');
                            }
                          }}
                          disabled={uploadingFor !== null}
                        />
                      </>
                    )}
                  </div>

                  {/* License Back */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                    {selectedFiles['license-back'] ? (
                      // Preview ảnh đã chọn
                      <div className="space-y-3">
                        <img 
                          src={URL.createObjectURL(selectedFiles['license-back'])} 
                          alt="GPLX mặt sau preview" 
                          className="w-full h-32 object-cover rounded-lg border-2 border-purple-400"
                        />
                        <p className="text-sm font-medium text-purple-600">✅ Đã chọn file</p>
                        <p className="text-xs text-gray-500 truncate">{selectedFiles['license-back'].name}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUploadSelectedFile('license-back')}
                            disabled={uploadingFor !== null}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                          >
                            {uploadingFor && uploadType === 'license-back' ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Đang upload...
                              </>
                            ) : (
                              <>
                                <Upload className="h-3 w-3 mr-1" />
                                Upload ảnh
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedFiles(prev => ({ ...prev, 'license-back': null }))}
                            disabled={uploadingFor !== null}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Chọn file
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-1 font-semibold">🏍️ GPLX</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">Mặt sau</p>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="max-w-xs mx-auto"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileSelect(file, 'license-back');
                            }
                          }}
                          disabled={uploadingFor !== null}
                        />
                      </>
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
              {paginatedFilteredUsers.map((customer, index) => {
                // Calculate risk indicators
                const idAccuracy = customer.identityOcr?.front?.overall_score ? parseFloat(customer.identityOcr.front.overall_score) : 100
                const licenseAccuracy = customer.licenseOcr?.front?.overall_score ? parseFloat(customer.licenseOcr.front.overall_score) : 100
                const hasNameMismatch = customer.identityName && customer.licenseName && customer.identityName !== customer.licenseName
                const hasIncompleteDoc = !customer.identityCardFrontUploaded || !customer.identityCardBackUploaded || !customer.licenseFrontUploaded || !customer.licenseBackUploaded
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
                            {(customer.fullname || customer.identityName || customer.email)?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{customer.fullname || customer.identityName || customer.email || 'N/A'}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email || ''}</p>
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
                        <span className="text-gray-600 dark:text-gray-400">Giới tính:</span>
                        <span className="font-medium">
                          {customer.identitySex || customer.identityOcr?.front?.sex || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Quốc tịch:</span>
                        <span className="font-medium text-xs">
                          {customer.identityNationality || customer.identityOcr?.front?.nationality || 'N/A'}
                        </span>
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
                        <span className="font-medium">{(customer.lastUpdatedAt || customer.lastKycAt || customer.updatedAt) ? new Date(customer.lastUpdatedAt || customer.lastKycAt || customer.updatedAt).toLocaleDateString('vi-VN', { timeZone: 'UTC' }) : 'N/A'}</span>
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
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant={customer.identityCardFrontUploaded ? "default" : "secondary"} className="text-xs">
                            CCCD trước
                          </Badge>
                          <Badge variant={customer.identityCardBackUploaded ? "default" : "secondary"} className="text-xs">
                            CCCD sau
                          </Badge>
                          <Badge variant={customer.licenseFrontUploaded ? "default" : "secondary"} className="text-xs">
                            GPLX trước
                          </Badge>
                          <Badge variant={customer.licenseBackUploaded ? "default" : "secondary"} className="text-xs">
                            GPLX sau
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
                                      <span className="col-span-2 font-medium">
                                        {selectedCustomer.identitySex || selectedCustomer.identityOcr?.front?.sex || 'N/A'}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <span className="text-gray-600 dark:text-gray-400">Quốc tịch:</span>
                                      <span className="col-span-2 font-medium">
                                        {selectedCustomer.identityNationality || selectedCustomer.identityOcr?.front?.nationality || 'N/A'}
                                      </span>
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
                                    {selectedCustomer.identityHome && (
                                      <div className="grid grid-cols-3 gap-2">
                                        <span className="text-gray-600 dark:text-gray-400">Quê quán:</span>
                                        <span className="col-span-2 font-medium text-xs leading-relaxed">{selectedCustomer.identityHome}</span>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <Card className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">CCCD mặt trước</span>
                                      {selectedCustomer.identityCardFrontUploaded && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      )}
                                    </div>
                                    {selectedCustomer.identityCardFrontImage && (
                                      <img 
                                        src={selectedCustomer.identityCardFrontImage} 
                                        alt="CCCD mặt trước" 
                                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => handleImageClick(selectedCustomer.identityCardFrontImage)}
                                      />
                                    )}
                                  </Card>
                                  <Card className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">CCCD mặt sau</span>
                                      {selectedCustomer.identityCardBackUploaded && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      )}
                                    </div>
                                    {selectedCustomer.identityCardBackImage && (
                                      <img 
                                        src={selectedCustomer.identityCardBackImage} 
                                        alt="CCCD mặt sau" 
                                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => handleImageClick(selectedCustomer.identityCardBackImage)}
                                      />
                                    )}
                                  </Card>
                                  <Card className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">GPLX mặt trước</span>
                                      {selectedCustomer.licenseFrontUploaded && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      )}
                                    </div>
                                    {selectedCustomer.licenseImage && (
                                      <img 
                                        src={selectedCustomer.licenseImage} 
                                        alt="GPLX mặt trước" 
                                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => handleImageClick(selectedCustomer.licenseImage)}
                                      />
                                    )}
                                  </Card>
                                  <Card className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">GPLX mặt sau</span>
                                      {selectedCustomer.licenseBackUploaded && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      )}
                                    </div>
                                    {selectedCustomer.licenseBackImage && (
                                      <img 
                                        src={selectedCustomer.licenseBackImage} 
                                        alt="GPLX mặt sau" 
                                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => handleImageClick(selectedCustomer.licenseBackImage)}
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
                                  disabled={isVerifying}
                                >
                                  {isVerifying ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Đang xử lý...
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Duyệt KYC
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={() => handleRejectClick(selectedCustomer._id)}
                                  variant="destructive"
                                  className="flex-1"
                                  disabled={isVerifying}
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
                          disabled={isVerifying}
                        >
                          {isVerifying ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Duyệt
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleRejectClick(customer._id)}
                          size="sm"
                          variant="destructive"
                          disabled={isVerifying}
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

          {/* Phân trang KYC Pending */}
          {filteredUsers.length > 0 && (
            <Card className="border-0 shadow-lg mt-6">
              <CardContent className="p-4">
                <TablePagination
                  currentPage={pendingPage}
                  totalItems={filteredUsers.length}
                  itemsPerPage={pendingLimit}
                  onPageChange={handlePendingPageChange}
                  onItemsPerPageChange={handlePendingItemsPerPageChange}
                  disabled={isLoading}
                  itemsPerPageOptions={[5, 10, 20, 50]}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Not Submitted KYC Tab */}
        <TabsContent value="not-submitted" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserX className="h-6 w-6 text-red-500" />
                  Users chưa xác thực KYC
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Theo dõi và hỗ trợ users hoàn thiện hồ sơ KYC
                </p>
              </div>
              <Button 
                onClick={loadUsersNotSubmittedKyc}
                disabled={notSubmittedLoading || uploadingFor !== null || isVerifying}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${notSubmittedLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>

            {/* Stats Cards with Animation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">Chưa submit</p>
                        <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{notSubmittedStats.notSubmitted}</p>
                      </div>
                      <div className="p-4 bg-yellow-500 rounded-full shadow-lg">
                        <Clock className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Bị từ chối</p>
                        <p className="text-3xl font-bold text-red-900 dark:text-red-100">{notSubmittedStats.rejected}</p>
                      </div>
                      <div className="p-4 bg-red-500 rounded-full shadow-lg">
                        <XCircle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Search and Filter Controls - Enhanced */}
            <Card className="border-0 shadow-lg mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                    <Input
                      placeholder="Tìm kiếm email, tên, SĐT..."
                      value={notSubmittedSearch}
                      onChange={(e) => setNotSubmittedSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNotSubmittedSearch()}
                      className="pl-10 border-2 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  <Select value={notSubmittedKycStatus} onValueChange={(value) => setNotSubmittedKycStatus(value as 'all' | 'not_submitted' | 'rejected')}>
                    <SelectTrigger className="border-2 focus:border-blue-500">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Trạng thái KYC" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          Tất cả trạng thái
                        </div>
                      </SelectItem>
                      <SelectItem value="not_submitted">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          Chưa submit
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Bị từ chối
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={notSubmittedSortBy} onValueChange={(value) => setNotSubmittedSortBy(value as 'createdAt' | 'lastLoginAt' | 'fullname')}>
                    <SelectTrigger className="border-2 focus:border-blue-500">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">📅 Ngày đăng ký</SelectItem>
                      <SelectItem value="lastLoginAt">🕐 Lần đăng nhập cuối</SelectItem>
                      <SelectItem value="fullname">👤 Tên</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={notSubmittedSortOrder} onValueChange={(value) => setNotSubmittedSortOrder(value as 'asc' | 'desc')}>
                    <SelectTrigger className="border-2 focus:border-blue-500">
                      <SelectValue placeholder="Thứ tự" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">⬇️ Giảm dần</SelectItem>
                      <SelectItem value="asc">⬆️ Tăng dần</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            {notSubmittedLoading ? (
              <div className="text-center py-16">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-lg text-gray-600 dark:text-gray-300">Đang tải danh sách users...</p>
              </div>
            ) : notSubmittedUsers.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="text-center py-16">
                  <UserX className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    Không tìm thấy user nào
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Thử điều chỉnh bộ lọc hoặc tìm kiếm
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedNotSubmittedUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                    >
                      <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                        {/* Header with gradient */}
                        <div className={`h-2 ${user.kycStatus === 'rejected' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-yellow-500 to-orange-500'}`} />
                        
                        <CardContent className="p-6">
                          {/* User Info Header */}
                          <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                                user.kycStatus === 'rejected' 
                                  ? 'bg-gradient-to-br from-red-400 to-red-600' 
                                  : 'bg-gradient-to-br from-yellow-400 to-orange-600'
                              }`}>
                                {(user.fullname || user.email)?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">{user.fullname || user.email || 'N/A'}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{user.email || ''}</p>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="mb-4">
                            <Badge 
                              variant={user.kycStatus === 'rejected' ? 'destructive' : 'secondary'}
                              className="w-full justify-center py-2 text-sm font-medium"
                            >
                              {user.kycStatus === 'rejected' ? (
                                <><XCircle className="h-4 w-4 mr-1" /> Đã bị từ chối</>
                              ) : (
                                <><Clock className="h-4 w-4 mr-1" /> Chưa submit KYC</>
                              )}
                            </Badge>
                          </div>

                          {/* User Details */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                📱 SĐT:
                              </span>
                              <span className="font-semibold text-sm">{user.phone || 'Chưa có'}</span>
                            </div>

                            {user.createdAt && (
                              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                  📅 Đăng ký:
                                </span>
                                <span className="font-semibold text-sm">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            )}

                            {user.lastLoginAt && (
                              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                  🕐 Đăng nhập cuối:
                                </span>
                                <span className="font-semibold text-sm">{new Date(user.lastLoginAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            )}
                          </div>

                          {/* Document Status */}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">Trạng thái tài liệu:</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div className={`p-3 rounded-lg border-2 transition-all ${
                                user.kycInfo.identityUploaded 
                                  ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' 
                                  : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {user.kycInfo.identityUploaded ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span className="text-xs font-medium">CCCD</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {user.kycInfo.identityUploaded ? 'Đã tải lên' : 'Chưa có'}
                                </p>
                              </div>

                              <div className={`p-3 rounded-lg border-2 transition-all ${
                                user.kycInfo.licenseUploaded 
                                  ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' 
                                  : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {user.kycInfo.licenseUploaded ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span className="text-xs font-medium">GPLX</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {user.kycInfo.licenseUploaded ? 'Đã tải lên' : 'Chưa có'}
                                </p>
                              </div>
                            </div>

                            {user.kycInfo.staffUploaded && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2">
                                  <Upload className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                    Đã được staff hỗ trợ upload
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <Button
                            variant="outline"
                            className="w-full border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 transition-all"
                            onClick={() => {
                              setSelectedUserForUpload(user)
                              setShowUserInfoDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem thông tin & Upload
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Phân trang Chưa submit KYC */}
                {notSubmittedUsers.length > 0 && (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                      <TablePagination
                        currentPage={notSubmittedPageClient}
                        totalItems={notSubmittedUsers.length}
                        itemsPerPage={notSubmittedLimitClient}
                        onPageChange={handleNotSubmittedPageClientChange}
                        onItemsPerPageChange={handleNotSubmittedItemsPerPageChange}
                        disabled={notSubmittedLoading}
                        itemsPerPageOptions={[5, 10, 20, 50]}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Completed KYC Tab */}
        <TabsContent value="completed" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  KYC Đã duyệt
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Danh sách khách hàng đã được duyệt KYC thành công
                </p>
              </div>
              <Button 
                onClick={loadCompletedKyc}
                disabled={completedLoading || uploadingFor !== null || isVerifying}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${completedLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Đã duyệt</p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">{completedStats.approved}</p>
                      </div>
                      <div className="p-4 bg-green-500 rounded-full shadow-lg">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Bị từ chối</p>
                        <p className="text-3xl font-bold text-red-900 dark:text-red-100">{completedStats.rejected}</p>
                      </div>
                      <div className="p-4 bg-red-500 rounded-full shadow-lg">
                        <XCircle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">Đang chờ</p>
                        <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{completedStats.pending}</p>
                      </div>
                      <div className="p-4 bg-yellow-500 rounded-full shadow-lg">
                        <Clock className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Tổng cộng</p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{completedStats.total}</p>
                      </div>
                      <div className="p-4 bg-blue-500 rounded-full shadow-lg">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Search and Filter Controls */}
            <Card className="border-0 shadow-lg mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                    <Input
                      placeholder="Tìm kiếm theo tên, CCCD, GPLX..."
                      value={completedSearch}
                      onChange={(e) => setCompletedSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCompletedSearch()}
                      className="pl-10 border-2 focus:border-green-500 transition-colors"
                    />
                  </div>
                  
                  <Select value={completedSortBy} onValueChange={(value) => setCompletedSortBy(value as 'approvedAt' | 'lastUpdatedAt' | 'identityName' | 'identityCard' | 'licenseNumber')}>
                    <SelectTrigger className="border-2 focus:border-green-500">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approvedAt">📅 Ngày duyệt</SelectItem>
                      <SelectItem value="lastUpdatedAt">🕐 Cập nhật cuối</SelectItem>
                      <SelectItem value="identityName">👤 Tên CCCD</SelectItem>
                      <SelectItem value="identityCard">🪪 Số CCCD</SelectItem>
                      <SelectItem value="licenseNumber">🏍️ Số GPLX</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={completedSortOrder} onValueChange={(value) => setCompletedSortOrder(value as 'asc' | 'desc')}>
                    <SelectTrigger className="border-2 focus:border-green-500">
                      <SelectValue placeholder="Thứ tự" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">⬇️ Giảm dần</SelectItem>
                      <SelectItem value="asc">⬆️ Tăng dần</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleCompletedSearch}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Tìm kiếm
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Completed KYC List */}
            {completedLoading ? (
              <div className="text-center py-16">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-green-500" />
                <p className="text-lg text-gray-600 dark:text-gray-300">Đang tải danh sách KYC đã duyệt...</p>
              </div>
            ) : completedKycUsers.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="text-center py-16">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    Không có KYC nào đã duyệt
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Thử điều chỉnh bộ lọc hoặc tìm kiếm
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedKycUsers.map((kyc, index) => (
                    <motion.div
                      key={kyc._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                    >
                      <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                        {/* Header with gradient */}
                        <div className="h-2 bg-gradient-to-r from-green-500 to-green-600" />
                        
                        <CardContent className="p-6">
                          {/* User Info Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {kyc.identityName ? kyc.identityName.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">{kyc.identityName || kyc.userId?.email || 'N/A'}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{kyc.userId?.email || ''}</p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Đã duyệt
                            </Badge>
                          </div>

                          {/* KYC Details */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                🪪 CCCD:
                              </span>
                              <span className="font-semibold text-sm">{kyc.identityCard || 'N/A'}</span>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              🏍️ GPLX:
                              </span>
                              <span className="font-semibold text-sm">{kyc.licenseNumber || 'N/A'}</span>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                📅 Duyệt lúc:
                              </span>
                              <span className="font-semibold text-sm">
                                {kyc.approvedAt ? new Date(kyc.approvedAt).toLocaleDateString('vi-VN', { timeZone: 'UTC' }) : 'N/A'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                👤 Duyệt bởi:
                              </span>
                              <span className="font-semibold text-sm">{kyc.approvedBy?.fullname || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button
                            variant="outline"
                            className="w-full border-2 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-500 transition-all"
                            onClick={() => {
                              const convertedCustomer: PendingKycUser = {
                                _id: kyc._id,
                                userId: kyc.userId?._id || '',
                                email: kyc.userId?.email || '',
                                fullname: kyc.identityName,
                                status: kyc.status,
                                rejectionReason: '',
                                verificationMethod: '',
                                autoApproved: false,
                                identityCard: kyc.identityCard,
                                identityCardType: '',
                                identityCardFrontImage: kyc.identityCardFrontImage,
                                identityCardBackImage: kyc.identityCardBackImage,
                                identityCardFrontUploaded: !!kyc.identityCardFrontImage,
                                identityCardBackUploaded: !!kyc.identityCardBackImage,
                                identityName: kyc.identityName,
                                identityDob: kyc.identityDob,
                                identityHome: '',
                                identityAddress: kyc.identityAddress,
                                identitySex: kyc.identitySex,
                                identityNationality: kyc.identityNationality,
                                identityDoe: '',
                                identityIssueDate: kyc.identityIssueDate,
                                identityIssueLoc: kyc.identityIssueLoc,
                                identityFeatures: kyc.identityFeatures,
                                identityReligion: kyc.identityReligion,
                                identityEthnicity: kyc.identityEthnicity,
                                licenseNumber: kyc.licenseNumber,
                                licenseImage: kyc.licenseImage,
                                licenseBackImage: kyc.licenseBackImage,
                                licenseFrontUploaded: !!kyc.licenseImage,
                                licenseBackUploaded: !!kyc.licenseBackImage,
                                licenseUploaded: !!kyc.licenseImage,
                                licenseTypeOcr: '',
                                licenseName: kyc.licenseName,
                                licenseDob: kyc.licenseDob,
                                licenseNation: '',
                                licenseAddress: '',
                                licensePlaceIssue: '',
                                licenseIssueDate: '',
                                licenseClass: kyc.licenseClass,
                                licenseClassList: [],
                                lastUpdatedAt: kyc.lastUpdatedAt,
                                createdAt: '',
                                updatedAt: ''
                              }
                              setSelectedCustomer(convertedCustomer)
                              setShowCustomerDetailDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {completedKycUsers.length > 0 && completedPagination.totalItems > 0 && (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                      <TablePagination
                        currentPage={completedPagination.currentPage}
                        totalItems={completedPagination.totalItems}
                        itemsPerPage={completedPagination.itemsPerPage}
                        onPageChange={(page) => setCompletedPagination(prev => ({ ...prev, currentPage: page }))}
                        onItemsPerPageChange={handleCompletedItemsPerPageChange}
                        disabled={completedLoading}
                        itemsPerPageOptions={[5, 10, 20, 50]}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* User Info Dialog for Upload */}
      <Dialog open={showUserInfoDialog} onOpenChange={setShowUserInfoDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Users className="h-6 w-6 text-blue-600" />
              Thông tin User
            </DialogTitle>
            <DialogDescription>
              Xem thông tin chi tiết và upload tài liệu cho user
            </DialogDescription>
          </DialogHeader>
          
          {selectedUserForUpload && (
           <div className="space-y-6 py-4 overflow-y-auto flex-1">
              {/* User Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg ${
                  selectedUserForUpload.kycStatus === 'rejected' 
                    ? 'bg-gradient-to-br from-red-400 to-red-600' 
                    : 'bg-gradient-to-br from-blue-400 to-purple-600'
                }`}>
                  {(selectedUserForUpload.fullname || selectedUserForUpload.email)?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUserForUpload.fullname || selectedUserForUpload.email || 'N/A'}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUserForUpload.email || ''}</p>
                  <Badge 
                    variant={selectedUserForUpload.kycStatus === 'rejected' ? 'destructive' : 'secondary'}
                    className="mt-2"
                  >
                    {selectedUserForUpload.kycStatus === 'rejected' ? '❌ Đã bị từ chối' : '⏳ Chưa submit KYC'}
                  </Badge>
                </div>
              </div>

              {/* User Details */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">📱 Số điện thoại</p>
                    <p className="font-semibold">{selectedUserForUpload.phone || 'Chưa có'}</p>
                  </CardContent>
                </Card>
                
                {selectedUserForUpload.createdAt && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">📅 Ngày đăng ký</p>
                      <p className="font-semibold">{new Date(selectedUserForUpload.createdAt).toLocaleDateString('vi-VN')}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedUserForUpload.lastLoginAt && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">🕐 Đăng nhập cuối</p>
                      <p className="font-semibold">{new Date(selectedUserForUpload.lastLoginAt).toLocaleDateString('vi-VN')}</p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">📋 Trạng thái KYC</p>
                    <p className="font-semibold">{selectedUserForUpload.kycStatus === 'rejected' ? 'Bị từ chối' : 'Chưa submit'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Document Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trạng thái tài liệu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border-2 ${
                      selectedUserForUpload.kycInfo.identityUploaded 
                        ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' 
                        : 'bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {selectedUserForUpload.kycInfo.identityUploaded && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        <span className="font-semibold">CCCD</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedUserForUpload.kycInfo.identityUploaded ? '✅ Đã tải lên' : '❌ Chưa có'}
                      </p>
                    </div>

                    <div className={`p-4 rounded-lg border-2 ${
                      selectedUserForUpload.kycInfo.licenseUploaded 
                        ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' 
                        : 'bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {selectedUserForUpload.kycInfo.licenseUploaded && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        <span className="font-semibold">GPLX</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedUserForUpload.kycInfo.licenseUploaded ? '✅ Đã tải lên' : '❌ Chưa có'}
                      </p>
                    </div>
                  </div>

                  {selectedUserForUpload.kycInfo.staffUploaded && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          ℹ️ Tài liệu đã được staff hỗ trợ upload
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upload Section */}
              <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    Upload tài liệu cho user
                  </CardTitle>
                  <CardDescription>
                    Nhấn nút "Chuyển đến KYC" để chuyển sang tab "KYC Đang chờ duyệt" và upload tài liệu cho user này
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Hướng dẫn upload:
                        </p>
                        <ol className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 space-y-1 list-decimal list-inside">
                          <li>Nhấn nút "Chuyển đến KYC" bên trên</li>
                          <li>Hệ thống sẽ tự động chuyển sang tab "KYC Đang chờ duyệt"</li>
                          <li>Sử dụng các file input để upload CCCD/GPLX</li>
                          <li>User ID sẽ được tự động điền khi cần thiết</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowUserInfoDialog(false)
                    setSelectedUserForUpload(null)
                  }}
                >
                  Đóng
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => handleNavigateToKycPending(selectedUserForUpload.id)}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Chuyển đến KYC
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog 
        open={showRejectDialog} 
        onOpenChange={(open) => {
          // Prevent closing when verifying
          if (!isVerifying) {
            setShowRejectDialog(open);
          }
        }}
      >
        <DialogContent 
          className="max-w-md"
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside during verification
            if (isVerifying) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing with ESC key during verification
            if (isVerifying) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Từ chối xác thực KYC</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để khách hàng biết cách khắc phục
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 relative">
            {/* Loading Overlay */}
            {isVerifying && (
              <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-lg">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col items-center gap-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-red-600" />
                  <p className="text-lg font-semibold">Đang xử lý từ chối...</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vui lòng không đóng cửa sổ</p>
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">Lý do từ chối:</label>
              <Textarea
                placeholder="Ví dụ: Hình ảnh CCCD không rõ nét, thông tin không khớp..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={isVerifying}
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
              disabled={isVerifying}
            >
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim() || isVerifying}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận từ chối'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Document Image" 
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog (for Completed KYC) */}
      <Dialog open={showCustomerDetailDialog} onOpenChange={setShowCustomerDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thông tin KYC đã duyệt: {selectedCustomer?.fullname}</DialogTitle>
            <DialogDescription>
              Chi tiết thông tin khách hàng đã được xác thực
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4 py-4">
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-4 py-2">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  KYC đã được duyệt
                </Badge>
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
                      <span className="col-span-2 font-medium">
                        {selectedCustomer.identitySex || 'N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Quốc tịch:</span>
                      <span className="col-span-2 font-medium">
                        {selectedCustomer.identityNationality || 'N/A'}
                      </span>
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
                    {selectedCustomer.identityReligion && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Tôn giáo:</span>
                        <span className="col-span-2 font-medium text-xs leading-relaxed">{selectedCustomer.identityReligion}</span>
                      </div>
                    )}
                    {selectedCustomer.identityEthnicity && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Dân tộc:</span>
                        <span className="col-span-2 font-medium text-xs leading-relaxed">{selectedCustomer.identityEthnicity}</span>
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
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
                
              {/* Document Images */}
              <div>
                <h4 className="font-medium mb-3">Tài liệu đã xác thực</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <Card className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">CCCD mặt trước</span>
                                      {selectedCustomer.identityCardFrontImage && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      )}
                                    </div>
                    {selectedCustomer.identityCardFrontImage && (
                      <img 
                        src={selectedCustomer.identityCardFrontImage} 
                        alt="CCCD mặt trước" 
                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(selectedCustomer.identityCardFrontImage)}
                      />
                    )}
                  </Card>
                                  <Card className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">CCCD mặt sau</span>
                                      {selectedCustomer.identityCardBackImage && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      )}
                                    </div>
                    {selectedCustomer.identityCardBackImage && (
                      <img 
                        src={selectedCustomer.identityCardBackImage} 
                        alt="CCCD mặt sau" 
                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(selectedCustomer.identityCardBackImage)}
                      />
                    )}
                  </Card>
                                  <Card className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">GPLX mặt trước</span>
                                      {selectedCustomer.licenseImage && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      )}
                                    </div>
                    {selectedCustomer.licenseImage && (
                      <img 
                        src={selectedCustomer.licenseImage} 
                        alt="GPLX mặt trước" 
                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(selectedCustomer.licenseImage)}
                      />
                    )}
                  </Card>
                                  <Card className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">GPLX mặt sau</span>
                                      {selectedCustomer.licenseBackImage && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      )}
                                    </div>
                    {selectedCustomer.licenseBackImage && (
                      <img 
                        src={selectedCustomer.licenseBackImage} 
                        alt="GPLX mặt sau" 
                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(selectedCustomer.licenseBackImage)}
                      />
                    )}
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
    </>
  )
}