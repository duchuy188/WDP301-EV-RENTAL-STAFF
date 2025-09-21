import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/register" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại đăng ký
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Điều khoản sử dụng dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Chấp nhận điều khoản</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Bằng việc sử dụng dịch vụ cho thuê xe điện của chúng tôi, bạn đồng ý tuân thủ 
                các điều khoản và điều kiện được nêu trong tài liệu này.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Đối tượng sử dụng</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Người dùng phải đủ 18 tuổi trở lên</li>
                <li>Có giấy phép lái xe hợp lệ</li>
                <li>Cung cấp thông tin chính xác khi đăng ký</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Quy định về thuê xe</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Xe phải được trả đúng thời gian quy định</li>
                <li>Không được sử dụng xe cho mục đích bất hợp pháp</li>
                <li>Chịu trách nhiệm về mọi hỏng hóc trong thời gian thuê</li>
                <li>Không được chuyển nhượng quyền thuê cho bên thứ ba</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Chính sách thanh toán</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Thanh toán trước khi nhận xe</li>
                <li>Phí phạt cho việc trả xe muộn</li>
                <li>Bồi thường thiệt hại theo giá thị trường</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Bảo mật thông tin</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo quy định của pháp luật 
                về bảo vệ dữ liệu cá nhân.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Liên hệ</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Nếu có thắc mắc về điều khoản sử dụng, vui lòng liên hệ với chúng tôi qua:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 mt-2">
                <li>Email: support@evrental.com</li>
                <li>Hotline: 1900-123-456</li>
              </ul>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">
                Điều khoản này có hiệu lực từ ngày {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
