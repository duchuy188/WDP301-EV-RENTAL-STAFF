import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Check, 
  AlertTriangle,
  Star,
  Upload,
  X,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { mockBookings } from '@/data/mockData';

const ReturnCar: React.FC = () => {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [noIssues, setNoIssues] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const activeBookings = mockBookings.filter(booking => booking.status === 'active');

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReturn = () => {
    setShowPayment(true);
  };

  const handlePayment = () => {
    setShowPayment(false);
    setShowRating(true);
    toast.success('Thanh toán thành công!');
  };

  const handleRatingSubmit = () => {
    toast.success('Cảm ơn bạn đã đánh giá!');
    setShowRating(false);
    setSelectedBooking(null);
    setUploadedImages([]);
    setNoIssues(false);
    setAdditionalNotes('');
    setRating(0);
    setReview('');
  };

  const additionalCosts = 50000; // Mock additional cost

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Trả xe
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Hoàn tất thủ tục trả xe và đánh giá trải nghiệm
          </p>
        </motion.div>

        {!selectedBooking ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Chọn chuyến đi cần trả xe
            </h2>
            <div className="grid gap-6">
              {activeBookings.length > 0 ? (
                activeBookings.map((booking, index) => (
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
                                Bắt đầu: {formatDate(booking.startDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="mb-2 bg-blue-600">
                              Đang thuê
                            </Badge>
                            <p className="text-lg font-bold text-green-600">
                              {formatPrice(booking.totalPrice)}
                            </p>
                            <Button className="mt-2 bg-orange-600 hover:bg-orange-700">
                              Trả xe
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
                  <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Không có xe nào đang thuê
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Hãy thuê xe để có thể trả xe tại đây
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <h2 className="text-2xl font-bold mb-6">Kiểm tra tình trạng xe</h2>
                
                {/* Image Upload */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Upload ảnh tình trạng xe</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Chụp ảnh tình trạng hiện tại của xe để xác nhận
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Chụp ảnh hoặc chọn từ thư viện
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Chọn ảnh
                      </label>
                    </Button>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Condition Check */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Xác nhận tình trạng</h3>
                  <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Checkbox
                      id="no-issues"
                      checked={noIssues}
                      onCheckedChange={setNoIssues}
                    />
                    <label 
                      htmlFor="no-issues" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Tôi xác nhận xe không có vấn đề gì, tình trạng tốt
                    </label>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Ghi chú thêm (nếu có)</h3>
                  <Textarea
                    placeholder="Mô tả chi tiết nếu có vấn đề gì với xe..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Additional Costs */}
                {additionalCosts > 0 && (
                  <div className="mb-8">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-800 dark:text-yellow-400">
                            Chi phí phát sinh
                          </h4>
                          <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                            Phí dọn dẹp xe: {formatPrice(additionalCosts)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBooking(null)}
                  >
                    Quay lại
                  </Button>
                  
                  <Button
                    onClick={handleReturn}
                    disabled={uploadedImages.length === 0 || !noIssues}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Xác nhận & Thanh toán
                  </Button>
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
                    <CardTitle>Chi tiết trả xe</CardTitle>
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
                            <h4 className="font-semibold mb-2">Thời gian sử dụng</h4>
                            <div className="text-sm space-y-1">
                              <p>🕐 Bắt đầu: {formatDate(booking.startDate)}</p>
                              <p>🏁 Dự kiến kết thúc: {formatDate(booking.endDate)}</p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="font-semibold mb-2">Chi phí</h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Chi phí gốc:</span>
                                <span>{formatPrice(booking.totalPrice)}</span>
                              </div>
                              {additionalCosts > 0 && (
                                <div className="flex justify-between text-orange-600">
                                  <span>Phí phát sinh:</span>
                                  <span>{formatPrice(additionalCosts)}</span>
                                </div>
                              )}
                              <Separator />
                              <div className="flex justify-between font-semibold">
                                <span>Tổng cộng:</span>
                                <span className="text-orange-600">
                                  {formatPrice(booking.totalPrice + additionalCosts)}
                                </span>
                              </div>
                            </div>
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

        {/* Payment Modal */}
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">Xác nhận thanh toán</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Chi phí thuê xe:</span>
                  <span>{formatPrice(mockBookings.find(b => b.id === selectedBooking)?.totalPrice || 0)}</span>
                </div>
                {additionalCosts > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Phí phát sinh:</span>
                    <span>{formatPrice(additionalCosts)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng cộng:</span>
                  <span>{formatPrice((mockBookings.find(b => b.id === selectedBooking)?.totalPrice || 0) + additionalCosts)}</span>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowPayment(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handlePayment}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Thanh toán
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Rating Modal */}
        {showRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Trả xe thành công!
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3 text-center">Đánh giá trải nghiệm</h4>
                  <div className="flex justify-center space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                />

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRating(false)}
                    className="flex-1"
                  >
                    Bỏ qua
                  </Button>
                  <Button
                    onClick={handleRatingSubmit}
                    disabled={rating === 0}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Gửi đánh giá
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReturnCar;