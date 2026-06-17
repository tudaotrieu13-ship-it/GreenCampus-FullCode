import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Leaf, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { API_URL } from '../config/api';
import { useToast } from './ToastProvider';

const formatText = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    let currentLine = line;
    let isBullet = false;
    
    if (currentLine.trim().startsWith('* ')) {
      isBullet = true;
      currentLine = currentLine.replace(/^\s*\*\s+/, '');
    } else if (currentLine.trim().startsWith('- ')) {
      isBullet = true;
      currentLine = currentLine.replace(/^\s*-\s+/, '');
    }

    const parts = currentLine.split(/(\*\*.*?\*\*)/g);
    
    return (
      <div key={i} className={`${isBullet ? 'ml-3 relative' : 'mb-1'} min-h-[1rem] leading-relaxed`}>
        {isBullet && <span className="absolute -left-3 top-0 font-bold">•</span>}
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
      </div>
    );
  });
};

const GreenAssistantBot = () => {
  const { confirm, showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  
  // Initialize state from localStorage or use default greeting
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('greencampus_ai_chat');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse chat history from localStorage', e);
    }
    return [
      { sender: 'bot', text: 'Chào bạn! Mình là Trợ lý Sống Xanh (Green Assistant). Mình có thể giúp gì cho bạn hôm nay? (Ví dụ: Làm sao để tích lũy điểm G-Points?)' }
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('greencampus_ai_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearHistory = async () => {
    const isConfirmed = await confirm('Bạn muốn xóa toàn bộ đoạn hội thoại này?');
    if (isConfirmed) {
      const defaultHistory = [
        { sender: 'bot', text: 'Chào bạn! Mình là Trợ lý Sống Xanh (Green Assistant). Mình có thể giúp gì cho bạn hôm nay? (Ví dụ: Làm sao để tích lũy điểm G-Points?)' }
      ];
      setChatHistory(defaultHistory);
      localStorage.removeItem('greencampus_ai_chat');
      showToast('Đã xóa lịch sử hội thoại');
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, chatHistory]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    
    // Add user message to history
    const newHistory = [...chatHistory, { sender: 'user', text: userMessage }];
    setChatHistory(newHistory);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('greencampus_token');
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: chatHistory // Send previous context
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi kết nối AI');

      setChatHistory([...newHistory, { sender: 'bot', text: data.reply }]);
    } catch (error) {
      console.error(error);
      setChatHistory([...newHistory, { sender: 'bot', text: 'Xin lỗi, hiện tại mình đang bận hoặc hệ thống bị lỗi. Bạn thử lại sau nhé!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 md:w-96 rounded-2xl shadow-2xl mb-4 border border-emerald-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-300 origin-bottom-left">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Green Assistant</h3>
                <p className="text-[10px] text-emerald-100 flex items-center gap-1"><Sparkles size={10} /> Trợ lý AI Sống Xanh</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleClearHistory}
                className="text-white/80 hover:text-white transition-colors p-1"
                title="Xóa lịch sử trò chuyện"
              >
                <Trash2 size={16} />
              </button>
              <button className="text-white/80 hover:text-white transition-colors p-1" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="h-96 flex flex-col bg-[#F9FBF9]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 max-w-[85%] text-sm rounded-2xl shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-emerald-500 text-white rounded-br-sm' 
                      : 'bg-white text-gray-800 border border-emerald-100 rounded-bl-sm'
                  }`}>
                    {msg.sender === 'bot' ? formatText(msg.text) : msg.text}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex flex-col items-start">
                  <div className="bg-white p-3 rounded-2xl rounded-bl-sm shadow-sm border border-emerald-100 flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 size={16} className="animate-spin text-emerald-500" /> AI đang suy nghĩ...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-emerald-50">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hỏi mình bất cứ điều gì..." 
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="bg-emerald-500 text-white p-2.5 rounded-full hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(16,185,129,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 relative group"
      >
        {isOpen ? <X size={28} /> : <Leaf size={28} />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-white animate-bounce">
            <Sparkles size={12} className="text-white" />
          </div>
        )}
        
        {/* Tooltip */}
        {!isOpen && (
          <span className="absolute left-full ml-4 whitespace-nowrap bg-white text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-emerald-100">
            Hỏi AI Sống Xanh!
          </span>
        )}
      </button>
    </div>
  );
};

export default GreenAssistantBot;
