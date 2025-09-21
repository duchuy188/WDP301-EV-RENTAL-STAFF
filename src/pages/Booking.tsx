import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Calendar, 
  Clock, 
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Battery,
  MapPin,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { mockCars } from '@/data/mockData';

const Booking: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCar, setSelectedCar] = useState(mockCars[0]);
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const steps = [
    { number: 1, title: 'Chọn xe', description: 'Chọn xe phù hợp' },
    { number: 2, title: 'Chọn thời gian', description: 'Thời gian thuê' },
    { number: 3, title: 'Xác nhận', description: 'Chi phí & thanh toán' },
  ];

  const calculatePrice = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2025-01-01T${startTime}:00`);
    const end = new Date(`2025-01-01T${endTime}:00`);
    const hours = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.ceil(hours) * selectedCar.pricePerHour;
  };

  const basePrice = calculatePrice();
  const serviceFee = basePrice * 0.1;
  const totalPrice = basePrice + serviceFee;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleConfirmBooking = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Đặt xe
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Hoàn tất đặt xe trong 3 bước đơn giản
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
            >
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                      ${currentStep >= step.number 
                        ? 'bg-green-600 border-green-600 text-white' 
                        : 'border-gray-300 text-gray-300'
                      }
                    `}>
                      {currentStep > step.number ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{step.number}</span>
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`
                        w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 transition-colors duration-300
                        ${currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'}
                      `} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Step Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Chọn xe</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockCars.filter(car => car.available).map((car) => (
                      <Card
                        key={car.id}
                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                          selectedCar.id === car.id 
                            ? 'ring-2 ring-green-600 shadow-md' 
                            : ''
                        }`}
                        onClick={() => setSelectedCar(car)}
                      >
                        <div className="relative">
                          <img
                            src={car.image}
                            alt={car.name}
                            className="w-full h-32 object-cover rounded-t-lg"
                          />
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                            <div className="flex items-center text-green-600 text-sm">
                              <Battery className="h-3 w-3 mr-1" />
                              {car.batteryLevel}%
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">{car.name}</h3>
                          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm">{car.location}</span>
                          </div>
                          <p className="text-lg font-bold text-green-600">
                            {formatPrice(car.pricePerHour)}/giờ
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Chọn thời gian</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date">Ngày thuê</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="date"
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="pl-10"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startTime">Giờ bắt đầu</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">Giờ kết thúc</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {bookingDate && startTime && endTime && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
                    >
                      <h3 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                        Thông tin thuê xe
                      </h3>
                      <p>Ngày: {new Date(bookingDate).toLocaleDateString('vi-VN')}</p>
                      <p>Thời gian: {startTime} - {endTime}</p>
                      <p>Tổng thời gian: {Math.ceil(Math.abs(new Date(`2025-01-01T${endTime}:00`).getTime() - new Date(`2025-01-01T${startTime}:00`).getTime()) / (1000 * 60 * 60))} giờ</p>
                    </motion.div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Xác nhận & Thanh toán</h2>
                  <div className="space-y-6">
                    {/* Booking Summary */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Thông tin đặt xe</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Xe:</span>
                          <span>{selectedCar.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ngày:</span>
                          <span>{new Date(bookingDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Thời gian:</span>
                          <span>{startTime} - {endTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Chi tiết chi phí</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Giá thuê:</span>
                          <span>{formatPrice(basePrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phí dịch vụ (10%):</span>
                          <span>{formatPrice(serviceFee)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-base">
                          <span>Tổng cộng:</span>
                          <span className="text-green-600">{formatPrice(totalPrice)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Phương thức thanh toán</h3>
                      <Select defaultValue="credit-card">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit-card">Thẻ tín dụng</SelectItem>
                          <SelectItem value="momo">Ví MoMo</SelectItem>
                          <SelectItem value="banking">Internet Banking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>

                {currentStep < 3 ? (
                  <Button
                    onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                    disabled={
                      (currentStep === 2 && (!bookingDate || !startTime || !endTime)) ||
                      (currentStep === 1 && !selectedCar)
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Tiếp tục
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleConfirmBooking}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Xác nhận đặt xe
                  </Button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Tóm tắt đặt xe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCar && (
                    <>
                      <div className="text-center">
                        <img
                          src={selectedCar.image}
                          alt={selectedCar.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <h3 className="font-semibold">{selectedCar.name}</h3>
                        <div className="flex items-center justify-center mt-2">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {selectedCar.location}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Progress value={selectedCar.batteryLevel} className="h-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Pin: {selectedCar.batteryLevel}%
                          </span>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">Thời gian thuê</h4>
                        {bookingDate && startTime && endTime ? (
                          <div className="text-sm space-y-1">
                            <p>📅 {new Date(bookingDate).toLocaleDateString('vi-VN')}</p>
                            <p>🕐 {startTime} - {endTime}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Chưa chọn thời gian</p>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-2">Tổng chi phí</h4>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {formatPrice(totalPrice)}
                          </p>
                          {basePrice > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Đã bao gồm phí dịch vụ
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center max-w-md w-full"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="h-8 w-8 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Đặt xe thành công!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Chúng tôi đã gửi thông tin chi tiết đến email của bạn
              </p>
              <Button 
                onClick={() => setShowSuccess(false)}
                className="bg-green-600 hover:bg-green-700"
              >
                Tiếp tục
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Booking;