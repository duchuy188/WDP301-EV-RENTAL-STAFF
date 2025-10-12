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
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { getContracts, getContractById, type Contract } from '@/api/contracts';

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
      setSelectedContract(response.data);
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

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
          <Badge variant="outline" className="text-gray-600">
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
            📄 Quản lý Contracts
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
                    contract.status === 'cancelled' ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
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
                          onClick={() => window.open(contract.contract_file_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
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
                  <h4 className="font-medium mb-3 text-orange-600 dark:text-orange-400">
                    Chữ ký Staff
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedContract.staff_signed_by ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Người ký:</span>
                          <span className="font-medium">{selectedContract.staff_signed_by.fullname}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="font-medium text-xs">{selectedContract.staff_signed_by.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Thời gian:</span>
                          <span className="font-medium text-xs">{formatDateTime(selectedContract.staff_signed_at)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Clock className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Chưa ký</p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400">
                    Chữ ký Khách hàng
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedContract.customer_signed_by ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Người ký:</span>
                          <span className="font-medium">{selectedContract.customer_signed_by.fullname}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="font-medium text-xs">{selectedContract.customer_signed_by.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Thời gian:</span>
                          <span className="font-medium text-xs">{formatDateTime(selectedContract.customer_signed_at)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
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

              {/* Download Button */}
              {selectedContract.contract_file_url && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => window.open(selectedContract.contract_file_url, '_blank')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Tải xuống Contract (PDF)
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

