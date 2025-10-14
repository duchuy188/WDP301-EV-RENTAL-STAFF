import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  User, 
  Calendar, 
  MapPin,
  Car,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Download,
  Search,
  Filter,
  Loader2,
  Ban
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getContracts, getContractById, signContract, downloadContractPdf, cancelContract, type Contract } from '@/api/contracts';
import { SignaturePad } from '@/components/SignaturePad';
import { formatDate, formatDateTime } from '@/lib/utils';

export function Contracts() {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signingContract, setSigningContract] = useState(false);
  const [showSignCustomerDialog, setShowSignCustomerDialog] = useState(false);
  const [signingCustomerContract, setSigningCustomerContract] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellingContract, setCancellingContract] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    signed: 0,
    cancelled: 0,
    expired: 0,
    total: 0
  });

  // Load contracts
  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getContracts({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
        sort: sortField !== 'none' ? sortField : undefined,
        order: sortField !== 'none' ? sortOrder : undefined,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setContracts(response.data.contracts);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      });

      // Calculate stats
      const pending = response.data.contracts.filter(c => c.status === 'pending').length;
      const signed = response.data.contracts.filter(c => c.status === 'signed').length;
      const cancelled = response.data.contracts.filter(c => c.status === 'cancelled').length;
      const expired = response.data.contracts.filter(c => c.status === 'expired').length;
      
      setStats({
        pending,
        signed,
        cancelled,
        expired,
        total: response.data.pagination.total
      });
    } catch (error: unknown) {
      console.error('Contracts API Error:', error);
      setContracts([]);
      const errorMessage = (error as Error)?.message || 'Lỗi khi tải danh sách contracts';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, searchQuery, sortField, sortOrder, toast]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleViewDetail = async (contract: Contract) => {
    setShowDetailDialog(true);
    setDetailLoading(true);
    try {
      const response = await getContractById(contract._id);
      setSelectedContract(response.data.contract);
    } catch (error: unknown) {
      console.error('Contract Detail API Error:', error);
      const errorMessage = (error as Error)?.message || 'Lỗi khi lấy chi tiết contract';
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

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadContracts();
  };

  const handleSignContract = async (signature: string) => {
    if (!selectedContract) return;
    
    setSigningContract(true);
    try {
      // Clean base64 (remove data URL prefix if exists)
      const cleanSignature = signature.replace(/^data:image\/\w+;base64,/, '');
      
      const response = await signContract(selectedContract._id, {
        signature: cleanSignature,
        signature_type: 'staff', // Staff always signs as staff
      });
      
      toast({
        title: "Thành công",
        description: response.message,
      });
      
      // Reload contract detail
      const updatedContract = await getContractById(selectedContract._id);
      setSelectedContract(updatedContract.data.contract);
      
      // Reload contracts list
      loadContracts();
      
      setShowSignDialog(false);
    } catch (error: unknown) {
      console.error('Sign Contract Error:', error);
      const errorMessage = (error as Error)?.message || 'Lỗi khi ký contract';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSigningContract(false);
    }
  };

  const handleSignCustomerContract = async (signature: string) => {
    if (!selectedContract) return;
    
    setSigningCustomerContract(true);
    try {
      // Clean base64 (remove data URL prefix if exists)
      const cleanSignature = signature.replace(/^data:image\/\w+;base64,/, '');
      
      const response = await signContract(selectedContract._id, {
        signature: cleanSignature,
        signature_type: 'customer', // Sign as customer
      });
      
      toast({
        title: "Thành công",
        description: response.message,
      });
      
      // Reload contract detail
      const updatedContract = await getContractById(selectedContract._id);
      setSelectedContract(updatedContract.data.contract);
      
      // Reload contracts list
      loadContracts();
      
      setShowSignCustomerDialog(false);
    } catch (error: unknown) {
      console.error('Sign Contract (Customer) Error:', error);
      const errorMessage = (error as Error)?.message || 'Lỗi khi ký contract cho khách hàng';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSigningCustomerContract(false);
    }
  };

  const handleDownloadPdf = async (contractId: string, contractCode: string) => {
    setDownloadingPdfId(contractId);
    try {
      await downloadContractPdf(contractId);
      toast({
        title: "Thành công",
        description: `Đã tải xuống PDF contract ${contractCode}`,
      });
    } catch (error) {
      console.error('Download PDF error:', error);
      toast({
        title: "Lỗi",
        description: (error as Error)?.message || "Không thể tải xuống PDF",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleOpenCancelDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setCancelReason('');
    setShowCancelDialog(true);
  };

  const handleCancelContract = async () => {
    if (!selectedContract) return;
    
    if (!cancelReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do hủy contract",
        variant: "destructive",
      });
      return;
    }

    setCancellingContract(true);
    try {
      await cancelContract(selectedContract._id, { reason: cancelReason });
      
      toast({
        title: "Thành công",
        description: `Đã hủy contract ${selectedContract.code}`,
      });

      // Reload contracts list
      loadContracts();
      
      setShowCancelDialog(false);
      setShowDetailDialog(false);
      setCancelReason('');
    } catch (error: unknown) {
      console.error('Cancel Contract Error:', error);
      const errorMessage = (error as Error)?.message || 'Lỗi khi hủy contract';
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCancellingContract(false);
    }
  };


  const getStatusBadge = (status: string, statusText?: string) => {
    const text = statusText || status;
    
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            {text}
          </Badge>
        );
      case 'signed':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            {text}
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            {text}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            {text}
          </Badge>
        );
      default:
        return <Badge variant="outline">{text}</Badge>;
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
             Quản lý hợp đồng
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Danh sách hợp đồng thuê xe điện
          </p>
        </div>
        <Button 
          onClick={loadContracts}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Chờ ký
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
                Đã ký
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.signed}</div>
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
                Đã hủy
              </CardTitle>
              <XCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
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
                Hết hạn
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng cộng
              </CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter & Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* First Row: Status Filter and Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">Trạng thái:</span>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}>
                  <SelectTrigger className="w-[180px] border-2 focus:border-blue-500">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">-- Tất cả --</SelectItem>
                    <SelectItem value="pending">pending</SelectItem>
                    <SelectItem value="signed">signed</SelectItem>
                    <SelectItem value="cancelled">cancelled</SelectItem>
                    <SelectItem value="expired">expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 flex-1 w-full md:flex-1">
                <Search className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <Input
                  placeholder="Tìm theo mã contract hoặc tiêu đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} size="sm">
                  Tìm
                </Button>
              </div>
            </div>

            {/* Second Row: Sort options and result count */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium whitespace-nowrap">Sắp xếp theo:</span>
                  <Select value={sortField} onValueChange={(value) => {
                    setSortField(value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}>
                    <SelectTrigger className="w-[180px] border-2 focus:border-blue-500">
                      <SelectValue placeholder="Chọn trường" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Không sắp xếp --</SelectItem>
                      <SelectItem value="createdAt">createdAt</SelectItem>
                      <SelectItem value="updatedAt">updatedAt</SelectItem>
                      <SelectItem value="valid_from">valid_from</SelectItem>
                      <SelectItem value="valid_until">valid_until</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium whitespace-nowrap">Thứ tự:</span>
                  <Select 
                    value={sortOrder} 
                    onValueChange={(value: 'asc' | 'desc') => {
                      setSortOrder(value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    disabled={sortField === 'none'}
                  >
                    <SelectTrigger className="w-[120px] border-2 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">asc ↑</SelectItem>
                      <SelectItem value="desc">desc ↓</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Hiển thị {contracts.length} trong {pagination.total} contracts
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      {loading ? (
        <div className="text-center py-16">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Đang tải danh sách contracts...</p>
        </div>
      ) : contracts.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-16">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Không có contract nào
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter !== 'all' || searchQuery
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' 
                : 'Chưa có contract nào trong hệ thống'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((contract, index) => (
              <motion.div
                key={contract._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Header with gradient based on status */}
                  <div className={`h-2 ${
                    contract.status === 'signed' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    contract.status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                    contract.status === 'expired' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    contract.status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    'bg-gradient-to-r from-gray-400 to-gray-500'
                  }`} />
                  
                  <CardContent className="p-6">
                    {/* Code and Status */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {contract.code}
                      </div>
                      {getStatusBadge(contract.status, contract.statusText)}
                    </div>

                    {/* Title */}
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">
                        {contract.title}
                      </h3>
                    </div>

                    {/* Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {contract.customer.fullname}
                          </p>
                          <p className="text-xs text-gray-500">{contract.customer.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {contract.vehicle.license_plate}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{contract.vehicle.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {formatDate(contract.valid_from)} - {formatDate(contract.valid_until)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {contract.station.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 transition-all"
                        onClick={() => handleViewDetail(contract)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Chi tiết
                      </Button>
                      {contract.contract_file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-2"
                          onClick={() => handleDownloadPdf(contract._id, contract.code)}
                          disabled={downloadingPdfId === contract._id}
                        >
                          {downloadingPdfId === contract._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
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
            <DialogTitle>Chi tiết Contract: {selectedContract?.code || '...'}</DialogTitle>
            <DialogDescription>
              Thông tin đầy đủ về hợp đồng
            </DialogDescription>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="text-center py-16">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-lg text-gray-600 dark:text-gray-300">Đang tải chi tiết contract...</p>
            </div>
          ) : selectedContract && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex justify-center">
                {getStatusBadge(selectedContract.status, selectedContract.statusText)}
              </div>

              {/* Title & Template */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                <h4 className="font-medium mb-2 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {selectedContract.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Template: {selectedContract.template.name}
                </p>
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
                      <span className="col-span-2 font-medium">{selectedContract.customer.fullname}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="col-span-2 font-medium text-xs break-all">{selectedContract.customer.email}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Điện thoại:</span>
                      <span className="col-span-2 font-medium">{selectedContract.customer.phone}</span>
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
                      <span className="col-span-2 font-medium">{selectedContract.vehicle.license_plate}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Tên xe:</span>
                      <span className="col-span-2 font-medium">{selectedContract.vehicle.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Model:</span>
                      <span className="col-span-2 font-medium">{selectedContract.vehicle.model}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Màu xe:</span>
                      <span className="col-span-2 font-medium">{selectedContract.vehicle.color}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Station & Valid Period */}
              <Card className="p-4">
                <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Thông tin trạm & thời hạn
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Trạm:</span>
                    <span className="col-span-2 font-medium">{selectedContract.station.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Địa chỉ:</span>
                    <span className="col-span-2 font-medium text-xs">{selectedContract.station.address}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Hiệu lực từ:</span>
                    <span className="col-span-2 font-medium">{formatDate(selectedContract.valid_from)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">Hiệu lực đến:</span>
                    <span className="col-span-2 font-medium">{formatDate(selectedContract.valid_until)}</span>
                  </div>
                </div>
              </Card>

              {/* Signatures */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-orange-600 dark:text-orange-400 flex items-center justify-between">
                    <span>Chữ ký Staff</span>
                    {selectedContract.staff_signed_at && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã ký
                      </Badge>
                    )}
                  </h4>
                  <div className="space-y-3 text-sm">
                    {selectedContract.staff_signed_at ? (
                      <>
                        {/* Signature Image - Display actual signature from base64 */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                          <p className="text-xs text-gray-500 mb-2 text-center">✍️ Chữ ký điện tử</p>
                          <div className="flex justify-center items-center min-h-24 bg-white dark:bg-gray-900 rounded">
                            {selectedContract.staff_signature ? (
                              <img 
                                src={`data:image/png;base64,${selectedContract.staff_signature}`}
                                alt="Staff Signature"
                                className="max-h-20 max-w-full object-contain"
                                style={{ imageRendering: 'crisp-edges' }}
                              />
                            ) : (
                              <p className="text-2xl font-signature text-orange-600 dark:text-orange-400">
                                {selectedContract.staff_signed_by?.fullname || 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Người ký:</span>
                          <span className="font-medium">{selectedContract.staff_signed_by?.fullname || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="font-medium text-xs">{selectedContract.staff_signed_by?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Thời gian:</span>
                          <span className="font-medium text-xs">{formatDateTime(selectedContract.staff_signed_at)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Chưa ký</p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400 flex items-center justify-between">
                    <span>Chữ ký Khách hàng</span>
                    {selectedContract.customer_signed_at && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã ký
                      </Badge>
                    )}
                  </h4>
                  <div className="space-y-3 text-sm">
                    {selectedContract.customer_signed_at ? (
                      <>
                        {/* Signature Image - Display actual signature from base64 */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                          <p className="text-xs text-gray-500 mb-2 text-center">✍️ Chữ ký điện tử</p>
                          <div className="flex justify-center items-center min-h-24 bg-white dark:bg-gray-900 rounded">
                            {selectedContract.customer_signature ? (
                              <img 
                                src={`data:image/png;base64,${selectedContract.customer_signature}`}
                                alt="Customer Signature"
                                className="max-h-20 max-w-full object-contain"
                                style={{ imageRendering: 'crisp-edges' }}
                              />
                            ) : (
                              <p className="text-2xl font-signature text-purple-600 dark:text-purple-400">
                                {selectedContract.customer.fullname || 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Người ký:</span>
                          <span className="font-medium">{selectedContract.customer.fullname || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="font-medium text-xs">{selectedContract.customer.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Thời gian:</span>
                          <span className="font-medium text-xs">{formatDateTime(selectedContract.customer_signed_at)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Chưa ký</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Special Conditions & Notes */}
              {(selectedContract.special_conditions || selectedContract.notes) && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Điều khoản & Ghi chú
                  </h4>
                  <div className="space-y-3 text-sm">
                    {selectedContract.special_conditions && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Điều khoản đặc biệt:</p>
                        <p className="p-2 bg-gray-50 dark:bg-gray-800 rounded">{selectedContract.special_conditions}</p>
                      </div>
                    )}
                    {selectedContract.notes && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Ghi chú:</p>
                        <p className="p-2 bg-gray-50 dark:bg-gray-800 rounded">{selectedContract.notes}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Rental Link */}
              {selectedContract.rental && (
                <Card className="p-4 bg-green-50 dark:bg-green-900/20">
                  <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">
                    Rental liên quan
                  </h4>
                  <p className="text-sm">
                    Mã Rental: <span className="font-bold">{selectedContract.rental.code}</span>
                  </p>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                {/* Sign Button for Staff - only show if staff hasn't signed yet and status is pending */}
                {selectedContract.status === 'pending' && !selectedContract.staff_signed_at && (
                  <Button
                    onClick={() => setShowSignDialog(true)}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    ✍️ Ký Contract (Staff)
                  </Button>
                )}
                
                {/* Sign Button for Customer - Customer signs themselves at station */}
                {selectedContract.status === 'pending' && !selectedContract.customer_signed_at && (
                  <Button
                    onClick={() => setShowSignCustomerDialog(true)}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    ✍️ Khách hàng ký
                  </Button>
                )}
                
                {/* Download Button */}
                {selectedContract.contract_file_url && (
                  <Button
                    onClick={() => handleDownloadPdf(selectedContract._id, selectedContract.code)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                    disabled={downloadingPdfId === selectedContract._id}
                  >
                    {downloadingPdfId === selectedContract._id ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Tải xuống PDF
                      </>
                    )}
                  </Button>
                )}
                
                {/* Cancel Button */}
                {selectedContract.status !== 'cancelled' && (
                  <Button
                    onClick={() => handleOpenCancelDialog(selectedContract)}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                    variant="destructive"
                  >
                    <Ban className="h-5 w-5 mr-2" />
                    Hủy Contract
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign Contract Dialog - Staff */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">✍️ Ký Contract - Staff</DialogTitle>
            <DialogDescription>
              Vẽ chữ ký của bạn để xác nhận contract
            </DialogDescription>
          </DialogHeader>
          
          {selectedContract && (
            <div className="space-y-4 py-4">
              {/* Contract Info */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Mã Contract:</p>
                    <p className="font-bold text-blue-700 dark:text-blue-300">{selectedContract.code}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Khách hàng:</p>
                    <p className="font-semibold">{selectedContract.customer.fullname}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Xe:</p>
                    <p className="font-semibold">{selectedContract.vehicle.license_plate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Thời hạn:</p>
                    <p className="font-semibold text-xs">{formatDate(selectedContract.valid_from)} - {formatDate(selectedContract.valid_until)}</p>
                  </div>
                </div>
              </Card>

              {/* Signature Pad */}
              {signingContract ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-lg text-gray-600 dark:text-gray-300">Đang xử lý chữ ký...</p>
                </div>
              ) : (
                <SignaturePad
                  onSave={handleSignContract}
                  onCancel={() => setShowSignDialog(false)}
                />
              )}

              {/* Important Note */}
              <Card className="p-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-green-900 dark:text-green-300 mb-1">
                      Lưu ý:
                    </p>
                    <p className="text-green-800 dark:text-green-400">
                      Sau khi ký, chữ ký sẽ được lưu vào hệ thống. Khách hàng cũng cần ký để hoàn tất contract.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign Contract Dialog - Customer */}
      <Dialog open={showSignCustomerDialog} onOpenChange={setShowSignCustomerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">✍️ Chữ ký Khách hàng</DialogTitle>
            <DialogDescription>
              Khách hàng ký contract trực tiếp tại trạm
            </DialogDescription>
          </DialogHeader>
          
          {selectedContract && (
            <div className="space-y-4 py-4">
              {/* Contract Info */}
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Mã Contract:</p>
                    <p className="font-bold text-purple-700 dark:text-purple-300">{selectedContract.code}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Khách hàng:</p>
                    <p className="font-semibold">{selectedContract.customer.fullname}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Xe:</p>
                    <p className="font-semibold">{selectedContract.vehicle.license_plate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Thời hạn:</p>
                    <p className="font-semibold text-xs">{formatDate(selectedContract.valid_from)} - {formatDate(selectedContract.valid_until)}</p>
                  </div>
                </div>
              </Card>

              {/* Signature Pad */}
              {signingCustomerContract ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-500" />
                  <p className="text-lg text-gray-600 dark:text-gray-300">Đang xử lý chữ ký...</p>
                </div>
              ) : (
                <SignaturePad
                  onSave={handleSignCustomerContract}
                  onCancel={() => setShowSignCustomerDialog(false)}
                />
              )}

              {/* Important Note */}
              <Card className="p-3 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-orange-900 dark:text-orange-300 mb-1">
                      ⚠️ Lưu ý quan trọng:
                    </p>
                    <p className="text-orange-800 dark:text-orange-400">
                      Khách hàng phải có mặt tại trạm và tự vẽ chữ ký của mình. 
                      Chữ ký này đại diện cho sự xác nhận của khách hàng với các điều khoản trong contract.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Contract Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Ban className="h-6 w-6 text-red-500" />
              Hủy Contract
            </DialogTitle>
            <DialogDescription>
              Nhập lý do hủy contract {selectedContract?.code}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Contract Info */}
            {selectedContract && (
              <Card className="p-4 bg-gray-50 dark:bg-gray-800">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Mã Contract:</span>
                    <p className="font-semibold">{selectedContract.code}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Khách hàng:</span>
                    <p className="font-semibold">{selectedContract.customer.fullname}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Xe:</span>
                    <p className="font-semibold">{selectedContract.vehicle.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
                    <div>{getStatusBadge(selectedContract.status, selectedContract.statusText)}</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Cancel Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Lý do hủy <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Nhập lý do hủy contract..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Vui lòng nhập rõ lý do để lưu vào hệ thống
              </p>
            </div>

            {/* Warning */}
            <Card className="p-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-red-900 dark:text-red-300 mb-1">
                    ⚠️ Cảnh báo:
                  </p>
                  <p className="text-red-800 dark:text-red-400">
                    Hành động này không thể hoàn tác. Contract sẽ được đánh dấu là đã hủy và không thể sử dụng lại.
                  </p>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason('');
                }}
                disabled={cancellingContract}
              >
                Đóng
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelContract}
                disabled={cancellingContract || !cancelReason.trim()}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                {cancellingContract ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Xác nhận hủy
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

