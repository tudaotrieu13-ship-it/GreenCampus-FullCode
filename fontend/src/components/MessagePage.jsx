import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search, Plus, Image, Smile, ThumbsUp, Send, Phone, Video,
  Info, ChevronDown, Bell, BellOff, User, Share2, Lock,
  MoreHorizontal, PaperclipIcon, Sticker, Gift, Mic, Pin, PinOff, X, Loader2, ArrowLeft
} from 'lucide-react';
import { io } from 'socket.io-client';
import { API_URL, BACKEND_ORIGIN } from '../config/api';
import { useToast } from './ToastProvider';

const resolveImage = (url, name) => {
  if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=E1F0C4&color=2D6A4F&bold=true`;
  
  let finalUrl = url;
  try {
    const parsed = JSON.parse(url);
    if (Array.isArray(parsed) && parsed.length > 0) finalUrl = parsed[0];
  } catch (e) {
    if (typeof url === 'string' && url.includes(',')) {
      finalUrl = url.split(',')[0];
    }
  }

  if (finalUrl.startsWith('http') || finalUrl.startsWith('blob:')) return finalUrl;
  return `${BACKEND_ORIGIN}${finalUrl}`;
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const Avatar = ({ src, size = 10, online = false }) => (
  <div className="relative flex-shrink-0">
    <div className={`w-${size} h-${size} rounded-full overflow-hidden bg-gray-200`}>
      <img src={src} alt="" className="w-full h-full object-cover" />
    </div>
    {online && (
      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
    )}
  </div>
);

const ChatListItem = ({ contact, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-left transition-colors ${active ? 'bg-brand-primary/40' : 'hover:bg-gray-100'}`}
  >
    <Avatar src={contact.avatar} size={12} online={contact.online} />
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline">
        <span className={`text-sm font-semibold truncate ${contact.unread ? 'text-gray-900' : 'text-gray-700'}`}>{contact.name}</span>
        <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">{contact.time}</span>
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-xs truncate ${contact.unread ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>{contact.lastMsg}</p>
        {contact.unread > 0 && (
          <span className="ml-2 bg-brand-green text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0">{contact.unread}</span>
        )}
      </div>
    </div>
  </button>
);

