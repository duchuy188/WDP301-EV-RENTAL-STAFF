import { Car, Booking, User, FAQ, Testimonial } from '../types';

export const mockCars: Car[] = [
  {
    id: '1',
    name: 'VinFast VF e34',
    type: 'car',
    batteryLevel: 85,
    pricePerHour: 150000,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    location: 'Quận 1, TP.HCM',
    available: true,
  },
  {
    id: '2',
    name: 'Tesla Model 3',
    type: 'car',
    batteryLevel: 92,
    pricePerHour: 200000,
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    location: 'Quận 3, TP.HCM',
    available: true,
  },
  {
    id: '3',
    name: 'Feliz S Electric',
    type: 'scooter',
    batteryLevel: 78,
    pricePerHour: 50000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    location: 'Quận 7, TP.HCM',
    available: true,
  },
  {
    id: '4',
    name: 'BMW i3',
    type: 'car',
    batteryLevel: 65,
    pricePerHour: 180000,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    location: 'Quận 2, TP.HCM',
    available: false,
  },
  {
    id: '5',
    name: 'Yadea G5',
    type: 'scooter',
    batteryLevel: 90,
    pricePerHour: 45000,
    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    location: 'Quận 5, TP.HCM',
    available: true,
  },
  {
    id: '6',
    name: 'Hyundai Kona Electric',
    type: 'car',
    batteryLevel: 88,
    pricePerHour: 160000,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    location: 'Quận 10, TP.HCM',
    available: true,
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    carId: '1',
    car: mockCars[0],
    startDate: '2025-01-15T09:00:00Z',
    endDate: '2025-01-15T17:00:00Z',
    totalPrice: 1200000,
    status: 'completed',
    createdAt: '2025-01-10T10:00:00Z',
  },
  {
    id: 'booking-2',
    carId: '3',
    car: mockCars[2],
    startDate: '2025-01-20T14:00:00Z',
    endDate: '2025-01-20T18:00:00Z',
    totalPrice: 200000,
    status: 'active',
    createdAt: '2025-01-18T15:30:00Z',
  },
  {
    id: 'booking-3',
    carId: '2',
    car: mockCars[1],
    startDate: '2025-01-25T08:00:00Z',
    endDate: '2025-01-25T20:00:00Z',
    totalPrice: 2400000,
    status: 'confirmed',
    createdAt: '2025-01-22T09:15:00Z',
  },
];

export const mockUser: User = {
  id: 'user-1',
  name: 'Nguyễn Văn An',
  email: 'nguyenvanan@gmail.com',
  phone: '0901234567',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
  licenseVerified: true,
  idVerified: true,
  memberSince: '2023-06-15',
};

export const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Lê Thị Mai',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b608?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 5,
    comment: 'Dịch vụ tuyệt vời! Xe sạch sẽ, pin đầy, thủ tục đơn giản. Tôi sẽ tiếp tục sử dụng.',
  },
  {
    id: '2',
    name: 'Trần Minh Khang',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 5,
    comment: 'Thuê xe điện rất tiện lợi, không khói bụi, yên tĩnh. Giá cả hợp lý, hỗ trợ 24/7.',
  },
  {
    id: '3',
    name: 'Phạm Thu Hà',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 4,
    comment: 'Ứng dụng dễ sử dụng, tìm xe nhanh. Chỉ có điều muốn có nhiều điểm trả xe hơn.',
  },
];

export const mockFAQs: FAQ[] = [
  {
    id: '1',
    question: 'Làm thế nào để đặt xe điện?',
    answer: 'Bạn có thể đặt xe thông qua ứng dụng hoặc website của chúng tôi. Chỉ cần chọn xe, thời gian thuê và thanh toán.',
  },
  {
    id: '2',
    question: 'Giấy tờ cần thiết khi thuê xe?',
    answer: 'Bạn cần có GPLX còn hạn, CCCD/CMND và thẻ tín dụng/ghi nợ để thanh toán.',
  },
  {
    id: '3',
    question: 'Nếu xe hết pin giữa đường thì sao?',
    answer: 'Chúng tôi có dịch vụ hỗ trợ 24/7. Bạn có thể gọi hotline và chúng tôi sẽ hỗ trợ ngay lập tức.',
  },
  {
    id: '4',
    question: 'Có thể hủy đặt xe không?',
    answer: 'Có, bạn có thể hủy đặt xe miễn phí trước 2 giờ. Sau đó sẽ có phí hủy theo quy định.',
  },
  {
    id: '5',
    question: 'Giá thuê xe được tính như thế nào?',
    answer: 'Giá thuê được tính theo giờ, có thể có phí phụ trội tùy vào loại xe và thời gian thuê.',
  },
];