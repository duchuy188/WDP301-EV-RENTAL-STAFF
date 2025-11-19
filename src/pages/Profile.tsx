import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  CreditCard,
  Edit,
  Check,
  X,
  Upload,
  Camera,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, EyeOff } from 'lucide-react';
import { updateProfile, UpdateProfilePayload, ApiError, getStoredTokens, logout as apiLogout, clearStoredTokens, changePassword, ChangePasswordPayload } from '@/api/auth';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '@/context/SidebarContext';
import { useProfile } from '@/contexts/ProfileContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, updateProfile: updateProfileContext, isLoading: profileLoading, error: profileError } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    address: '',
  });
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Change Password states
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogout = async () => {
    try {
      const { refreshToken } = getStoredTokens();
      if (refreshToken) {
        await apiLogout({ refreshToken });
      }
    } catch (e) {
      // proceed even if API fails
      console.error('Logout failed:', e);
    } finally {
      clearStoredTokens();
      toast({
        title: "Đã đăng xuất thành công",
        description: "Hẹn gặp lại bạn lần sau!",
        variant: "success",
        duration: 3000,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        fullname: profile.fullname || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      const updatePayload: UpdateProfilePayload = {
        fullname: formData.fullname,
        phone: formData.phone,
        address: formData.address,
      };
      
      if (selectedAvatar) {
        updatePayload.avatar = selectedAvatar;
      }
      
      const response = await updateProfile(updatePayload);
      
      // Update global profile context
      updateProfileContext(response.profile);
      setFormData({
        fullname: response.profile.fullname || '',
        email: response.profile.email || '',
        phone: response.profile.phone || '',
        address: response.profile.address || '',
      });
      
      // Clear avatar selection
      setSelectedAvatar(null);
      setAvatarPreview(null);
      
      setIsEditing(false);
      toast({
        title: "Thành công",
        description: response.message || 'Cập nhật hồ sơ thành công!',
        variant: "success",
        duration: 3000,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Cập nhật hồ sơ thất bại';
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullname: profile.fullname || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
    setSelectedAvatar(null);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới và xác nhận mật khẩu không khớp",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 8 ký tự",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      
      const payload: ChangePasswordPayload = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      };
      
      const response = await changePassword(payload);
      
      toast({
        title: "Thành công",
        description: response.message || 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.',
        variant: "success",
        duration: 3000,
      });
      
      // Close dialog
      setIsChangePasswordOpen(false);
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Auto logout after 2 seconds
      setTimeout(async () => {
        await handleLogout();
      }, 2000);
      
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Đổi mật khẩu thất bại';
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCloseChangePasswordDialog = () => {
    setIsChangePasswordOpen(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{profileError}</p>
          <button
            className="px-4 py-2 rounded-md bg-primary text-white"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 md:py-8">
      <div
        className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8 transition-[max-width] duration-300',
          collapsed ? 'max-w-7xl' : 'max-w-6xl'
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4">
            <Button
              size="default"
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm focus-visible:ring-2 focus-visible:ring-green-500"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
            > 
              <ChevronLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tài khoản của tôi
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {isLoading ? 'Đang lưu...' : 'Lưu'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage 
                        src={avatarPreview || profile?.avatar} 
                        alt={profile?.fullname || 'Avatar'} 
                      />
                      <AvatarFallback className="text-lg">
                        {(profile?.fullname || 'U').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 transition-colors cursor-pointer">
                        <Camera className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {formData.fullname || profile?.fullname}
                    </h3>
                    {profile?.role && (
                      <p className="text-gray-600 dark:text-gray-300">{profile.role}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Họ và tên</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.fullname}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullname: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{profile?.fullname}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{profile?.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{profile?.phone || '—'}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Địa chỉ</Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Nhập địa chỉ của bạn"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{profile?.address || '—'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Verification */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Xác thực giấy tờ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Giấy phép lái xe</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">GPLX hạng B1</p>
                      </div>
                    </div>
                    <Badge className={'bg-green-100 text-green-800'}>
                      Đang mô phỏng
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Căn cước công dân</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">CCCD/CMND</p>
                      </div>
                    </div>
                    <Badge className={'bg-green-100 text-green-800'}>
                      Đang mô phỏng
                    </Badge>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                      Khu vực xác thực giấy tờ là mô phỏng trong phiên bản này
                    </p>
                    <Button className="mt-2 bg-yellow-600 hover:bg-yellow-700">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload giấy tờ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 lg:sticky lg:top-24 self-start"
          >
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Visa ****1234</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Mặc định</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Chính</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-pink-600" />
                      <div>
                        <p className="font-medium">Ví MoMo</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">090****567</p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Thêm phương thức
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Tổng chuyến đi:</span>
                    <span className="font-semibold">15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Điểm đánh giá:</span>
                    <span className="font-semibold text-yellow-600">4.8/5 ⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Tổng tiết kiệm:</span>
                    <span className="font-semibold text-green-600">2.5kg CO₂</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="mr-2 h-4 w-4" />
                        Đổi mật khẩu
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Đổi mật khẩu</DialogTitle>
                        <DialogDescription>
                          Nhập mật khẩu hiện tại và mật khẩu mới của bạn. Bạn sẽ cần đăng nhập lại sau khi đổi mật khẩu.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {/* Current Password */}
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              placeholder="Nhập mật khẩu hiện tại"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Mật khẩu mới</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Nhập lại mật khẩu mới"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCloseChangePasswordDialog}
                          disabled={isChangingPassword}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="button"
                          onClick={handleChangePassword}
                          disabled={isChangingPassword}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isChangingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" />
                    Cài đặt riêng tư
                  </Button>
                  <Separator />
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;