import { getAuthHeaders } from './auth';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_SWAGGER_URL ||
  '';

const apiUrl = (path: string): string =>
  API_BASE ? `${API_BASE.replace(/\/$/, '')}${path}` : path;

// Types based on actual API response
export interface Conversation {
  session_id: string;
  user_role: string;
  status: string;
  total_messages: number;
  last_activity: string;
  created_at: string;
}

export interface ConversationsResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
  };
}

export interface MessageMetadata {
  suggestions?: string[];
  actions?: string[];
  context?: string;
}

export interface HistoryMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export interface ChatMessage {
  id: string;
  session_id?: string;
  message: string;
  response?: string;
  sender: 'user' | 'bot';
  timestamp: string;
  context?: string;
}

export interface SendMessagePayload {
  message: string;
  session_id?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  suggestions?: string[];
  actions?: string[];
  context?: string;
  session_id: string;
  conversation_id?: string;
}

export interface ConversationHistory {
  success: boolean;
  data: {
    session_id: string;
    user_role: string;
    total_messages: number;
    last_activity: string;
    messages: HistoryMessage[];
  };
}

export interface CreateConversationResponse {
  success: boolean;
  message: string;
  data: {
    session_id: string;
    user_role: string;
    created_at: string;
  };
}

export interface SuggestionsResponse {
  success: boolean;
  data: {
    suggestions: string[];
    user_role: string;
  };
}

/**
 * Lấy danh sách hội thoại của user
 */
export async function getConversations(limit: number = 20): Promise<ConversationsResponse> {
  const res = await fetch(apiUrl(`/api/chatbot/conversations?limit=${limit}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    let errorMessage = 'Không thể tải danh sách hội thoại';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Ignore parsing errors
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

/**
 * Gửi tin nhắn cho chatbot
 */
export async function sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
  const res = await fetch(apiUrl('/api/chatbot/message'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorMessage = 'Không thể gửi tin nhắn';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Ignore parsing errors
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

/**
 * Lấy lịch sử hội thoại
 * @param sessionId - ID của session hội thoại (required)
 */
export async function getChatHistory(sessionId: string): Promise<ConversationHistory> {
  const url = `/api/chatbot/history?session_id=${sessionId}`;
    
  const res = await fetch(apiUrl(url), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    let errorMessage = 'Không thể tải lịch sử hội thoại';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Ignore parsing errors
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

/**
 * Tạo hội thoại mới
 */
export async function createConversation(): Promise<CreateConversationResponse> {
  const res = await fetch(apiUrl('/api/chatbot/conversations'), {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    let errorMessage = 'Không thể tạo hội thoại mới';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Ignore parsing errors
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

/**
 * Lấy gợi ý dựa trên role
 * @param context - Ngữ cảnh để tạo gợi ý phù hợp (optional)
 */
export async function getSuggestions(context?: string): Promise<SuggestionsResponse> {
  const url = context 
    ? `/api/chatbot/suggestions?context=${encodeURIComponent(context)}`
    : '/api/chatbot/suggestions';
    
  const res = await fetch(apiUrl(url), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    let errorMessage = 'Không thể tải gợi ý';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Ignore parsing errors
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

