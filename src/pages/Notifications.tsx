import { useEffect } from "react";
import AppShell from "../components/AppShell";
import { useNotificationStore, useAuthStore } from "../stores";
import { Bell, Heart, MessageCircle, Star, MapPin, Check } from "lucide-react";
import type { NotificationType, Notification } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const ICON_MAP: Record<NotificationType, React.ReactNode> = {
  match: <Heart className="h-4 w-4 text-rose-500 fill-current" />,
  message: <MessageCircle className="h-4 w-4 text-sky-500" />,
  like: <Star className="h-4 w-4 text-amber-500 fill-current" />,
  booking_confirmed: <MapPin className="h-4 w-4 text-emerald-500" />,
  booking_cancelled: <MapPin className="h-4 w-4 text-rose-500" />,
  gem_approved: <Star className="h-4 w-4 text-emerald-500" />,
  system: <Bell className="h-4 w-4 text-slate-500" />,
};

const BG_MAP: Record<NotificationType, string> = {
  match: "bg-rose-50",
  message: "bg-sky-50",
  like: "bg-amber-50",
  booking_confirmed: "bg-emerald-50",
  booking_cancelled: "bg-rose-50",
  gem_approved: "bg-emerald-50",
  system: "bg-slate-50",
};

const formatTime = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

export default function Notifications() {
  const { user } = useAuthStore();
  const { notifications, setNotifications, markAllRead } = useNotificationStore();
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data) return;
        const mapped: Notification[] = data.map((r) => ({
          id: r.id,
          type: r.type as NotificationType,
          title: r.title,
          body: r.body,
          read: r.read,
          createdAt: r.created_at,
        }));
        setNotifications(mapped);
      });
  }, [user, setNotifications]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            {unread > 0 && <p className="text-sky-600 text-sm font-medium mt-0.5">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 transition border border-slate-200 px-3 py-1.5 rounded-full">
              <Check className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">No notifications yet</p>
            <p className="text-slate-400 text-xs mt-1">You will see matches, messages, and booking updates here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div key={notif.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition ${
                  notif.read ? "bg-white border-slate-100" : "bg-sky-50/50 border-sky-100"
                }`}>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${BG_MAP[notif.type]}`}>
                  {ICON_MAP[notif.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${notif.read ? "text-slate-700" : "text-slate-900"}`}>{notif.title}</p>
                    {!notif.read && <span className="h-2 w-2 bg-sky-500 rounded-full shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{notif.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatTime(notif.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
