import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  MapPin, 
  Clock,
  DollarSign,
  Image as ImageIcon,
  FileText,
  RefreshCw,
  Battery,
  Gauge,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getStaffRentals, getRentalById, getCheckoutInfo, checkoutNormal, checkoutFees, type Rental, type RentalDetail, type CheckoutInfo, type CheckoutNormalResponse, type CheckoutFeesResponse } from '@/api/rentals';
import { createContract } from '@/api/contracts';
import { formatDateTime } from '@/lib/utils';
import { TablePagination } from '@/components/ui/table-pagination';

export function Rentals() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'pending_payment' | 'pending_deposit' | 'completed' | 'all'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    pages: 0
  });

  const handleItemsPerPageChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    loadRentals(1, newLimit);
  };
  const [selectedRental, setSelectedRental] = useState<RentalDetail | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Create Contract states
  const [showCreateContractDialog, setShowCreateContractDialog] = useState(false);
  const [contractNotes, setContractNotes] = useState('');
  const [creatingContract, setCreatingContract] = useState(false);
  
  // Checkout states
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'result'>('form');
  const [checkoutResult, setCheckoutResult] = useState<CheckoutNormalResponse | CheckoutFeesResponse | null>(null);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  
  // Checkout form states
  const [photos, setPhotos] = useState<File[]>([]);
  const [mileage, setMileage] = useState('');
  const [batteryLevel, setBatteryLevel] = useState('');
  const [exteriorCondition, setExteriorCondition] = useState('good');
  const [interiorCondition, setInteriorCondition] = useState('good');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [damageDescription, setDamageDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [customerNotes, setCustomerNotes] = useState('');
  
  // Fee states
  const [hasAdditionalFees, setHasAdditionalFees] = useState(false);
  const [lateFee, setLateFee] = useState('');
  const [damageFee, setDamageFee] = useState('');
  const [otherFees, setOtherFees] = useState('');

  // Stats
  const [stats, setStats] = useState({
    active: 0,
    pending_payment: 0,
    completed: 0,
    total: 0
  });

  // Load rentals
  const loadRentals = useCallback(async (page?: number, limit?: number, status?: typeof statusFilter) => {
    setLoading(true);
    try {
      const pageToLoad = page !== undefined ? page : pagination.page;
      const limitToLoad = limit !== undefined ? limit : pagination.limit;
      const statusToLoad = status !== undefined ? status : statusFilter;
      
      const response = await getStaffRentals({
        status: statusToLoad === 'all' ? undefined : statusToLoad,
        page: pageToLoad,
        limit: limitToLoad
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
      const pending = response.data.rentals.filter(r => r.status === 'pending_payment' || r.status === 'pending_deposit').length;
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
      const errorMessage = (error as {response?: {data?: {message?: string}}, message?: string})?.response?.data?.message || 
                          (error as Error)?.message || 
                          'Lỗi khi tải danh sách rentals';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, statusFilter]);

  useEffect(() => {
    loadRentals();
  }, [loadRentals]);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleCreateContract = async () => {
    if (!selectedRental) return;
    
    setCreatingContract(true);
    try {
      const response = await createContract({
        rental_id: selectedRental._id,
        notes: contractNotes || 'Contract cho thuê xe điện',
      });
      
      toast({
        title: "Thành công",
        description: response.message,
        variant: "success",
        duration: 3000,
      });
      
      setShowCreateContractDialog(false);
      setContractNotes('');
      
      // Reload rental detail to see updated info
      const updatedRental = await getRentalById(selectedRental._id);
      setSelectedRental(updatedRental.data);
      
      // Reload rentals list
      loadRentals();
    } catch (error: unknown) {
      console.error('Create Contract Error:', error);
      const errorMessage = (error as {response?: {data?: {message?: string}}, message?: string})?.response?.data?.message || 
                          (error as Error)?.message || 
                          'Lỗi khi tạo contract';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setCreatingContract(false);
    }
  };

  const handleViewDetail = async (rental: Rental) => {
    setShowDetailDialog(true);
    setDetailLoading(true);
    try {
      const response = await getRentalById(rental._id);
      setSelectedRental(response.data);
    } catch (error: unknown) {
      console.error('Rental Detail API Error:', error);
      const errorMessage = (error as {response?: {data?: {message?: string}}, message?: string})?.response?.data?.message || 
                          (error as Error)?.message || 
                          'Lỗi khi lấy chi tiết rental';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      setShowDetailDialog(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStartCheckout = async (rentalId: string) => {
    // Reset form
    setCheckoutStep('form');
    setCheckoutResult(null);
    setPhotos([]);
    setMileage('');
    setBatteryLevel('');
    setExteriorCondition('good');
    setInteriorCondition('good');
    setInspectionNotes('');
    setDamageDescription('');
    setPaymentMethod('vnpay');
    setCustomerNotes('');
    setHasAdditionalFees(false);
    setLateFee('');
    setDamageFee('');
    setOtherFees('');
    
    setShowCheckoutDialog(true);
    setCheckoutLoading(true);
    try {
      const response = await getCheckoutInfo(rentalId);
      setCheckoutInfo(response.data);
    } catch (error: unknown) {
      console.error('Checkout Info API Error:', error);
      const errorMessage = (error as {response?: {data?: {message?: string}}, message?: string})?.response?.data?.message || 
                          (error as Error)?.message || 
                          'Lỗi khi lấy thông tin checkout';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      setShowCheckoutDialog(false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 10) {
      toast({
        title: "Cảnh báo",
        description: "Chỉ được upload tối đa 10 ảnh",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmitCheckout = async () => {
    if (!checkoutInfo) return;

    // Validation
    if (!mileage || !batteryLevel) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin bắt buộc",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Check if any fees are entered
    const hasFeesEntered = hasAdditionalFees && (lateFee || damageFee || otherFees);

    setCheckoutSubmitting(true);
    try {
      let response;
      
      if (hasFeesEntered) {
        // Use checkout-fees endpoint
        response = await checkoutFees(checkoutInfo.rental?.id || '', {
          photos,
          mileage: parseInt(mileage),
          battery_level: parseInt(batteryLevel),
          exterior_condition: exteriorCondition,
          interior_condition: interiorCondition,
          inspection_notes: inspectionNotes,
          damage_description: damageDescription,
          payment_method: paymentMethod,
          customer_notes: customerNotes,
          late_fee: lateFee ? parseInt(lateFee) : 0,
          damage_fee: damageFee ? parseInt(damageFee) : 0,
          other_fees: otherFees ? parseInt(otherFees) : 0,
        });
      } else {
        // Use checkout-normal endpoint
        response = await checkoutNormal(checkoutInfo.rental?.id || '', {
          photos,
          mileage: parseInt(mileage),
          battery_level: parseInt(batteryLevel),
          exterior_condition: exteriorCondition,
          interior_condition: interiorCondition,
          inspection_notes: inspectionNotes,
          damage_description: damageDescription,
          payment_method: paymentMethod,
          customer_notes: customerNotes,
        });
      }

      setCheckoutResult(response);
      setCheckoutStep('result');
      
      toast({
        title: "Thành công",
        description: response.message,
        variant: "success",
        duration: 3000,
      });
      
      // Reload rentals list
      loadRentals();
    } catch (error: unknown) {
      console.error('Checkout API Error:', error);
      const errorMessage = (error as {response?: {data?: {message?: string}}, message?: string})?.response?.data?.message || 
                          (error as Error)?.message || 
                          'Lỗi khi thực hiện checkout';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
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
      case 'pending_deposit':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Chờ thanh toán cọc
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

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Chờ ký
          </Badge>
        );
      case 'signed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đã ký
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-gray-600">
            <XCircle className="h-3 w-3 mr-1" />
            Đã hủy
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Hết hạn
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const translateVehicleStatus = (status: string) => {
    switch (status) {
      case 'available':
        return 'Sẵn sàng';
      case 'rented':
        return 'Đang cho thuê';
      case 'maintenance':
        return 'Bảo trì';
      case 'reserved':
        return 'Đã đặt trước';
      default:
        return status;
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
             Quản lý thuê xe
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Danh sách các rental tại station của bạn
          </p>
        </div>
        <Button 
          onClick={() => loadRentals()}
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
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                Đang thuê
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <FaMotorcycle className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.active}</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">Rentals đang hoạt động</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Chờ thanh toán
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">{stats.pending_payment}</div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">Cần xử lý thanh toán</p>
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
                Hoàn thành
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.completed}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Rentals đã hoàn thành</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
                Tổng cộng
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.total}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">Tất cả rentals</p>
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
                setStatusFilter(value as 'active' | 'pending_payment' | 'pending_deposit' | 'completed' | 'all');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
                <SelectTrigger className="w-[200px] border-2 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 Tất cả</SelectItem>
                  <SelectItem value="active">🛵 Đang thuê</SelectItem>
                  <SelectItem value="pending_payment">💰 Chờ thanh toán</SelectItem>
                  <SelectItem value="pending_deposit">💰 Chờ thanh toán cọc</SelectItem>
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
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                  {/* Header with gradient based on status */}
                  <div className={`h-2 ${
                    rental.status === 'active' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    rental.status === 'pending_payment' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                    'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`} />
                  
                  <CardContent className="p-6 flex-1 flex flex-col">
                    {/* Code and Status */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {rental.code}
                      </div>
                      {getStatusBadge(rental.status)}
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-3 mb-4 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {rental.user_id?.fullname || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">{rental.user_id?.phone || ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <FaMotorcycle className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {rental.vehicle_id?.license_plate || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">{rental.vehicle_id?.name || ''}</p>
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
                      className="w-full border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 transition-all mt-auto"
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
          {pagination.total > 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <TablePagination
                  currentPage={pagination.page}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={(page) => loadRentals(page)}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  disabled={loading}
                  itemsPerPageOptions={[5, 10, 20, 50]}
                />
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
                      {selectedRental.booking_id?.start_date ? new Date(selectedRental.booking_id.start_date).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">Ngày kết thúc:</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-300">
                      {selectedRental.booking_id?.end_date ? new Date(selectedRental.booking_id.end_date).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">Tổng giá booking:</span>
                    <span className="font-bold text-lg text-green-600 dark:text-green-400">
                      {formatPrice(selectedRental.booking_id?.total_price || 0)}
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
                      <span className="col-span-2 font-medium">{selectedRental.user_id?.fullname || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="col-span-2 font-medium text-xs break-all">{selectedRental.user_id?.email || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Điện thoại:</span>
                      <span className="col-span-2 font-medium">{selectedRental.user_id?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </Card>

                {/* Vehicle Info */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-green-600 dark:text-green-400 flex items-center gap-2">
                    <FaMotorcycle className="h-4 w-4" />
                    Thông tin xe
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Biển số:</span>
                      <span className="col-span-2 font-medium">{selectedRental.vehicle_id?.license_plate || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Tên xe:</span>
                      <span className="col-span-2 font-medium">{selectedRental.vehicle_id?.name || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Model:</span>
                      <span className="col-span-2 font-medium">{selectedRental.vehicle_id?.model || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Battery className="h-3 w-3" />
                        Dung lượng pin:
                      </span>
                      <span className="col-span-2 font-medium">{selectedRental.vehicle_id?.battery_capacity || 'N/A'} kWh</span>
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
                    <span className="col-span-2 font-medium">{selectedRental.station_id?.name || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Địa chỉ:</span>
                    <span className="col-span-2 font-medium text-xs">{selectedRental.station_id?.address || 'N/A'}</span>
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
                      <span className="font-medium">{selectedRental.vehicle_condition_before.mileage || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Battery className="h-3 w-3" />
                        Pin:
                      </span>
                      <span className="font-medium">{selectedRental.vehicle_condition_before.battery_level != null ? `${selectedRental.vehicle_condition_before.battery_level}%` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Ngoại hình (dàn áo):</span>
                      {getConditionBadge(selectedRental.vehicle_condition_before.exterior_condition)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Kỹ thuật (mô tơ – điện):</span>
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
                        <span className="font-medium">{selectedRental.vehicle_condition_after.mileage || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Battery className="h-3 w-3" />
                          Pin:
                        </span>
                        <span className="font-medium">{selectedRental.vehicle_condition_after.battery_level != null ? `${selectedRental.vehicle_condition_after.battery_level}%` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Ngoại hình (dàn áo):</span>
                        {getConditionBadge(selectedRental.vehicle_condition_after.exterior_condition)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Kỹ thuật (mô tơ – điện):</span>
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

              {/* Action Buttons */}
              {selectedRental.status === 'active' && (
                <div className="flex flex-col gap-6 pt-4">
                  {/* Hiển thị Contract Status nếu có */}
                  {selectedRental.contract ? (
                    <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Thông tin Contract
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Mã Contract:</p>
                          <p className="font-bold text-blue-700 dark:text-blue-300">{selectedRental.contract.code}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Trạng thái:</p>
                          {getContractStatusBadge(selectedRental.contract.status)}
                        </div>
                        {selectedRental.contract.staff_signed_at && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Staff đã ký:</p>
                            <p className="text-xs text-green-600 dark:text-green-400">✅ {formatDateTime(selectedRental.contract.staff_signed_at)}</p>
                          </div>
                        )}
                        {selectedRental.contract.customer_signed_at && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Khách hàng đã ký:</p>
                            <p className="text-xs text-green-600 dark:text-green-400">✅ {formatDateTime(selectedRental.contract.customer_signed_at)}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ) : (
                    // Chỉ hiện nút "Tạo Contract" nếu CHƯA CÓ contract
                    <div className="flex justify-center">
                      <Button
                        onClick={() => {
                          setShowCreateContractDialog(true);
                          setContractNotes('');
                        }}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                        size="lg"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Tạo Contract
                      </Button>
                    </div>
                  )}
                  
                  {/* Button Checkout - chỉ hiện nếu có contract signed */}
                  {selectedRental.contract?.is_signed && (
                    <div className="flex justify-center">
                      <Button
                        onClick={() => handleStartCheckout(selectedRental._id)}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                        size="lg"
                      >
                        <FaMotorcycle className="h-5 w-5 mr-2" />
                        Trả xe / Checkout
                      </Button>
                    </div>
                  )}
                  
                  {/* Warning nếu contract chưa ký */}
                  {selectedRental.contract && !selectedRental.contract.is_signed && (
                    <Card className="p-3 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-semibold text-orange-900 dark:text-orange-300 mb-1">
                            ⚠️ Chờ ký hợp đồng
                          </p>
                          <p className="text-orange-800 dark:text-orange-400">
                            Contract cần được ký bởi cả staff và khách hàng trước khi checkout.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}
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
                alt="Rental Image" 
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Contract Dialog */}
      <Dialog 
        open={showCreateContractDialog} 
        onOpenChange={(open) => {
          if (!creatingContract) {
            setShowCreateContractDialog(open);
          }
        }}
      >
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            if (creatingContract) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (creatingContract) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">📝 Tạo Contract từ Rental</DialogTitle>
            <DialogDescription>
              Tạo hợp đồng thuê xe điện cho rental này
            </DialogDescription>
          </DialogHeader>
          
          {selectedRental && (
            <div className="space-y-4 py-4">
              {/* Rental Info */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-3 text-blue-700 dark:text-blue-400">
                  Thông tin Rental
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Mã Rental:</p>
                    <p className="font-bold text-blue-700 dark:text-blue-300">{selectedRental.code}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Khách hàng:</p>
                    <p className="font-semibold">{selectedRental.user_id?.fullname || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Xe:</p>
                    <p className="font-semibold">{selectedRental.vehicle_id?.license_plate || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Trạm:</p>
                    <p className="font-semibold text-xs">{selectedRental.station_id?.name || 'N/A'}</p>
                  </div>
                </div>
              </Card>

              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contract-notes">
                    Ghi chú <span className="text-xs text-gray-500">(Optional)</span>
                  </Label>
                  <Textarea
                    id="contract-notes"
                    placeholder="Contract cho thuê xe điện"
                    value={contractNotes}
                    onChange={(e) => setContractNotes(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Mặc định: "Contract cho thuê xe điện"
                  </p>
                </div>

              </div>

              {/* Important Note */}
              <Card className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                      Điều kiện tiên quyết:
                    </p>
                    <p className="text-yellow-800 dark:text-yellow-400">
                      Phải đã hoàn tất thanh toán (có ít nhất một payment loại deposit hoặc rental_fee ở trạng thái completed)
                    </p>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <div className="flex justify-center gap-4 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateContractDialog(false)}
                  disabled={creatingContract}
                  className="px-8"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateContract}
                  disabled={creatingContract}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 shadow-lg"
                >
                  {creatingContract ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Tạo Contract
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog 
        open={showCheckoutDialog} 
        onOpenChange={(open) => {
          // Chỉ cho phép đóng khi không đang loading, không đang submit, hoặc đã có kết quả
          if (!checkoutLoading && !checkoutSubmitting) {
            setShowCheckoutDialog(open);
          }
        }}
      >
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            // Ngăn đóng khi đang loading hoặc đang submit
            if (checkoutLoading || checkoutSubmitting) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Ngăn đóng khi đang loading hoặc đang submit
            if (checkoutLoading || checkoutSubmitting) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">🛵 Thông tin trả xe / Checkout</DialogTitle>
            <DialogDescription>
              Xem lại thông tin trước khi tiến hành trả xe
            </DialogDescription>
          </DialogHeader>
          
          {checkoutLoading ? (
            <div className="text-center py-16">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-green-500" />
              <p className="text-lg text-gray-600 dark:text-gray-300">Đang tải thông tin checkout...</p>
            </div>
          ) : checkoutInfo && (
            <div className="space-y-6 py-4">
              {/* Rental Info */}
              <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Thông tin Rental
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Mã Rental:</p>
                    <p className="font-bold text-green-700 dark:text-green-300">{checkoutInfo.rental?.code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Thời gian bắt đầu:</p>
                    <p className="font-semibold">{checkoutInfo.rental?.actual_start_time ? formatDateTime(checkoutInfo.rental.actual_start_time) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Thời lượng:</p>
                    <p className="font-bold text-lg text-blue-600">
                      {checkoutInfo.rental?.rental_duration_hours || 0} giờ
                    </p>
                  </div>
                </div>
              </Card>

              {/* Customer & Vehicle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Khách hàng
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Họ tên:</p>
                      <p className="font-semibold">{checkoutInfo.customer?.fullname || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Email:</p>
                      <p className="font-medium text-xs break-all">{checkoutInfo.customer?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Điện thoại:</p>
                      <p className="font-semibold">{checkoutInfo.customer?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-green-600 dark:text-green-400 flex items-center gap-2">
                    <FaMotorcycle className="h-4 w-4" />
                    Xe
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Biển số:</p>
                      <p className="font-bold text-lg">{checkoutInfo.vehicle?.license_plate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Tên xe:</p>
                      <p className="font-semibold">{checkoutInfo.vehicle?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Dung lượng pin:</p>
                      <p className="font-medium flex items-center gap-1">
                        <Battery className="h-3 w-3" />
                        {checkoutInfo.vehicle?.battery_capacity || 'N/A'} kWh
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Station & Staff Info */}
              <Card className="p-4">
                <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Trạm & Staff
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Trạm:</p>
                    <p className="font-semibold">{checkoutInfo.station?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-1">{checkoutInfo.station?.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Staff nhận xe:</p>
                    <p className="font-semibold">{checkoutInfo.pickup_staff?.fullname || 'N/A'}</p>
                  </div>
                </div>
              </Card>

              {/* Vehicle Condition Before */}
              <Card className="p-4">
                <h4 className="font-medium mb-3 text-orange-600 dark:text-orange-400">
                  Tình trạng xe khi nhận
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Gauge className="h-6 w-6 text-gray-600 mb-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Km</p>
                    <p className="font-bold text-lg">{checkoutInfo.rental?.vehicle_condition_before?.mileage || 0}</p>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Battery className="h-6 w-6 text-green-600 mb-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Pin</p>
                    <p className="font-bold text-lg text-green-600">
                      {checkoutInfo.rental?.vehicle_condition_before?.battery_level ? `${checkoutInfo.rental.vehicle_condition_before.battery_level}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FaMotorcycle className="h-6 w-6 text-blue-600 mb-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Ngoại hình (dàn áo)</p>
                    {getConditionBadge(checkoutInfo.rental?.vehicle_condition_before?.exterior_condition || null)}
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FaMotorcycle className="h-6 w-6 text-purple-600 mb-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Kỹ thuật (mô tơ – điện)</p>
                    {getConditionBadge(checkoutInfo.rental?.vehicle_condition_before?.interior_condition || null)}
                  </div>
                </div>
                {checkoutInfo.rental?.vehicle_condition_before?.notes && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ghi chú khi nhận xe:</p>
                    <p className="text-sm">{checkoutInfo.rental.vehicle_condition_before.notes}</p>
                  </div>
                )}
              </Card>

              {/* Images Before */}
              {checkoutInfo.rental?.images_before && checkoutInfo.rental.images_before.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Hình ảnh khi nhận xe
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {checkoutInfo.rental.images_before.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Before ${idx + 1}`}
                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(img)}
                      />
                    ))}
                  </div>
                </Card>
              )}

              {/* Checkout Form or Result */}
              {checkoutStep === 'form' ? (
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="font-semibold text-lg">📝 Thông tin trả xe</h3>
                  
                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="photos" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Ảnh xe khi trả <span className="text-xs text-gray-500">(Tối đa 10 ảnh)</span>
                    </Label>
                    <Input
                      id="photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                    {photos.length > 0 && (
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {photos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Photo ${idx + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemovePhoto(idx)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mileage & Battery */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mileage" className="flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Số km * <span className="text-xs text-gray-500">(sau khi trả)</span>
                      </Label>
                      <Input
                        id="mileage"
                        type="number"
                        min="0"
                        placeholder="VD: 1050"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="battery" className="flex items-center gap-2">
                        <Battery className="h-4 w-4" />
                        Mức pin (%) *
                      </Label>
                      <Input
                        id="battery"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="VD: 75"
                        value={batteryLevel}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Chỉ cho phép nhập số từ 0 đến 100
                          if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
                            setBatteryLevel(value);
                          }
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tình trạng ngoại hình (dàn áo) *</Label>
                      <Select value={exteriorCondition} onValueChange={setExteriorCondition}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">✨Xuất sắc</SelectItem>
                          <SelectItem value="good">✅Tốt</SelectItem>
                          <SelectItem value="fair">⚠️Khá</SelectItem>
                          <SelectItem value="poor">❌Kém</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tình trạng kỹ thuật (mô tơ – điện) *</Label>
                      <Select value={interiorCondition} onValueChange={setInteriorCondition}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">✨Xuất sắc</SelectItem>
                          <SelectItem value="good">✅Tốt</SelectItem>
                          <SelectItem value="fair">⚠️Khá</SelectItem>
                          <SelectItem value="poor">❌Kém</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="inspection">Ghi chú kiểm tra xe</Label>
                    <Textarea
                      id="inspection"
                      placeholder="VD: Xe sạch sẽ, không có hư hỏng..."
                      value={inspectionNotes}
                      onChange={(e) => setInspectionNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="damage">Mô tả hư hỏng (nếu có)</Label>
                    <Textarea
                      id="damage"
                      placeholder="VD: Không có hư hỏng..."
                      value={damageDescription}
                      onChange={(e) => setDamageDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>Phương thức thanh toán</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Tiền mặt</SelectItem>
                        {/* <SelectItem value="bank_transfer">🏦 Chuyển khoản</SelectItem>
                        <SelectItem value="credit_card">💳 Thẻ tín dụng</SelectItem> */}
                        <SelectItem value="vnpay">💳 VNPay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-notes">Ghi chú từ khách hàng</Label>
                    <Textarea
                      id="customer-notes"
                      placeholder="VD: Xe chạy tốt, không có vấn đề gì..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Additional Fees Section */}
                  <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <Label htmlFor="has-fees" className="text-base font-semibold text-orange-900 dark:text-orange-300 cursor-pointer">
                          Có phí phát sinh
                        </Label>
                      </div>
                      <input
                        id="has-fees"
                        type="checkbox"
                        checked={hasAdditionalFees}
                        onChange={(e) => setHasAdditionalFees(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </div>
                    
                    {hasAdditionalFees && (
                      <>
                        {/* Bảng giá tham khảo */}
                        <Card className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                          <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            📊 Bảng giá tham khảo
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            {/* Phí trễ giờ */}
                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 space-y-2">
                              <p className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Phí trễ giờ
                              </p>
                              <div className="space-y-1.5">
                                <button
                                  type="button"
                                  onClick={() => setLateFee('20000')}
                                  className="w-full text-left px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">1-2 giờ:</span>
                                  <span className="font-bold ml-2">20,000đ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLateFee('50000')}
                                  className="w-full text-left px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">3-6 giờ:</span>
                                  <span className="font-bold ml-2">50,000đ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLateFee('100000')}
                                  className="w-full text-left px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">&gt;6 giờ:</span>
                                  <span className="font-bold ml-2">100,000đ</span>
                                </button>
                              </div>
                            </div>

                            {/* Phí hư hỏng xe */}
                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-700 space-y-2">
                              <p className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                                <AlertCircle className="h-3 w-3" />
                                Phí hư hỏng xe
                              </p>
                              <div className="space-y-1.5">
                                <button
                                  type="button"
                                  onClick={() => setDamageFee('50000')}
                                  className="w-full text-left px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">Trầy nhẹ:</span>
                                  <span className="font-bold ml-2">50,000đ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDamageFee('150000')}
                                  className="w-full text-left px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">Hư hỏng vừa:</span>
                                  <span className="font-bold ml-2">150,000đ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDamageFee('300000')}
                                  className="w-full text-left px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">Hư hỏng nặng:</span>
                                  <span className="font-bold ml-2">300,000đ</span>
                                </button>
                              </div>
                            </div>

                            {/* Phí phụ trội khác */}
                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 space-y-2">
                              <p className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                <DollarSign className="h-3 w-3" />
                                Phí phụ trội khác
                              </p>
                              <div className="space-y-1.5">
                                <button
                                  type="button"
                                  onClick={() => setOtherFees('25000')}
                                  className="w-full text-left px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">Vệ sinh xe:</span>
                                  <span className="font-bold ml-2">25,000đ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOtherFees('50000')}
                                  className="w-full text-left px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">Mất phụ kiện:</span>
                                  <span className="font-bold ml-2">50,000đ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOtherFees('100000')}
                                  className="w-full text-left px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">Vi phạm khác:</span>
                                  <span className="font-bold ml-2">100,000đ</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                            <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>💡 <strong>Mẹo:</strong> Nhấn vào giá để tự động điền, hoặc nhập số tiền tùy chỉnh bên dưới</span>
                            </p>
                          </div>
                        </Card>

                        {/* Các input fields */}
                        <div className="space-y-4 pt-4 border-t border-orange-200 dark:border-orange-700">
                          <div className="space-y-2">
                            <Label htmlFor="late-fee" className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Phí trễ giờ (VNĐ)
                            </Label>
                            <Input
                              id="late-fee"
                              type="number"
                              min="0"
                              placeholder="VD: 50000"
                              value={lateFee}
                              onChange={(e) => setLateFee(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="damage-fee" className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Phí hư hỏng xe (VNĐ)
                            </Label>
                            <Input
                              id="damage-fee"
                              type="number"
                              min="0"
                              placeholder="VD: 75000"
                              value={damageFee}
                              onChange={(e) => setDamageFee(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="other-fees" className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Phí phụ trội khác (VNĐ)
                            </Label>
                            <Input
                              id="other-fees"
                              type="number"
                              min="0"
                              placeholder="VD: 25000"
                              value={otherFees}
                              onChange={(e) => setOtherFees(e.target.value)}
                            />
                          </div>
                          
                          {(lateFee || damageFee || otherFees) && (
                            <div className="pt-4 border-t border-orange-200 dark:border-orange-700">
                              <div className="flex items-center justify-between text-lg font-bold">
                                <span className="text-orange-900 dark:text-orange-300">Tổng phí phát sinh:</span>
                                <span className="text-red-600 dark:text-red-400">
                                  {formatPrice(
                                    (lateFee ? parseInt(lateFee) : 0) +
                                    (damageFee ? parseInt(damageFee) : 0) +
                                    (otherFees ? parseInt(otherFees) : 0)
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </Card>

                  {/* Submit Buttons */}
                  <div className="flex justify-center gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCheckoutDialog(false)}
                      disabled={checkoutLoading || checkoutSubmitting}
                      className="px-8"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleSubmitCheckout}
                      disabled={checkoutLoading || checkoutSubmitting || !mileage || !batteryLevel}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 shadow-lg"
                    >
                      {checkoutSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Hoàn tất trả xe
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : checkoutResult && (
                <div className="space-y-6 pt-6 border-t">
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <h3 className="text-2xl font-bold text-green-600 mb-2">
                      {checkoutResult.message}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Mã rental: <span className="font-bold">{checkoutResult.data.rental.code}</span>
                    </p>
                  </div>

                  {/* Rental Status */}
                  <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Trạng thái</p>
                        <Badge className={checkoutResult.data.rental.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {checkoutResult.data.rental.status === 'completed' ? '✅ Hoàn thành' : '⏳ Chờ thanh toán'}
                        </Badge>
                      </div>
                      {'checkout_info' in checkoutResult.data && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Số ngày thuê</p>
                          <p className="font-bold text-lg">{checkoutResult.data.checkout_info.rental_days}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phí phát sinh</p>
                        <p className="font-bold text-lg">{formatPrice(checkoutResult.data.fee_breakdown.total_fees)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Trạng thái xe</p>
                        <Badge variant="outline">{translateVehicleStatus(checkoutResult.data.vehicle_status)}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tổng thanh toán</p>
                        <p className="font-bold text-lg text-green-600">{formatPrice(checkoutResult.data.total_paid)}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Status Reason */}
                  {'checkout_info' in checkoutResult.data && checkoutResult.data.checkout_info && (
                    <Card className="p-4">
                      <p className="text-sm">
                        <strong>Lý do:</strong> {checkoutResult.data.checkout_info.status_reason}
                      </p>
                    </Card>
                  )}

                  {/* Payments */}
                  {checkoutResult.data.payments.length > 0 && (
                    <Card className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Thông tin thanh toán
                      </h4>
                      <div className="space-y-2">
                        {checkoutResult.data.payments.map((payment, idx) => {
                          const paymentUrls = 'payment_urls' in checkoutResult.data ? checkoutResult.data.payment_urls : undefined;
                          const paymentUrl = paymentUrls?.[payment.id];
                          
                          return (
                            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">
                                    {payment.type === 'deposit' ? '💰 Thanh toán cọc' : 
                                     payment.type === 'additional_fee' ? '💳 Thanh toán phí phát sinh' : '💳 Thanh toán'}
                                  </p>
                                  <p className="text-xs text-gray-500">{payment.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg text-green-600">
                                    {formatPrice(payment.amount)}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {payment.status === 'pending' ? '⏳ Chờ' : '✅ Đã thanh toán'}
                                  </Badge>
                                </div>
                              </div>
                              
                              {paymentUrl && payment.status === 'pending' && (
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <Button
                                    onClick={() => navigate('/payments', { 
                                      state: { 
                                        paymentId: payment.id,
                                        showQr: true,
                                        qrData: {
                                          qrData: paymentUrl.paymentUrl,
                                          qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentUrl.paymentUrl)}`,
                                          qrText: `Mã giao dịch: ${paymentUrl.orderId}\nSố tiền: ${formatPrice(paymentUrl.amount)}\nQuét mã QR hoặc truy cập link để thanh toán VNPay`,
                                          vnpayData: {
                                            paymentUrl: paymentUrl.paymentUrl,
                                            orderId: paymentUrl.orderId,
                                            txnRef: payment.id,
                                            orderInfo: `Thanh toán ${payment.description}`,
                                            amount: paymentUrl.amount,
                                            createDate: new Date().toISOString(),
                                            expireDate: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                                            params: {}
                                          }
                                        }
                                      }
                                    })}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 text-sm font-medium shadow-md hover:shadow-lg"
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Thanh toán ngay {formatPrice(paymentUrl.amount)}
                                  </Button>
                                  <p className="text-xs text-gray-500 mt-1 text-center">
                                    Mã đơn: {paymentUrl.orderId}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {'payment_urls' in checkoutResult.data && checkoutResult.data.payment_urls && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Vui lòng hoàn tất thanh toán để kết thúc giao dịch
                          </p>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Uploaded Images */}
                  {checkoutResult.data.images?.uploaded && checkoutResult.data.images.uploaded.length > 0 && (
                    <Card className="p-4">
                      <h4 className="font-medium mb-3">Ảnh đã upload</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {checkoutResult.data.images.uploaded.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Uploaded ${idx + 1}`}
                            className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImageClick(img)}
                          />
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Close Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => {
                        setShowCheckoutDialog(false);
                        setShowDetailDialog(false);
                      }}
                      className="px-8"
                    >
                      Đóng
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

