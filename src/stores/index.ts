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
    await supabase.auth.signInWithOAuth({
      provider: "google",
      // Redirect to /auth/callback — let the router decide dashboard vs onboarding
      options: { redirectTo: `${window.location.origin}/auth/callback` },
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

    // Upsert profile so it exists even if the DB trigger didn't fire
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      created_at: new Date().toISOString(),
    }, { onConflict: "id" });

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
  setMatches: (matches: Match[]) => void;
  addMatch: (match: Match) => void;
  clearNewMatch: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  newMatch: null,
  setMatches: (matches) => set({ matches }),
  addMatch: (match) =>
    set((s) => ({ matches: [...s.matches, match], newMatch: match })),
  clearNewMatch: () => set({ newMatch: null }),
}));

// ─── Chat Store ──────────────────────────────────────────────
interface ChatState {
  messages: Record<string, Message[]>; // keyed by matchId
  addMessage: (matchId: string, message: Message) => void;
  setMessages: (matchId: string, messages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  addMessage: (matchId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [matchId]: [...(s.messages[matchId] ?? []), message],
      },
    })),
  setMessages: (matchId, messages) =>
    set((s) => ({ messages: { ...s.messages, [matchId]: messages } })),
}));

// ─── Notification Store ───────────────────────────────────────
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 2, // demo unread count
  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
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
