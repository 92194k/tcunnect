import { create } from "zustand";
import type {
  User,
  Match,
  Message,
  Notification,
  Booking,
  HiddenGem,
} from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// ─── Auth Store ──────────────────────────────────────────────
interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  onboardingComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setOnboardingComplete: (val: boolean) => void;
  loadSession: () => Promise<void>;
  updateProfile: (fields: Partial<User>) => Promise<void>;
}

// ─── Demo mode (no .env) ─────────────────────────────────────
const DEMO_USERS: Record<string, User> = {
  "demo@tcunnect.com": {
    id: "user_001", email: "demo@tcunnect.com", fullName: "Khemberly", age: 22,
    bio: "Always looking for new places to explore 🌿", location: "Taguig City",
    profilePhoto: "https://images.unsplash.com/photo-1675705444858-97005ce93298?auto=format&fit=crop&w=200&q=80",
    travelInterests: ["Beach", "Food", "Nature"],
    createdAt: new Date().toISOString(), isPremium: false, isVerified: false,
  },
  "admin@tcunnect.com": {
    id: "admin_001", email: "admin@tcunnect.com", fullName: "TCUnnect Admin",
    bio: "Platform administrator", location: "Manila", profilePhoto: "",
    travelInterests: [], createdAt: new Date().toISOString(),
    isPremium: true, isVerified: true, isAdmin: true,
  },
};

// ─── Map Supabase profile row → our User type ────────────────
function profileToUser(profile: Record<string, unknown>): User {
  return {
    id: profile.id as string,
    email: profile.email as string,
    fullName: (profile.full_name as string) || "",
    age: profile.age as number | undefined,
    bio: (profile.bio as string) || "",
    location: (profile.location as string) || "",
    profilePhoto: (profile.profile_photo as string) || "",
    travelInterests: (profile.travel_interests as User["travelInterests"]) || [],
    createdAt: profile.created_at as string,
    isPremium: Boolean(profile.is_premium),
    isVerified: Boolean(profile.is_verified),
    isAdmin: Boolean(profile.is_admin),
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  // isLoading is ONLY for loadSession() — the initial session check on app boot.
  // login() and signup() must NOT touch isLoading so that RedirectIfLoggedIn
  // never unmounts an active form component mid-submission.
  isLoading: true,
  onboardingComplete: false,

  // Load existing session on app start
  loadSession: async () => {
    console.log("[loadSession] called");
    if (!isSupabaseConfigured) { set({ isLoading: false }); return; } // demo mode
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { set({ isLoading: false }); return; }
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", session.user.id).single();
    if (profile) {
      const user = profileToUser(profile);
      const onboardingComplete = (user.travelInterests?.length ?? 0) > 0;
      console.log("[loadSession] profile loaded — onboardingComplete:", onboardingComplete);
      set({ user, isLoggedIn: true, onboardingComplete, isLoading: false });
    } else {
      console.log("[loadSession] no profile row found for user");
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    // NOTE: intentionally does NOT set isLoading — that flag is only for loadSession().
    // Login.tsx manages its own submitting state to avoid unmounting the form.
    console.log("[login] START");

    // ── Demo mode ──────────────────────────────────────────────
    if (!isSupabaseConfigured) {
      await new Promise((r) => setTimeout(r, 800));
      const user = DEMO_USERS[email.toLowerCase()];
      if (!user || password.length < 6) {
        throw new Error("Invalid credentials. Try demo@tcunnect.com / password123");
      }
      set({ user, isLoggedIn: true, onboardingComplete: true });
      return;
    }

    // ── Live Supabase mode ─────────────────────────────────────
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    console.log("[login] supabase response — error:", error, "user:", data?.user?.id, "session:", !!data?.session);
    if (error) throw new Error(error.message);
    if (!data.user) return;
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", data.user.id).single();
    const user = profileToUser(profile ?? { id: data.user.id, email, full_name: "", created_at: new Date().toISOString() });
    console.log("[login] setting store — isLoggedIn:true onboardingComplete:", (user.travelInterests?.length ?? 0) > 0);
    set({ user, isLoggedIn: true, onboardingComplete: (user.travelInterests?.length ?? 0) > 0 });
  },

  loginWithGoogle: async () => {
    if (!isSupabaseConfigured) return;
    // Use VITE_SITE_URL if set (set this in Vercel env vars to your production URL).
    // Falls back to window.location.origin so local dev still works.
    const siteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") ?? window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
  },

  signup: async (email, password, fullName) => {
    // NOTE: intentionally does NOT set isLoading — that flag is only for loadSession().
    // SignUp.tsx manages its own submitting state to avoid unmounting the form
    // (which would cause setEmailSent(true) to run on an unmounted component and be lost).
    console.log("[signup] START — email:", email);

    // ── Demo mode ──────────────────────────────────────────────
    if (!isSupabaseConfigured) {
      await new Promise((r) => setTimeout(r, 1000));
      const newUser: User = {
        id: `user_${Date.now()}`, email, fullName, bio: "", location: "",
        profilePhoto: "", travelInterests: [],
        createdAt: new Date().toISOString(), isPremium: false, isVerified: false,
      };
      set({ user: newUser, isLoggedIn: true, onboardingComplete: false });
      return;
    }

    // ── Live Supabase mode ─────────────────────────────────────
    const { error, data } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
    console.log("[signup] supabase.auth.signUp response:", {
      error: error?.message ?? null,
      userId: data?.user?.id ?? null,
      hasSession: !!data?.session,
    });

    if (error) throw new Error(error.message);
    if (!data.user) {
      console.warn("[signup] no user in response — unusual");
      return;
    }

    // Email confirmation required — no session yet
    if (!data.session) {
      console.log("[signup] no session — email confirmation required → throwing __EMAIL_CONFIRM__");
      throw new Error("__EMAIL_CONFIRM__");
    }

    // Session exists — confirmation is disabled or auto-confirmed
    console.log("[signup] session exists — loading profile");
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", data.user.id).single();
    const user = profileToUser(profile ?? { id: data.user.id, email, full_name: fullName, created_at: new Date().toISOString() });
    console.log("[signup] setting store — isLoggedIn:true onboardingComplete:", (user.travelInterests?.length ?? 0) > 0);
    set({ user, isLoggedIn: true, onboardingComplete: (user.travelInterests?.length ?? 0) > 0 });
  },

  logout: async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    set({ user: null, isLoggedIn: false, onboardingComplete: false });
  },
  setUser: (user) => set({ user, isLoggedIn: true }),
  setOnboardingComplete: (val) => set({ onboardingComplete: val }),

  updateProfile: async (fields) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const updated = { ...user, ...fields };
    set({ user: updated });

    if (!isSupabaseConfigured) return;

    // Map camelCase → snake_case for Supabase
    const row: Record<string, unknown> = {};
    if (fields.fullName        !== undefined) row.full_name        = fields.fullName;
    if (fields.bio             !== undefined) row.bio              = fields.bio;
    if (fields.location        !== undefined) row.location         = fields.location;
    if (fields.travelInterests !== undefined) row.travel_interests = fields.travelInterests;
    // Skip saving base64 data URLs — too large for a text column
    if (fields.profilePhoto !== undefined && !fields.profilePhoto.startsWith("data:")) {
      row.profile_photo = fields.profilePhoto;
    }

    const { error } = await supabase.from("profiles").update(row).eq("id", user.id);
    if (error) throw new Error(error.message);
  },
}));