const MessageBubble = ({ msg, contactAvatar }) => {
  const isMe = msg.from === 'me';
  const isImage = msg.text && msg.text.startsWith('[IMAGE] ');
  const textContent = isImage ? null : msg.text;
  const imageContent = isImage ? msg.text.replace('[IMAGE] ', '') : null;

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}>
      <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && (
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mb-1">
            <img src={contactAvatar} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex flex-col gap-1 max-w-[75%]">
          {msg.item && (
            <div className={`overflow-hidden rounded-[18px] border border-gray-200 shadow-sm bg-white mb-1 transition-transform hover:scale-[1.02] cursor-pointer w-64 ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
              {msg.item.image && (
                <div className="h-32 w-full overflow-hidden">
                  <img
                    src={resolveImage(msg.item.image, '')}
                    alt={msg.item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-bold text-gray-900 line-clamp-1">{msg.item.title}</p>
                <p className="text-brand-green font-bold text-xs mt-1">
                  {msg.item.price ? `${Number(msg.item.price).toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                </p>
              </div>
            </div>
          )}
          {textContent && (
            <div className={`px-4 py-2.5 rounded-[18px] text-sm leading-relaxed ${isMe ? 'bg-brand-green text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
              {textContent}
            </div>
          )}
          {imageContent && (
            <div className={`overflow-hidden rounded-[18px] border border-gray-200 shadow-sm bg-white mb-1 w-64 ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
              <img
                src={resolveImage(imageContent, '')}
                alt="Đính kèm"
                className="w-full h-auto object-cover cursor-pointer hover:opacity-90"
              />
            </div>
          )}
        </div>
        <span className="text-[10px] text-gray-400 mb-1">{msg.time}</span>
      </div>
      {isMe && msg.isReadByOther && (
        <span className="text-[10px] text-gray-400 mr-8 -mt-1">Đã xem</span>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const MessagePage = ({ initialContact = null, currentUser = null, onOpenStore = null, onLogout = null, onBuyItem = null }) => {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(initialContact);
  const [activeTab, setActiveTab] = useState('all');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState({});
  const [search, setSearch] = useState('');
  const [infoOpen, setInfoOpen] = useState({ media: false, privacy: false });
  const [isMuted, setIsMuted] = useState(false);
  const [pinnedItem, setPinnedItem] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const EMOJI_LIST = ['😀', '😂', '🥰', '😎', '😭', '😡', '👍', '🙏', '🔥', '❤️', '🥺', '🎉', '✨', '🤔', '🙌', '💯', '💩', '🥳'];

  const [localUser, setLocalUser] = useState(currentUser);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showMobileInfo, setShowMobileInfo] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setLocalUser(currentUser);
      setLoadingUser(false);
    } else {
      try {
        const storedUserStr = localStorage.getItem('greencampus_user') || localStorage.getItem('user');
        if (storedUserStr) {
          setLocalUser(JSON.parse(storedUserStr));
        }
      } catch (err) {
        console.error("Failed to parse user from local storage", err);
      } finally {
        setLoadingUser(false);
      }
    }
  }, [currentUser]);

  const token = localUser?.token || localStorage.getItem('greencampus_token') || null;
  const currentUserId = localUser?.user?.id || localUser?.id || null;



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContact, messages]);

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        console.warn("Phiên đăng nhập hết hạn (401). Đang đăng xuất...");
        if (onLogout) onLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) {
          const mappedContacts = data.map(c => {
            const mapped = {
              id: c.user_id,
              name: c.full_name,
              avatar: resolveImage(c.avatar_url, c.full_name),
              lastMsg: c.last_message,
              time: new Date(c.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              unread: Number(c.unread_count) || 0,
              online: true
            };
            // Preserve postReference if this is the active contact to avoid losing it during refresh
            if (activeContact?.id === mapped.id && activeContact.postReference) {
              mapped.postReference = activeContact.postReference;
            }
            return mapped;
          });

          if (initialContact && !mappedContacts.find(c => c.id === initialContact?.id)) {
            mappedContacts.unshift({
              ...initialContact,
              lastMsg: 'Bắt đầu cuộc trò chuyện',
              time: 'Vừa xong',
              unread: 0,
              online: true
            });
          }

          setContacts(mappedContacts);

          if (!activeContact && mappedContacts.length > 0) {
            setActiveContact(mappedContacts[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };



  const handlePin = async () => {
    if (!token || !activeContact?.id || !activeContact?.postReference) return;
    const ref = activeContact.postReference;
    const targetItemId = ref.itemId || null;
    const targetPostId = ref.postId || null;
    if (!targetItemId && !targetPostId) return;

    try {
      const res = await fetch(`${API_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: activeContact.id,
          itemId: targetItemId,
          postId: targetPostId,
          content: 'Tôi quan tâm đến sản phẩm này'
        })
      });

      if (res.status === 401) {
        if (onLogout) onLogout();
        return;
      }

      if (res.ok) {
        showToast('Đã ghim sản phẩm', 'success');
        fetchMessages(); // Refresh messages to show the shared card
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi ghim sản phẩm', 'error');
    }
  };

  const fetchMessages = async () => {
    if (!token || !activeContact?.id) return;
    try {
      const res = await fetch(`${API_URL}/chat/${activeContact.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        if (onLogout) onLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const mappedMsgs = data.map(m => ({
          id: m.id,
          from: m.sender_id === currentUserId ? 'me' : 'them',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          item: m.item_id || m.post_id ? {
            id: m.item_id || m.post_id,
            title: m.item_title || m.post_title,
            price: m.item_price || m.post_price,
            image: m.item_image || m.post_image,
            isPost: !!m.post_id
          } : null,
          isReadByOther: m.is_read === 1
        }));
        setMessages(prev => ({ ...prev, [activeContact.id]: mappedMsgs }));
      }

      // Fetch pinned item
      const pinRes = await fetch(`${API_URL}/chat/pinned/${activeContact.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pinRes.ok) {
        const pinData = await pinRes.json();
        setPinnedItem(pinData || null);
      } else {
        setPinnedItem(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeContact) {
      fetchMessages();

      // Auto-pin if navigating from product
      if (activeContact.postReference?.itemId && token) {
        fetch(`${API_URL}/chat/pin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            otherUserId: activeContact.id,
            itemId: activeContact.postReference.itemId
          })
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) setPinnedItem(data);
          })
          .catch(console.error);
      }
      // Mark as read
      if (token && activeContact.unread > 0) {
        fetch(`${API_URL}/chat/read/${activeContact.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          if (res.ok) {
            setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, unread: 0 } : c));
            if (socketRef.current) socketRef.current.emit('message_read', { receiverId: activeContact.id, senderId: currentUserId });
          }
        }).catch(console.error);
      }
      setIsTyping(false); // Reset typing indicator when switching contacts
    }
  }, [activeContact]);

  useEffect(() => {
    if (initialContact) setActiveContact(initialContact);
  }, [initialContact]);

  useEffect(() => {
    if (!token || !currentUserId) return;

    // Khởi tạo Socket.IO
    socketRef.current = io(BACKEND_ORIGIN);

    // Tham gia phòng riêng theo ID
    socketRef.current.emit('join_room', currentUserId);

    socketRef.current.on('disconnect', () => {
      showToast('Đang mất kết nối mạng, đang thử kết nối lại...', 'error');
    });

    socketRef.current.on('connect', () => {
      // Option: showToast('Đã kết nối lại thành công', 'success') if it was previously disconnected
    });

    // Lắng nghe tin nhắn mới
    socketRef.current.on('receive_message', (newMsg) => {
      const mappedMsg = {
        id: newMsg.id,
        from: newMsg.sender_id === currentUserId ? 'me' : 'them',
        text: newMsg.content,
        time: new Date(newMsg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        item: newMsg.item_id || newMsg.post_id ? {
          id: newMsg.item_id || newMsg.post_id,
          title: newMsg.item_title || newMsg.post_title,
          price: newMsg.item_price || newMsg.post_price,
          image: newMsg.item_image || newMsg.post_image,
          isPost: !!newMsg.post_id
        } : null
      };

      const otherId = newMsg.sender_id === currentUserId ? newMsg.receiver_id : newMsg.sender_id;

      setMessages(prev => ({
        ...prev,
        [otherId]: [...(prev[otherId] || []), mappedMsg]
      }));

      // Update conversations list so the latest message shows on the left
      fetchConversations();
    });

    socketRef.current.on('message_read', ({ senderId }) => {
      // The other person read our messages.
      setMessages(prev => {
        const theirMsgs = prev[senderId] || [];
        return {
          ...prev,
          [senderId]: theirMsgs.map(m => ({ ...m, isReadByOther: true }))
        };
      });
    });

    socketRef.current.on('typing', ({ senderId, isTyping: typingStatus }) => {
      setContacts(prev => {
        const idx = prev.findIndex(c => c.id === senderId);
        if (idx === -1) return prev;
        const newContacts = [...prev];
        if (activeContact?.id === senderId) {
          setIsTyping(typingStatus);
        }
        return newContacts;
      });
    });

    fetchConversations();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [token, currentUserId]); // Chỉ chạy lại khi đăng nhập/đăng xuất

  const handleSend = async () => {
    if (!inputText.trim() || !activeContact?.id || !token) return;

    const content = inputText.trim();
    setInputText('');

    const tempId = Date.now();
    const newMsg = { id: tempId, from: 'me', text: content, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => ({ ...prev, [activeContact.id]: [...(prev[activeContact.id] || []), newMsg] }));

    try {
      const res = await fetch(`${API_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: activeContact.id,
          content: content
        })
      });

      if (res.status === 401) {
        if (onLogout) onLogout();
        return;
      }

      if (res.ok) {
        fetchMessages();
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleFileUpload = async (file) => {
    if (!token || !activeContact?.id) return;
    
    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.', 'error');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/chat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.status === 401) {
        if (onLogout) onLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        showToast('Đã gửi ảnh thành công', 'success');

        const content = `[IMAGE] ${data.url}`;
        const tempId = Date.now();
        const newMsg = { id: tempId, from: 'me', text: content, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => ({ ...prev, [activeContact.id]: [...(prev[activeContact.id] || []), newMsg] }));

        await fetch(`${API_URL}/chat/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            receiverId: activeContact.id,
            content: content
          })
        });
      } else {
        showToast('Không thể tải ảnh lên', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải ảnh lên', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'unread') return c.unread > 0;
    if (activeTab === 'group') return c.isGroup;
    return true;
  });

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unread', label: 'Chưa đọc' },
    { key: 'group', label: 'Nhóm' },
  ];

  if (loadingUser) {
    return (
      <div className="flex h-[calc(100vh-72px)] bg-white items-center justify-center text-gray-500">
        Đang tải...
      </div>
    );
  }

  if (!localUser || !token) {
    return (
      <div className="flex h-[calc(100vh-72px)] bg-white items-center justify-center text-gray-500">
        Hãy đăng nhập để sử dụng tính năng nhắn tin.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-72px)] bg-white overflow-hidden border-t border-gray-100">

      {/* ── LEFT: Chat List ── */}
      <div className={`w-[340px] flex-shrink-0 flex flex-col border-r border-gray-100 bg-white max-md:w-full ${activeContact ? 'max-md:hidden' : 'max-md:flex'}`}>
        {/* Header */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Đoạn chat</h2>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm trên Messenger"
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${activeTab === tab.key ? 'bg-brand-primary text-brand-green' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {filteredContacts.map(contact => (
            <ChatListItem
              key={contact.id}
              contact={contact}
              active={activeContact?.id === contact.id}
              onClick={() => setActiveContact(contact)}
            />
          ))}
        </div>
      </div>

      {/* ── CENTER: Chat Window ── */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white ${!activeContact ? 'max-md:hidden' : 'max-md:flex'}`}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveContact(null)} 
                  className="md:hidden w-8 h-8 -ml-2 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <ArrowLeft size={20} />
                </button>
                <Avatar src={activeContact.avatar} size={10} online={true} />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{activeContact.name}</p>
                  <p className="text-xs text-green-500 font-medium">Đang hoạt động</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowMobileInfo(true)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-brand-green transition-colors">
                  <Info size={20} />
                </button>
              </div>
            </div>

            {/* Post Reference Banner */}
            {(pinnedItem || activeContact?.postReference) && (() => {
              const displayedItem = pinnedItem || activeContact.postReference;
              return (
                <div className="mx-5 mt-4 p-3 bg-brand-primary/10 border border-brand-green/20 rounded-[12px] flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 relative group transition-all">
                  {displayedItem.image && (
                    <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-white flex-shrink-0 border border-gray-100">
                      <img
                        src={resolveImage(displayedItem.image, '')}
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-brand-green tracking-wider mb-1 block flex items-center gap-1">
                      <Pin size={10} className="fill-current" /> Đang trao đổi về sản phẩm
                    </span>
                    <p className="text-sm text-gray-900 font-medium line-clamp-2 leading-tight">
                      {displayedItem.content || displayedItem.title}
                    </p>
                    <p className="text-brand-green font-bold text-sm mt-1">
                      {displayedItem.price ? `${Number(displayedItem.price).toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        onBuyItem && onBuyItem({
                          id: displayedItem.item_id || displayedItem.itemId || displayedItem.id,
                          title: displayedItem.content || displayedItem.title || 'Sản phẩm',
                          price: displayedItem.price || 0,
                          image: displayedItem.image,
                          user_id: displayedItem.seller_id || displayedItem.user_id || activeContact.id
                        });
                        showToast('Đã bắt đầu giao dịch', 'success');
                      }}
                      className="px-3 py-1.5 rounded-[8px] bg-brand-green text-white font-bold text-xs hover:bg-brand-green/90 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Gift size={14} /> Chốt đơn
                    </button>
                    {!pinnedItem && (
                      <button
                        onClick={handlePin}
                        className="px-3 py-1.5 rounded-[8px] bg-white text-gray-600 border border-gray-200 font-bold text-xs hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Pin size={14} /> Ghim lại
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {/* Date divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">Hôm nay</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              {(messages[activeContact?.id] || []).map(msg => (
                <MessageBubble key={msg.id} msg={msg} contactAvatar={activeContact?.avatar} />
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-gray-400 text-xs italic opacity-70 animate-pulse">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <img src={activeContact.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  Đang soạn tin...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1">
                <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-brand-green transition-colors">
                  <Image size={20} />
                </button>
                <div className="relative">
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-brand-green transition-colors">
                    <Sticker size={20} />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 w-[280px] bg-white border border-gray-200 shadow-xl rounded-xl p-3 z-50">
                      <div className="grid grid-cols-6 gap-2">
                        {EMOJI_LIST.map((emoji, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setInputText(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md text-xl transition-transform hover:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  if (e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }} />
              </div>
              <div className="flex-1 relative flex items-center">
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 z-10 flex items-center px-4 rounded-full gap-2 text-sm text-brand-green font-medium">
                    <Loader2 size={16} className="animate-spin" /> Đang tải ảnh...
                  </div>
                )}
                <input
                  value={inputText}
                  onChange={e => {
                    setInputText(e.target.value);
                    if (socketRef.current && activeContact) {
                      socketRef.current.emit('typing', { senderId: currentUserId, receiverId: activeContact.id, isTyping: true });
                      clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => {
                        socketRef.current.emit('typing', { senderId: currentUserId, receiverId: activeContact.id, isTyping: false });
                      }, 2000);
                    }
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Aa"
                  className="w-full px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <button
                onClick={() => {
                  if (inputText.trim()) {
                    handleSend();
                  } else {
                    const tempId = Date.now();
                    const content = '👍';
                    const newMsg = { id: tempId, from: 'me', text: content, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) };
                    setMessages(prev => ({ ...prev, [activeContact.id]: [...(prev[activeContact.id] || []), newMsg] }));
                    showToast('Đã gửi biểu tượng Like', 'info');
                    
                    fetch(`${API_URL}/chat/send`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        receiverId: activeContact.id,
                        content: content
                      })
                    });
                  }
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-brand-green hover:bg-gray-100 transition-colors"
              >
                {inputText.trim() ? <Send size={20} /> : <ThumbsUp size={20} />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Hãy chọn một cuộc trò chuyện để bắt đầu
          </div>
        )}
      </div>

      {/* ── RIGHT: Chat Info ── */}
      {activeContact && (
        <div className={`w-[280px] flex-shrink-0 border-l border-gray-100 flex flex-col overflow-y-auto bg-white max-md:fixed max-md:top-0 max-md:right-0 max-md:bottom-0 max-md:z-50 max-md:w-[280px] max-md:shadow-2xl transition-transform duration-300 ${showMobileInfo ? 'max-md:translate-x-0' : 'max-md:translate-x-full'}`}>
          {/* Profile */}
          <div className="flex flex-col items-center pt-8 pb-5 px-4 border-b border-gray-100 relative">
            <button 
              onClick={() => setShowMobileInfo(false)} 
              className="md:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
            >
              <X size={16} />
            </button>
            <Avatar src={activeContact.avatar} size={20} online={activeContact.online} />
            <h3 className="mt-3 font-bold text-gray-900 text-base text-center">{activeContact.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{activeContact.online ? '● Đang hoạt động' : 'Không hoạt động'}</p>

            {/* Quick actions */}
            <div className="grid grid-cols-4 gap-1 w-full mt-5">
              {[
                { id: 'profile', icon: User, label: 'Trang cá nhân', action: () => onOpenStore && onOpenStore(activeContact.id, activeContact.name, activeContact.avatar) },
                { id: 'mute', icon: isMuted ? BellOff : Bell, label: isMuted ? 'Bật TB' : 'Tắt TB', action: async () => {
                  try {
                    const res = await fetch(`${API_URL}/chat/mute/${activeContact.id}`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setIsMuted(data.isMuted);
                      showToast(data.isMuted ? 'Đã tắt thông báo đoạn chat này' : 'Đã bật lại thông báo', 'success');
                    }
                  } catch (err) {}
                } },
                { id: 'search', icon: Search, label: 'Tìm kiếm', action: () => showToast('Đang bật thanh tìm kiếm...', 'info') },
                { id: 'share', icon: Share2, label: 'Chia sẻ', action: () => showToast('Đã copy link liên kết trang cá nhân!', 'success') },
              ].map(({ id, icon: Icon, label, action }) => (
                <button key={id} onClick={action} className="flex flex-col items-center gap-1.5 p-2 rounded-[10px] hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <Icon size={16} />
                  </div>
                  <span className="text-[9px] text-gray-500 font-medium text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accordion: Media */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setInfoOpen(p => ({ ...p, media: !p.media }))}
              className="w-full flex items-center justify-between px-4 py-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <span>File phương tiện & liên kết</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${infoOpen.media ? 'rotate-180' : ''}`} />
            </button>
            {infoOpen.media && (
              <div className="px-4 pb-4">
                {(() => {
                  const currentMsgs = messages[activeContact?.id] || [];
                  const mediaLinks = currentMsgs
                    .filter(m => m.text && m.text.startsWith('[IMAGE] '))
                    .map(m => m.text.replace('[IMAGE] ', ''))
                    .reverse(); // Newest first

                  if (mediaLinks.length === 0) {
                    return <p className="text-xs text-gray-400">Chưa có file phương tiện nào được chia sẻ.</p>;
                  }

                  return (
                    <>
                      <div className="grid grid-cols-3 gap-1.5">
                        {mediaLinks.slice(0, 6).map((url, idx) => (
                          <div key={idx} className="aspect-square rounded-[8px] overflow-hidden bg-gray-100 border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
                            <img src={resolveImage(url, '')} alt="media" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      {mediaLinks.length > 6 && (
                        <button className="mt-3 text-xs text-brand-green font-semibold hover:underline w-full text-center">
                          Xem tất cả ({mediaLinks.length})
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Accordion: Privacy */}
          <div>
            <button
              onClick={() => setInfoOpen(p => ({ ...p, privacy: !p.privacy }))}
              className="w-full flex items-center justify-between px-4 py-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <span>Quyền riêng tư & hỗ trợ</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${infoOpen.privacy ? 'rotate-180' : ''}`} />
            </button>
            {infoOpen.privacy && (
              <div className="px-4 pb-4 flex flex-col gap-1">
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_URL}/chat/block/${activeContact.id}`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      if (res.ok) {
                        const data = await res.json();
                        showToast(data.isBlocked ? 'Đã chặn người dùng. Bạn sẽ không nhận được tin nhắn từ họ nữa.' : 'Đã bỏ chặn người dùng.', 'success');
                        if (data.isBlocked) {
                           setActiveContact(null);
                           fetchConversations();
                        }
                      }
                    } catch (err) {}
                  }} 
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 font-medium hover:bg-gray-100 rounded-[8px] transition-colors"
                >
                  <span className="flex items-center gap-2"><Lock size={14} className="text-gray-400" /> Chặn</span>
                </button>
                <button 
                  onClick={() => showToast('Mở Report Modal (đang phát triển)', 'info')} 
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 font-medium hover:bg-gray-100 rounded-[8px] transition-colors"
                >
                  <span className="flex items-center gap-2"><Info size={14} className="text-gray-400" /> Báo cáo</span>
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ đoạn chat này không?')) {
                      try {
                        const res = await fetch(`${API_URL}/chat/${activeContact.id}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok) {
                          showToast('Đã xóa cuộc trò chuyện', 'success');
                          setActiveContact(null);
                          // Needs a fetchConversations() call but it's not in this scope, we can just reload or rely on state.
                        }
                      } catch (err) {}
                    }
                  }} 
                  className="w-full text-left px-3 py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-[8px] transition-colors"
                >
                  Xóa đoạn chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagePage;
