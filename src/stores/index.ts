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
  isLoading: true,  // true until loadSession resolves — prevents premature guard redirects
  onboardingComplete: false,

  // Load existing session on app start
  loadSession: async () => {
    if (!isSupabaseConfigured) { set({ isLoading: false }); return; } // demo mode
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { set({ isLoading: false }); return; }
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", session.user.id).single();
    if (profile) {
      const user = profileToUser(profile);
      const onboardingComplete = (user.travelInterests?.length ?? 0) > 0;
      set({ user, isLoggedIn: true, onboardingComplete, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });

    // ── Demo mode ──────────────────────────────────────────────
    if (!isSupabaseConfigured) {
      await new Promise((r) => setTimeout(r, 800));
      const user = DEMO_USERS[email.toLowerCase()];
      if (!user || password.length < 6) {
        set({ isLoading: false });
        throw new Error("Invalid credentials. Try demo@tcunnect.com / password123");
      }
      set({ user, isLoggedIn: true, isLoading: false, onboardingComplete: true });
      return;
    }

    // ── Live Supabase mode ─────────────────────────────────────
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { set({ isLoading: false }); throw new Error(error.message); }
    if (!data.user) { set({ isLoading: false }); return; }
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", data.user.id).single();
    const user = profileToUser(profile ?? { id: data.user.id, email, full_name: "", created_at: new Date().toISOString() });
    set({ user, isLoggedIn: true, isLoading: false, onboardingComplete: (user.travelInterests?.length ?? 0) > 0 });
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
    set({ isLoading: true });

    // ── Demo mode ──────────────────────────────────────────────
    if (!isSupabaseConfigured) {
      await new Promise((r) => setTimeout(r, 1000));
      const newUser: User = {
        id: `user_${Date.now()}`, email, fullName, bio: "", location: "",
        profilePhoto: "", travelInterests: [],
        createdAt: new Date().toISOString(), isPremium: false, isVerified: false,
      };
      set({ user: newUser, isLoggedIn: true, isLoading: false, onboardingComplete: false });
      return;
    }

    // ── Live Supabase mode ─────────────────────────────────────
    const { error, data } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
    if (error) { set({ isLoading: false }); throw new Error(error.message); }
    if (!data.user) { set({ isLoading: false }); return; }

    // Email confirmation required — no session yet
    if (!data.session) {
      set({ isLoading: false });
      throw new Error("__EMAIL_CONFIRM__");
    }

    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", data.user.id).single();
    const user = profileToUser(profile ?? { id: data.user.id, email, full_name: fullName, created_at: new Date().toISOString() });
    set({ user, isLoggedIn: true, isLoading: false, onboardingComplete: (user.travelInterests?.length ?? 0) > 0 });
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
  loadingMatches: boolean;
  setMatches: (matches: Match[]) => void;
  addMatch: (match: Match) => void;
  clearNewMatch: () => void;
  loadMatches: (userId: string) => Promise<void>;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  newMatch: null,
  loadingMatches: false,
  setMatches: (matches) => set({ matches }),
  addMatch: (match) =>
    set((s) => {
      // Avoid duplicates (e.g. if loadMatches already loaded this match)
      if (s.matches.find((m) => m.id === match.id)) return { newMatch: match };
      return { matches: [...s.matches, match], newMatch: match };
    }),
  clearNewMatch: () => set({ newMatch: null }),

  loadMatches: async (userId: string) => {
    if (!isSupabaseConfigured || !userId) return;
    set({ loadingMatches: true });

    // 1. Fetch all active matches where current user is a participant
    const { data: matchRows, error } = await supabase
      .from("matches")
      .select("id, user1_id, user2_id, status, created_at")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error || !matchRows || matchRows.length === 0) {
      set({ loadingMatches: false });
      return;
    }

    // 2. Collect all partner IDs
    const partnerIds = matchRows.map((m) =>
      m.user1_id === userId ? m.user2_id : m.user1_id
    );

    // 3. Fetch partner profiles in one query
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, profile_photo, location, bio, travel_interests, is_premium, is_verified, email, created_at, age")
      .in("id", partnerIds);

    const profileMap: Record<string, Record<string, unknown>> = {};
    for (const p of (profiles ?? [])) profileMap[p.id as string] = p as Record<string, unknown>;

    // 4. Build Match objects
    const matches: Match[] = matchRows.map((m) => {
      const partnerId = m.user1_id === userId ? m.user2_id : m.user1_id;
      const profile = profileMap[partnerId];
      const partner: User = profile
        ? profileToUser(profile)
        : {
            id: partnerId, email: "", fullName: "Traveler", bio: "",
            location: "", profilePhoto: "", travelInterests: [],
            createdAt: m.created_at, isPremium: false, isVerified: false,
          };
      return {
        id: m.id,
        user1Id: m.user1_id,
        user2Id: m.user2_id,
        user: partner,
        createdAt: m.created_at,
        status: m.status as Match["status"],
      };
    });

    // 5. Merge with existing (don't wipe out a match added mid-session)
    const existing = get().matches;
    const merged = [...matches];
    for (const ex of existing) {
      if (!merged.find((m) => m.id === ex.id)) merged.push(ex);
    }

    set({ matches: merged, loadingMatches: false });
  },
}));

