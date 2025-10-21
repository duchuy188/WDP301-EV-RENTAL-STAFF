import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  BotMessageSquare,
  User, 
  X, 
  Minimize2,
  Maximize2,
  Plus,
  History,
  Clock,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import * as chatbotApi from '@/api/chatbot';

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatContext, setChatContext] = useState<ChatContext>({
    topic: '',
    userIntent: '',
    lastKeywords: [],
    conversationStep: 0
  });
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(false);
  const [conversations, setConversations] = useState<chatbotApi.Conversation[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const addWelcomeMessage = useCallback(() => {
    setChatMessages([{
      id: Date.now().toString(),
      type: 'bot',
      message: 'Xin chào! Tôi là trợ lý ảo của EV Rental. Tôi có thể giúp gì cho bạn?',
      timestamp: new Date(),
      context: 'greeting'
    }]);
  }, []);

  // Initialize chatbot: Load conversations or create new one
  const initializeChatbot = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      // BƯỚC 1: Lấy danh sách conversations
      const response = await chatbotApi.getConversations(20);
      
      if (response.success && response.data.conversations.length > 0) {
        // Lưu danh sách conversations
        setConversations(response.data.conversations);
        
        // BƯỚC 2a: Đã có conversation → load conversation gần nhất
        const latestConv = response.data.conversations[0];
        setSessionId(latestConv.session_id);
        
        // Load lịch sử nếu có messages
        if (latestConv.total_messages > 0) {
          const history = await chatbotApi.getChatHistory(latestConv.session_id);
          if (history.success && history.data.messages && history.data.messages.length > 0) {
            // Convert API messages sang UI format
            // API trả về role: 'user' | 'assistant', cần convert sang type: 'user' | 'bot'
            setChatMessages(history.data.messages.map((msg, index) => ({
              id: `${latestConv.session_id}-${index}`,
              type: msg.role === 'assistant' ? 'bot' : 'user',
              message: msg.message,
              timestamp: new Date(msg.timestamp),
              context: msg.metadata?.context
            })));
          } else {
            // Có conversation nhưng chưa có message
            addWelcomeMessage();
          }
        } else {
          // Có conversation nhưng chưa có message
          addWelcomeMessage();
        }
      } else {
        // BƯỚC 2b: Chưa có conversation → tạo mới
        const newConv = await chatbotApi.createConversation();
        if (newConv.success && newConv.data.session_id) {
          setSessionId(newConv.data.session_id);
          console.log('Created new conversation:', newConv.data.session_id, 'for role:', newConv.data.user_role);
          // Reload conversations list
          const updatedResponse = await chatbotApi.getConversations(20);
          if (updatedResponse.success) {
            setConversations(updatedResponse.data.conversations);
          }
        }
        addWelcomeMessage();
      }

      // BƯỚC 3: Load suggestions (optional)
      try {
        const suggestionsData = await chatbotApi.getSuggestions();
        if (suggestionsData.success && suggestionsData.data.suggestions) {
          setSuggestions(suggestionsData.data.suggestions);
          console.log('Suggestions loaded for role:', suggestionsData.data.user_role);
        }
      } catch (error) {
        console.log('Could not load suggestions:', error);
      }

    } catch (error) {
      console.error('Error initializing chatbot:', error);
      // Fallback: Show welcome message
      addWelcomeMessage();
    } finally {
      setIsLoadingConversations(false);
    }
  }, [addWelcomeMessage]);

  // Load conversations when chat opens
  useEffect(() => {
    if (isOpen && chatMessages.length === 0 && !isLoadingConversations) {
      initializeChatbot();
    }
  }, [isOpen, chatMessages.length, isLoadingConversations, initializeChatbot]);

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
  const generateBotResponse = (userMessage: string, _chatHistory: ChatMessage[], currentContext: ChatContext): { message: string; newContext: ChatContext } => {
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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsTyping(true);

    try {
      // BƯỚC 4: Call API để gửi tin nhắn
      const response = await chatbotApi.sendMessage({
        message: currentInput,
        session_id: sessionId
      });

      if (response.success && response.message) {
        // Update sessionId nếu API trả về ID mới
        if (response.session_id && !sessionId) {
          setSessionId(response.session_id);
        }

        // Thêm bot response vào UI
        const botResponse: ChatMessage = {
          id: Date.now().toString(),
          type: 'bot',
          message: response.message,
          timestamp: new Date(),
          context: response.context
        };

        setChatMessages(prev => [...prev, botResponse]);

        // Update suggestions nếu có
        if (response.suggestions && response.suggestions.length > 0) {
          setSuggestions(response.suggestions);
        }
      } else {
        throw new Error('Invalid API response');
      }

    } catch (error) {
      console.error('Error sending message to API:', error);
      
      // Fallback: Generate contextual bot response locally
      setTimeout(() => {
        const { message, newContext } = generateBotResponse(currentInput, chatMessages, chatContext);
        
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          message,
          timestamp: new Date(),
          context: newContext.topic
        };
        
        setChatMessages(prev => [...prev, botResponse]);
        setChatContext(newContext);
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(!isMinimized);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleNewConversation = async () => {
    try {
      setIsLoadingConversations(true);
      
      // Tạo conversation mới
      const newConv = await chatbotApi.createConversation();
      if (newConv.success && newConv.data.session_id) {
        setSessionId(newConv.data.session_id);
        console.log('Created new conversation:', newConv.data.session_id);
        
        // Reload conversations list
        const updatedResponse = await chatbotApi.getConversations(20);
        if (updatedResponse.success) {
          setConversations(updatedResponse.data.conversations);
        }
        
        // Reset chat messages với welcome message
        setChatMessages([{
          id: Date.now().toString(),
          type: 'bot',
          message: 'Xin chào! Đây là hội thoại mới. Tôi có thể giúp gì cho bạn?',
          timestamp: new Date(),
          context: 'greeting'
        }]);
        
        // Reset context
        setChatContext({
          topic: '',
          userIntent: '',
          lastKeywords: [],
          conversationStep: 0
        });
      }
    } catch (error) {
      console.error('Error creating new conversation:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleSelectConversation = async (conversation: chatbotApi.Conversation) => {
    try {
      setIsLoadingConversations(true);
      setSessionId(conversation.session_id);
      
      // Load lịch sử conversation
      if (conversation.total_messages > 0) {
        const history = await chatbotApi.getChatHistory(conversation.session_id);
        if (history.success && history.data.messages && history.data.messages.length > 0) {
          setChatMessages(history.data.messages.map((msg, index) => ({
            id: `${conversation.session_id}-${index}`,
            type: msg.role === 'assistant' ? 'bot' : 'user',
            message: msg.message,
            timestamp: new Date(msg.timestamp),
            context: msg.metadata?.context
          })));
        } else {
          addWelcomeMessage();
        }
      } else {
        addWelcomeMessage();
      }
      
      // Close conversations list
      setShowConversationsList(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    // Tạo user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: suggestion,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Call API để gửi tin nhắn
      const response = await chatbotApi.sendMessage({
        message: suggestion,
        session_id: sessionId
      });

      if (response.success && response.message) {
        if (response.session_id && !sessionId) {
          setSessionId(response.session_id);
        }

        const botResponse: ChatMessage = {
          id: Date.now().toString(),
          type: 'bot',
          message: response.message,
          timestamp: new Date(),
          context: response.context
        };

        setChatMessages(prev => [...prev, botResponse]);

        // Update suggestions nếu có
        if (response.suggestions && response.suggestions.length > 0) {
          setSuggestions(response.suggestions);
        }
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Error sending suggestion:', error);
      
      // Fallback
      setTimeout(() => {
        const { message, newContext } = generateBotResponse(suggestion, chatMessages, chatContext);
        
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          message,
          timestamp: new Date(),
          context: newContext.topic
        };
        
        setChatMessages(prev => [...prev, botResponse]);
        setChatContext(newContext);
      }, 500);
    } finally {
      setIsTyping(false);
    }
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
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999]"
          >
            <Button
              onClick={toggleChat}
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
              size="icon"
            >
              <div className="relative flex items-center justify-center">
                <BotMessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 absolute -top-1 -right-1 text-yellow-300" />
              </div>
            </Button>
            {/* Notification dot */}
            <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] sm:text-xs text-white font-bold">1</span>
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
              height: isMinimized ? 60 : 'auto' 
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-4 right-4 z-[9999] w-[calc(100vw-2rem)] sm:w-96 sm:bottom-6 sm:right-6 max-w-md"
          >
            <Card className="shadow-2xl border-0 overflow-hidden flex flex-col max-h-[600px]">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarFallback className="bg-white text-green-600">
                        <div className="relative">
                          <BotMessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                          <Zap className="h-1.5 w-1.5 sm:h-2 sm:w-2 absolute -top-0.5 -right-0.5 text-yellow-500" />
                        </div>
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xs sm:text-sm font-semibold">🛵 Trợ lý ảo EV</CardTitle>
                      <div className="hidden sm:flex items-center space-x-1">
                        <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs opacity-90">Đang online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-0.5 sm:space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConversationsList(!showConversationsList)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
                      title="Lịch sử hội thoại"
                    >
                      <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={minimizeChat}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20 hidden sm:flex"
                      title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
                    >
                      {isMinimized ? (
                        <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeChat}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
                      title="Đóng"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                    <CardContent className="p-0 flex flex-col">
                      {/* Conversations List or Messages */}
                      {showConversationsList ? (
                        /* Conversations List */
                        <div className="h-56 sm:h-64 overflow-y-auto p-3 sm:p-4 bg-gray-50 dark:bg-gray-800">
                          <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-700 dark:text-gray-300">
                            Lịch sử hội thoại
                          </h3>
                          <div className="space-y-1.5 sm:space-y-2">
                            {conversations.length === 0 ? (
                              <p className="text-xs text-gray-500 text-center py-4">
                                Chưa có hội thoại nào
                              </p>
                            ) : (
                              conversations.map((conv) => (
                                <motion.div
                                  key={conv.session_id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all ${
                                    conv.session_id === sessionId
                                      ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700'
                                      : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
                                  }`}
                                  onClick={() => handleSelectConversation(conv)}
                                >
                                  <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 flex-shrink-0" />
                                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                                          {new Date(conv.last_activity).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300">
                                        {conv.total_messages} tin nhắn
                                      </p>
                                    </div>
                                    {conv.session_id === sessionId && (
                                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                    )}
                                  </div>
                                </motion.div>
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Messages */
                        <div className="h-56 sm:h-64 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-800">
                        {chatMessages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-start space-x-1.5 sm:space-x-2 max-w-[85%] sm:max-w-[80%] ${
                              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                            }`}>
                              {message.type === 'bot' && (
                                <Avatar className="h-5 w-5 sm:h-6 sm:w-6 mt-1">
                                  <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                    <div className="relative">
                                      <BotMessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      <Zap className="h-1 w-1 sm:h-1.5 sm:w-1.5 absolute -top-0.5 -right-0.5 text-yellow-500" />
                                    </div>
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {message.type === 'user' && (
                                <Avatar className="h-5 w-5 sm:h-6 sm:w-6 mt-1">
                                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                    <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`p-2.5 sm:p-3 rounded-lg ${
                                message.type === 'user' 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-white dark:bg-gray-700 border'
                              }`}>
                                <div className="text-xs sm:text-sm whitespace-pre-line break-words">{message.message}</div>
                                <p className={`text-[10px] sm:text-xs mt-1 ${
                                  message.type === 'user' 
                                    ? 'text-green-100' 
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
                                <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                  <div className="relative">
                                    <BotMessageSquare className="h-3 w-3" />
                                    <Zap className="h-1.5 w-1.5 absolute -top-0.5 -right-0.5 text-yellow-500" />
                                  </div>
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
                      )}

                      {/* Input */}
                      <div className="border-t bg-white dark:bg-gray-900">
                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                          <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-1.5 sm:pb-2">
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2">Gợi ý:</p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {suggestions.slice(0, 3).map((suggestion, index) => (
                                <Button
                                  key={index}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  variant="outline"
                                  size="sm"
                                  className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 sm:px-3 border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Input area */}
                        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2">
                          <div className="flex gap-1.5 sm:gap-2">
                            <form onSubmit={handleChatSubmit} className="flex flex-1 gap-1.5 sm:gap-2">
                              <Input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                              />
                              <Button 
                                type="submit" 
                                size="sm" 
                                disabled={!chatInput.trim()}
                                className="bg-green-600 hover:bg-green-700 h-9 w-9 sm:h-10 sm:w-10 p-0"
                                title="Gửi"
                              >
                                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </form>
                            <Button
                              onClick={handleNewConversation}
                              disabled={isLoadingConversations}
                              variant="outline"
                              size="sm"
                              className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950 h-9 w-9 sm:h-10 sm:w-10 p-0"
                              title="Tạo hội thoại mới"
                            >
                              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
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
