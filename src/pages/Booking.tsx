import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Calendar, 
  Clock, 
  CreditCard,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Car,
  User,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  getStationBookings, 
  confirmBooking, 
  cancelBooking,
  type Booking, 
  type BookingListResponse, 
  type BookingListParams,
  type ConfirmBookingRequest,
  type VehicleCondition,
  type ConfirmBookingResponse 
} from '@/api/booking';

const Booking: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Booking['status'] | 'all'>('all');
  const [hasError, setHasError] = useState(false);
  
  // Confirm booking dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmBookingResponse | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Form data for confirmation
  const [vehicleCondition, setVehicleCondition] = useState<VehicleCondition>({
    battery_level: 100,
    odometer: 0,
    exterior_condition: 'good',
    interior_condition: 'good',
    issues: []
  });
  const [staffNotes, setStaffNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const { toast } = useToast();

  // Load bookings data
  const loadBookings = useCallback(async (params?: BookingListParams) => {
    setIsLoading(true);
    try {
      const response: BookingListResponse = await getStationBookings({
        page: 1,
        limit: 50,
        ...params
      });

      setBookings(response.bookings);
      setFilteredBookings(response.bookings);
      
      toast({
        title: "Thành công",
        description: `Đã tải ${response.bookings.length} booking`,
      });
    } catch (error: unknown) {
      console.error('Error loading bookings:', error);
      setHasError(true);
      toast({
        title: "Lỗi",
        description: (error as Error).message || "Lỗi khi tải danh sách booking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load data on component mount
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Filter bookings based on search and status
  useEffect(() => {
    let filtered = bookings;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(booking => {
        const term = searchTerm.toLowerCase();
        return (
          booking.code?.toLowerCase().includes(term) ||
          String(booking.user_id || '').toLowerCase().includes(term) ||
          String(booking.vehicle_id || '').toLowerCase().includes(term) ||
          booking.special_requests?.toLowerCase().includes(term) ||
          booking.notes?.toLowerCase().includes(term)
        );
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, selectedStatus]);

  // Helper functions
  const formatPriceDisplay = (price: number | undefined | null) => {
    if (!price || isNaN(price)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  };


  const getStatusVariant = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'default';
      case 'checked_in':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      case 'checked_in':
        return 'Đã nhận xe';
      case 'in_progress':
        return 'Đang thuê';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Car className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'checked_in':
        return <Car className="h-4 w-4 text-green-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Reset form data
  const resetConfirmForm = () => {
    setVehicleCondition({
      battery_level: 100,
      odometer: 0,
      exterior_condition: 'good',
      interior_condition: 'good',
      issues: []
    });
    setStaffNotes('');
    setSelectedFiles([]);
  };

  // Open confirm dialog
  const openConfirmDialog = (bookingId: string) => {
    setConfirmingBookingId(bookingId);
    resetConfirmForm();
    setIsConfirmDialogOpen(true);
    setShowResult(false);
    setConfirmResult(null);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      toast({
        title: "Cảnh báo",
        description: "Chỉ được chọn tối đa 5 ảnh",
        variant: "destructive",
      });
      return;
    }
    setSelectedFiles(files);
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Booking actions
  const handleConfirmBooking = async () => {
    if (!confirmingBookingId) return;
    
    if (selectedFiles.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng tải lên ít nhất 1 ảnh xe trước bàn giao",
        variant: "destructive",
      });
      return;
    }

    if (!staffNotes.trim()) {
      toast({
        title: "Lỗi", 
        description: "Vui lòng nhập ghi chú của nhân viên",
        variant: "destructive",
      });
      return;
    }

    setIsConfirming(true);
    try {
      const confirmData: ConfirmBookingRequest = {
        vehicle_condition_before: vehicleCondition,
        staff_notes: staffNotes.trim(),
        files: selectedFiles
      };

      const response = await confirmBooking(confirmingBookingId, confirmData);
      
      setBookings(prev => 
        prev.map(booking => 
          booking._id === confirmingBookingId ? response.booking : booking
        )
      );
      
      setConfirmResult(response);
      setShowResult(true);
      
      toast({
        title: "Thành công",
        description: `Đã xác nhận booking ${response.booking.code || 'N/A'}`,
      });
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelBooking = async (bookingId: string, reason: string = "Hủy bởi staff") => {
    try {
      const updatedBooking = await cancelBooking(bookingId, reason);
      setBookings(prev => 
        prev.map(booking => 
          booking._id === bookingId ? updatedBooking : booking
        )
      );
      toast({
        title: "Thành công",
        description: `Đã hủy booking ${updatedBooking.code || 'N/A'}`,
      });
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };


  const getBookingStats = () => {
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      in_progress: bookings.filter(b => b.status === 'in_progress').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };
    return stats;
  };

  const stats = getBookingStats();

  // Error fallback UI
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Có lỗi xảy ra
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Không thể tải giao diện quản lý booking. Vui lòng thử lại.
            </p>
            <Button 
              onClick={() => {
                setHasError(false);
                loadBookings();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Thử lại
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Quản lý Booking
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
                Quản lý tất cả đặt xe tại trạm của bạn
              </p>
            </div>
            <Button 
              onClick={() => loadBookings()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo mã booking, ID khách hàng, xe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Bộ lọc
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Tổng số</p>
              </CardContent>
            </Card>
            </motion.div>

            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Chờ xử lý</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="text-center">
                        <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Đã xác nhận</p>
                        </CardContent>
                      </Card>
          </motion.div>
          
          {/* Đã bỏ UI trạng thái Đang thuê */}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Hoàn thành</p>
              </CardContent>
            </Card>
          </motion.div>
          
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Đã hủy</p>
              </CardContent>
            </Card>
                    </motion.div>
                    </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md"
        >
          <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as Booking['status'] | 'all')}>
            <div className="p-6 pb-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="pending">Chờ xử lý</TabsTrigger>
                <TabsTrigger value="confirmed">Đã xác nhận</TabsTrigger>
                <TabsTrigger value="cancelled">Đã hủy</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={selectedStatus} className="mt-0 p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Đang tải danh sách booking...</p>
                    </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Không có booking nào
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredBookings.map((booking) => (
                      <motion.div
                        key={booking._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        layout
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold">{booking.code || 'N/A'}</h3>
                                  {getStatusIcon(booking.status)}
                                  <Badge variant={getStatusVariant(booking.status)}>
                                    {getStatusText(booking.status)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {booking.booking_type === 'online' ? '🌐 Đặt online' : '🏢 Đặt tại chỗ'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {booking.status === 'pending' && (
                  <Button
                                    size="sm"
                                    onClick={() => openConfirmDialog(booking._id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Xác nhận bàn giao
                  </Button>
                                )}
                                
                                {booking.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCancelBooking(booking._id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Hủy
                  </Button>
                )}
              </div>
          </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <div className="text-sm">
                                  <p className="font-medium">Thời gian thuê</p>
                                  <p className="text-gray-600 dark:text-gray-300">
                                    {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                                  </p>
                                </div>
                        </div>
                              
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <div className="text-sm">
                                  <p className="font-medium">Giờ</p>
                                  <p className="text-gray-600 dark:text-gray-300">
                                    {booking.pickup_time || 'N/A'} - {booking.return_time || 'N/A'}
                                  </p>
                        </div>
                      </div>

                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <div className="text-sm">
                                  <p className="font-medium">Khách hàng</p>
                                  <p className="text-gray-600 dark:text-gray-300">
                                    {booking.user_id ? String(booking.user_id).slice(-8) + '...' : 'N/A'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-gray-400" />
                                <div className="text-sm">
                                  <p className="font-medium">Tổng tiền</p>
                                  <p className="text-green-600 font-semibold">
                                    {formatPriceDisplay(booking.total_price)}
                                  </p>
                                </div>
                          </div>
                      </div>

                            {booking.special_requests && (
                              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <p className="text-sm">
                                  <span className="font-medium">Yêu cầu đặc biệt:</span>{' '}
                                  {booking.special_requests}
                                </p>
                              </div>
                            )}

                            {booking.notes && (
                              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm">
                                  <span className="font-medium">Ghi chú:</span>{' '}
                                  {booking.notes}
                                </p>
                      </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
                    ))}
                  </AnimatePresence>
          </div>
              )}
            </TabsContent>
          </Tabs>
          </motion.div>

          {/* Confirm Booking Dialog */}
          <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {showResult ? 'Kết quả xác nhận booking' : 'Xác nhận bàn giao xe'}
                </DialogTitle>
              </DialogHeader>
              
              {!showResult ? (
                // Form for confirmation
                <div className="space-y-6 py-4">
                  {/* Vehicle Condition Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Tình trạng xe trước bàn giao</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="battery_level">Mức pin (%)</Label>
                        <Input
                          id="battery_level"
                          type="number"
                          min="0"
                          max="100"
                          value={vehicleCondition.battery_level || ''}
                          onChange={(e) => setVehicleCondition((prev: VehicleCondition) => ({
                            ...prev,
                            battery_level: parseInt(e.target.value) || 0
                          }))}
                          placeholder="Nhập mức pin"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="odometer">Số km đã đi</Label>
                        <Input
                          id="odometer"
                          type="number"
                          min="0"
                          value={vehicleCondition.odometer || ''}
                          onChange={(e) => setVehicleCondition((prev: VehicleCondition) => ({
                            ...prev,
                            odometer: parseInt(e.target.value) || 0
                          }))}
                          placeholder="Nhập số km"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="exterior_condition">Tình trạng ngoại thất</Label>
                      <Textarea
                        id="exterior_condition"
                        value={vehicleCondition.exterior_condition || ''}
                        onChange={(e) => setVehicleCondition((prev: VehicleCondition) => ({
                          ...prev,
                          exterior_condition: e.target.value
                        }))}
                        placeholder="Mô tả tình trạng ngoại thất xe"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="interior_condition">Tình trạng nội thất</Label>
                      <Textarea
                        id="interior_condition"
                        value={vehicleCondition.interior_condition || ''}
                        onChange={(e) => setVehicleCondition((prev: VehicleCondition) => ({
                          ...prev,
                          interior_condition: e.target.value
                        }))}
                        placeholder="Mô tả tình trạng nội thất xe"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Staff Notes Section */}
                  <div>
                    <Label htmlFor="staff_notes">Ghi chú nhân viên *</Label>
                    <Textarea
                      id="staff_notes"
                      value={staffNotes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStaffNotes(e.target.value)}
                      placeholder="Nhập ghi chú về quá trình bàn giao xe"
                      rows={4}
                      required
                    />
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <Label htmlFor="vehicle_images">Ảnh xe trước bàn giao * (tối đa 5 ảnh)</Label>
                    <Input
                      id="vehicle_images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="mt-2"
                    />
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {selectedFiles.slice(0, 5).map((file, idx) => (
                          <img
                            key={idx}
                            src={URL.createObjectURL(file)}
                            alt={`Ảnh xe ${idx + 1}`}
                            className="w-24 h-24 object-cover rounded border"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsConfirmDialogOpen(false)}
                      disabled={isConfirming}
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleConfirmBooking}
                      disabled={isConfirming || !staffNotes.trim() || selectedFiles.length === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isConfirming ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Xác nhận bàn giao
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // Results display
                confirmResult && (
                  <div className="space-y-6 py-4">
                    <div className="text-center">
                      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-green-600 mb-2">
                        {confirmResult.message}
                      </h2>
                    </div>

                    {/* Booking Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Car className="h-5 w-5 mr-2" />
                        Thông tin Booking
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Mã booking:</span> {confirmResult.booking.code}
                        </div>
                        <div>
                          <span className="font-medium">Trạng thái:</span> {getStatusText(confirmResult.booking.status)}
                        </div>
                        <div>
                          <span className="font-medium">Tổng tiền:</span> {formatPrice(confirmResult.booking.total_price)}
                        </div>
                        <div>
                          <span className="font-medium">Đặt cọc:</span> {formatPrice(confirmResult.booking.deposit_amount)}
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Thông tin Thanh toán
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Mã thanh toán:</span> {confirmResult.payment.code}
                        </div>
                        <div>
                          <span className="font-medium">Số tiền:</span> {formatPrice(confirmResult.payment.amount)}
                        </div>
                        <div>
                          <span className="font-medium">Phương thức:</span> {confirmResult.payment.payment_method}
                        </div>
                        <div>
                          <span className="font-medium">Loại:</span> {confirmResult.payment.payment_type}
                        </div>
                        <div>
                          <span className="font-medium">Trạng thái:</span> {confirmResult.payment.status}
                        </div>
                      </div>
                      {confirmResult.payment.qr_code_image && (
                        <div className="mt-4">
                          <span className="font-medium">QR Code:</span>
                          <img 
                            src={confirmResult.payment.qr_code_image} 
                            alt="QR Code Payment" 
                            className="mt-2 max-w-48 mx-auto border rounded"
                          />
                        </div>
                      )}
                    </div>

                    {/* Rental Info */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Thông tin Thuê xe
                      </h3>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Mã thuê xe:</span> {confirmResult.rental.code}
                        </div>
                        <div>
                          <span className="font-medium">Ghi chú nhân viên:</span> {confirmResult.rental.staff_notes}
                        </div>
                        <div>
                          <span className="font-medium">Số ảnh trước bàn giao:</span> {confirmResult.rental.images_before.length} ảnh
                        </div>
                      </div>
                    </div>

                    {/* Close Button */}
                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={() => {
                          setIsConfirmDialogOpen(false);
                          setShowResult(false);
                          setConfirmResult(null);
                          setConfirmingBookingId(null);
                          resetConfirmForm();
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Đóng
                      </Button>
                    </div>
                  </div>
                )
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  } catch (renderError) {
    console.error('Render error in Booking component:', renderError);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Lỗi hiển thị
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Có lỗi khi hiển thị giao diện. Vui lòng làm mới trang.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới trang
            </Button>
          </Card>
        </div>
      </div>
    );
  }
};

export default Booking;