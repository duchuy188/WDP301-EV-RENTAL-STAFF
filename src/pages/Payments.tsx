import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Receipt, Filter, RefreshCw, Eye, Plus, QrCode } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getPayments, Payment, PaymentListParams, createPayment, CreatePaymentRequest, QRData, getPaymentDetails } from '@/api/payments'
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
  const { toast } = useToast()

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

  // Helper functions for display
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      completed: 'default',
      cancelled: 'destructive',
    }
    
    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
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
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Tìm theo mã payment hoặc tên khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || '--'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="--">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Type Filter */}
            <Select
              value={filters.payment_type || '--'}
              onValueChange={(value) => handleFilterChange('payment_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Loại thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="--">Tất cả loại</SelectItem>
                <SelectItem value="deposit">Đặt cọc</SelectItem>
                <SelectItem value="rental_fee">Phí thuê</SelectItem>
                <SelectItem value="additional_fee">Phí phát sinh</SelectItem>
                <SelectItem value="refund">Hoàn tiền</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Method Filter */}
            <Select
              value={filters.payment_method || '--'}
              onValueChange={(value) => handleFilterChange('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="--">Tất cả phương thức</SelectItem>
                <SelectItem value="cash">Tiền mặt</SelectItem>
                <SelectItem value="qr_code">QR Code</SelectItem>
                <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                <SelectItem value="vnpay">VNPay</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select
              value={filters.sort || 'createdAt'}
              onValueChange={(value) => handleFilterChange('sort', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Ngày tạo</SelectItem>
                <SelectItem value="updatedAt">Ngày cập nhật</SelectItem>
                <SelectItem value="amount">Số tiền</SelectItem>
              </SelectContent>
            </Select>

            {/* Order */}
            <Select
              value={filters.order || 'desc'}
              onValueChange={(value) => handleFilterChange('order', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Thứ tự" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Tăng dần</SelectItem>
                <SelectItem value="desc">Giảm dần</SelectItem>
              </SelectContent>
            </Select>
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
                          {formatDate(payment.createdAt)}
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
                      <Badge>{selectedPayment.rental_id.status}</Badge>
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
                  <p>{formatDate(selectedPayment.createdAt)}</p>
                          </div>
                <div>
                  <label className="text-gray-500">Cập nhật</label>
                  <p>{formatDate(selectedPayment.updatedAt)}</p>
                </div>
              </div>
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
            {/* Booking ID */}
            <div className="space-y-2">
              <Label htmlFor="booking_id">Booking ID <span className="text-red-500">*</span></Label>
              <Input
                id="booking_id"
                placeholder="Nhập booking ID (VD: 68de84c07e24c557e83abcc0)"
                value={formData.booking_id}
                onChange={(e) => handleFormChange('booking_id', e.target.value)}
              />
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
                  <SelectItem value="refund">Hoàn tiền</SelectItem>
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
                  <SelectItem value="qr_code">QR Code</SelectItem>
                  <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="vnpay">VNPay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rental ID (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="rental_id">Rental ID (không bắt buộc)</Label>
              <Input
                id="rental_id"
                placeholder="Nhập rental ID nếu có"
                value={formData.rental_id}
                onChange={(e) => handleFormChange('rental_id', e.target.value)}
              />
            </div>

            {/* Amount (for additional_fee) */}
            {formData.payment_type === 'additional_fee' && (
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
                <Button
                  onClick={() => window.open(qrData.vnpayData?.paymentUrl, '_blank')}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                >
                  Mở trang thanh toán VNPay
                </Button>
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
    </motion.div>
  )
}