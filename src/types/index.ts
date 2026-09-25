// ─────────────────────────────────────────────────────────────
// TCUnnect · Type Definitions
// ─────────────────────────────────────────────────────────────

// Preset interests + any custom string the user creates
export type TravelInterest = string;

export interface User {
  id: string;
  email: string;
  fullName: string;
  age?: number;
  bio: string;
  location: string;
  profilePhoto: string;
  travelInterests: TravelInterest[];
  createdAt: string;
  isPremium: boolean;
  isVerified: boolean;
  isAdmin?: boolean;
}

export interface Like {
  id: string;
  userId: string;
  likedUserId: string;
  createdAt: string;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  user: User; // the other user
  createdAt: string;
  status: "active" | "blocked" | "archived";
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  timestamp: string;   // used in Chat.tsx
  read: boolean;       // used in Chat.tsx
}

export interface TripPlan {
  id: string;
  matchId: string;
  destination: string;
  date: string;
  numberOfPeople: number;
  budget: string;
  createdAt: string;
}

export type GemCategory =
  | "Beach"
  | "Mountain"
  | "Nature"
  | "Food"
  | "Heritage"
  | "Cafe"
  | "Waterfalls"
  | "City";

export interface HiddenGem {
  id: string;
  name: string;
  location: string;
  category: GemCategory;
  description: string;
  images: string[];
  budgetLevel: "₱" | "₱₱" | "₱₱₱";
  bestTimeToVisit: string;
  submittedBy: string;
  status: "pending" | "approved" | "rejected";
  isFeatured: boolean;
  createdAt: string;
}

export type TripType = "solo" | "group" | "couple" | "family";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  userId: string;
  gemId: string;
  gemName: string;
  tripType: TripType;
  date: string;
  guests: number;
  notes: string;
  status: BookingStatus;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  location?: string;
  upvotes: number;
  commentCount: number;
  userVoted?: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export type PaymentMethod = "GCash" | "Maya";

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  receiptUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export type NotificationType =
  | "match"
  | "message"
  | "like"
  | "booking_confirmed"
  | "booking_cancelled"
  | "gem_approved"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reportedBy: string;
  reportedItemType: "Post" | "Comment" | "User";
  reportedItemId: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
}
