import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useNotificationStore } from "../stores";
import { Bell, Heart, MessageCircle, Star, MapPin, Check, Loader2, Calendar, Users, BookOpen } from "lucide-react";
import type { NotificationType } from "../types";

const ICON_MAP: Record<NotificationType, React.ReactNode> = {
  match:              <Heart className="h-4 w-4 text-rose-500 fill-current" />,
  message:            <MessageCircle className="h-4 w-4 text-sky-500" />,
  like:               <Star className="h-4 w-4 text-amber-500 fill-current" />,
  booking_submitted:  <Calendar className="h-4 w-4 text-sky-500" />,
  booking_confirmed:  <MapPin className="h-4 w-4 text-emerald-500" />,
  booking_cancelled:  <MapPin className="h-4 w-4 text-rose-500" />,
  booking_updated:    <Calendar className="h-4 w-4 text-amber-500" />,
  community_reply:    <MessageCircle className="h-4 w-4 text-violet-500" />,
  gem_approved:       <Star className="h-4 w-4 text-emerald-500" />,
  gem_update:         <MapPin className="h-4 w-4 text-sky-500" />,
  system:             <Bell className="h-4 w-4 text-slate-500" />,
};

const BG_MAP: Record<NotificationType, string> = {
  match:              "bg-rose-50",
  message:            "bg-sky-50",
  like:               "bg-amber-50",
  booking_submitted:  "bg-sky-50",
  booking_confirmed:  "bg-emerald-50",
  booking_cancelled:  "bg-rose-50",
  booking_updated:    "bg-amber-50",
  community_reply:    "bg-violet-50",
  gem_approved:       "bg-emerald-50",
  gem_update:         "bg-sky-50",
  system:             "bg-slate-50",
};

type FilterTab = "All" | "Messages" | "Matches" | "Bookings" | "Community" | "Places";

const FILTER_TABS: FilterTab[] = ["All", "Messages", "Matches", "Bookings", "Community", "Places"];

const TAB_TYPES: Record<FilterTab, NotificationType[]> = {
  All:       [],
  Messages:  ["message"],
  Matches:   ["match", "like"],
  Bookings:  ["booking_submitted", "booking_confirmed", "booking_cancelled", "booking_updated"],
  Community: ["community_reply"],
  Places:    ["gem_approved", "gem_update"],
};

const formatTime = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllRead } =
    useNotificationStore();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = activeTab === "All"
    ? notifications
    : notifications.filter((n) => TAB_TYPES[activeTab].includes(n.type));

  function handleClick(id: string, read: boolean, linkTo?: string) {
    if (!read) markAsRead(id);
    if (linkTo) navigate(linkTo);
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sky-600 text-sm font-medium mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 transition border border-slate-200 px-3 py-1.5 rounded-full"
            >
              <Check className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {FILTER_TABS.map((tab) => {
            const tabUnread = tab === "All"
              ? unreadCount
              : notifications.filter((n) => !n.read && TAB_TYPES[tab].includes(n.type)).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  activeTab === tab
                    ? "bg-sky-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-sky-300"
                }`}
              >
                {tab}
                {tabUnread > 0 && (
                  <span className={`h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    activeTab === tab ? "bg-white text-sky-600" : "bg-sky-500 text-white"
                  }`}>
                    {tabUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 text-sky-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {activeTab === "All" ? "No notifications yet" : `No ${activeTab.toLowerCase()} notifications`}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {activeTab === "All"
                ? "You'll be notified when you get a match, message, or booking update."
                : `${activeTab} notifications will appear here.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif.id, notif.read, notif.linkTo)}
                className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition ${
                  notif.read
                    ? "bg-white border-slate-100"
                    : "bg-sky-50/50 border-sky-100 cursor-pointer hover:bg-sky-50"
                } ${notif.linkTo ? "hover:shadow-sm" : ""}`}
              >
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${BG_MAP[notif.type]}`}>
                  {ICON_MAP[notif.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${notif.read ? "text-slate-700" : "text-slate-900"}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="h-2 w-2 bg-sky-500 rounded-full shrink-0 mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{notif.body}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-slate-400">{formatTime(notif.createdAt)}</p>
                    {notif.linkTo && (
                      <p className="text-[10px] text-sky-500 font-medium">Tap to view →</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
