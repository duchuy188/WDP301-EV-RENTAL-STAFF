import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, CreditCard, CheckCircle2, DollarSign, Calendar, Receipt } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { mockRentals, mockCustomers, mockVehicles, mockPayments } from '@/data/mockData'
import { useToast } from '@/hooks/use-toast'

export function Payments() {
  const [searchCode, setSearchCode] = useState('')
  const [selectedRental, setSelectedRental] = useState<any>(null)
  const { toast } = useToast()

  const findRentalDetails = (rentalId: string) => {
    const rental = mockRentals.find(r => r.id === rentalId)
    if (!rental) return null

    const customer = mockCustomers.find(c => c.id === rental.customerId)
    const vehicle = mockVehicles.find(v => v.id === rental.vehicleId)
    const payment = mockPayments.find(p => p.rentalId === rental.id)

    return { rental, customer, vehicle, payment }
  }

  const handleSearch = () => {
    // Mock search by rental code
    const details = findRentalDetails('r1') // Mock finding a rental
    if (details) {
      setSelectedRental(details)
    } else {
      toast({
        title: "Không tìm thấy",
        description: "Không tìm thấy chuyến thuê với mã này",
        variant: "destructive"
      })
    }
  }

  const handleConfirmPayment = () => {
    toast({
      title: "Thanh toán thành công ✅",
      description: "Đã xác nhận thanh toán và cập nhật trạng thái"
    })
    setSelectedRental(null)
    setSearchCode('')
  }

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <Receipt className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400 text-lg">Chưa có chuyến thuê cần thanh toán</p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Nhập mã chuyến thuê để tìm kiếm</p>
    </motion.div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thanh toán tại điểm</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Xử lý thanh toán và hoàn trả cọc cho khách hàng</p>
      </div>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Tìm kiếm chuyến thuê</span>
            </CardTitle>
            <CardDescription>
              Nhập mã chuyến thuê để xem chi tiết thanh toán
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Nhập mã chuyến thuê (VD: R001)"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="px-8 h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                <Search className="h-4 w-4 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Section */}
      {selectedRental ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <span>Chi tiết thanh toán</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Rental Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Thông tin chuyến thuê</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={selectedRental.customer.avatar}
                          alt={selectedRental.customer.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{selectedRental.customer.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRental.customer.phone}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Xe thuê:</span>
                          <p className="font-medium">{selectedRental.vehicle.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRental.vehicle.licensePlate}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Thời gian:</span>
                          <p className="font-medium">2 ngày</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">20/12 - 22/12</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <img
                      src={selectedRental.vehicle.image}
                      alt={selectedRental.vehicle.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Chi tiết tài chính</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Phí thuê xe (2 ngày):</span>
                        <span className="font-medium">1.000.000 VND</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Phí dịch vụ:</span>
                        <span className="font-medium">100.000 VND</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Thuế VAT (10%):</span>
                        <span className="font-medium">110.000 VND</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Tổng cộng:</span>
                          <span className="text-green-600">1.210.000 VND</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800 dark:text-blue-200">Đã thanh toán cọc:</span>
                        <span className="font-bold text-blue-800 dark:text-blue-200">500.000 VND</span>
                      </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-orange-800 dark:text-orange-200">Còn lại cần thanh toán:</span>
                        <span className="font-bold text-orange-800 dark:text-orange-200">710.000 VND</span>
                      </div>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full h-12 bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Xác nhận thanh toán
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Xác nhận thanh toán</DialogTitle>
                        <DialogDescription>
                          Xác nhận khách hàng đã thanh toán đầy đủ số tiền còn lại
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            710.000 VND
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Số tiền cần thanh toán
                          </p>
                        </div>
                        <div className="flex space-x-3">
                          <Button 
                            onClick={handleConfirmPayment}
                            className="flex-1 bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500"
                          >
                            Xác nhận đã nhận tiền
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <EmptyState />
      )}
    </motion.div>
  )
}