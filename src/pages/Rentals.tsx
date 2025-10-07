import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  User, 
  Calendar, 
  MapPin, 
  Clock,
  DollarSign,
  Image as ImageIcon,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Battery,
  Gauge,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getStaffRentals, getRentalById, type Rental, type RentalDetail } from '@/api/rentals';

export function Rentals() {
  const { toast } = useToast();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'pending_payment' | 'completed' | 'all'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [selectedRental, setSelectedRental] = useState<RentalDetail | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    active: 0,
    pending_payment: 0,
    completed: 0,
    total: 0
  });

  // Load rentals
  const loadRentals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getStaffRentals({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setRentals(response.data.rentals);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      });

      // Calculate stats from current data
      // Note: In production, these should come from a separate API endpoint
      const active = response.data.rentals.filter(r => r.status === 'active').length;
      const pending = response.data.rentals.filter(r => r.status === 'pending_payment').length;
      const completed = response.data.rentals.filter(r => r.status === 'completed').length;
      
      setStats({
        active,
        pending_payment: pending,
        completed,
        total: response.data.pagination.total
      });
    } catch (error: unknown) {
      console.error('Rentals API Error:', error);
      setRentals([]);
      const errorMessage = (error as Error)?.message || 'Lỗi khi tải danh sách rentals';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, toast]);

  useEffect(() => {
    loadRentals();
  }, [loadRentals]);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleViewDetail = async (rental: Rental) => {
    setShowDetailDialog(true);
    setDetailLoading(true);
    try {
      const response = await getRentalById(rental._id);
      setSelectedRental(response.data);
    } catch (error: unknown) {
      console.error('Rental Detail API Error:', error);
      const errorMessage = (error as Error)?.message || 'Lỗi khi lấy chi tiết rental';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
      setShowDetailDialog(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đang thuê
          </Badge>
        );
      case 'pending_payment':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Chờ thanh toán
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Hoàn thành
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConditionBadge = (condition: string | null) => {
    if (!condition) return <Badge variant="outline">N/A</Badge>;
    
    switch (condition) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800">Xuất sắc</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800">Tốt</Badge>;
      case 'fair':
        return <Badge className="bg-yellow-100 text-yellow-800">Khá</Badge>;
      case 'poor':
        return <Badge className="bg-red-100 text-red-800">Kém</Badge>;
      default:
        return <Badge variant="outline">{condition}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🚗 Quản lý Rentals
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Danh sách các rental tại station của bạn
          </p>
        </div>
        <Button 
          onClick={loadRentals}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Đang thuê
              </CardTitle>
              <Car className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-gray-500 mt-1">Rentals đang hoạt động</p>
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
                Chờ thanh toán
              </CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending_payment}</div>
              <p className="text-xs text-gray-500 mt-1">Cần xử lý thanh toán</p>
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
                Hoàn thành
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.completed}</div>
              <p className="text-xs text-gray-500 mt-1">Rentals đã hoàn thành</p>
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
                Tổng cộng
              </CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">Tất cả rentals</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-medium whitespace-nowrap">Lọc theo trạng thái:</span>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value as 'active' | 'pending_payment' | 'completed' | 'all');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
                <SelectTrigger className="w-[200px] border-2 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 Tất cả</SelectItem>
                  <SelectItem value="active">🚗 Đang thuê</SelectItem>
                  <SelectItem value="pending_payment">💰 Chờ thanh toán</SelectItem>
                  <SelectItem value="completed">✅ Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị {rentals.length} trong {pagination.total} rentals
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rentals List */}
      {loading ? (
        <div className="text-center py-16">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Đang tải danh sách rentals...</p>
        </div>
      ) : rentals.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-16">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Không có rental nào
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter !== 'all' 
                ? 'Thử thay đổi bộ lọc để xem các rental khác' 
                : 'Chưa có rental nào tại station của bạn'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentals.map((rental, index) => (
              <motion.div
                key={rental._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Header with gradient based on status */}
                  <div className={`h-2 ${
                    rental.status === 'active' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    rental.status === 'pending_payment' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                    'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`} />
                  
                  <CardContent className="p-6">
                    {/* Code and Status */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {rental.code}
                      </div>
                      {getStatusBadge(rental.status)}
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {rental.user_id.fullname}
                          </p>
                          <p className="text-xs text-gray-500">{rental.user_id.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {rental.vehicle_id.license_plate}
                          </p>
                          <p className="text-xs text-gray-500">{rental.vehicle_id.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Bắt đầu: {formatDateTime(rental.actual_start_time)}
                          </p>
                          {rental.actual_end_time && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Kết thúc: {formatDateTime(rental.actual_end_time)}
                            </p>
                          )}
                        </div>
                      </div>

                      {rental.total_fees > 0 && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <p className="text-sm font-semibold text-red-600">
                            {formatPrice(rental.total_fees)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* View Detail Button */}
                    <Button
                      variant="outline"
                      className="w-full border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 transition-all"
                      onClick={() => handleViewDetail(rental)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Xem chi tiết
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Rental: {selectedRental?.code || '...'}</DialogTitle>
            <DialogDescription>
              Thông tin đầy đủ về rental
            </DialogDescription>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="text-center py-16">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-lg text-gray-600 dark:text-gray-300">Đang tải chi tiết rental...</p>
            </div>
          ) : selectedRental && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex justify-center">
                {getStatusBadge(selectedRental.status)}
              </div>

              {/* Booking Info */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Thông tin Booking
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">Ngày bắt đầu:</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-300">
                      {new Date(selectedRental.booking_id.start_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">Ngày kết thúc:</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-300">
                      {new Date(selectedRental.booking_id.end_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">Tổng giá booking:</span>
                    <span className="font-bold text-lg text-green-600 dark:text-green-400">
                      {formatPrice(selectedRental.booking_id.total_price)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Main Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Info */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Thông tin khách hàng
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Họ tên:</span>
                      <span className="col-span-2 font-medium">{selectedRental.user_id.fullname}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="col-span-2 font-medium text-xs break-all">{selectedRental.user_id.email}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Điện thoại:</span>
                      <span className="col-span-2 font-medium">{selectedRental.user_id.phone}</span>
                    </div>
                  </div>
                </Card>

                {/* Vehicle Info */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-green-600 dark:text-green-400 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Thông tin xe
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Biển số:</span>
                      <span className="col-span-2 font-medium">{selectedRental.vehicle_id.license_plate}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Tên xe:</span>
                      <span className="col-span-2 font-medium">{selectedRental.vehicle_id.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Model:</span>
                      <span className="col-span-2 font-medium">{selectedRental.vehicle_id.model}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Battery className="h-3 w-3" />
                        Dung lượng pin:
                      </span>
                      <span className="col-span-2 font-medium">{selectedRental.vehicle_id.battery_capacity} kWh</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Station and Time Info */}
              <Card className="p-4">
                <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Thông tin trạm & thời gian
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Trạm:</span>
                    <span className="col-span-2 font-medium">{selectedRental.station_id.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Địa chỉ:</span>
                    <span className="col-span-2 font-medium text-xs">{selectedRental.station_id.address}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Bắt đầu:</span>
                    <span className="col-span-2 font-medium">{formatDateTime(selectedRental.actual_start_time)}</span>
                  </div>
                  {selectedRental.actual_end_time && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Kết thúc:</span>
                      <span className="col-span-2 font-medium">{formatDateTime(selectedRental.actual_end_time)}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Staff nhận xe:</span>
                    <span className="col-span-2 font-medium">{selectedRental.pickup_staff_id?.fullname || 'N/A'}</span>
                  </div>
                  {selectedRental.return_staff_id && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Staff trả xe:</span>
                      <span className="col-span-2 font-medium">{selectedRental.return_staff_id.fullname}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Vehicle Conditions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Before */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-green-600 dark:text-green-400">
                    Tình trạng xe khi nhận
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Gauge className="h-3 w-3" />
                        Km:
                      </span>
                      <span className="font-medium">{selectedRental.vehicle_condition_before.mileage || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Battery className="h-3 w-3" />
                        Pin:
                      </span>
                      <span className="font-medium">{selectedRental.vehicle_condition_before.battery_level ? `${selectedRental.vehicle_condition_before.battery_level}%` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Ngoại thất:</span>
                      {getConditionBadge(selectedRental.vehicle_condition_before.exterior_condition)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Nội thất:</span>
                      {getConditionBadge(selectedRental.vehicle_condition_before.interior_condition)}
                    </div>
                    {selectedRental.vehicle_condition_before.notes && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Ghi chú:</p>
                        <p className="text-xs mt-1">{selectedRental.vehicle_condition_before.notes}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* After */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-orange-600 dark:text-orange-400">
                    Tình trạng xe khi trả
                  </h4>
                  {selectedRental.actual_end_time ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Gauge className="h-3 w-3" />
                          Km:
                        </span>
                        <span className="font-medium">{selectedRental.vehicle_condition_after.mileage || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Battery className="h-3 w-3" />
                          Pin:
                        </span>
                        <span className="font-medium">{selectedRental.vehicle_condition_after.battery_level ? `${selectedRental.vehicle_condition_after.battery_level}%` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Ngoại thất:</span>
                        {getConditionBadge(selectedRental.vehicle_condition_after.exterior_condition)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Nội thất:</span>
                        {getConditionBadge(selectedRental.vehicle_condition_after.interior_condition)}
                      </div>
                      {selectedRental.vehicle_condition_after.notes && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Ghi chú:</p>
                          <p className="text-xs mt-1">{selectedRental.vehicle_condition_after.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Xe chưa được trả</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Fees */}
              {(selectedRental.late_fee > 0 || selectedRental.damage_fee > 0 || selectedRental.other_fees > 0) && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-red-600 dark:text-red-400 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Phí phát sinh
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedRental.late_fee > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phí trễ hạn:</span>
                        <span className="font-semibold text-red-600">{formatPrice(selectedRental.late_fee)}</span>
                      </div>
                    )}
                    {selectedRental.damage_fee > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phí hư hỏng:</span>
                        <span className="font-semibold text-red-600">{formatPrice(selectedRental.damage_fee)}</span>
                      </div>
                    )}
                    {selectedRental.other_fees > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phí khác:</span>
                        <span className="font-semibold text-red-600">{formatPrice(selectedRental.other_fees)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-900 dark:text-white">Tổng:</span>
                      <span className="font-bold text-lg text-red-600">{formatPrice(selectedRental.total_fees)}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Images */}
              {(selectedRental.images_before.length > 0 || selectedRental.images_after.length > 0) && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Hình ảnh
                  </h4>
                  <div className="space-y-4">
                    {selectedRental.images_before.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ảnh khi nhận xe:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {selectedRental.images_before.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Before ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleImageClick(img)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedRental.images_after.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ảnh khi trả xe:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {selectedRental.images_after.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`After ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleImageClick(img)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Notes */}
              {(selectedRental.staff_notes || selectedRental.customer_notes) && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Ghi chú
                  </h4>
                  <div className="space-y-3 text-sm">
                    {selectedRental.staff_notes && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Ghi chú của staff:</p>
                        <p className="p-2 bg-gray-50 dark:bg-gray-800 rounded">{selectedRental.staff_notes}</p>
                      </div>
                    )}
                    {selectedRental.customer_notes && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Ghi chú của khách hàng:</p>
                        <p className="p-2 bg-gray-50 dark:bg-gray-800 rounded">{selectedRental.customer_notes}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}
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
                alt="Rental Image" 
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

