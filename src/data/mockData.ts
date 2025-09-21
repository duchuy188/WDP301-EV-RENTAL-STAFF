// Mock data for the Station Staff Dashboard
export interface Vehicle {
  id: string
  name: string
  licensePlate: string
  batteryLevel: number
  status: 'available' | 'rented' | 'maintenance' | 'reserved'
  lastMaintenance: string
  image: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  isVerified: boolean
  avatar?: string
}

export interface Rental {
  id: string
  customerId: string
  vehicleId: string
  startDate: string
  endDate: string
  totalAmount: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  depositAmount: number
}

export interface Payment {
  id: string
  rentalId: string
  amount: number
  type: 'deposit' | 'final' | 'refund'
  status: 'pending' | 'completed' | 'failed'
  date: string
}

export interface Staff {
  id: string
  name: string
  email: string
  avatar: string
  role: string
}

// Mock data
export const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    name: 'Tesla Model 3',
    licensePlate: '29A-12345',
    batteryLevel: 85,
    status: 'available',
    lastMaintenance: '2024-12-15',
    image: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 'v2',
    name: 'VinFast VF8',
    licensePlate: '30B-67890',
    batteryLevel: 92,
    status: 'rented',
    lastMaintenance: '2024-12-10',
    image: 'https://images.pexels.com/photos/12789670/pexels-photo-12789670.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 'v3',
    name: 'BMW i4',
    licensePlate: '29C-54321',
    batteryLevel: 45,
    status: 'available',
    lastMaintenance: '2024-12-12',
    image: 'https://images.pexels.com/photos/12789670/pexels-photo-12789670.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 'v4',
    name: 'Hyundai Kona Electric',
    licensePlate: '30D-98765',
    batteryLevel: 15,
    status: 'maintenance',
    lastMaintenance: '2024-12-08',
    image: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
]

export const mockCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Nguyễn Văn An',
    email: 'nva@example.com',
    phone: '0901234567',
    licenseNumber: 'B2-123456789',
    isVerified: true,
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100'
  },
  {
    id: 'c2',
    name: 'Trần Thị Bình',
    email: 'ttb@example.com',
    phone: '0912345678',
    licenseNumber: 'B2-987654321',
    isVerified: false,
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100'
  },
  {
    id: 'c3',
    name: 'Lê Minh Cường',
    email: 'lmc@example.com',
    phone: '0923456789',
    licenseNumber: 'B2-456789123',
    isVerified: true,
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100'
  }
]

export const mockRentals: Rental[] = [
  {
    id: 'r1',
    customerId: 'c1',
    vehicleId: 'v2',
    startDate: '2024-12-20T08:00:00Z',
    endDate: '2024-12-22T18:00:00Z',
    totalAmount: 1500000,
    status: 'active',
    depositAmount: 500000
  },
  {
    id: 'r2',
    customerId: 'c3',
    vehicleId: 'v1',
    startDate: '2024-12-21T10:00:00Z',
    endDate: '2024-12-23T20:00:00Z',
    totalAmount: 1800000,
    status: 'pending',
    depositAmount: 600000
  }
]

export const mockPayments: Payment[] = [
  {
    id: 'p1',
    rentalId: 'r1',
    amount: 500000,
    type: 'deposit',
    status: 'completed',
    date: '2024-12-20T07:45:00Z'
  },
  {
    id: 'p2',
    rentalId: 'r2',
    amount: 600000,
    type: 'deposit',
    status: 'pending',
    date: '2024-12-21T09:30:00Z'
  }
]

export const mockStaff: Staff = {
  id: 's1',
  name: 'Phạm Thị Hoa',
  email: 'pth@evrentals.com',
  avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=100',
  role: 'Station Manager'
}

export const mockKPIData = {
  availableVehicles: 2,
  todayHandovers: 5,
  stationRevenue: 12500000,
  activeRentals: 3
}

export const mockChartData = [
  { hour: '06:00', rentals: 2 },
  { hour: '08:00', rentals: 5 },
  { hour: '10:00', rentals: 8 },
  { hour: '12:00', rentals: 12 },
  { hour: '14:00', rentals: 7 },
  { hour: '16:00', rentals: 10 },
  { hour: '18:00', rentals: 15 },
  { hour: '20:00', rentals: 8 },
  { hour: '22:00', rentals: 3 }
]

export const mockNotifications = [
  {
    id: 'n1',
    title: 'Xe cần bảo trì',
    message: 'Hyundai Kona Electric (30D-98765) cần kiểm tra định kỳ',
    type: 'warning',
    time: '10 phút trước'
  },
  {
    id: 'n2',
    title: 'Khách hàng mới đăng ký',
    message: 'Trần Thị Bình vừa hoàn tất đăng ký thuê xe',
    type: 'info',
    time: '25 phút trước'
  },
  {
    id: 'n3',
    title: 'Thanh toán thành công',
    message: 'Đã nhận thanh toán 1.500.000 VND từ Nguyễn Văn An',
    type: 'success',
    time: '1 giờ trước'
  }
]