import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  User,
  Filter,
  X,
  UserPlus,
  Eye,
  MapPin,
  QrCode,
  Upload,
  Camera,
  Keyboard
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { TablePagination } from '@/components/ui/table-pagination';
import { 
  getStationBookings, 
  getBookingDetails,
  confirmBooking, 
  cancelBooking,
  createWalkInBooking,
  scanQRCode,
  type Booking, 
  type BookingListResponse, 
  type BookingListParams,
  type ConfirmBookingRequest,
  type VehicleCondition,
  type ConfirmBookingResponse,
  type WalkInBookingRequest,
  type WalkInBookingResponse,
  type ScanQRResponse 
} from '@/api/booking';
import { getStaffVehicleById, getStaffVehicles, type Vehicle } from '@/api/vehicles';

const Booking: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Booking['status'] | 'all'>('all');
  const [hasError, setHasError] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  const handleItemsPerPageChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    loadBookings(undefined, 1, newLimit);
  };
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateType, setDateType] = useState<'booking' | 'pickup' | 'return'>('booking');
  
  // Confirm booking dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmBookingResponse | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoadingVehicleData, setIsLoadingVehicleData] = useState(false);
  
  // Walk-in booking dialog state
  const [isWalkInDialogOpen, setIsWalkInDialogOpen] = useState(false);
  const [isCreatingWalkIn, setIsCreatingWalkIn] = useState(false);
  const [walkInResult, setWalkInResult] = useState<WalkInBookingResponse | null>(null);
  const [showWalkInResult, setShowWalkInResult] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  
  // Booking detail dialog state
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<Booking | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  // Cancel booking dialog state
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [shouldRefund, setShouldRefund] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  
  // QR Scanner dialog state
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrCodeManual, setQrCodeManual] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanQRResponse | null>(null);
  const [showScanResult, setShowScanResult] = useState(false);
  const [qrImagePreview, setQrImagePreview] = useState<string | null>(null);
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear?: () => void } | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);
  
  // Walk-in form data
  const [walkInFormData, setWalkInFormData] = useState<WalkInBookingRequest>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_cmnd: '',
    model: '',
    color: '',
    start_date: '',
    end_date: '',
    pickup_time: '08:00',
    return_time: '18:00',
    special_requests: '',
    notes: ''
  });
  
  // Form data for confirmation
  const [vehicleCondition, setVehicleCondition] = useState<VehicleCondition>({
    battery_level: 85,
    mileage: 15000,
    exterior_condition: 'good',
    interior_condition: 'good',
    notes: ''
  });
  const [staffNotes, setStaffNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const { toast } = useToast();

  // Helper function to parse error message
  const parseErrorMessage = (error: unknown, defaultMessage: string = 'Đã xảy ra lỗi'): string => {
    if (!error) return defaultMessage;
    
    if (typeof error === 'string') return error;
    
    // Try to get error from API response first (Axios error structure)
    const apiError = (error as {response?: {data?: {message?: string}}, message?: string})?.response?.data?.message;
    if (apiError) return apiError;
    
    if (error && typeof error === 'object' && 'message' in error) {
      const msg = (error as Error).message;
      
      // Try to parse JSON if it's a JSON string
      try {
        const parsed = JSON.parse(msg);
        return parsed.message || msg || defaultMessage;
      } catch {
        return msg || defaultMessage;
      }
    }
    
    return defaultMessage;
  };

  // Load bookings data
  const loadBookings = useCallback(async (params?: BookingListParams, page?: number, limit?: number) => {
    setIsLoading(true);
    try {
      const pageToLoad = page !== undefined ? page : pagination.page;
      const limitToLoad = limit !== undefined ? limit : pagination.limit;
      const response: BookingListResponse = await getStationBookings({
        page: pageToLoad,
        limit: limitToLoad,
        ...params
      });

      setBookings(response.bookings);
      setFilteredBookings(response.bookings);
      setPagination({
        page: response.pagination?.current || pageToLoad,
        limit: limitToLoad,
        total: response.pagination?.totalRecords || response.bookings.length,
        pages: response.pagination?.total || Math.ceil((response.pagination?.totalRecords || response.bookings.length) / limitToLoad)
      });
      
    } catch (error: unknown) {
      console.error('Error loading bookings:', error);
      setHasError(true);
      toast({
        title: "Lỗi",
        description: parseErrorMessage(error, 'Lỗi khi tải danh sách booking'),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Handle DD/MM/YYYY HH:mm:ss format
      if (dateStr.includes('/') && dateStr.includes(' ')) {
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('/');
        // Convert to YYYY-MM-DDTHH:mm:ss format for reliable parsing
        const isoDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
        const date = new Date(isoDateStr);
        
        if (isNaN(date.getTime())) {
          console.log('Still invalid after reformatting:', dateStr, isoDateStr);
          return 'N/A';
        }
        return date.toLocaleDateString('vi-VN');
      }
      
      // Fallback for other formats
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.log('Invalid date string:', dateStr);
        return 'N/A';
      }
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      console.log('Error formatting date:', dateStr, error);
      return 'N/A';
    }
  };


  const getStatusVariant = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'outline';
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

  const getStatusClassName = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      default:
        return '';
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
        return <FaMotorcycle className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'checked_in':
        return <FaMotorcycle className="h-4 w-4 text-green-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Reset form data
  const resetConfirmForm = () => {
    setVehicleCondition({
      battery_level: 85,
      mileage: 15000,
      exterior_condition: 'good',
      interior_condition: 'good',
      notes: ''
    });
    setStaffNotes('');
    setSelectedFiles([]);
  };

  // Open confirm dialog and fetch vehicle data
  const openConfirmDialog = async (bookingId: string) => {
    setConfirmingBookingId(bookingId);
    resetConfirmForm();
    setIsConfirmDialogOpen(true);
    setShowResult(false);
    setConfirmResult(null);
    
    // Find the booking to get vehicle_id
    const booking = bookings.find(b => b._id === bookingId);
    
    if (booking && booking.vehicle_id) {
      // Get vehicle ID - handle both string and object types
      const vehicleId = typeof booking.vehicle_id === 'string' 
        ? booking.vehicle_id 
        : booking.vehicle_id._id;
      
      if (vehicleId) {
        setIsLoadingVehicleData(true);
        try {
          // Fetch vehicle data using STAFF endpoint
          const vehicleResponse = await getStaffVehicleById(vehicleId);
          const vehicleData = vehicleResponse.vehicle;
          
          // Update vehicle condition with real data from vehicle
          setVehicleCondition(prev => ({
            ...prev,
            battery_level: vehicleData.current_battery || 0,
            mileage: vehicleData.current_mileage || 0,
          }));
        } catch (error) {
          console.error('Error fetching vehicle data:', error);
          toast({
            title: "⚠️ Cảnh báo",
            description: "Không thể tải thông tin xe. Vui lòng nhập thủ công.",
            variant: "destructive",
            duration: 3000,
          });
        } finally {
          setIsLoadingVehicleData(false);
        }
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      toast({
        title: "Cảnh báo",
        description: "Chỉ được chọn tối đa 5 ảnh",
        variant: "destructive",
        duration: 3000,
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
        duration: 3000,
      });
      return;
    }

    if (!staffNotes.trim()) {
      toast({
        title: "Lỗi", 
        description: "Vui lòng nhập ghi chú của nhân viên",
        variant: "destructive",
        duration: 3000,
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
        variant: "success",
        duration: 3000,
      });
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: parseErrorMessage(error, 'Không thể xác nhận booking'),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const openCancelDialog = (bookingId: string) => {
    setCancelingBookingId(bookingId);
    setCancelReason('');
    setShouldRefund(false);
    setIsCancelDialogOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!cancelingBookingId || !cancelReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do hủy",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsCanceling(true);
    try {
      const response = await cancelBooking(
        cancelingBookingId, 
        cancelReason.trim(),
        shouldRefund
      );
      
      // Verify response has required fields
      if (!response || !response.booking || !response.booking._id) {
        console.error('Invalid booking data received:', response);
        throw new Error('Dữ liệu booking không hợp lệ');
      }
      
      setBookings(prev => 
        prev.map(booking => 
          booking._id === cancelingBookingId ? response.booking : booking
        )
      );
      
      // Update booking detail if it's the same booking
      if (selectedBookingDetail?._id === cancelingBookingId) {
        setSelectedBookingDetail(response.booking);
      }
      
      // Show refund info in toast if available
      if (response.refund_info) {
        toast({
          title: "✅ Hủy booking thành công",
          description: response.refund_info.message,
          variant: "success",
          duration: 5000,
        });
      } else {
        toast({
          title: "Thành công",
          description: response.message || `Đã hủy booking ${response.booking.code || response.booking._id}`,
          variant: "success",
          duration: 3000,
        });
      }
      
      setIsCancelDialogOpen(false);
      setCancelingBookingId(null);
      setCancelReason('');
      setShouldRefund(false);
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: parseErrorMessage(error, 'Không thể hủy booking'),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsCanceling(false);
    }
  };

  // Reset walk-in form
  const resetWalkInForm = () => {
    setWalkInFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      customer_cmnd: '',
      model: '',
      color: '',
      start_date: '',
      end_date: '',
      pickup_time: '08:00',
      return_time: '18:00',
      special_requests: '',
      notes: ''
    });
  };

  // Load available vehicles for walk-in booking
  const loadAvailableVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const response = await getStaffVehicles({
        page: 1,
        limit: 100,
        status: 'available'
      });
      
      // Filter to only include vehicles with status 'available' (không bao gồm reserved, rented, maintenance)
      const availableOnly = response.vehicles.filter(v => v.status === 'available');
      setAvailableVehicles(availableOnly);
      
      if (availableOnly.length === 0) {
        toast({
          title: "ℹ️ Thông báo",
          description: "Hiện tại không có xe nào sẵn sàng cho thuê.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast({
        title: "⚠️ Cảnh báo",
        description: "Không thể tải danh sách xe. Vui lòng thử lại.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // Handle vehicle selection for walk-in booking
  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const selectedVehicle = availableVehicles.find(v => v._id === vehicleId);
    if (selectedVehicle) {
      setWalkInFormData(prev => ({
        ...prev,
        model: selectedVehicle.model,
        color: selectedVehicle.color
      }));
    }
  };

  // Open walk-in dialog
  const openWalkInDialog = () => {
    resetWalkInForm();
    setSelectedVehicleId('');
    setIsWalkInDialogOpen(true);
    setShowWalkInResult(false);
    setWalkInResult(null);
    loadAvailableVehicles();
  };

  // Handle walk-in form change
  const handleWalkInFormChange = (field: keyof WalkInBookingRequest, value: string) => {
    setWalkInFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // If start_date is changed and end_date is before the new start_date, reset end_date
      if (field === 'start_date' && value && prev.end_date) {
        const newStartDate = new Date(value);
        const currentEndDate = new Date(prev.end_date);
        
        if (currentEndDate < newStartDate) {
          newData.end_date = '';
        }
      }
      
      return newData;
    });
  };

  // Validate walk-in form
  const validateWalkInForm = (): string | null => {
    if (!walkInFormData.customer_name.trim()) return 'Vui lòng nhập tên khách hàng';
    if (!walkInFormData.customer_phone.trim()) return 'Vui lòng nhập số điện thoại';
    if (!walkInFormData.customer_email.trim()) return 'Vui lòng nhập email';
    if (!selectedVehicleId) return 'Vui lòng chọn xe';
    if (!walkInFormData.start_date) return 'Vui lòng chọn ngày bắt đầu';
    if (!walkInFormData.end_date) return 'Vui lòng chọn ngày kết thúc';
    if (!walkInFormData.pickup_time) return 'Vui lòng chọn giờ nhận xe';
    if (!walkInFormData.return_time) return 'Vui lòng chọn giờ trả xe';
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(walkInFormData.customer_email)) {
      return 'Email không hợp lệ';
    }
    
    // Validate phone format (basic)
    if (walkInFormData.customer_phone.length < 10) {
      return 'Số điện thoại không hợp lệ';
    }
    
    // Validate dates - cannot be in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    const startDate = new Date(walkInFormData.start_date);
    const endDate = new Date(walkInFormData.end_date);
    
    if (startDate < today) {
      return 'Ngày bắt đầu không được là ngày trong quá khứ';
    }
    
    if (endDate < today) {
      return 'Ngày kết thúc không được là ngày trong quá khứ';
    }
    
    if (endDate < startDate) {
      return 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    return null;
  };

  // Handle create walk-in booking
  const handleCreateWalkInBooking = async () => {
    const validationError = validateWalkInForm();
    if (validationError) {
      toast({
        title: "Lỗi",
        description: validationError,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsCreatingWalkIn(true);
    try {
      const response = await createWalkInBooking(walkInFormData);
      
      setWalkInResult(response);
      setShowWalkInResult(true);
      
      // Reload bookings to show the new one
      await loadBookings();
      
      toast({
        title: "Thành công",
        description: response.message,
        variant: "success",
        duration: 3000,
      });
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: parseErrorMessage(error, 'Không thể tạo booking walk-in'),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsCreatingWalkIn(false);
    }
  };

  // Load booking detail
  const loadBookingDetail = async (bookingId: string) => {
    setIsLoadingDetail(true);
    try {
      const response = await getBookingDetails(bookingId);
      setSelectedBookingDetail(response.booking);
      setIsDetailDialogOpen(true);
      
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: parseErrorMessage(error, 'Không thể tải chi tiết booking'),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Handle QR code image upload
  const handleQRImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file hình ảnh",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageDataUrl = event.target?.result as string;
      setQrImagePreview(imageDataUrl);

      // Decode QR code from image
      try {
        const image = new Image();
        image.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Import jsQR dynamically
          const jsQR = (await import('jsqr')).default;
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            setQrCodeManual(code.data);
            toast({
              title: "Thành công",
              description: `Đã đọc được mã QR: ${code.data}`,
              variant: "success",
              duration: 3000,
            });
          } else {
            toast({
              title: "Lỗi",
              description: "Không thể đọc mã QR từ hình ảnh. Vui lòng thử lại hoặc nhập thủ công.",
              variant: "destructive",
              duration: 3000,
            });
          }
        };
        image.src = imageDataUrl;
      } catch (error) {
        console.error('Error decoding QR code:', error);
        toast({
          title: "Lỗi",
          description: "Không thể đọc mã QR từ hình ảnh",
          variant: "destructive",
          duration: 3000,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle scan QR code
  const handleScanQR = async () => {
    if (!qrCodeManual.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã QR hoặc upload hình ảnh",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsScanning(true);
    try {
      const response = await scanQRCode(qrCodeManual.trim());
      setScanResult(response);
      setShowScanResult(true);
      
      // Reload bookings to update the list
      await loadBookings();
      
      toast({
        title: "✅ Thành công",
        description: response.message,
        variant: "success",
        duration: 3000,
      });
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: parseErrorMessage(error, 'Không thể quét mã QR'),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Stop camera scanner
  const stopCameraScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        // Try to stop the scanner
        await scannerRef.current.stop();
      } catch (err: unknown) {
        // Ignore "scanner is not running" errors - this is normal
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (!errorMessage.includes('not running') && !errorMessage.includes('paused')) {
          console.error('Error stopping camera:', err);
        }
      } finally {
        // Always cleanup
        try {
          scannerRef.current.clear?.();
        } catch {
          // Ignore clear errors
        }
        scannerRef.current = null;
        setIsCameraActive(false);
        
        // Clear the DOM element
        if (qrReaderRef.current) {
          qrReaderRef.current.innerHTML = '';
        }
      }
    } else {
      // If no scanner ref but state says active, reset state
      setIsCameraActive(false);
    }
  }, []);

  // Start camera scanner
  const startCameraScanner = useCallback(async () => {
    if (!qrReaderRef.current) return;
    
    // Don't start if already active
    if (isCameraActive || scannerRef.current) {
      // Silently return, camera is already running
      return;
    }

    try {
      setIsCameraActive(true);
      const { Html5Qrcode } = await import('html5-qrcode');

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      const qrCodeSuccessCallback = async (decodedText: string) => {
        console.log('QR Code detected:', decodedText);
        setQrCodeManual(decodedText);
        
        // Stop scanner after detection
        await stopCameraScanner();
        
        // Show success toast
        toast({
          title: "✅ Đã phát hiện mã QR",
          description: `Mã: ${decodedText} - Nhấn "Xác nhận & Check-in" để tiếp tục`,
          variant: "success",
          duration: 3000,
        });
      };

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera on mobile
        config,
        qrCodeSuccessCallback,
        undefined
      );
    } catch (err) {
      console.error('Error starting camera:', err);
      setIsCameraActive(false);
      scannerRef.current = null;
      toast({
        title: "Lỗi",
        description: "Không thể khởi động camera. Vui lòng cho phép quyền truy cập camera.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [isCameraActive, stopCameraScanner, toast]);

  // Effect to cleanup camera when dialog closes or scan method changes
  useEffect(() => {
    // Stop camera when switching away from camera tab or closing dialog
    if (!isQRScannerOpen || scanMethod !== 'camera' || showScanResult) {
      stopCameraScanner();
    }

    // Cleanup on unmount
    return () => {
      stopCameraScanner();
    };
  }, [isQRScannerOpen, scanMethod, showScanResult, stopCameraScanner]);

  // Reset QR scanner
  const resetQRScanner = () => {
    setQrCodeManual('');
    setQrImagePreview(null);
    setScanResult(null);
    setShowScanResult(false);
    setScanMethod('camera');
    stopCameraScanner();
  };

  // Open QR scanner dialog
  const openQRScanner = () => {
    resetQRScanner();
    setIsQRScannerOpen(true);
  };

  // Open booking detail dialog
  const openDetailDialog = (bookingId: string) => {
    loadBookingDetail(bookingId);
  };


  // Apply advanced filters
  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadBookings({
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search: searchTerm || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      dateType: dateType,
    }, 1);
    setShowAdvancedFilters(false);
  };

  // Clear advanced filters
  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setDateType('booking');
    setSearchTerm('');
    setSelectedStatus('all');
    setPagination(prev => ({ ...prev, page: 1 }));
    loadBookings(undefined, 1);
    setShowAdvancedFilters(false);
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
              Không thể tải giao diện quản lý đặt xe. Vui lòng thử lại.
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Quản lý đặt xe
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
                Quản lý tất cả đặt xe tại trạm của bạn
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={openQRScanner}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <QrCode className="h-5 w-5" />
                <span className="font-semibold">Quét QR</span>
              </Button>
              <Button 
                onClick={openWalkInDialog}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <UserPlus className="h-5 w-5" />
                <span className="font-semibold">Tạo Walk-in Booking</span>
              </Button>
              <Button 
                onClick={() => loadBookings()}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowAdvancedFilters(true)}
              >
                <Filter className="h-4 w-4" />
                Bộ lọc nâng cao
                {(startDate || endDate) && (
                  <Badge variant="secondary" className="ml-2">
                    {[startDate, endDate].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              {(startDate || endDate || searchTerm) && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleClearFilters}
                  title="Xóa tất cả bộ lọc"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Tổng số</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Chờ xử lý</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium">Đã xác nhận</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.confirmed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <FaMotorcycle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">Đang thuê</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.in_progress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">Hoàn thành</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-red-700 dark:text-red-400 font-medium">Đã hủy</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">{stats.cancelled}</p>
                  </div>
                </div>
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
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 gap-2">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="pending">Chờ xử lý</TabsTrigger>
                <TabsTrigger value="confirmed">Đã xác nhận</TabsTrigger>
                <TabsTrigger value="checked_in" className="hidden lg:flex">Đã nhận xe</TabsTrigger>
                <TabsTrigger value="in_progress" className="hidden lg:flex">Đang thuê</TabsTrigger>
                <TabsTrigger value="completed" className="hidden lg:flex">Hoàn thành</TabsTrigger>
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
                  <FaMotorcycle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
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
                        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{booking.code || 'N/A'}</h3>
                                  {getStatusIcon(booking.status)}
                                  <Badge variant={getStatusVariant(booking.status)} className={`text-xs px-2 py-1 ${getStatusClassName(booking.status)}`}>
                                    {getStatusText(booking.status)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {booking.booking_type === 'online' ? '🌐 Online' : '🏢 Tại chỗ'}
                                  </Badge>
                                </div>
                                {typeof booking.vehicle_id === 'object' && booking.vehicle_id && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                    <FaMotorcycle className="h-4 w-4" />
                                    <span className="font-medium">{booking.vehicle_id.name}</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{booking.vehicle_id.license_plate}</span>
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDetailDialog(booking._id)}
                                  className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Chi tiết
                                </Button>
                                
                                {booking.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => openConfirmDialog(booking._id)}
                                    className="bg-green-600 hover:bg-green-700 shadow-md"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Xác nhận
                                  </Button>
                                )}
                                
                                {booking.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openCancelDialog(booking._id)}
                                    className="shadow-md"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Hủy
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="text-sm flex-1">
                                  <p className="font-medium text-gray-700 dark:text-gray-300">Thời gian thuê</p>
                                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                                    {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                  <Clock className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="text-sm flex-1">
                                  <p className="font-medium text-gray-700 dark:text-gray-300">Giờ nhận/trả</p>
                                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                                    {booking.pickup_time || 'N/A'} - {booking.return_time || 'N/A'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                  <User className="h-4 w-4 text-orange-600" />
                                </div>
                                <div className="text-sm flex-1">
                                  <p className="font-medium text-gray-700 dark:text-gray-300">Khách hàng</p>
                                  <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                                    {typeof booking.user_id === 'object' && booking.user_id?.fullname 
                                      ? booking.user_id.fullname 
                                      : (booking.user_id ? String(booking.user_id).slice(-8) + '...' : 'N/A')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                  <CreditCard className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="text-sm flex-1">
                                  <p className="font-medium text-gray-700 dark:text-gray-300">Tổng tiền</p>
                                  <p className="text-green-600 font-bold">
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

              {/* Pagination */}
              {pagination.total > 0 && (
                <Card className="border-0 shadow-lg mt-8">
                  <CardContent className="p-4">
                    <TablePagination
                      currentPage={pagination.page}
                      totalItems={pagination.total}
                      itemsPerPage={pagination.limit}
                      onPageChange={(page) => {
                        loadBookings(undefined, page);
                      }}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      disabled={isLoading}
                      itemsPerPageOptions={[5, 10, 20, 50]}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
          </motion.div>

          {/* Confirm Booking Dialog */}
          <Dialog 
            open={isConfirmDialogOpen} 
            onOpenChange={(open) => {
              // Prevent closing dialog while confirming
              if (!isConfirming) {
                setIsConfirmDialogOpen(open);
              }
            }}
          >
            <DialogContent 
              className="max-w-4xl max-h-[90vh] overflow-y-auto"
              onInteractOutside={(e) => {
                // Prevent closing when clicking outside during confirmation
                if (isConfirming) {
                  e.preventDefault();
                }
              }}
              onEscapeKeyDown={(e) => {
                // Prevent closing with ESC key during confirmation
                if (isConfirming) {
                  e.preventDefault();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>
                  {showResult ? 'Kết quả xác nhận booking' : 'Xác nhận bàn giao xe'}
                </DialogTitle>
              </DialogHeader>
              
              {!showResult ? (
                // Form for confirmation
                <div className="space-y-6 py-4 relative">
                  
                  {/* Vehicle Condition Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Tình trạng xe trước bàn giao</h3>
                      {isLoadingVehicleData && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Đang tải dữ liệu xe...</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="battery_level">
                          Mức pin (%) 
                          <span className="text-xs text-green-600 ml-2"></span>
                        </Label>
                        <Input
                          id="battery_level"
                          type="number"
                          value={vehicleCondition.battery_level ?? 0}
                          readOnly
                          disabled
                          placeholder={isLoadingVehicleData ? "Đang tải..." : "Mức pin"}
                          className="bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="mileage">
                          Số km đã đi
                          <span className="text-xs text-green-600 ml-2"></span>
                        </Label>
                        <Input
                          id="mileage"
                          type="number"
                          value={vehicleCondition.mileage ?? 0}
                          readOnly
                          disabled
                          placeholder={isLoadingVehicleData ? "Đang tải..." : "Số km"}
                          className="bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="exterior_condition">Tình trạng ngoại hình (dàn áo)</Label>
                        <Select 
                          value={vehicleCondition.exterior_condition || 'good'} 
                          onValueChange={(value) => setVehicleCondition((prev: VehicleCondition) => ({
                            ...prev,
                            exterior_condition: value
                          }))}
                          disabled={isConfirming}
                        >
                          <SelectTrigger id="exterior_condition" disabled={isConfirming}>
                            <SelectValue placeholder="Chọn tình trạng" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">✨ Xuất sắc</SelectItem>
                            <SelectItem value="good">✅ Tốt</SelectItem>
                            <SelectItem value="fair">⚠️ Khá</SelectItem>
                            <SelectItem value="poor">❌ Kém</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="interior_condition">Tình trạng kỹ thuật (mô tơ – điện)</Label>
                        <Select 
                          value={vehicleCondition.interior_condition || 'good'} 
                          onValueChange={(value) => setVehicleCondition((prev: VehicleCondition) => ({
                            ...prev,
                            interior_condition: value
                          }))}
                          disabled={isConfirming}
                        >
                          <SelectTrigger id="interior_condition" disabled={isConfirming}>
                            <SelectValue placeholder="Chọn tình trạng" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">✨ Xuất sắc</SelectItem>
                            <SelectItem value="good">✅ Tốt</SelectItem>
                            <SelectItem value="fair">⚠️ Khá</SelectItem>
                            <SelectItem value="poor">❌ Kém</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="vehicle_notes">Ghi chú về tình trạng xe</Label>
                      <Textarea
                        id="vehicle_notes"
                        value={vehicleCondition.notes || ''}
                        onChange={(e) => setVehicleCondition((prev: VehicleCondition) => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        placeholder="Ví dụ: Xe sạch sẽ, không có vết xước"
                        rows={2}
                        disabled={isConfirming}
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
                      disabled={isConfirming}
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
                      disabled={isConfirming}
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
                        <FaMotorcycle className="h-5 w-5 mr-2" />
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
                    {confirmResult.payment && (
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
                    )}

                    {/* Rental Info */}
                    {confirmResult.rental && (
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
                    )}
                  </div>
                )
              )}
            </DialogContent>
          </Dialog>

          {/* Walk-in Booking Dialog */}
          <Dialog open={isWalkInDialogOpen} onOpenChange={setIsWalkInDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {showWalkInResult ? 'Tạo Walk-in Booking thành công' : 'Tạo Walk-in Booking'}
                </DialogTitle>
              </DialogHeader>
              
              {!showWalkInResult ? (
                // Form for walk-in booking
                <div className="space-y-6 py-4">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Thông tin khách hàng
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_name">Họ và tên *</Label>
                        <Input
                          id="customer_name"
                          value={walkInFormData.customer_name}
                          onChange={(e) => handleWalkInFormChange('customer_name', e.target.value)}
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="customer_phone">Số điện thoại *</Label>
                        <Input
                          id="customer_phone"
                          value={walkInFormData.customer_phone}
                          onChange={(e) => handleWalkInFormChange('customer_phone', e.target.value)}
                          placeholder="0123456789"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_email">Email *</Label>
                        <Input
                          id="customer_email"
                          type="email"
                          value={walkInFormData.customer_email}
                          onChange={(e) => handleWalkInFormChange('customer_email', e.target.value)}
                          placeholder="nguyenvana@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <FaMotorcycle className="h-5 w-5" />
                      Thông tin xe
                    </h3>
                    
                    {/* Vehicle Selector */}
                    <div>
                      <Label htmlFor="vehicle_select">Chọn xe *</Label>
                      {isLoadingVehicles ? (
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Đang tải danh sách xe...</span>
                        </div>
                      ) : (
                        <Select value={selectedVehicleId} onValueChange={handleVehicleSelect}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="-- Chọn xe có sẵn --" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVehicles.length === 0 ? (
                              <div className="p-2 text-center text-sm text-gray-500">
                                Không có xe có sẵn
                              </div>
                            ) : (
                              availableVehicles.map((vehicle) => (
                                <SelectItem key={vehicle._id} value={vehicle._id}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{vehicle.brand} {vehicle.model}</span>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-sm">{vehicle.color}</span>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-xs text-gray-500">{vehicle.license_plate}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Display selected vehicle info */}
                    {selectedVehicleId && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Model xe</Label>
                          <p className="font-medium mt-1">{walkInFormData.model}</p>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Màu sắc</Label>
                          <p className="font-medium mt-1">{walkInFormData.color}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rental Period */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Thời gian thuê
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">Ngày bắt đầu *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={walkInFormData.start_date}
                          onChange={(e) => handleWalkInFormChange('start_date', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="end_date">Ngày kết thúc *</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={walkInFormData.end_date}
                          onChange={(e) => handleWalkInFormChange('end_date', e.target.value)}
                          min={walkInFormData.start_date || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pickup_time">Giờ nhận xe *</Label>
                        <Input
                          id="pickup_time"
                          type="time"
                          value={walkInFormData.pickup_time}
                          onChange={(e) => handleWalkInFormChange('pickup_time', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="return_time">Giờ trả xe *</Label>
                        <Input
                          id="return_time"
                          type="time"
                          value={walkInFormData.return_time}
                          onChange={(e) => handleWalkInFormChange('return_time', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Thông tin bổ sung</h3>
                    
                    <div>
                      <Label htmlFor="special_requests">Yêu cầu đặc biệt</Label>
                      <Textarea
                        id="special_requests"
                        value={walkInFormData.special_requests}
                        onChange={(e) => handleWalkInFormChange('special_requests', e.target.value)}
                        placeholder="Cần mũ bảo hiểm size L..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Ghi chú</Label>
                      <Textarea
                        id="notes"
                        value={walkInFormData.notes}
                        onChange={(e) => handleWalkInFormChange('notes', e.target.value)}
                        placeholder="Khách hàng lần đầu thuê xe điện..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsWalkInDialogOpen(false)}
                      disabled={isCreatingWalkIn}
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleCreateWalkInBooking}
                      disabled={isCreatingWalkIn}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isCreatingWalkIn ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Tạo Walk-in Booking
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // Results display
                walkInResult && (
                  <div className="space-y-6 py-4">
                    <div className="text-center">
                      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-green-600 mb-2">
                        {walkInResult.message}
                      </h2>
                    </div>

                    {/* Booking Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <FaMotorcycle className="h-5 w-5 mr-2" />
                        Thông tin Booking
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Mã booking:</span> {walkInResult.data.booking.code}
                        </div>
                        <div>
                          <span className="font-medium">Khách hàng:</span> {walkInResult.data.booking.customer.name}
                        </div>
                        <div>
                          <span className="font-medium">Số điện thoại:</span> {walkInResult.data.booking.customer.phone}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {walkInResult.data.booking.customer.email}
                        </div>
                        <div>
                          <span className="font-medium">Xe:</span> {walkInResult.data.booking.vehicle.name}
                        </div>
                        <div>
                          <span className="font-medium">Biển số:</span> {walkInResult.data.booking.vehicle.license_plate}
                        </div>
                        <div>
                          <span className="font-medium">Trạm:</span> {walkInResult.data.booking.station}
                        </div>
                        <div>
                          <span className="font-medium">Thời gian:</span> {formatDate(walkInResult.data.booking.start_date)} - {formatDate(walkInResult.data.booking.end_date)}
                        </div>
                        <div>
                          <span className="font-medium">Tổng tiền:</span> {formatPrice(walkInResult.data.booking.total_price)}
                        </div>
                        <div>
                          <span className="font-medium">Tiền cọc:</span> {formatPrice(walkInResult.data.booking.deposit_amount)}
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    {walkInResult.data.booking.qr_code && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                        <h3 className="text-lg font-semibold mb-3">Mã QR</h3>
                        <div className="bg-white p-4 inline-block rounded-lg">
                          <p className="text-2xl font-mono font-bold">{walkInResult.data.booking.qr_code}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Hết hạn: {formatDate(walkInResult.data.booking.qr_expires_at)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Các bước tiếp theo
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        {walkInResult.data.next_steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Close Button */}
                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={() => {
                          setIsWalkInDialogOpen(false);
                          setShowWalkInResult(false);
                          setWalkInResult(null);
                          resetWalkInForm();
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

          {/* Booking Detail Dialog */}
          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FaMotorcycle className="h-5 w-5" />
                  Chi tiết Booking
                </DialogTitle>
              </DialogHeader>
              
              {isLoadingDetail ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Đang tải chi tiết booking...</p>
                </div>
              ) : selectedBookingDetail ? (
                <div className="space-y-6 py-4">
                  {/* Header Info */}
                  <div className="flex justify-between items-start p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedBookingDetail.code || 'N/A'}
                      </h2>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedBookingDetail.status)}
                        <Badge variant={getStatusVariant(selectedBookingDetail.status)} className={`text-sm ${getStatusClassName(selectedBookingDetail.status)}`}>
                          {getStatusText(selectedBookingDetail.status)}
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                          {selectedBookingDetail.booking_type === 'online' ? '🌐 Đặt online' : '🏢 Đặt tại chỗ'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tổng tiền</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(selectedBookingDetail.total_price)}
                      </p>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          Thông tin khách hàng
                        </h3>
                        <div className="space-y-2 text-sm">
                          {typeof selectedBookingDetail.user_id === 'object' ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Họ tên:</span>
                                <span className="font-medium">{selectedBookingDetail.user_id.fullname || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                                <span className="font-medium">{selectedBookingDetail.user_id.email || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Số điện thoại:</span>
                                <span className="font-medium">{selectedBookingDetail.user_id.phone || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Trạng thái KYC:</span>
                                <Badge 
                                  variant={
                                    selectedBookingDetail.user_id.kycStatus === 'approved' ? 'default' : 
                                    selectedBookingDetail.user_id.kycStatus === 'pending' ? 'secondary' : 
                                    'destructive'
                                  }
                                  className={
                                    selectedBookingDetail.user_id.kycStatus === 'approved' ? 'bg-green-600' : ''
                                  }
                                >
                                  {selectedBookingDetail.user_id.kycStatus === 'approved' ? 'Đã duyệt' :
                                   selectedBookingDetail.user_id.kycStatus === 'pending' ? 'Chờ duyệt' :
                                   'Từ chối'}
                                </Badge>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <FaMotorcycle className="h-5 w-5 text-green-600" />
                          Thông tin xe
                        </h3>
                        <div className="space-y-2 text-sm">
                          {typeof selectedBookingDetail.vehicle_id === 'object' ? (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400">Biển số xe:</span>
                                <span className="font-bold text-lg text-green-600">{selectedBookingDetail.vehicle_id.license_plate || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Tên xe:</span>
                                <span className="font-medium">{selectedBookingDetail.vehicle_id.name || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Hãng:</span>
                                <span className="font-medium">{selectedBookingDetail.vehicle_id.brand || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Model:</span>
                                <span className="font-medium">{selectedBookingDetail.vehicle_id.model || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Năm sản xuất:</span>
                                <span className="font-medium">{selectedBookingDetail.vehicle_id.year || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Màu sắc:</span>
                                <span className="font-medium">{selectedBookingDetail.vehicle_id.color || 'N/A'}</span>
                              </div>
                              {selectedBookingDetail.vehicle_id.images && selectedBookingDetail.vehicle_id.images.length > 0 && (
                                <div className="pt-2 border-t">
                                  <span className="text-gray-500 dark:text-gray-400 block mb-2">Hình ảnh xe:</span>
                                  <div className="grid grid-cols-2 gap-2">
                                    {selectedBookingDetail.vehicle_id.images.slice(0, 4).map((img, idx) => (
                                      <img 
                                        key={idx}
                                        src={img} 
                                        alt={`Vehicle ${idx + 1}`}
                                        className="w-full h-20 object-cover rounded border"
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-orange-600" />
                          Trạm
                        </h3>
                        <div className="space-y-2 text-sm">
                          {typeof selectedBookingDetail.station_id === 'object' ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Tên trạm:</span>
                                <span className="font-semibold">{selectedBookingDetail.station_id.name || 'N/A'}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-gray-500 dark:text-gray-400">Địa chỉ:</span>
                                <span className="font-medium text-right">{selectedBookingDetail.station_id.address || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Số điện thoại:</span>
                                <span className="font-medium">{selectedBookingDetail.station_id.phone || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                                <span className="font-medium">{selectedBookingDetail.station_id.email || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t">
                                <span className="text-gray-500 dark:text-gray-400">Giờ mở cửa:</span>
                                <span className="font-medium text-green-600">{selectedBookingDetail.station_id.opening_time || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Giờ đóng cửa:</span>
                                <span className="font-medium text-red-600">{selectedBookingDetail.station_id.closing_time || 'N/A'}</span>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-purple-600" />
                          Thời gian thuê
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Ngày bắt đầu:</span>
                            <span className="font-medium">{formatDate(selectedBookingDetail.start_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Ngày kết thúc:</span>
                            <span className="font-medium">{formatDate(selectedBookingDetail.end_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Giờ nhận xe:</span>
                            <span className="font-medium">{selectedBookingDetail.pickup_time || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Giờ trả xe:</span>
                            <span className="font-medium">{selectedBookingDetail.return_time || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-gray-500 dark:text-gray-400">Tổng số ngày:</span>
                            <span className="font-bold text-blue-600">{selectedBookingDetail.total_days} ngày</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-green-600" />
                          Chi phí
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Giá/ngày:</span>
                            <span className="font-medium">{formatPrice(selectedBookingDetail.price_per_day)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Tổng tiền:</span>
                            <span className="font-medium">{formatPrice(selectedBookingDetail.total_price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Tiền cọc:</span>
                            <span className="font-medium">{formatPrice(selectedBookingDetail.deposit_amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Phí trễ hạn:</span>
                            <span className="font-medium text-orange-600">{formatPrice(selectedBookingDetail.late_fee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Phí hư hỏng:</span>
                            <span className="font-medium text-red-600">{formatPrice(selectedBookingDetail.damage_fee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Phí khác:</span>
                            <span className="font-medium">{formatPrice(selectedBookingDetail.other_fees)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-gray-500 dark:text-gray-400">Tổng thanh toán:</span>
                            <span className="font-bold text-green-600">{formatPrice(selectedBookingDetail.final_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  {selectedBookingDetail.qr_code && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-3">Mã QR</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Mã QR:</span>
                          <span className="font-mono font-medium">{selectedBookingDetail.qr_code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Hết hạn:</span>
                          <span className="font-medium">{formatDate(selectedBookingDetail.qr_expires_at)}</span>
                        </div>
                        {selectedBookingDetail.qr_used_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Đã sử dụng:</span>
                            <span className="font-medium">{formatDate(selectedBookingDetail.qr_used_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  {selectedBookingDetail.special_requests && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        Yêu cầu đặc biệt
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedBookingDetail.special_requests}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedBookingDetail.notes && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <h3 className="text-lg font-semibold mb-2">Ghi chú</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedBookingDetail.notes}
                      </p>
                    </div>
                  )}

                  {/* Cancellation Info */}
                  {selectedBookingDetail.status === 'cancelled' && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        Thông tin hủy
                      </h3>
                      <div className="space-y-2 text-sm">
                        {selectedBookingDetail.cancellation_reason && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Lý do:</span>
                            <span className="font-medium">{selectedBookingDetail.cancellation_reason}</span>
                          </div>
                        )}
                        {selectedBookingDetail.cancelled_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Thời gian hủy:</span>
                            <span className="font-medium">{formatDate(selectedBookingDetail.cancelled_at)}</span>
                          </div>
                        )}
                        {selectedBookingDetail.cancelled_by && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Người hủy:</span>
                            <span className="font-medium">
                              {typeof selectedBookingDetail.cancelled_by === 'object' 
                                ? selectedBookingDetail.cancelled_by.fullname 
                                : String(selectedBookingDetail.cancelled_by).slice(-12)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Confirmation Info */}
                  {selectedBookingDetail.status === 'confirmed' && selectedBookingDetail.confirmed_at && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        Thông tin xác nhận
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Thời gian xác nhận:</span>
                          <span className="font-medium">{formatDate(selectedBookingDetail.confirmed_at)}</span>
                        </div>
                        {selectedBookingDetail.confirmed_by && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Người xác nhận:</span>
                            <span className="font-medium">
                              {typeof selectedBookingDetail.confirmed_by === 'object' 
                                ? selectedBookingDetail.confirmed_by.fullname 
                                : String(selectedBookingDetail.confirmed_by).slice(-12)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-600" />
                      Thời gian tạo & cập nhật
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Tạo lúc:</span>
                        <span className="font-medium">{formatDate(selectedBookingDetail.created_at || selectedBookingDetail.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Cập nhật:</span>
                        <span className="font-medium">{formatDate(selectedBookingDetail.updated_at || selectedBookingDetail.updatedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Trạng thái:</span>
                        <span className="font-medium">
                          {selectedBookingDetail.is_active ? (
                            <Badge variant="default" className="bg-green-600">Hoạt động</Badge>
                          ) : (
                            <Badge variant="destructive">Không hoạt động</Badge>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    {selectedBookingDetail.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => {
                            setIsDetailDialogOpen(false);
                            openConfirmDialog(selectedBookingDetail._id);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Xác nhận bàn giao
                        </Button>
                        <Button
                          onClick={() => {
                            setIsDetailDialogOpen(false);
                            openCancelDialog(selectedBookingDetail._id);
                          }}
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Hủy booking
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-300">Không có dữ liệu</p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Advanced Filters Dialog */}
          <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <span className="text-xl font-bold">Bộ lọc nâng cao</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Date Type Filter */}
                <div className="space-y-2">
                  <Label>Lọc theo loại ngày</Label>
                  <Select value={dateType} onValueChange={(value: 'booking' | 'pickup' | 'return') => setDateType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại ngày" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Ngày đặt xe</SelectItem>
                      <SelectItem value="pickup">Ngày lấy xe</SelectItem>
                      <SelectItem value="return">Ngày trả xe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Từ ngày</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Đến ngày</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Status Filter Dropdown */}
                <div className="space-y-2">
                  <Label>Lọc theo trạng thái đặt xe</Label>
                  <Select value={selectedStatus} onValueChange={(value) => {
                    setSelectedStatus(value as Booking['status'] | 'all');
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- Tất cả --</SelectItem>
                      <SelectItem value="pending">Chờ xác nhận</SelectItem>
                      <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                      <SelectItem value="checked_in">Đã nhận xe</SelectItem>
                      <SelectItem value="in_progress">Đang thuê</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Filters Summary */}
                {(startDate || endDate) && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Bộ lọc đang áp dụng:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {startDate && (
                        <Badge variant="secondary">
                          Từ: {startDate}
                        </Badge>
                      )}
                      {endDate && (
                        <Badge variant="secondary">
                          Đến: {endDate}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {dateType === 'booking' ? '📅 Ngày đặt' : dateType === 'pickup' ? '🚗 Ngày lấy xe' : '🔙 Ngày trả xe'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Xóa bộ lọc
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Áp dụng
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Cancel Booking Dialog */}
          <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Hủy đặt xe
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Bạn có chắc chắn muốn hủy booking này? Hành động này không thể hoàn tác.
                  </p>
                </div>
                
                {/* Refund checkbox - only show for online bookings with paid holding fee */}
                {(() => {
                  const bookingToCancel = bookings.find(b => b._id === cancelingBookingId);
                  return bookingToCancel?.booking_type === 'online' && 
                         bookingToCancel?.holding_fee?.status === 'paid' ? (
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Checkbox 
                        id="refund" 
                        checked={shouldRefund}
                        onCheckedChange={(checked) => setShouldRefund(checked === true)}
                      />
                      <Label htmlFor="refund" className="text-sm cursor-pointer">
                        <span className="font-semibold text-blue-900">Hoàn tiền giữ chỗ</span>
                        <span className="text-gray-600 ml-1">
                          (50,000đ - tiền mặt tại quầy)
                        </span>
                      </Label>
                    </div>
                  ) : null;
                })()}
                
                <div className="space-y-2">
                  <Label htmlFor="cancel-reason">Lý do hủy *</Label>
                  <Textarea
                    id="cancel-reason"
                    placeholder="Nhập lý do hủy booking..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCancelDialogOpen(false);
                      setCancelingBookingId(null);
                      setCancelReason('');
                      setShouldRefund(false);
                    }}
                    disabled={isCanceling}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelBooking}
                    disabled={isCanceling || !cancelReason.trim()}
                  >
                    {isCanceling ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Đang hủy...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Xác nhận hủy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* QR Scanner Dialog */}
          <Dialog open={isQRScannerOpen} onOpenChange={(open) => {
            setIsQRScannerOpen(open);
            if (!open) {
              stopCameraScanner();
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <QrCode className="h-6 w-6 text-green-600" />
                  {showScanResult ? 'Kết quả quét QR' : 'Quét mã QR'}
                </DialogTitle>
              </DialogHeader>
              
              {!showScanResult ? (
                // QR Scanner Form
                <div className="space-y-6 py-4">
                  {/* Scan Method Tabs */}
                  <Tabs value={scanMethod} onValueChange={(value) => setScanMethod(value as 'camera' | 'upload' | 'manual')}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="camera" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Camera
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload
                      </TabsTrigger>
                      <TabsTrigger value="manual" className="flex items-center gap-2">
                        <Keyboard className="h-4 w-4" />
                        Thủ công
                      </TabsTrigger>
                    </TabsList>

                    {/* Camera Scan Tab */}
                    <TabsContent value="camera" className="space-y-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Nhấn "Bật camera" và hướng vào mã QR trên điện thoại của khách hàng
                          </p>
                        </div>

                        {/* Camera Preview */}
                        <div className="relative">
                          <div 
                            id="qr-reader" 
                            ref={qrReaderRef}
                            className={`border-2 rounded-lg overflow-hidden ${
                              isCameraActive 
                                ? 'border-green-500 bg-black' 
                                : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                            }`}
                            style={{ width: '100%', minHeight: '300px' }}
                          >
                            {!isCameraActive && (
                              <div className="flex flex-col items-center justify-center h-full py-12">
                                <Camera className="h-16 w-16 text-gray-400 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  Camera chưa được khởi động
                                </p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                                  Nhấn nút "Bật camera" bên dưới
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {isCameraActive && (
                            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-lg">
                              <span className="animate-pulse h-2 w-2 bg-white rounded-full"></span>
                              Camera đang hoạt động
                            </div>
                          )}
                        </div>

                        {qrCodeManual && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                              ✅ Đã phát hiện mã QR:
                            </p>
                            <p className="text-lg font-mono font-bold text-green-600">
                              {qrCodeManual}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {!isCameraActive ? (
                            <Button
                              variant="outline"
                              onClick={startCameraScanner}
                              className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Bật camera
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={stopCameraScanner}
                              className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Tắt camera
                            </Button>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Upload Image Tab */}
                    <TabsContent value="upload" className="space-y-4">
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Tải lên hình chụp màn hình mã QR từ khách hàng
                          </p>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleQRImageUpload}
                            className="hidden"
                            id="qr-image-upload"
                            disabled={isScanning}
                          />
                          <label 
                            htmlFor="qr-image-upload" 
                            className="cursor-pointer flex flex-col items-center gap-3"
                          >
                            <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                              <Upload className="h-12 w-12 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">
                                Chọn hình ảnh chứa mã QR
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Hỗ trợ JPG, PNG, GIF
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* QR Image Preview */}
                        {qrImagePreview && (
                          <div className="mt-4">
                            <Label className="mb-2 block">Hình ảnh đã tải lên:</Label>
                            <div className="relative inline-block">
                              <img 
                                src={qrImagePreview} 
                                alt="QR Code Preview" 
                                className="max-w-xs max-h-64 object-contain rounded-lg border-2 border-blue-500"
                              />
                              <button
                                onClick={() => {
                                  setQrImagePreview(null);
                                  setQrCodeManual('');
                                }}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                disabled={isScanning}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {qrCodeManual && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                              ✅ Đã đọc được mã QR:
                            </p>
                            <p className="text-lg font-mono font-bold text-blue-600">
                              {qrCodeManual}
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Manual Input Tab */}
                    <TabsContent value="manual" className="space-y-4">
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Nhập mã QR mà khách hàng cung cấp
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="qr-manual" className="text-lg font-medium mb-2 block">
                            Mã QR
                          </Label>
                          <Input
                            id="qr-manual"
                            placeholder="Ví dụ: BKFVBHRS"
                            value={qrCodeManual}
                            onChange={(e) => setQrCodeManual(e.target.value.toUpperCase())}
                            className="text-lg font-mono tracking-wider text-center"
                            disabled={isScanning}
                          />
                        </div>

                        {qrCodeManual && (
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Mã đã nhập:
                            </p>
                            <p className="text-xl font-mono font-bold text-gray-900 dark:text-white text-center">
                              {qrCodeManual}
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsQRScannerOpen(false);
                        stopCameraScanner();
                      }}
                      disabled={isScanning}
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleScanQR}
                      disabled={isScanning || !qrCodeManual.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Xác nhận & Check-in
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // Scan Result Display
                scanResult && (
                  <div className="space-y-6 py-4">
                    {/* Success Header */}
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                        {scanResult.booking.isCheckedIn ? (
                          <CheckCircle className="h-12 w-12 text-green-600" />
                        ) : (
                          <AlertCircle className="h-12 w-12 text-yellow-600" />
                        )}
                      </div>
                      <h2 className={`text-2xl font-bold mb-2 ${scanResult.booking.isCheckedIn ? 'text-green-600' : 'text-yellow-600'}`}>
                        {scanResult.message}
                      </h2>
                      {scanResult.booking.isCheckedIn && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Khách hàng đã được check-in thành công
                        </p>
                      )}
                    </div>

                    {/* Booking Information */}
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <FaMotorcycle className="h-5 w-5 text-blue-600" />
                          Thông tin Booking
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Mã booking:</span>
                            <p className="font-bold text-lg text-blue-600">{scanResult.booking.code}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Trạng thái:</span>
                            <Badge variant={getStatusVariant(scanResult.booking.status as Booking['status'])} className={`mt-1 ${getStatusClassName(scanResult.booking.status as Booking['status'])}`}>
                              {getStatusText(scanResult.booking.status as Booking['status'])}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <User className="h-5 w-5 text-orange-600" />
                          Khách hàng
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Họ tên:</span>
                            <span className="font-medium">{scanResult.booking.user.fullname}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Email:</span>
                            <span className="font-medium">{scanResult.booking.user.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Số điện thoại:</span>
                            <span className="font-medium">{scanResult.booking.user.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <FaMotorcycle className="h-5 w-5 text-green-600" />
                          Xe thuê
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400">Biển số:</span>
                            <span className="font-bold text-lg text-green-600">{scanResult.booking.vehicle.license_plate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Tên xe:</span>
                            <span className="font-medium">{scanResult.booking.vehicle.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Hãng:</span>
                            <span className="font-medium">{scanResult.booking.vehicle.brand} {scanResult.booking.vehicle.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Màu sắc:</span>
                            <span className="font-medium">{scanResult.booking.vehicle.color}</span>
                          </div>
                        </div>
                      </div>

                      {/* Station Info */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-purple-600" />
                          Trạm
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Tên trạm:</span>
                            <span className="font-medium">{scanResult.booking.station.name}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 dark:text-gray-400">Địa chỉ:</span>
                            <span className="font-medium text-right">{scanResult.booking.station.address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Số điện thoại:</span>
                            <span className="font-medium">{scanResult.booking.station.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rental Period */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          Thời gian thuê
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Ngày bắt đầu:</span>
                            <span className="font-medium">{formatDate(scanResult.booking.start_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Ngày kết thúc:</span>
                            <span className="font-medium">{formatDate(scanResult.booking.end_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Giờ nhận xe:</span>
                            <span className="font-medium">{scanResult.booking.pickup_time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Giờ trả xe:</span>
                            <span className="font-medium">{scanResult.booking.return_time}</span>
                          </div>
                        </div>
                      </div>

                      {/* QR Info */}
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-3">Thông tin QR</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Hết hạn:</span>
                            <span className="font-medium">{formatDate(scanResult.booking.qr_expires_at)}</span>
                          </div>
                          {scanResult.booking.qr_used_at && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Đã sử dụng:</span>
                              <span className="font-medium text-green-600">{formatDate(scanResult.booking.qr_used_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsQRScannerOpen(false);
                          resetQRScanner();
                        }}
                      >
                        Đóng
                      </Button>
                      {scanResult.booking.isCheckedIn && (
                        <Button 
                          onClick={() => {
                            // Đóng modal QR
                            setIsQRScannerOpen(false);
                            resetQRScanner();
                            // Mở modal xác nhận bàn giao xe
                            openConfirmDialog(scanResult.booking._id);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Xác nhận 
                        </Button>
                      )}
                    </div>
                  </div>
                )
              )}
            </DialogContent>
          </Dialog>
      </motion.div>
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