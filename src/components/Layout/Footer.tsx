import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liên hệ</h3>
            <div className="space-y-2">
              <p>📞 1900-1234</p>
              <p>✉️ support@evrental.vn</p>
              <p>📍 123 Đường ABC, Quận 1, TP.HCM</p>
              <p>🕐 24/7 - Hỗ trợ liên tục</p>
            </div>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Chính sách</h3>
            <div className="space-y-2">
              <Link to="#" className="block hover:text-green-400 transition-colors">
                Điều khoản sử dụng
              </Link>
              <Link to="#" className="block hover:text-green-400 transition-colors">
                Chính sách bảo mật
              </Link>
              <Link to="#" className="block hover:text-green-400 transition-colors">
                Quy định thanh toán
              </Link>
              <Link to="#" className="block hover:text-green-400 transition-colors">
                Hướng dẫn sử dụng
              </Link>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Mạng xã hội</h3>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-blue-400 rounded-lg hover:bg-blue-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold">EV Rental</span>
          </div>
          <p className="text-gray-400 mt-4 md:mt-0">
            © 2025 EV Rental. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;