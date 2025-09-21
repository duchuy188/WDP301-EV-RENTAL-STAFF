import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Car, Battery, Shield, Clock, CreditCard, CheckCircle, MapPin } from 'lucide-react';

const Home: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Auto flip every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const benefits = [
    {
      icon: Car,
      title: 'Đơn giản',
      description: 'Đặt xe dễ dàng chỉ với vài thao tác'
    },
    {
      icon: Battery,
      title: 'Thân thiện',
      description: 'Xe điện sạch, không khí thải'
    },
    {
      icon: Shield,
      title: 'An toàn',
      description: 'Bảo hiểm toàn diện, an tâm lái xe'
    },
    {
      icon: Clock,
      title: 'Linh hoạt',
      description: 'Thuê theo giờ, ngày hoặc tuần'
    }
  ];

  const steps = [
    {
      icon: MapPin,
      title: 'Tìm xe',
      description: 'Chọn xe điện phù hợp với nhu cầu của bạn'
    },
    {
      icon: CreditCard,
      title: 'Thanh toán',
      description: 'Đặt xe và thanh toán trực tuyến'
    },
    {
      icon: CheckCircle,
      title: 'Lái xe',
      description: 'Nhận xe và bắt đầu hành trình'
    }
  ];

  const testimonials = [
    {
      name: 'Nguyễn Minh Anh',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b593?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      text: 'Dịch vụ tuyệt vời! Xe điện rất sạch và tiết kiệm. Tôi sẽ tiếp tục sử dụng.'
    },
    {
      name: 'Trần Văn Đức',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      text: 'Ứng dụng dễ sử dụng, xe luôn có sẵn khi cần. Rất hài lòng với chất lượng dịch vụ.'
    },
    {
      name: 'Lê Thị Hoa',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      text: 'Thuê xe điện giúp tôi tiết kiệm rất nhiều chi phí. Xe chạy êm và không tiếng ồn.'
    }
  ];

  const stats = [
    { label: 'Khách hàng hài lòng', value: '10,000+' },
    { label: 'Xe điện có sẵn', value: '500+' },
    { label: 'Thành phố phục vụ', value: '25+' },
    { label: 'Km đã vận chuyển', value: '1M+' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 pt-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  🌱 Thân thiện với môi trường
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  Thuê xe điện
                  <br />
                  <span className="text-4xl lg:text-5xl">dễ dàng, nhanh chóng</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Trải nghiệm tương lai với dịch vụ cho thuê xe điện hiện đại. 
                  Tiết kiệm chi phí, bảo vệ môi trường và di chuyển thông minh.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg">
                  Thuê xe ngay
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-2">
                  Tìm hiểu thêm
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                {/* Flip Container */}
                <div 
                  className="relative w-full h-96 cursor-pointer"
                  style={{ perspective: '1000px' }}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <motion.div
                    className="absolute inset-0 w-full h-full"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  >
                    {/* Front Side - VF e34 */}
                    <div
                      className="absolute inset-0 w-full h-full backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <img
                        src="/src/data/oto.jpg"
                        alt="VinFast VF e34 - Xe điện hiện đại"
                        className="rounded-2xl shadow-2xl w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
                        <p className="text-sm font-semibold">VinFast VF e34</p>
                      </div>
                    </div>
                    
                    {/* Back Side - VF 8 */}
                    <div
                      className="absolute inset-0 w-full h-full backface-hidden"
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&w=800&q=80"
                        alt="VinFast VF 8 - Xe điện cao cấp"
                        className="rounded-2xl shadow-2xl w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
                        <p className="text-sm font-semibold">VinFast VF 8</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Click hint */}
                <div className="absolute top-4 right-4 bg-white/90 text-gray-700 px-3 py-2 rounded-lg text-sm">
                  👆 Click để xem thêm
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-2xl opacity-20"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl font-bold">Tại sao chọn chúng tôi?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Những lợi ích vượt trội khi sử dụng dịch vụ cho thuê xe điện của chúng tôi
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="text-center h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                      <benefit.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl font-bold">Cách thức hoạt động</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Chỉ với 3 bước đơn giản, bạn đã có thể thuê xe điện
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="relative"
              >
                <Card className="text-center h-full">
                  <CardHeader>
                    <div className="relative mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                      <step.icon className="w-8 h-8 text-white" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                  </CardContent>
                </Card>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transform -translate-y-1/2"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl font-bold">Khách hàng nói gì về chúng tôi</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Hàng ngàn khách hàng đã tin tưởng và hài lòng với dịch vụ của chúng tôi
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        <div className="flex items-center space-x-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 italic">"{testimonial.text}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-bold text-white">
              Sẵn sàng trải nghiệm tương lai?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Tham gia cùng hàng ngàn khách hàng đã chọn xe điện cho cuộc sống xanh và bền vững
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="px-8 py-6 text-lg">
                Đăng ký ngay
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-white text-white hover:bg-white hover:text-blue-600">
                Liên hệ tư vấn
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
