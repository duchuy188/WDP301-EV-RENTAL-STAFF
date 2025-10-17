import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Receipt, Filter, RefreshCw, Eye, Plus, QrCode, ArrowLeftRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getPayments, Payment, PaymentListParams, createPayment, CreatePaymentRequest, QRData, getPaymentDetails, confirmPayment, ConfirmPaymentRequest, cancelPayment, CancelPaymentRequest, updatePaymentMethod } from '@/api/payments'
import { formatDate } from '@/lib/utils'
import { getStationBookings, Booking } from '@/api/booking'
import { getStaffRentals, Rental } from '@/api/rentals'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [showQrDialog, setShowQrDialog] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [updateMethodDialogOpen, setUpdateMethodDialogOpen] = useState(false)
  const [updatingMethod, setUpdatingMethod] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'vnpay'>('cash')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loadingRentals, setLoadingRentals] = useState(false)
  const { toast } = useToast()

  // Confirm payment form state
  const [confirmFormData, setConfirmFormData] = useState<ConfirmPaymentRequest>({
    transaction_id: '',
    notes: '',
  })
  
  // Cancel payment form state
  const [cancelFormData, setCancelFormData] = useState<CancelPaymentRequest>({
    reason: '',
  })

  // Form state for creating payment
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    booking_id: '',
    payment_type: 'deposit',
    payment_method: 'cash',
    rental_id: '',
    amount: undefined,
    reason: '',
    notes: '',
  })

  // Filter states
  const [filters, setFilters] = useState<PaymentListParams>({
    page: 1,
    limit: 10,
    status: undefined,
    payment_type: undefined,
    payment_method: undefined,
    sort: 'createdAt',
    order: 'desc',
  })
  
  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  })

  // Fetch payments data
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const params: PaymentListParams = {
        ...filters,
        search: searchTerm || undefined,
      }
      
      const response = await getPayments(params)
      setPayments(response.payments)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Error fetching payments:', error)
      const errorMessage = error instanceof Error ? error.message : "Không thể tải danh sách payments"
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters, searchTerm, toast])

  // Load payments on mount and when filters change
  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Fetch bookings for dropdown
  const fetchBookings = useCallback(async () => {
    try {
      setLoadingBookings(true)
      const response = await getStationBookings({ 
        limit: 100, 
        status: 'confirmed' // Only show confirmed bookings for payment creation
      })
      setBookings(response.bookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast({
        title: "Cảnh báo",
        description: "Không thể tải danh sách booking",
        variant: "destructive"
      })
    } finally {
      setLoadingBookings(false)
    }
  }, [toast])

  // Load bookings when create dialog opens
  useEffect(() => {
    if (createDialogOpen) {
      fetchBookings()
    }
  }, [createDialogOpen, fetchBookings])

  // Fetch rentals for dropdown
  const fetchRentals = useCallback(async () => {
    try {
      setLoadingRentals(true)
      const response = await getStaffRentals({ 
        limit: 100, 
        status: 'active' // Only show active rentals
      })
      setRentals(response.data.rentals)
    } catch (error) {
      console.error('Error fetching rentals:', error)
      toast({
        title: "Cảnh báo",
        description: "Không thể tải danh sách rental",
        variant: "destructive"
      })
    } finally {
      setLoadingRentals(false)
    }
  }, [toast])

  // Load rentals when create dialog opens and payment type is additional_fee
  useEffect(() => {
    if (createDialogOpen && formData.payment_type === 'additional_fee') {
      fetchRentals()
    }
  }, [createDialogOpen, formData.payment_type, fetchRentals])

  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }))
    fetchPayments()
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof PaymentListParams, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '--' ? undefined : value,
      page: 1, // Reset to first page when filter changes
    }))
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  // View payment details
  const viewPaymentDetails = async (payment: Payment) => {
    try {
      setLoading(true)
      // Call API to get full payment details
      const response = await getPaymentDetails(payment._id)
      setSelectedPayment(response.payment)
      setDetailsOpen(true)
    } catch (error) {
      console.error('Error fetching payment details:', error)
      // Fallback to use payment from list
      setSelectedPayment(payment)
      setDetailsOpen(true)
      toast({
        title: "Cảnh báo",
        description: "Không thể tải chi tiết đầy đủ, hiển thị thông tin cơ bản",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      booking_id: '',
      payment_type: 'deposit',
      payment_method: 'cash',
      rental_id: '',
      amount: undefined,
      reason: '',
      notes: '',
    })
  }

  // Handle create payment
  const handleCreatePayment = async () => {
    try {
      // Validation
      if (!formData.booking_id) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập Booking ID",
          variant: "destructive"
        })
        return
      }

      if (formData.payment_type === 'additional_fee' && !formData.amount) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập số tiền cho phí phát sinh",
          variant: "destructive"
        })
        return
      }

      if (formData.payment_type === 'additional_fee' && !formData.rental_id) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập Rental ID cho phí phát sinh",
          variant: "destructive"
        })
        return
      }

      setCreating(true)

      // Prepare data
      const requestData: CreatePaymentRequest = {
        booking_id: formData.booking_id,
        payment_type: formData.payment_type,
        payment_method: formData.payment_method,
      }

      if (formData.rental_id) requestData.rental_id = formData.rental_id
      if (formData.amount) requestData.amount = formData.amount
      if (formData.reason) requestData.reason = formData.reason
      if (formData.notes) requestData.notes = formData.notes

      const response = await createPayment(requestData)

      toast({
        title: "Thành công",
        description: response.message || "Tạo payment thành công",
        variant: "success",
      })

      // If there's QR data, show it
      if (response.qrData) {
        setQrData(response.qrData)
        setShowQrDialog(true)
      }

      // Close create dialog and refresh list
      setCreateDialogOpen(false)
      resetForm()
      fetchPayments()

    } catch (error) {
      console.error('Error creating payment:', error)
      const errorMessage = error instanceof Error ? error.message : "Không thể tạo payment"
    toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  // Handle form field changes
  const handleFormChange = (field: keyof CreatePaymentRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Reset confirm form
  const resetConfirmForm = () => {
    setConfirmFormData({
      transaction_id: '',
      notes: '',
    })
  }

  // Handle confirm payment
  const handleConfirmPayment = async () => {
    if (!selectedPayment) return

    try {
      setConfirming(true)

      const response = await confirmPayment(selectedPayment._id, confirmFormData)

      toast({
        title: "Thành công",
        description: response.message || "Xác nhận thanh toán thành công",
        variant: "success",
      })

      // If there's QR data, show it
      if (response.qrData) {
        setQrData(response.qrData)
        setShowQrDialog(true)
      }

      // Close confirm dialog and update payment details
      setConfirmDialogOpen(false)
      resetConfirmForm()
      
      // Update selected payment with new data
      setSelectedPayment(response.payment)
      
      // Refresh list
      fetchPayments()

    } catch (error) {
      console.error('Error confirming payment:', error)
      const errorMessage = error instanceof Error ? error.message : "Không thể xác nhận payment"
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setConfirming(false)
    }
  }

  // Open confirm dialog
  const openConfirmDialog = () => {
    setConfirmDialogOpen(true)
  }

  // Reset cancel form
  const resetCancelForm = () => {
    setCancelFormData({
      reason: '',
    })
  }

  // Handle cancel payment
  const handleCancelPayment = async () => {
    if (!selectedPayment) return

    // Validation
    if (!cancelFormData.reason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do hủy",
        variant: "destructive"
      })
      return
    }

    try {
      setCancelling(true)

      const response = await cancelPayment(selectedPayment._id, cancelFormData)

      toast({
        title: "Thành công",
        description: response.message || "Hủy payment thành công",
        variant: "success",
      })

      // Close cancel dialog and update payment details
      setCancelDialogOpen(false)
      resetCancelForm()
      
      // Update selected payment with new data
      setSelectedPayment(response.payment)
      
      // Refresh list
      fetchPayments()

    } catch (error) {
      console.error('Error cancelling payment:', error)
      const errorMessage = error instanceof Error ? error.message : "Không thể hủy payment"
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setCancelling(false)
    }
  }

  // Open update method dialog
  const openUpdateMethodDialog = () => {
    if (selectedPayment) {
      // Set the opposite method as default
      const oppositeMethod = selectedPayment.payment_method === 'cash' ? 'vnpay' : 'cash'
      setNewPaymentMethod(oppositeMethod)
      setUpdateMethodDialogOpen(true)
    }
  }

  // Handle update payment method
  const handleUpdatePaymentMethod = async () => {
    if (!selectedPayment) return

    try {
      setUpdatingMethod(true)

      const response = await updatePaymentMethod(selectedPayment._id, {
        payment_method: newPaymentMethod
      })

      toast({
        title: "Thành công",
        description: response.message || "Cập nhật phương thức thanh toán thành công",
        variant: "success",
      })

      // Close dialog
      setUpdateMethodDialogOpen(false)
      
      // Update selected payment with new data
      setSelectedPayment(response.payment)
      
      // Refresh list
      fetchPayments()

      // If changed to VNPay, show QR dialog
      if (newPaymentMethod === 'vnpay' && response.payment.vnpay_url) {
        setQrData({
          qrData: response.payment.qr_code_data || response.payment.vnpay_url,
          qrImageUrl: response.payment.qr_code_image || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(response.payment.vnpay_url)}`,
          qrText: `Mã giao dịch: ${response.payment.code}\nQuét mã QR hoặc truy cập link để thanh toán VNPay`,
          vnpayData: {
            paymentUrl: response.payment.vnpay_url,
            orderId: response.payment.vnpay_transaction_no || response.payment.code,
            txnRef: response.payment.code,
            orderInfo: `Thanh toán ${response.payment.code}`,
            amount: response.payment.amount,
            createDate: new Date().toISOString(),
            expireDate: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            params: {}
          }
        })
        setShowQrDialog(true)
      }

    } catch (error) {
      console.error('Error updating payment method:', error)
      const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật phương thức thanh toán"
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setUpdatingMethod(false)
    }
  }

  // Open cancel dialog
  const openCancelDialog = () => {
    setCancelDialogOpen(true)
  }

  // Helper functions for display
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      completed: 'default',
      cancelled: 'destructive',
      active: 'default',
      failed: 'destructive',
      in_progress: 'default',
      checked_in: 'default',
      checked_out: 'default',
    }
    
    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      active: 'Hoạt động',
      failed: 'Thất bại',
      in_progress: 'Đang thuê',
      checked_in: 'Đã nhận xe',
      checked_out: 'Đã trả xe',
    }
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getPaymentTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      deposit: 'Đặt cọc',
      rental_fee: 'Phí thuê',
      additional_fee: 'Phí phát sinh',
      refund: 'Hoàn tiền',
    }
    
    return (
      <Badge variant="outline">
        {labels[type] || type}
      </Badge>
    )
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Tiền mặt',
      qr_code: 'QR Code',
      bank_transfer: 'Chuyển khoản',
      vnpay: 'VNPay',
    }
    
    return labels[method] || method
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
      <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý thanh toán</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Danh sách tất cả các giao dịch thanh toán</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo payment
          </Button>
          <Button 
            onClick={fetchPayments}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Bộ lọc</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
            {/* Search Row */}
            <div className="flex space-x-2">
              <Input
                placeholder="Tìm theo mã payment hoặc tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium whitespace-nowrap">Trạng thái:</span>
                <Select
                  value={filters.status || '--'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="--">Tất cả trạng thái</SelectItem>
                    <SelectItem value="pending">⏳ Chờ xử lý</SelectItem>
                    <SelectItem value="completed">✅ Hoàn thành</SelectItem>
                    <SelectItem value="cancelled">❌ Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Type Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium whitespace-nowrap">Loại:</span>
                <Select
                  value={filters.payment_type || '--'}
                  onValueChange={(value) => handleFilterChange('payment_type', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Loại thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="--">Tất cả loại</SelectItem>
                    <SelectItem value="deposit">💰 Đặt cọc</SelectItem>
                    <SelectItem value="rental_fee">🏠 Phí thuê</SelectItem>
                    <SelectItem value="additional_fee">➕ Phí phát sinh</SelectItem>
                    {/* <SelectItem value="refund">Hoàn tiền</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium whitespace-nowrap">Phương thức:</span>
                <Select
                  value={filters.payment_method || '--'}
                  onValueChange={(value) => handleFilterChange('payment_method', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Phương thức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="--">Tất cả phương thức</SelectItem>
                    <SelectItem value="cash">💵 Tiền mặt</SelectItem>
                    <SelectItem value="vnpay">🏦 VNPay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium whitespace-nowrap">Sắp xếp:</span>
                <Select
                  value={filters.sort || 'createdAt'}
                  onValueChange={(value) => handleFilterChange('sort', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">📅 Ngày tạo</SelectItem>
                    <SelectItem value="updatedAt">🔄 Ngày cập nhật</SelectItem>
                    <SelectItem value="amount">💰 Số tiền</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order Row */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium whitespace-nowrap">Thứ tự:</span>
              <Select
                value={filters.order || 'desc'}
                onValueChange={(value) => handleFilterChange('order', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Thứ tự" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">⬆️ Tăng dần</SelectItem>
                  <SelectItem value="desc">⬇️ Giảm dần</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          </CardContent>
        </Card>

      {/* Payments Table */}
      <Card>
            <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Danh sách thanh toán</span>
            </div>
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              Tổng: {pagination.total} giao dịch
            </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Không tìm thấy giao dịch nào</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã GD</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Phương thức</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell className="font-medium">
                          {payment.code}
                        </TableCell>
                        <TableCell>
                          {typeof payment.user_id === 'object' ? (
                            <div>
                              <div className="font-medium">{payment.user_id.fullname}</div>
                              <div className="text-sm text-gray-500">{payment.user_id.phone}</div>
                            </div>
                          ) : (
                            payment.user_id
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(payment.amount)}
                          </span>
                        </TableCell>
                        <TableCell>{getPaymentTypeBadge(payment.payment_type)}</TableCell>
                        <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {typeof payment.booking_id === 'object' && payment.booking_id ? (
                            <span className="text-sm font-mono">{payment.booking_id.code}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(payment.createdAt || payment.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewPaymentDetails(payment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                  >
                    Trước
                  </Button>
                  <div className="flex items-center space-x-1">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <Button
                        key={i}
                        variant={pagination.page === i + 1 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(i + 1)}
                        disabled={loading}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages || loading}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết giao dịch</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về giao dịch thanh toán
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Mã giao dịch</label>
                  <p className="text-lg font-semibold">{selectedPayment.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số tiền</label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Loại thanh toán</label>
                  <div className="mt-1">{getPaymentTypeBadge(selectedPayment.payment_type)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phương thức</label>
                  <p className="mt-1">{getPaymentMethodLabel(selectedPayment.payment_method)}</p>
                </div>
                  <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                        <div>
                  <label className="text-sm font-medium text-gray-500">Mã giao dịch</label>
                  <p className="mt-1 font-mono text-sm">{selectedPayment.transaction_id || '-'}</p>
                        </div>
                      </div>
                      
              {/* Customer Info */}
              {typeof selectedPayment.user_id === 'object' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Thông tin khách hàng</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                      <label className="text-sm text-gray-500">Tên khách hàng</label>
                      <p>{selectedPayment.user_id.fullname}</p>
                        </div>
                        <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p>{selectedPayment.user_id.email}</p>
                        </div>
                    <div>
                      <label className="text-sm text-gray-500">Số điện thoại</label>
                      <p>{selectedPayment.user_id.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Info */}
              {typeof selectedPayment.booking_id === 'object' && selectedPayment.booking_id && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Thông tin đặt xe</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Mã booking</label>
                      <p className="font-mono">{selectedPayment.booking_id.code}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Thời gian thuê</label>
                      <p>{new Date(selectedPayment.booking_id.start_date).toLocaleDateString('vi-VN')} - {new Date(selectedPayment.booking_id.end_date).toLocaleDateString('vi-VN')}</p>
                    </div>
                    {selectedPayment.booking_id.total_price !== undefined && (
                  <div>
                        <label className="text-sm text-gray-500">Tổng giá thuê</label>
                        <p className="font-semibold text-blue-600">{formatCurrency(selectedPayment.booking_id.total_price)}</p>
                      </div>
                    )}
                    {selectedPayment.booking_id.deposit_amount !== undefined && (
                      <div>
                        <label className="text-sm text-gray-500">Số tiền cọc</label>
                        <p className="font-semibold text-orange-600">{formatCurrency(selectedPayment.booking_id.deposit_amount)}</p>
                      </div>
                    )}
                      </div>
                        </div>
              )}

              {/* Rental Info */}
              {selectedPayment.rental_id && typeof selectedPayment.rental_id === 'object' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Thông tin thuê xe</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Mã rental</label>
                      <p className="font-mono">{selectedPayment.rental_id.code}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Trạng thái</label>
                      <div className="mt-1">{getStatusBadge(selectedPayment.rental_id.status)}</div>
                    </div>
                    {selectedPayment.rental_id.actual_start_time && (
                      <div>
                        <label className="text-sm text-gray-500">Thời gian bắt đầu thực tế</label>
                        <p className="text-sm">{formatDate(selectedPayment.rental_id.actual_start_time)}</p>
                      </div>
                    )}
                    {selectedPayment.rental_id.actual_end_time && (
                      <div>
                        <label className="text-sm text-gray-500">Thời gian kết thúc thực tế</label>
                        <p className="text-sm">{formatDate(selectedPayment.rental_id.actual_end_time)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Processed By */}
              {typeof selectedPayment.processed_by === 'object' && selectedPayment.processed_by && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Người xử lý</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Tên nhân viên</label>
                      <p>{selectedPayment.processed_by.fullname}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="text-sm">{selectedPayment.processed_by.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPayment.notes && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                  <p className="mt-1 text-sm">{selectedPayment.notes}</p>
                </div>
              )}

              {/* VNPay Info */}
              {selectedPayment.vnpay_url && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Thông tin VNPay</h3>
                  <div className="space-y-2">
                    {selectedPayment.vnpay_transaction_no && (
                      <div>
                        <label className="text-sm text-gray-500">Mã giao dịch VNPay</label>
                        <p className="font-mono text-sm">{selectedPayment.vnpay_transaction_no}</p>
                      </div>
                    )}
                    {selectedPayment.vnpay_bank_code && (
                      <div>
                        <label className="text-sm text-gray-500">Ngân hàng</label>
                        <p>{selectedPayment.vnpay_bank_code}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-500">Ngày tạo</label>
                  <p>{formatDate(selectedPayment.createdAt || selectedPayment.created_at)}</p>
                </div>
                <div>
                  <label className="text-gray-500">Cập nhật</label>
                  <p>{formatDate(selectedPayment.updatedAt || selectedPayment.updated_at)}</p>
                    </div>
                  </div>

              {/* Action Buttons - Only show for pending payments */}
              {selectedPayment.status === 'pending' && (
                <div className="border-t pt-4 space-y-3">
                  {/* Chỉ hiển thị nút xác nhận cho phương thức tiền mặt */}
                  {selectedPayment.payment_method === 'cash' && (
                    <Button
                      onClick={openConfirmDialog}
                      className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                    >
                      Xác nhận thanh toán
                    </Button>
                  )}
                  {/* Update Payment Method Button */}
                  <Button
                    onClick={openUpdateMethodDialog}
                    variant="outline"
                    className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Đổi phương thức thanh toán
                  </Button>
                  <Button
                    onClick={openCancelDialog}
                    variant="destructive"
                    className="w-full"
                  >
                    Hủy payment
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Payment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
            <DialogTitle>Tạo payment mới</DialogTitle>
                        <DialogDescription>
              Tạo giao dịch thanh toán mới cho booking
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
            {/* Booking Selection */}
            <div className="space-y-2">
              <Label htmlFor="booking_id">Chọn Booking <span className="text-red-500">*</span></Label>
              {loadingBookings ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.booking_id}
                  onValueChange={(value) => handleFormChange('booking_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn booking..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-gray-500">
                        Không có booking khả dụng
                      </div>
                    ) : (
                      bookings.map((booking) => (
                        <SelectItem key={booking._id} value={booking._id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.code}</span>
                            <span className="text-xs text-gray-500">
                              {typeof booking.user_id === 'object' ? booking.user_id.fullname : ''} - 
                              {typeof booking.vehicle_id === 'object' ? ` ${booking.vehicle_id.name}` : ''}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-gray-500">
                Chỉ hiển thị các booking đã được xác nhận
              </p>
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label htmlFor="payment_type">Loại thanh toán <span className="text-red-500">*</span></Label>
              <Select
                value={formData.payment_type}
                onValueChange={(value) => handleFormChange('payment_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Đặt cọc</SelectItem>
                  <SelectItem value="rental_fee">Phí thuê</SelectItem>
                  <SelectItem value="additional_fee">Phí phát sinh</SelectItem>
                  {/* <SelectItem value="refund">Hoàn tiền</SelectItem> */}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment_method">Phương thức thanh toán <span className="text-red-500">*</span></Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => handleFormChange('payment_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="vnpay">VNPay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount and Rental ID (for additional_fee) */}
            {formData.payment_type === 'additional_fee' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount">Số tiền <span className="text-red-500">*</span></Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Nhập số tiền"
                    value={formData.amount || ''}
                    onChange={(e) => handleFormChange('amount', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rental_id">Chọn Rental <span className="text-red-500">*</span></Label>
                  {loadingRentals ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={formData.rental_id}
                      onValueChange={(value) => handleFormChange('rental_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn rental..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rentals.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-gray-500">
                            Không có rental khả dụng
                          </div>
                        ) : (
                          rentals.map((rental) => (
                            <SelectItem key={rental._id} value={rental._id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{rental.code}</span>
                                <span className="text-xs text-gray-500">
                                  {rental.user_id.fullname} - {rental.vehicle_id.name} ({rental.vehicle_id.license_plate})
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-gray-500">
                    Chỉ hiển thị các rental đang hoạt động
                  </p>
                </div>
              </>
            )}

            {/* Reason (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do (không bắt buộc)</Label>
              <Input
                id="reason"
                placeholder="VD: Phí trễ giờ trả xe"
                value={formData.reason}
                onChange={(e) => handleFormChange('reason', e.target.value)}
              />
                          </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú (không bắt buộc)</Label>
              <Textarea
                id="notes"
                placeholder="Nhập ghi chú..."
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                rows={3}
              />
                        </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleCreatePayment}
                disabled={creating}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                {creating ? 'Đang tạo...' : 'Tạo payment'}
              </Button>
                          <Button 
                onClick={() => {
                  setCreateDialogOpen(false)
                  resetForm()
                }}
                variant="outline"
                disabled={creating}
              >
                Hủy
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>Mã QR thanh toán</span>
            </DialogTitle>
            <DialogDescription>
              Quét mã QR để thanh toán
            </DialogDescription>
          </DialogHeader>
          {qrData && (
            <div className="space-y-4 py-4">
              {/* QR Code Image */}
              <div className="flex justify-center">
                <img
                  src={qrData.qrImageUrl}
                  alt="QR Code"
                  className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                />
                </div>

              {/* QR Text */}
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {qrData.qrText}
                </p>
              </div>

              {/* VNPay Link Button */}
              {qrData.vnpayData && (
                <>
                  <Button
                    onClick={() => window.open(qrData.vnpayData?.paymentUrl, '_blank')}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  >
                    Mở trang thanh toán VNPay
                  </Button>
                  <p className="text-xs text-center text-gray-500">
                    Sau khi thanh toán, cửa sổ sẽ tự động chuyển về trang kết quả
                  </p>
                </>
              )}

              {/* Close Button */}
              <Button
                onClick={() => {
                  setShowQrDialog(false)
                  setQrData(null)
                }}
                variant="outline"
                className="w-full"
              >
                Đóng
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận thanh toán</DialogTitle>
            <DialogDescription>
              Xác nhận payment đã được thanh toán thành công
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Transaction ID */}
            <div className="space-y-2">
              <Label htmlFor="transaction_id">Mã giao dịch (không bắt buộc)</Label>
              <Input
                id="transaction_id"
                placeholder="VD: TXN123456789"
                value={confirmFormData.transaction_id}
                onChange={(e) => setConfirmFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="confirm_notes">Ghi chú (không bắt buộc)</Label>
              <Textarea
                id="confirm_notes"
                placeholder="Nhập ghi chú..."
                value={confirmFormData.notes}
                onChange={(e) => setConfirmFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
              >
                {confirming ? 'Đang xác nhận...' : 'Xác nhận'}
              </Button>
              <Button
                onClick={() => {
                  setConfirmDialogOpen(false)
                  resetConfirmForm()
                }}
                variant="outline"
                disabled={confirming}
              >
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Payment Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hủy payment</DialogTitle>
            <DialogDescription>
              Hủy payment đang pending. Vui lòng nhập lý do.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="cancel_reason">Lý do hủy <span className="text-red-500">*</span></Label>
              <Textarea
                id="cancel_reason"
                placeholder="VD: Khách hàng không thanh toán"
                value={cancelFormData.reason}
                onChange={(e) => setCancelFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={4}
              />
              <p className="text-sm text-gray-500">Lý do này sẽ được lưu vào ghi chú của payment</p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleCancelPayment}
                disabled={cancelling}
                variant="destructive"
                className="flex-1"
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </Button>
              <Button
                onClick={() => {
                  setCancelDialogOpen(false)
                  resetCancelForm()
                }}
                variant="outline"
                disabled={cancelling}
              >
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Payment Method Dialog */}
      <Dialog open={updateMethodDialogOpen} onOpenChange={setUpdateMethodDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-500" />
              Đổi phương thức thanh toán
            </DialogTitle>
            <DialogDescription>
              Chuyển đổi phương thức thanh toán cho payment {selectedPayment?.code}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              {/* Current Method */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500">Phương thức hiện tại</label>
                <p className="text-lg font-semibold mt-1">
                  {selectedPayment.payment_method === 'cash' ? '💵 Tiền mặt' : '💳 VNPay'}
                </p>
              </div>

              {/* New Method Selection */}
              <div className="space-y-2">
                <Label htmlFor="new_method">
                  Phương thức mới <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newPaymentMethod}
                  onValueChange={(value) => setNewPaymentMethod(value as 'cash' | 'vnpay')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Tiền mặt</SelectItem>
                    <SelectItem value="vnpay">💳 VNPay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Info Card */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <div className="text-blue-600 dark:text-blue-400 text-sm">
                      <p className="font-semibold mb-1">ℹ️ Lưu ý:</p>
                      {newPaymentMethod === 'vnpay' ? (
                        <p>Sau khi chuyển sang VNPay, hệ thống sẽ tạo link thanh toán và mã QR mới cho khách hàng.</p>
                      ) : (
                        <p>Sau khi chuyển sang tiền mặt, khách hàng có thể thanh toán trực tiếp tại trạm.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Số tiền:</span>
                  <span className="font-semibold">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
                  <span>{getStatusBadge(selectedPayment.status)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setUpdateMethodDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={updatingMethod}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleUpdatePaymentMethod}
                  disabled={updatingMethod || newPaymentMethod === selectedPayment.payment_method}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                >
                  {updatingMethod ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="h-4 w-4 mr-2" />
                      Xác nhận đổi
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}