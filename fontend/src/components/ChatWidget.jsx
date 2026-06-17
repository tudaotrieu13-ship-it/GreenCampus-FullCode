import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { API_URL } from '../config/api';

const ChatWidget = ({ onOpenChat }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const token = localStorage.getItem('greencampus_token');
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/chat/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.totalUnread || 0);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <button 
        onClick={() => {
          setUnreadCount(0); // optimistically clear
          if (onOpenChat) onOpenChat();
        }}
        className="w-14 h-14 md:w-16 md:h-16 bg-brand-green text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(45,106,79,0.3)] hover:scale-110 active:scale-95 transition-all duration-300 relative"
      >
        <MessageCircle size={28} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
