import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, ShoppingBag, CheckCircle2, Star, Package,
  Tag, MessageCircle, ArrowRight, Check, Loader2
} from 'lucide-react';
import { API_URL } from '../config/api';

// ── Config: maps notification type → icon + color ─────────────────────────────
const TYPE_CONFIG = {
  new_transaction:       { Icon: ShoppingBag,    bg: 'bg-orange-100',       icon: 'text-orange-600',  dot: 'bg-orange-500' },
  order_placed:          { Icon: Package,         bg: 'bg-blue-100',         icon: 'text-blue-600',    dot: 'bg-blue-500' },
  transaction_status:    { Icon: Bell,            bg: 'bg-yellow-100',       icon: 'text-yellow-600',  dot: 'bg-yellow-500' },
  transaction_completed: { Icon: CheckCircle2,    bg: 'bg-green-100',        icon: 'text-green-600',   dot: 'bg-green-500' },
  item_posted:           { Icon: Tag,             bg: 'bg-[#E1F0C4]',        icon: 'text-[#2D6A4F]',   dot: 'bg-[#2D6A4F]' },
  new_rating:            { Icon: Star,            bg: 'bg-amber-100',        icon: 'text-amber-500',   dot: 'bg-amber-500' },
  new_message:           { Icon: MessageCircle,   bg: 'bg-purple-100',       icon: 'text-purple-600',  dot: 'bg-purple-500' },
};
const DEFAULT_CONFIG = { Icon: Bell, bg: 'bg-gray-100', icon: 'text-gray-500', dot: 'bg-gray-400' };

const formatTime = (dateString) => {
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateString).toLocaleDateString('vi-VN');
};

// ── Component ─────────────────────────────────────────────────────────────────
const NotificationDropdown = ({ currentUser, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [animateBell, setAnimateBell] = useState(false);
  const ref = useRef(null);
  const prevCountRef = useRef(0);

  const getToken = useCallback(
    () => currentUser?.token || localStorage.getItem('greencampus_token'),
    [currentUser]
  );

  // ── Fetch unread count ────────────────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    if (!currentUser) return;
    const t = getToken();
    if (!t) return;
    try {
      const res = await fetch(`${API_URL}/notifications/count`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (res.ok) {
        const { count } = await res.json();
        const newCount = Number(count);
        // Animate bell if count increased
        if (newCount > prevCountRef.current) {
          setAnimateBell(true);
          setTimeout(() => setAnimateBell(false), 1000);
          // If dropdown is open, auto-refresh the list
          setOpen(prev => {
            if (prev) {
              fetchNotifications();
            }
            return prev;
          });
        }
        prevCountRef.current = newCount;
        setUnreadCount(newCount);
      }
    } catch { /* ignore */ }
  }, [currentUser, getToken]);

  // ── Fetch notification list ───────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (res.ok) setNotifications(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [getToken]);

  // ── Polling: every 10s + visibility change ───────────────────────────────
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 10000);

    // Also refresh when user comes back to the tab
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchCount();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchCount]);

  // ── Listen for global refresh events from checkout/history/postmodal ─────
  useEffect(() => {
    const onRefresh = () => {
      // Small delay to allow backend to finish inserting the notification
      setTimeout(() => {
        fetchCount();
        if (open) fetchNotifications();
      }, 800);
    };
    window.addEventListener('greencampus:notif_refresh', onRefresh);
    return () => window.removeEventListener('greencampus:notif_refresh', onRefresh);
  }, [fetchCount, fetchNotifications, open]);

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Open/close ───────────────────────────────────────────────────────────
  const handleOpen = () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    fetchNotifications();
    // Mark count as seen visually when opening
  };

  // ── Mark one as read ─────────────────────────────────────────────────────
  const markOne = useCallback(async (id) => {
    const t = getToken();
    if (!t) return;
    fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT', headers: { Authorization: `Bearer ${t}` }
    }).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [getToken]);

  // ── Mark all as read ─────────────────────────────────────────────────────
  const markAll = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT', headers: { Authorization: `Bearer ${t}` }
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    prevCountRef.current = 0;
  }, [getToken]);

  // ── Click notification → navigate ────────────────────────────────────────
  const handleClick = (notif) => {
    if (!notif.is_read) markOne(notif.id);
    if (notif.link_page && onNavigate) onNavigate(notif.link_page);
    setOpen(false);
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-xl hover:bg-gray-100 transition-colors ${animateBell ? 'animate-bounce' : ''}`}
        title="Thông báo"
      >
        <Bell
          size={22}
          className={`transition-colors ${open ? 'text-[#2D6A4F]' : 'text-gray-600'}`}
        />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-sm ${animateBell ? 'animate-ping-once' : ''}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-[20px] shadow-2xl border border-gray-100 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-xs font-semibold text-[#2D6A4F] hover:text-[#2D6A4F]/80 transition-colors"
              >
                <Check size={12} />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[440px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-[#2D6A4F]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bell size={24} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Chưa có thông báo nào</p>
                <p className="text-xs text-gray-300">Mọi hoạt động sẽ hiện ở đây</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
                const { Icon } = cfg;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full flex items-start gap-3.5 px-5 py-4 text-left hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0 group ${!notif.is_read ? 'bg-[#E1F0C4]/20' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                      <Icon size={18} className={cfg.icon} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.body}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                        {formatTime(notif.created_at)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {!notif.is_read && (
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} mt-1.5`} />
                      )}
                      {notif.link_page && (
                        <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-auto" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">Hiển thị {notifications.length} thông báo gần nhất</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
