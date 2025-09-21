import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Edit3, 
  Check, 
  AlertCircle, 
  Camera,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { mockBookings } from '@/data/mockData';

const CheckIn: React.FC = () => {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const confirmedBookings = mockBookings.filter(booking => booking.status === 'confirmed');

  const steps = [
    { number: 1, title: 'Upload giấy tờ', icon: Upload },
    { number: 2, title: 'Xem hợp đồng', icon: FileText },
    { number: 3, title: 'Ký tên', icon: Edit3 },
    { number: 4, title: 'Xác nhận', icon: Check },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSignature = () => {
    setSignature('Nguyễn Văn An'); // Mock signature
  };

  const handleConfirmCheckIn = () => {
    setShowSuccess(true);
    toast.success('Đã xác nhận nhận xe thành công!');
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedBooking(null);
      setCurrentStep(1);
      setUploadedFiles([]);
      setSignature('');
    }, 3000);
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
            Nhận xe
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Hoàn tất thủ tục nhận xe để bắt đầu chuyến đi
          </p>
        </motion.div>

        {!selectedBooking ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Chọn chuyến đi để nhận xe
            </h2>
            <div className="grid gap-6">
              {confirmedBookings.length > 0 ? (
                confirmedBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                          onClick={() => setSelectedBooking(booking.id)}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={booking.car.image}
                              alt={booking.car.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div>
                              <h3 className="text-lg font-semibold">{booking.car.name}</h3>
                              <p className="text-gray-600 dark:text-gray-300">
                                {booking.car.location}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-2">
                              Đã xác nhận
                            </Badge>
                            <p className="text-lg font-bold text-green-600">
                              {formatPrice(booking.totalPrice)}
                            </p>
                            <Button className="mt-2 bg-green-600 hover:bg-green-700">
                              Check-in
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Không có chuyến đi nào cần nhận xe
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Hãy đặt xe trước để có thể nhận xe tại đây
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
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
                          <step.icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="ml-3 hidden sm:block">
                        <p className="text-sm font-medium">{step.title}</p>
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
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Upload giấy tờ</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Vui lòng upload ảnh GPLX và CCCD/CMND để xác thực
                    </p>
                    
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Kéo thả file hoặc click để chọn ảnh
                        </p>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button asChild variant="outline">
                          <label htmlFor="file-upload" className="cursor-pointer">
                            Chọn file
                          </label>
                        </Button>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-semibold">File đã upload:</h3>
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-blue-500" />
                                <span className="text-sm">{file.name}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Xem hợp đồng thuê xe</h2>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                      <h3 className="font-semibold text-lg mb-4">HỢP ĐỒNG THUÊ XE ĐIỆN</h3>
                      <div className="space-y-4 text-sm">
                        <div>
                          <h4 className="font-semibold">Điều 1: Thông tin xe</h4>
                          <p>- Loại xe: {mockBookings.find(b => b.id === selectedBooking)?.car.name}</p>
                          <p>- Vị trí: {mockBookings.find(b => b.id === selectedBooking)?.car.location}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Điều 2: Thời gian thuê</h4>
                          <p>- Từ: {formatDate(mockBookings.find(b => b.id === selectedBooking)?.startDate || '')}</p>
                          <p>- Đến: {formatDate(mockBookings.find(b => b.id === selectedBooking)?.endDate || '')}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Điều 3: Trách nhiệm</h4>
                          <p>- Người thuê có trách nhiệm bảo quản xe</p>
                          <p>- Trả xe đúng thời gian và địa điểm</p>
                          <p>- Bồi thường nếu có hư hỏng</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Điều 4: Chi phí</h4>
                          <p>- Tổng tiền: {formatPrice(mockBookings.find(b => b.id === selectedBooking)?.totalPrice || 0)}</p>
                          <p>- Phí phát sinh (nếu có): Theo quy định</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-800 dark:text-yellow-400">Lưu ý quan trọng:</h4>
                          <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                            Vui lòng đọc kỹ hợp đồng trước khi ký. Khi ký tên, bạn đã đồng ý với tất cả các điều khoản.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Ký tên xác nhận</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Vui lòng ký tên để xác nhận đã đồng ý với hợp đồng
                    </p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                      {!signature ? (
                        <>
                          <Edit3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Click để ký tên
                          </p>
                          <Button 
                            onClick={handleSignature}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Ký tên
                          </Button>
                        </>
                      ) : (
                        <div className="text-center">
                          <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                          <p className="text-lg font-semibold text-green-600 mb-2">Đã ký: {signature}</p>
                          <p className="text-sm text-gray-500">
                            {new Date().toLocaleDateString('vi-VN')} - {new Date().toLocaleTimeString('vi-VN')}
                          </p>
                          <Button 
                            variant="outline"
                            onClick={() => setSignature('')}
                            className="mt-4"
                          >
                            Ký lại
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Xác nhận cuối cùng</h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-green-600" />
                        <span>Giấy tờ đã upload ({uploadedFiles.length} file)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-green-600" />
                        <span>Hợp đồng đã xem</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-green-600" />
                        <span>Đã ký tên: {signature}</span>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
                      <p className="text-green-800 dark:text-green-400 text-center font-semibold">
                        Tất cả thủ tục đã hoàn tất. Click "Xác nhận nhận xe" để hoàn thành!
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentStep === 1) {
                        setSelectedBooking(null);
                      } else {
                        setCurrentStep(currentStep - 1);
                      }
                    }}
                  >
                    {currentStep === 1 ? 'Quay lại' : 'Bước trước'}
                  </Button>
                  
                  {currentStep < 4 ? (
                    <Button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      disabled={
                        (currentStep === 1 && uploadedFiles.length === 0) ||
                        (currentStep === 3 && !signature)
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Tiếp tục
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConfirmCheckIn}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Xác nhận nhận xe
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-24"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin chuyến đi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const booking = mockBookings.find(b => b.id === selectedBooking);
                      if (!booking) return null;
                      
                      return (
                        <div className="space-y-4">
                          <div className="text-center">
                            <img
                              src={booking.car.image}
                              alt={booking.car.name}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                            <h3 className="font-semibold">{booking.car.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {booking.car.location}
                            </p>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="font-semibold mb-2">Thời gian</h4>
                            <div className="text-sm space-y-1">
                              <p>🕐 Bắt đầu: {formatDate(booking.startDate)}</p>
                              <p>🏁 Kết thúc: {formatDate(booking.endDate)}</p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Tổng chi phí</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatPrice(booking.totalPrice)}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}

        {/* Success Animation */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center max-w-md w-full mx-4"
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
                Nhận xe thành công!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Chúc bạn có một chuyến đi an toàn và vui vẻ!
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;