// src/components/student/AITutorChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { studentApi } from '../../api/student';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AITutorChatProps {
  courseId: string;
  className?: string;
}

export function AITutorChat({ courseId, className = '' }: AITutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
  }, [courseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    const greeting: Message = {
      role: 'assistant',
      content: '👋 Hi! I\'m your AI tutor. Ask me anything about this course!',
    };
    try {
      const response = await studentApi.getTutorConversation(courseId);
      const history = response.data?.messages || [];
      if (history.length > 0) {
        // Backend messages are { role: 'user'|'tutor', text }.
        setMessages(history.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text ?? m.content ?? '',
        })));
      } else {
        setMessages([greeting]);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setMessages([greeting]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await studentApi.sendTutorMessage(courseId, input);
      setConversationId(response.data.conversation_id);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.reply
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`flex flex-col h-[500px] bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <Bot className="w-8 h-8 text-blue-600" />
        <div>
          <h3 className="font-semibold text-gray-900">AI Tutor</h3>
          <p className="text-xs text-gray-500">Powered by AI</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <Bot className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <User className="w-8 h-8 text-gray-600 flex-shrink-0 mt-1" />
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a question about the course..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}