import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle, XCircle, Eye, UserCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { mockCustomers, type Customer } from '@/data/mockData'
import { useToast } from '@/hooks/use-toast'

export function Customers() {
  const [customers, setCustomers] = useState(mockCustomers)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const { toast } = useToast()

  const handleVerifyCustomer = (customerId: string, isApproved: boolean) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { ...customer, isVerified: isApproved }
        : customer
    ))
    
    toast({
      title: isApproved ? "Xác thực thành công ✅" : "Đã từ chối xác thực ❌",
      description: isApproved 
        ? "Khách hàng đã được xác thực và có thể thuê xe"
        : "Khách hàng cần cung cấp lại tài liệu"
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Xác thực Khách hàng</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Kiểm tra và xác thực thông tin khách hàng</p>
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
              <span>Tải lên tài liệu</span>
            </CardTitle>
            <CardDescription>
              Khách hàng có thể tải lên GPLX và CCCD để xác thực
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">Giấy phép lái xe (GPLX)</p>
                <Input type="file" accept="image/*" className="max-w-xs mx-auto" />
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">Căn cước công dân (CCCD)</p>
                <Input type="file" accept="image/*" className="max-w-xs mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer, index) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={customer.avatar}
                      alt={customer.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                    </div>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.5 + index * 0.1 }}
                  >
                    {customer.isVerified ? (
                      <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs">
                        <CheckCircle className="h-3 w-3" />
                        <span>Đã xác thực</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full text-xs">
                        <XCircle className="h-3 w-3" />
                        <span>Chưa xác thực</span>
                      </div>
                    )}
                  </motion.div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Số điện thoại:</span>
                    <span className="font-medium">{customer.phone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Số GPLX:</span>
                    <span className="font-medium">{customer.licenseNumber}</span>
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
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Thông tin khách hàng: {selectedCustomer?.name}</DialogTitle>
                        <DialogDescription>
                          Kiểm tra và xác thực thông tin khách hàng
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedCustomer && (
                        <div className="space-y-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium mb-3">Thông tin cá nhân</h4>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Họ tên:</span>
                                  <p className="font-medium">{selectedCustomer.name}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                                  <p className="font-medium">{selectedCustomer.email}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Số điện thoại:</span>
                                  <p className="font-medium">{selectedCustomer.phone}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Số GPLX:</span>
                                  <p className="font-medium">{selectedCustomer.licenseNumber}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-3">Tài liệu đã tải lên</h4>
                              <div className="space-y-3">
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Giấy phép lái xe</span>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </div>
                                </div>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Căn cước công dân</span>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {!selectedCustomer.isVerified && (
                            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <Button
                                onClick={() => handleVerifyCustomer(selectedCustomer.id, true)}
                                className="flex-1 bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Xác thực
                              </Button>
                              <Button
                                onClick={() => handleVerifyCustomer(selectedCustomer.id, false)}
                                variant="destructive"
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Từ chối
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  {!customer.isVerified && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleVerifyCustomer(customer.id, true)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Duyệt
                      </Button>
                      <Button
                        onClick={() => handleVerifyCustomer(customer.id, false)}
                        size="sm"
                        variant="destructive"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Từ chối
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}