// ─── Chat Store ──────────────────────────────────────────────
interface ChatState {
  messages: Record<string, Message[]>; // keyed by matchId
  loadingMessages: Record<string, boolean>;
  addMessage: (matchId: string, message: Message) => void;
  setMessages: (matchId: string, messages: Message[]) => void;
  loadMessages: (matchId: string) => Promise<void>;
  sendMessage: (opts: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    messageType?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<Message>;
  markConversationRead: (matchId: string, currentUserId: string) => Promise<void>;
}

function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    senderId: row.sender_id as string,
    receiverId: row.receiver_id as string,
    content: row.content as string,
    messageType: (row.message_type as Message["messageType"]) ?? "text",
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    timestamp: row.created_at as string,
    read: row.read as boolean,
  };
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  loadingMessages: {},

  addMessage: (matchId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [matchId]: [...(s.messages[matchId] ?? []), message],
      },
    })),

  setMessages: (matchId, messages) =>
    set((s) => ({ messages: { ...s.messages, [matchId]: messages } })),

  loadMessages: async (matchId) => {
    if (!isSupabaseConfigured) return;
    set((s) => ({ loadingMessages: { ...s.loadingMessages, [matchId]: true } }));
    const { data, error } = await supabase
      .from("messages")
      .select("id, match_id, sender_id, receiver_id, content, message_type, metadata, read, created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (!error && data) {
      const msgs = data.map(rowToMessage);
      set((s) => ({
        messages: { ...s.messages, [matchId]: msgs },
        loadingMessages: { ...s.loadingMessages, [matchId]: false },
      }));
    } else {
      set((s) => ({ loadingMessages: { ...s.loadingMessages, [matchId]: false } }));
    }
  },

  sendMessage: async ({ matchId, senderId, receiverId, content, messageType, metadata }) => {
    const tempId = `tmp_${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      matchId,
      senderId,
      receiverId,
      content,
      messageType: (messageType as Message["messageType"]) ?? "text",
      metadata,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Optimistic add
    set((s) => ({
      messages: {
        ...s.messages,
        [matchId]: [...(s.messages[matchId] ?? []), optimistic],
      },
    }));

    if (!isSupabaseConfigured) return optimistic;

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          match_id: matchId,
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          message_type: messageType ?? "text",
          metadata: metadata ?? null,
        })
        .select("id, match_id, sender_id, receiver_id, content, message_type, metadata, read, created_at")
        .single();

      if (data && !error) {
        const saved = rowToMessage(data);
        // Replace optimistic message with real one
        set((s) => ({
          messages: {
            ...s.messages,
            [matchId]: (s.messages[matchId] ?? []).map((m) =>
              m.id === tempId ? saved : m
            ),
          },
        }));
        return saved;
      }
    } catch {
      // Keep the optimistic message on error
    }
    return optimistic;
  },

  markConversationRead: async (matchId, currentUserId) => {
    // Optimistically mark all messages from partner as read
    set((s) => ({
      messages: {
        ...s.messages,
        [matchId]: (s.messages[matchId] ?? []).map((m) =>
          m.receiverId === currentUserId && !m.read ? { ...m, read: true } : m
        ),
      },
    }));
    if (!isSupabaseConfigured) return;
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("match_id", matchId)
      .eq("receiver_id", currentUserId)
      .eq("read", false);
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
      .select("id, type, title, body, read, created_at, link_to, reference_id")
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
      linkTo: n.link_to ?? undefined,
      referenceId: n.reference_id ?? undefined,
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

// ─── Notification helper — call from any page after a user action ────────────
export async function createNotification(
  userId: string,
  opts: {
    type: Notification["type"];
    title: string;
    body: string;
    linkTo?: string;
    referenceId?: string;
  }
) {
  if (!isSupabaseConfigured) return;
  try {
    const { data } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: opts.type,
        title: opts.title,
        body: opts.body,
        read: false,
        link_to: opts.linkTo ?? null,
        reference_id: opts.referenceId ?? null,
      })
      .select("id, type, title, body, read, created_at, link_to, reference_id")
      .single();

    if (data) {
      const notif: Notification = {
        id: data.id,
        type: data.type as Notification["type"],
        title: data.title,
        body: data.body ?? "",
        read: data.read,
        createdAt: data.created_at,
        linkTo: data.link_to ?? undefined,
        referenceId: data.reference_id ?? undefined,
      };
      useNotificationStore.getState().addNotification(notif);
    }
  } catch (e) {
    console.error("createNotification error:", e);
  }
}

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
