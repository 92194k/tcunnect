# TCUnnect — Developer Guide

A complete reference for building and extending the TCUnnect campus social discovery platform.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Design System](#4-design-system)
5. [Routing & Navigation](#5-routing--navigation)
6. [Data Layer](#6-data-layer)
7. [Pages & Components](#7-pages--components)
8. [Key Features Explained](#8-key-features-explained)
9. [UX & Business Rules](#9-ux--business-rules)
10. [Extending the App](#10-extending-the-app)
11. [Backend Integration Roadmap](#11-backend-integration-roadmap)

---

## 1. Project Overview

**TCUnnect** is a campus-based social discovery and anonymous community platform built exclusively for Taguig City University (TCU) students.

**Tagline:** Meet. Match. Connect.

**Core Loops:**
- Students discover each other by browsing profile cards
- Likes are anonymous until both sides like each other (mutual match)
- Matched users unlock private messaging
- Anyone can post anonymously to the Campus Feed
- Premium users (₱30 lifetime) can see who liked and viewed them

**What TCUnnect is NOT:**
- Not a dating app (campus social platform)
- Not location-based (no GPS, no maps, no distance)
- Not anonymous in DMs (messaging requires mutual match)

---

## 2. Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| UI Framework | React 19                                |
| Language     | TypeScript 5.7                          |
| Build Tool   | Vite 8                                  |
| Styling      | Tailwind CSS v4 (`@tailwindcss/vite`)   |
| Fonts        | Plus Jakarta Sans (display), Inter (body) via Google Fonts |
| Package Manager | pnpm                                 |
| Dev Server   | Already running on `$PORT` (default 8443) |

> No external UI library. All components are hand-built with Tailwind utility classes.

---

## 3. Project Structure

```
code/
├── index.html                  # Vite HTML shell
├── vite.config.ts              # Vite + Tailwind plugin config
├── src/
│   ├── main.tsx                # React entrypoint → mounts App into #root
│   ├── index.css               # Global CSS: Google Fonts imports, @theme tokens, animations
│   ├── App.tsx                 # Top-level router (view state machine)
│   ├── data.ts                 # All sample data + TypeScript types
│   ├── components/
│   │   └── Logo.tsx            # TCUnnect SVG logo + wordmark
│   └── pages/
│       ├── Landing.tsx         # Public marketing page (tcunnect.com)
│       ├── Auth.tsx            # Login + Sign Up (shared component, mode prop)
│       ├── Onboarding.tsx      # 7-step post-registration flow
│       └── Dashboard.tsx       # Authenticated shell + ALL dashboard sub-views
```

### Why one Dashboard file?

All authenticated views (Discover, Likes, Matches, Messages, Feed, Notifications, Profile, Premium, Admin) live inside `Dashboard.tsx` as internal functional components. This keeps the sidebar, topbar, and match overlay shared without prop-drilling through a router. When the app grows, split each internal component into its own file under `src/pages/`.

---

## 4. Design System

### Color Tokens (`src/index.css` → `@theme` block)

| Token                  | Value     | Usage                          |
|------------------------|-----------|--------------------------------|
| `--color-primary`      | `#6C3AE8` | Buttons, active nav, accents   |
| `--color-primary-dark` | `#5A2DD6` | Hover state for primary        |
| `--color-primary-light`| `#EDE9FF` | Soft backgrounds, selected tags|
| `--color-like`         | `#F43F5E` | Like button, heart icons       |
| `--color-like-light`   | `#FFF0F3` | Like button backgrounds        |
| `--color-match`        | `#10B981` | Match success, online indicator|
| `--color-match-light`  | `#ECFDF5` | Match badge backgrounds        |
| `--color-premium`      | `#F59E0B` | Premium badge, CTA highlight   |
| `--color-premium-light`| `#FFFBEB` | Premium section backgrounds    |
| `--color-app-bg`       | `#F4F2FF` | Page background                |
| `--color-surface`      | `#FFFFFF` | Cards, panels                  |

In Tailwind v4, these map directly to utility classes:
```html
bg-primary    text-primary    border-primary
bg-like       text-like
bg-match      text-match
bg-premium    text-premium
bg-app-bg
```

### Typography

```css
--font-family-display: 'Plus Jakarta Sans', sans-serif;
--font-family-body:    'Inter', sans-serif;
```

Apply the display font with the custom utility class:
```html
<h1 class="font-display font-extrabold text-3xl">...</h1>
```

Body font is set as the default on `body` in `index.css`.

### Department Badge Colors

Defined inline in `DeptBadge` component inside `Dashboard.tsx`:

| Dept  | Background     | Text         |
|-------|---------------|--------------|
| CICT  | `blue-100`    | `blue-700`   |
| COED  | `green-100`   | `green-700`  |
| CBA   | `orange-100`  | `orange-700` |
| CCS   | `purple-100`  | `purple-700` |
| CON   | `pink-100`    | `pink-700`   |
| COE   | `red-100`     | `red-700`    |

### Animations

All keyframes are defined in `src/index.css`:

| Class        | Effect                                     | Used in              |
|--------------|--------------------------------------------|----------------------|
| `.match-pop` | Scale + fade in (bouncy easing)            | Match overlay        |
| `.slide-up`  | Slide from below + fade in                 | Modals, step cards   |
| `.fade-in`   | Simple opacity fade                        | Overlays             |
| `.card-left` | Swipe card left + rotate (pass animation)  | Discover card        |
| `.card-right`| Swipe card right + rotate (like animation) | Discover card        |
| `.sparkle`   | Pulse scale loop                           | Match badge, hearts  |
| `.float`     | Gentle vertical float loop                 | Hero profile cards   |

---

## 5. Routing & Navigation

TCUnnect uses a **client-side view state machine** instead of a URL router. This is intentional for simplicity in the current prototype.

### View State in `App.tsx`

```typescript
type View =
  | "landing" | "login" | "signup" | "onboarding"
  | "discover" | "likes" | "matches" | "messages"
  | "feed" | "notifications" | "profile" | "premium" | "admin";

const [view, setView] = useState<View>("landing");
```

### Routing Logic

```
landing  ──[Get Started]──→  signup
landing  ──[Log In]────────→  login
signup   ──[submit]────────→  onboarding
login    ──[submit]────────→  discover (dashboard)
onboarding ──[finish]──────→  discover (dashboard)
discover ──[sidebar nav]───→  any dashboard view
any view ──[Log Out]───────→  landing
```

### Adding URL-based Routing

To add `react-router` when the app grows:
1. Invoke `Skill('make:react-router')` before implementing
2. Wrap `App.tsx` in `<BrowserRouter>`
3. Convert each view to a `<Route>` with a path like `/app/discover`
4. Replace `setView()` calls with `useNavigate()`

---

## 6. Data Layer

All data lives in `src/data.ts`. In production, replace these with API calls.

### Types

```typescript
type Student = {
  id: number;
  name: string;
  dept: string;           // "CICT" | "COED" | "CBA" | "CCS" | "CON" | "COE"
  year: string;           // "1st Year" | "2nd Year" | "3rd Year" | "4th Year"
  program: string;
  bio: string;
  interests: string[];
  sharedInterests: string[];  // intersection with current user's interests
  photo: string;          // Unsplash URL
  online: boolean;
  views: number;
  likedAt?: string;       // present if this student liked the current user
};
```

### Exported Collections

| Export          | Type          | Description                              |
|-----------------|---------------|------------------------------------------|
| `ME`            | `Student`     | The logged-in user's profile             |
| `STUDENTS`      | `Student[]`   | Discover feed profiles (7 sample users)  |
| `MATCHES`       | `Student[]`   | Mutually matched users                   |
| `CONVERSATIONS` | array         | Message threads with full message history|
| `FEED_POSTS`    | array         | Anonymous campus feed posts              |
| `NOTIFICATIONS` | array         | Notification center items                |

### Sample Student Photos (Unsplash)

All photos use this URL pattern:
```
https://images.unsplash.com/photo-{ID}?w=600&h=700&fit=crop&auto=format
```

Photos were selected for realistic campus portraiture. Replace with real student uploads in production.

---

## 7. Pages & Components

### `Logo.tsx`

```tsx
<Logo size="sm" | "md" | "lg" />   // defaults to "md"
<Logo white />                      // white wordmark for dark backgrounds
```

The logo is a pure SVG — two overlapping circles (purple → pink gradient) with a connecting curve. No external assets required.

---

### `Landing.tsx`

Public marketing page. All sections are self-contained within the file.

**Sections (top to bottom):**
1. **Nav** — sticky, backdrop-blur, Get Started CTA
2. **Hero** — headline, CTAs, floating profile cards, stats bar
3. **How It Works** — 3-step cards
4. **Features** — 6-feature grid
5. **Community** — feed preview with sample posts
6. **Premium** — dark gradient section with ₱30 CTA
7. **Footer** — logo, links, copyright

**Navigation from Landing:**
```tsx
onNavigate("signup")   // Get Started button
onNavigate("login")    // Log In button
onNavigate("discover") // Explore TCUnnect (skips auth for demo)
```

---

### `Auth.tsx`

Shared component for both login and signup. Controlled by the `mode` prop.

```tsx
<Auth mode="login"  onNavigate={...} />
<Auth mode="signup" onNavigate={...} />
```

**Fields:**
- Sign Up: Name, Email, Password, Confirm Password, Terms checkbox
- Login: Email, Password, Remember me, Forgot password link

**On submit:** navigates to `"onboarding"` (signup) or `"discover"` (login).

> In production: validate email domain against TCU student emails, integrate OAuth.

---

### `Onboarding.tsx`

7-step linear flow with a progress bar. Each step renders conditionally based on `step` state.

| Step | Content               | Required? |
|------|-----------------------|-----------|
| 1    | Department selection  | Yes       |
| 2    | Year level            | Yes       |
| 3    | Program/major         | No (skip) |
| 4    | Profile photo upload  | No (skip) |
| 5    | Interests (5–10 tags) | Yes (min 5)|
| 6    | Bio (max 150 chars)   | No (skip) |
| 7    | Profile preview       | —         |

**State managed locally** — no global store needed at this scale.

**Continue button** is disabled when required fields are missing:
```tsx
disabled={
  (step === 1 && !dept) ||
  (step === 2 && !year) ||
  (step === 5 && selectedInterests.length < 5)
}
```

---

### `Dashboard.tsx`

The main authenticated shell. Contains:

#### Shell Components

| Component        | Location                  | Description                        |
|------------------|---------------------------|------------------------------------|
| `Dashboard`      | default export            | Layout shell: sidebar + topbar + content |
| `MatchOverlay`   | inside Dashboard.tsx      | Full-screen match celebration modal |
| Sidebar          | inline in Dashboard       | Logo, nav items, settings, logout   |
| TopBar           | inline in Dashboard       | Search bar, notification bell, avatar |
| Mobile bottom nav| inline in Dashboard       | 5-icon tab bar (lg:hidden)          |

#### View Components (all inside Dashboard.tsx)

| Component         | View ID         | Key State                          |
|-------------------|-----------------|------------------------------------|
| `DiscoverView`    | `"discover"`    | `cardIndex`, `swipeAnim`           |
| `LikesView`       | `"likes"`       | `tab` (likes/views), `isPremium`   |
| `MatchesView`     | `"matches"`     | —                                  |
| `MessagesView`    | `"messages"`    | `activeConv`, `messages`, `input`  |
| `FeedView`        | `"feed"`        | `posts`, `voted`, `showCreate`     |
| `NotificationsView`| `"notifications"`| —                                |
| `ProfileView`     | `"profile"`     | `editing`, `bio`                   |
| `PremiumView`     | `"premium"`     | `checkout`, `payment`, `done`      |
| `AdminView`       | `"admin"`       | `adminTab`                         |

#### Premium State

`isPremium` is managed in the `Dashboard` component and passed down to `LikesView` and `PremiumView`:

```typescript
const [isPremium, setIsPremium] = useState(false);

// Passed to PremiumView:
<PremiumView isPremium={isPremium} onPurchase={() => setIsPremium(true)} />
```

When `onPurchase()` is called (after simulated payment), `isPremium` flips to `true` and `LikesView` reveals full profiles.

#### Match Flow

```typescript
// DiscoverView calls this when a "like" results in a match:
onMatch(student)

// Dashboard stores the matched student:
const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);

// MatchOverlay renders when matchedStudent is set:
{matchedStudent && (
  <MatchOverlay
    student={matchedStudent}
    onClose={() => setMatchedStudent(null)}
    onMessage={() => { setMatchedStudent(null); setView("messages"); }}
  />
)}
```

The match is triggered randomly (`Math.random() > 0.5`) for demo purposes. In production, check against real like records in the database.

---

## 8. Key Features Explained

### Anonymous Like System

1. User A likes User B → stored as a pending like (not revealed)
2. User B likes User A → mutual match detected → **both** get revealed
3. Before match: User B sees "Someone from CICT liked you 👀" (no name, no photo)
4. After match: Match overlay appears, messaging unlocked

**Free vs Premium visibility on Likes page:**

| Element          | Free User           | Premium User        |
|------------------|---------------------|---------------------|
| Profile photo    | Blurred (`blur-lg`) | Full                |
| Name             | "Someone from CICT" | "Maya Cruz"         |
| Year             | Shown               | Shown               |
| Department       | Shown               | Shown               |
| Shared interests | Count only          | Full list           |
| Action           | "Unlock with Premium" | "Like Back" button |

### Card Swipe (Discover)

The card stack uses two rendered cards: the **active card** and a **background card** (next in queue).

```tsx
// Trigger animation
setSwipeAnim("left");   // pass
setSwipeAnim("right");  // like

// After 380ms, advance the index
setCardIndex((i) => i + 1);
setSwipeAnim("");
```

CSS classes `.card-left` and `.card-right` handle the translate + rotate animation.

### Anonymous Campus Feed

Posts have **no author identity** — not even a hashed identifier. When a post is created:
- No name stored
- No avatar shown (replaced with 🎭 emoji)
- Optional department tag is shown (self-selected by poster)

```tsx
// Post object has no user reference:
{
  id: number;
  dept: string | null;    // self-selected, optional
  text: string;           // max 500 chars
  upvotes: number;
  comments: number;
  time: string;
  tag: string | null;
}
```

### Premium Checkout Flow

```
PremiumView
  → "Get Premium — ₱30" clicked
  → setCheckout(true) → checkout modal opens
  → User selects: GCash / Maya / Card
  → "Pay ₱30" clicked
  → setDone(true) → success animation (2s)
  → setCheckout(false), onPurchase() called
  → isPremium = true globally
```

No real payment is processed. For production, integrate GCash API or a payment gateway like PayMongo.

---

## 9. UX & Business Rules

These rules are enforced throughout the app and must be preserved in all future extensions:

1. **No GPS or location tracking** — Department is the only campus grouping
2. **Anonymous likes** — Never reveal liker identity before mutual match
3. **Anonymous posts** — Never display author name, photo, or any identifier on Campus Feed posts or comments
4. **Messaging gated by match** — Users can only message after a mutual like
5. **Free users see blurred likers** — Full profiles require Premium
6. **Premium = ₱30 lifetime** — One-time payment, no subscription
7. **Department is required** — Used for grouping, filtering, and anonymous post tagging
8. **Interests minimum** — Users must select at least 5 interests during onboarding
9. **Bio max 150 characters** — Enforced in onboarding and profile editing
10. **Post max 500 characters** — Enforced in the create post modal
11. **Report & Block always available** — Accessible from profile view and chat header

---

## 10. Extending the App

### Adding a New Dashboard View

1. Create an internal component in `Dashboard.tsx`:
   ```tsx
   function MyNewView() {
     return <div>...</div>;
   }
   ```

2. Add it to the `NAV` array:
   ```typescript
   { id: "myview", icon: "🆕", label: "New Feature" }
   ```

3. Add it to the `View` type in both `App.tsx` and `Dashboard.tsx`

4. Add it to the `dashboardViews` array in `App.tsx`

5. Render it in Dashboard's `<main>`:
   ```tsx
   {view === "myview" && <MyNewView />}
   ```

### Splitting Dashboard into Separate Files

When `Dashboard.tsx` grows too large:

```
src/pages/dashboard/
  index.tsx         ← shell: sidebar, topbar, match overlay
  Discover.tsx      ← DiscoverView
  Likes.tsx         ← LikesView
  Matches.tsx       ← MatchesView
  Messages.tsx      ← MessagesView
  Feed.tsx          ← FeedView
  Notifications.tsx ← NotificationsView
  Profile.tsx       ← ProfileView
  Premium.tsx       ← PremiumView
  Admin.tsx         ← AdminView
```

Then import each in `dashboard/index.tsx`.

### Adding Real Animations

For swipe gestures on mobile, add `@use-gesture/react`:
```bash
pnpm add @use-gesture/react
```

Replace the button-driven swipe with drag gesture tracking.

### Adding Charts to Admin

Install `recharts`:
```bash
pnpm add recharts
```

Replace the bar chart placeholder in `AdminView` with:
```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
```

---

## 11. Backend Integration Roadmap

When moving from prototype to production:

### Authentication
- Integrate Supabase Auth or Firebase Auth
- Restrict registration to `@tcu.edu.ph` email domain
- OAuth: Google + Facebook

### Database Schema (suggested)

```sql
users          -- profile data, dept, year, interests
likes          -- (from_user, to_user, created_at)
matches        -- created when mutual like detected
messages       -- (match_id, sender_id, text, created_at)
feed_posts     -- (text, dept_tag, upvotes, created_at) — no user FK
notifications  -- (user_id, type, payload, read, created_at)
reports        -- (reporter_id, target_type, target_id, reason)
premium_users  -- (user_id, purchased_at, payment_method)
```

### Key API Endpoints

```
POST /auth/signup
POST /auth/login
GET  /students/discover        # paginated, excludes already-seen
POST /likes/:student_id        # check for mutual match server-side
GET  /likes/received           # premium: full profiles; free: blurred
GET  /matches
GET  /matches/:match_id/messages
POST /matches/:match_id/messages
GET  /feed/posts
POST /feed/posts               # anonymous — no user ID stored
POST /reports
POST /premium/purchase         # integrate PayMongo / GCash
```

### Anonymity in Feed (Production)

**Never** store user ID on feed posts. Consider:
- Storing only `dept` (user-selected at post time)
- Rate-limiting posts by session to prevent spam
- Admin moderation by content only (not user identity)

---

## Quick Reference

```bash
# Start dev server (already running in Figma Make)
pnpm dev

# Type check
pnpm tsc --noEmit

# Format
pnpm format
```

---

*TCUnnect — Built for Taguig City University students.*  
*© 2026 TCUnnect*