// ─── Match Store ─────────────────────────────────────────────
interface MatchState {
  matches: Match[];
  newMatch: Match | null;
  setMatches: (matches: Match[]) => void;
  addMatch: (match: Match) => void;
  clearNewMatch: () => void;
  fetchMatches: (userId: string) => Promise<void>;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  newMatch: null,
  setMatches: (matches) => set({ matches }),
  addMatch: (match) =>
    set((s) => ({ matches: [...s.matches, match], newMatch: match })),
  clearNewMatch: () => set({ newMatch: null }),

  fetchMatches: async (userId: string) => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from("matches")
      .select(`
        id, created_at, status,
        user1:profiles!matches_user1_id_fkey(id, full_name, profile_photo, location, travel_interests),
        user2:profiles!matches_user2_id_fkey(id, full_name, profile_photo, location, travel_interests)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    console.log("[fetchMatches] raw data:", JSON.stringify(data?.slice(0,2)));
    if (error) { console.error("[fetchMatches] error:", error.message, error.code); return; }

    const matches: Match[] = (data ?? []).map((row: any) => {
      const partner = row.user1?.id === userId ? row.user2 : row.user1;
      return {
        id: row.id,
        user1Id: row.user1?.id ?? "",
        user2Id: row.user2?.id ?? "",
        status: (row.status ?? "active") as "active" | "blocked" | "archived",
        user: {
          id: partner?.id ?? "",
          fullName: partner?.full_name ?? "Unknown",
          email: "",
          profilePhoto: partner?.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner?.full_name ?? "?")}&background=0ea5e9&color=fff`,
          location: partner?.location ?? "",
          travelInterests: partner?.travel_interests ?? [],
          age: 0, bio: "", createdAt: row.created_at, isPremium: false, isVerified: false,
        },
        createdAt: row.created_at,
      };
    });
    set({ matches });
  },
}));

// ─── Chat Store ──────────────────────────────────────────────
interface ChatState {
  messages: Record<string, Message[]>; // keyed by matchId
  unreadByMatch: Record<string, number>; // unread counts per match
  addMessage: (matchId: string, message: Message) => void;
  setMessages: (matchId: string, messages: Message[]) => void;
  fetchMessages: (matchId: string) => Promise<void>;
  sendMessage: (matchId: string, senderId: string, content: string) => Promise<void>;
  markMatchRead: (matchId: string, userId: string) => Promise<void>;
  subscribeToMatch: (matchId: string) => () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  unreadByMatch: {},

