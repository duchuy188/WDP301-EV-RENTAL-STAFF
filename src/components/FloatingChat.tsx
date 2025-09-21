import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X, 
  Minimize2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  context?: string; // Add context to track conversation flow
}

interface ChatContext {
  topic?: string;
  userIntent?: string;
  lastKeywords?: string[];
  conversationStep?: number;
}

const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: 'Xin chào! Tôi là trợ lý ảo của EV Rental. Tôi có thể giúp gì cho bạn?',
      timestamp: new Date(),
      context: 'greeting'
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatContext, setChatContext] = useState<ChatContext>({
    topic: '',
    userIntent: '',
    lastKeywords: [],
    conversationStep: 0
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Function to extract keywords and intent from user message
  const analyzeUserMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    const keywords = lowerMessage.split(' ').filter(word => word.length > 2);
    
    let intent = 'general';
    let topic = '';
    
    if (lowerMessage.includes('thuê') || lowerMessage.includes('booking') || lowerMessage.includes('đặt')) {
      intent = 'booking';
      topic = 'rental';
    } else if (lowerMessage.includes('giá') || lowerMessage.includes('phí') || lowerMessage.includes('cost')) {
      intent = 'pricing';
      topic = 'pricing';
    } else if (lowerMessage.includes('địa chỉ') || lowerMessage.includes('location') || lowerMessage.includes('nơi')) {
      intent = 'location';
      topic = 'location';
    } else if (lowerMessage.includes('trả xe') || lowerMessage.includes('return')) {
      intent = 'return';
      topic = 'return';
    } else if (lowerMessage.includes('hỗ trợ') || lowerMessage.includes('help') || lowerMessage.includes('support')) {
      intent = 'support';
      topic = 'support';
    } else if (lowerMessage.includes('pin') || lowerMessage.includes('battery') || lowerMessage.includes('sạc')) {
      intent = 'battery';
      topic = 'battery';
    }
    
    return { keywords, intent, topic };
  };

  // Function to generate contextual bot response
  const generateBotResponse = (userMessage: string, chatHistory: ChatMessage[], currentContext: ChatContext): { message: string; newContext: ChatContext } => {
    const analysis = analyzeUserMessage(userMessage);
    const lowerMessage = userMessage.toLowerCase();
    
    // Update context based on current analysis
    const newContext: ChatContext = {
      ...currentContext,
      topic: analysis.topic || currentContext.topic,
      userIntent: analysis.intent,
      lastKeywords: analysis.keywords,
      conversationStep: (currentContext.conversationStep || 0) + 1
    };
    
    // Greeting responses
    if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello') || lowerMessage.includes('chào')) {
      return {
        message: 'Xin chào! Rất vui được gặp bạn. Tôi có thể giúp gì cho bạn hôm nay? Bạn có muốn:\n• Thuê xe điện\n• Xem bảng giá\n• Tìm địa điểm nhận xe\n• Hỗ trợ khác',
        newContext: { ...newContext, topic: 'greeting' }
      };
    }
    
    // Context-aware responses based on previous conversation
    if (currentContext.topic === 'rental' || analysis.intent === 'booking') {
      if (lowerMessage.includes('xe máy') || lowerMessage.includes('scooter')) {
        return {
          message: 'Xe máy điện là lựa chọn tuyệt vời! Chúng tôi có:\n\n🛵 **VinFast Klara S** - 60km/sạc - 60.000đ/ngày\n🛵 **Honda U-BE** - 50km/sạc - 55.000đ/ngày\n🛵 **Pega Cap A** - 40km/sạc - 45.000đ/ngày\n\nBạn muốn thuê từ ngày nào và trong bao lâu?',
          newContext: { ...newContext, topic: 'scooter_selection' }
        };
      } else if (lowerMessage.includes('ô tô') || lowerMessage.includes('car')) {
        return {
          message: 'Ô tô điện rất tiện lợi! Chúng tôi có:\n\n🚗 **VinFast VF5** - 4 chỗ - 900.000đ/ngày\n🚙 **VinFast VF8** - 7 chỗ - 1.200.000đ/ngày\n🚗 **Tesla Model 3** - Cao cấp - 1.500.000đ/ngày\n\nBạn cần xe cho mấy người và thuê bao lâu?',
          newContext: { ...newContext, topic: 'car_selection' }
        };
      } else if (currentContext.topic === 'scooter_selection' || currentContext.topic === 'car_selection') {
        // User might be providing rental duration or dates
        if (lowerMessage.includes('ngày') || lowerMessage.includes('tuần') || lowerMessage.includes('tháng')) {
          return {
            message: 'Tuyệt vời! Để hoàn tất đặt xe, tôi cần thêm một số thông tin:\n• Họ tên và số điện thoại\n• Giấy phép lái xe (bản photo)\n• Địa điểm nhận xe\n• Thời gian cụ thể\n\nBạn có thể cung cấp thông tin này không?',
            newContext: { ...newContext, topic: 'booking_details' }
          };
        }
      }
      return {
        message: 'Tôi có thể hỗ trợ bạn thuê xe điện. Bạn muốn thuê:\n• Xe máy điện (tiện lợi, tiết kiệm)\n• Ô tô điện (gia đình, thoải mái)\n• Xe đạp điện (thể thao, thân thiện môi trường)',
        newContext
      };
    }
    
    if (currentContext.topic === 'pricing' || analysis.intent === 'pricing') {
      return {
        message: '💰 **Bảng giá thuê xe điện:**\n\n**Xe máy điện:**\n• VinFast Klara S: 60.000đ/ngày\n• Honda U-BE: 55.000đ/ngày\n• Pega Cap A: 45.000đ/ngày\n\n**Ô tô điện:**\n• VinFast VF5: 900.000đ/ngày\n• VinFast VF8: 1.200.000đ/ngày\n• Tesla Model 3: 1.500.000đ/ngày\n\n**Xe đạp điện:** 35.000đ/ngày\n\n*Giảm 10% cho thuê từ 7 ngày trở lên!*\n\nBạn quan tâm loại xe nào?',
        newContext
      };
    }
    
    if (currentContext.topic === 'location' || analysis.intent === 'location') {
      if (lowerMessage.includes('sân bay') || lowerMessage.includes('airport')) {
        return {
          message: '✈️ **Điểm nhận xe Sân bay Tân Sơn Nhất:**\n\n📍 Địa chỉ: Tầng 1, Nhà để xe B1\n⏰ Giờ hoạt động: 24/7\n📞 Hotline: 0901-234-567\n\n🎯 Ưu điểm:\n• Gần cửa ra quốc nội\n• Có đầy đủ loại xe\n• Nhân viên hỗ trợ 24/7\n\nBạn muốn đặt xe ngay?',
          newContext: { ...newContext, topic: 'airport_pickup' }
        };
      }
      return {
        message: '📍 **Các điểm nhận xe của chúng tôi:**\n\n🏢 **Quận 1:** 123 Nguyễn Huệ (6:00-22:00)\n🏢 **Quận 3:** 456 Nam Kỳ Khởi Nghĩa (6:00-22:00)\n🏢 **Quận 7:** 789 Nguyễn Thị Thập (6:00-22:00)\n✈️ **Sân bay TSN:** Tầng 1, B1 (24/7)\n\nBạn muốn nhận xe ở đâu?',
        newContext
      };
    }
    
    if (currentContext.topic === 'battery' || analysis.intent === 'battery') {
      return {
        message: '🔋 **Thông tin về pin xe điện:**\n\n**Xe máy điện:**\n• Quãng đường: 40-60km/lần sạc\n• Thời gian sạc: 4-6 tiếng\n• Pin lithium bền bỉ\n\n**Ô tô điện:**\n• Quãng đường: 300-400km/lần sạc\n• Thời gian sạc: 30-45 phút (sạc nhanh)\n• Hệ thống quản lý pin thông minh\n\n⚡ **Trạm sạc miễn phí** tại tất cả điểm nhận xe!\n\nBạn có lo lắng gì về pin không?',
        newContext
      };
    }
    
    // Follow-up responses based on context
    if ((currentContext.conversationStep || 0) > 2) {
      if (currentContext.topic === 'booking_details') {
        return {
          message: 'Cảm ơn bạn đã quan tâm! Để đặt xe nhanh chóng:\n\n📱 **Cách 1:** Gọi hotline 1900-1234\n💻 **Cách 2:** Đặt online tại website\n💬 **Cách 3:** Tiếp tục chat để tôi hỗ trợ\n\nBạn muốn tôi hướng dẫn đặt xe ngay bây giờ?',
          newContext
        };
      }
    }
    
    // Generic contextual responses
    const contextualResponses = [
      `Dựa trên cuộc trò chuyện của chúng ta về ${currentContext.topic || 'dịch vụ'}, tôi hiểu bạn đang quan tâm. Bạn có thể nói rõ hơn không?`,
      'Tôi đã ghi nhận thông tin bạn cung cấp. Để hỗ trợ tốt nhất, bạn có câu hỏi cụ thể nào không?',
      'Để tôi có thể hỗ trợ chính xác, bạn có thể cho biết bạn muốn biết thêm về phần nào?'
    ];
    
    return {
      message: contextualResponses[Math.floor(Math.random() * contextualResponses.length)],
      newContext
    };
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Generate contextual bot response with delay for natural feel
    setTimeout(() => {
      const { message, newContext } = generateBotResponse(chatInput, chatMessages, chatContext);
      
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message,
        timestamp: new Date(),
        context: newContext.topic
      };
      
      setChatMessages(prev => [...prev, botResponse]);
      setChatContext(newContext);
      setIsTyping(false);
    }, 1500);

    setChatInput('');
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={toggleChat}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              size="icon"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">1</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 60 : 400 
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 w-80"
          >
            <Card className="shadow-2xl border-0 overflow-hidden">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-white text-blue-600">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm font-semibold">Trợ lý ảo</CardTitle>
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs opacity-90">Đang online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={minimizeChat}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeChat}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Content */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="p-0">
                      {/* Messages */}
                      <div className="h-64 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                        {chatMessages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-start space-x-2 max-w-[80%] ${
                              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                            }`}>
                              {message.type === 'bot' && (
                                <Avatar className="h-6 w-6 mt-1">
                                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                    <Bot className="h-3 w-3" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {message.type === 'user' && (
                                <Avatar className="h-6 w-6 mt-1">
                                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                    <User className="h-3 w-3" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`p-3 rounded-lg ${
                                message.type === 'user' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white dark:bg-gray-700 border'
                              }`}>
                                <div className="text-sm whitespace-pre-line">{message.message}</div>
                                <p className={`text-xs mt-1 ${
                                  message.type === 'user' 
                                    ? 'text-blue-100' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {message.timestamp.toLocaleTimeString('vi-VN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        
                        {/* Typing Indicator */}
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                          >
                            <div className="flex items-start space-x-2 max-w-[80%]">
                              <Avatar className="h-6 w-6 mt-1">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  <Bot className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="bg-white dark:bg-gray-700 border p-3 rounded-lg">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input */}
                      <div className="p-4 border-t bg-white dark:bg-gray-900">
                        <form onSubmit={handleChatSubmit} className="flex space-x-2">
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 text-sm"
                          />
                          <Button 
                            type="submit" 
                            size="sm" 
                            disabled={!chatInput.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChat;