  addMessage: (matchId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [matchId]: [...(s.messages[matchId] ?? []), message],
      },
    })),

  setMessages: (matchId, messages) =>
    set((s) => ({ messages: { ...s.messages, [matchId]: messages } })),

  fetchMessages: async (matchId: string) => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from("messages")
      .select("id, match_id, sender_id, content, read, created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    console.log("[fetchMessages] matchId:", matchId, "rows:", data?.length, "error:", error?.message);
    if (error) { console.error("[fetchMessages] error:", error.message); return; }

    const msgs: Message[] = (data ?? []).map((m: any) => ({
      id: m.id,
      matchId: m.match_id,
      senderId: m.sender_id,
      content: m.content,
      read: m.read,
      timestamp: m.created_at,
    }));
    set((s) => ({ messages: { ...s.messages, [matchId]: msgs } }));
  },

  sendMessage: async (matchId: string, senderId: string, content: string) => {
    // Optimistic: add to local state immediately with a temp id
    const tempId = `temp_${Date.now()}`;
    const optimistic: Message = { id: tempId, matchId, senderId, content, read: false, timestamp: new Date().toISOString() };
    get().addMessage(matchId, optimistic);
    console.log("[sendMessage] optimistic add", { matchId, senderId, content });

    if (!isSupabaseConfigured) return;

    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: senderId, content })
      .select("id, match_id, sender_id, content, read, created_at")
      .single();

    if (error) {
      console.error("[sendMessage] insert error:", error.message, error.code, error.details);
      // Remove the optimistic message on failure
      set((s) => ({
        messages: {
          ...s.messages,
          [matchId]: (s.messages[matchId] ?? []).filter((m) => m.id !== tempId),
        },
      }));
      return;
    }

    if (data) {
      console.log("[sendMessage] insert success, id:", data.id);
      // Replace temp message with real one from DB
      set((s) => ({
        messages: {
          ...s.messages,
          [matchId]: (s.messages[matchId] ?? []).map((m) =>
            m.id === tempId
              ? { id: data.id, matchId: data.match_id, senderId: data.sender_id, content: data.content, read: data.read, timestamp: data.created_at }
              : m
          ),
        },
      }));
    }
  },

  markMatchRead: async (matchId: string, userId: string) => {
    if (!isSupabaseConfigured) return;
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("match_id", matchId)
      .neq("sender_id", userId)
      .eq("read", false);
    set((s) => ({ unreadByMatch: { ...s.unreadByMatch, [matchId]: 0 } }));
  },

  subscribeToMatch: (matchId: string) => {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const m = payload.new as any;
          const msg: Message = { id: m.id, matchId: m.match_id, senderId: m.sender_id, content: m.content, read: m.read, timestamp: m.created_at };
          // Only add if not already in store.
          // Sender already has it (optimistic or replaced). Receiver doesn't yet.
          const existing = get().messages[matchId] ?? [];
          const alreadyExists = existing.find((e) => e.id === msg.id);
          if (!alreadyExists) {
            console.log("[realtime] new message from", msg.senderId, ":", msg.content);
            get().addMessage(matchId, msg);
          } else {
            console.log("[realtime] deduped message id", msg.id);
          }
        }
      )
      .subscribe((status, err) => {
        console.log("[realtime] channel", `messages:${matchId}`, "status:", status, err ?? "");
      });
    return () => { supabase.removeChannel(channel); };
  },
}));

// ─── Notification Store ───────────────────────────────────────
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0, // always derived from real data — never hardcoded
  loading: false,

  fetchNotifications: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("fetchNotifications error:", error);
      set({ loading: false });
      return;
    }

    const notifications: Notification[] = (data ?? []).map((n) => ({
      id: n.id,
      type: n.type as Notification["type"],
      title: n.title,
      body: n.body ?? "",
      read: n.read,
      createdAt: n.created_at,
    }));

    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      loading: false,
    });
  },

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + (n.read ? 0 : 1),
    })),

  markAsRead: async (id) => {
    // Optimistic update
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
    // Persist to Supabase
    if (isSupabaseConfigured) {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    }
  },

  markAllRead: async () => {
    const ids = get().notifications.filter((n) => !n.read).map((n) => n.id);
    // Optimistic update
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
    // Persist to Supabase — mark every unread notification for this user
    if (isSupabaseConfigured && ids.length > 0) {
      await supabase.from("notifications").update({ read: true }).in("id", ids);
    }
  },

  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),
}));

// ─── Bookings Store ───────────────────────────────────────────
interface BookingState {
  bookings: Booking[];
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  setBookings: (bookings) => set({ bookings }),
  addBooking: (booking) =>
    set((s) => ({ bookings: [booking, ...s.bookings] })),
}));

// ─── Gems Store ───────────────────────────────────────────────
interface GemState {
  gems: HiddenGem[];
  featuredGem: HiddenGem | null;
  setGems: (gems: HiddenGem[]) => void;
  setFeaturedGem: (gem: HiddenGem | null) => void;
}

export const useGemStore = create<GemState>((set) => ({
  gems: [],
  featuredGem: null,
  setGems: (gems) => set({ gems }),
  setFeaturedGem: (gem) => set({ featuredGem: gem }),
}));
