Design and build a complete responsive web application called **TCUnnect** — a modern campus-based social discovery and anonymous community platform exclusively designed for Taguig City University (TCU) students.

The product is **NOT location-based and must NOT use GPS, maps, or distance tracking**.

The visual style should feel modern, youthful, clean, friendly, and premium — inspired by the usability of Badoo/Tinder for profile discovery and Reddit for the anonymous community feed, but with a completely original TCUnnect visual identity.

## BRAND

Product name: **TCUnnect**

Tagline:
**Meet. Match. Connect.**

Tone:

* youthful
* friendly
* campus-oriented
* social
* trustworthy
* modern
* slightly playful
* not overly romantic or explicitly dating-focused

Create a simple modern TCUnnect logo using a connected-link or two-person concept.

Use a clean modern sans-serif typeface.

Suggested visual direction:

* white / very light background
* dark navy or deep charcoal text
* vibrant purple/indigo primary accent
* pink/red accent for likes
* green for successful matches
* subtle gradients
* large rounded cards
* soft shadows
* generous spacing
* polished SaaS/social-app appearance

Do NOT make it look like a generic dating app.

---

# RESPONSIVE DESIGN

Create responsive layouts for:

1. Desktop — 1440px wide
2. Tablet — approximately 1024px
3. Mobile — 390px wide

Use Auto Layout, reusable components, variants, and responsive constraints throughout the design.

Create a complete design system before building the individual pages.

---

# DESIGN SYSTEM

Create:

### Colors

* Primary
* Primary hover
* Background
* Surface
* Card
* Text primary
* Text secondary
* Border
* Like
* Match/success
* Warning
* Error
* Premium/gold

### Typography

Create styles for:

* Display
* H1
* H2
* H3
* Body large
* Body
* Body small
* Caption
* Button
* Navigation

### Components

Create reusable components for:

* Buttons
* Icon buttons
* Navigation
* Profile cards
* Avatar
* Department badge
* Year-level badge
* Interest tags
* Like button
* Pass button
* View profile button
* Notification item
* Match card
* Message bubble
* Chat input
* Post card
* Comment
* Bottom navigation
* Modal
* Toast
* Dropdown
* Search/filter controls
* Premium badge
* Blurred profile card
* Report/block modal
* Confirmation dialog

Use variants for states such as:
Default / Hover / Pressed / Disabled.

---

# PUBLIC LANDING PAGE

Create a polished landing page for tcunnect.com.

Sections:

### Hero

Headline:
**Meet people. Find your circle.**

Supporting text:
**Discover fellow TCU students, connect through shared interests, and join an anonymous campus community.**

Primary CTA:
**Get Started**

Secondary CTA:
**Explore TCUnnect**

Hero visual should show several TCUnnect profile cards and connection/match UI.

### How It Works

Three steps:

1. **Create your profile**
   Add your department, year level, interests, photo, and optional bio.

2. **Discover people**
   Browse students and find people with shared interests.

3. **Match & connect**
   Like anonymously. If they like you back, you both get revealed and can chat.

### Features

Create feature cards for:

* Discover Students
* Anonymous Likes
* Mutual Matches
* Private Messaging
* Anonymous Campus Feed
* Premium Visibility

### Community Section

Show sample anonymous posts such as:

“Anyone else surviving finals week? 😭”

“Looking for people to join our study group.”

“Who else is always at the library?”

### Premium Section

Headline:
**See who's interested in you.**

Price:
**₱30 Lifetime**

Benefits:

* See everyone who liked you
* See everyone who viewed you
* Unlimited access
* Instant notifications
* Premium badge

CTA:
**Get Premium**

### Footer

Include:
TCUnnect logo
About
Safety
Privacy
Terms
Contact
© 2026 TCUnnect

---

# AUTHENTICATION

Create:

### Sign Up

Fields:

* Full name
* Email
* Password
* Confirm password

Social buttons:

* Continue with Google
* Continue with Facebook

Checkbox:
“I agree to the Terms and Privacy Policy.”

CTA:
**Create Account**

### Login

Fields:

* Email
* Password

Options:

* Remember me
* Forgot password?

Buttons:

* Log In
* Continue with Google
* Continue with Facebook

---

# ONBOARDING

After registration, create a multi-step onboarding flow.

### Step 1 — Department

Title:
**Where do you belong?**

Department selection cards:

* CICT
* COED
* CBA
* CCS
* CON
* COE
* Other

### Step 2 — Year Level

Options:

* 1st Year
* 2nd Year
* 3rd Year
* 4th Year

### Step 3 — Program

Optional program/major.

Example:
BS Computer Science
BS Information Technology

### Step 4 — Profile Photo

Upload one profile photo.

Show image preview and:
**Upload Photo**

### Step 5 — Interests

Title:
**What are you into?**

Require 5–10 interest tags.

Example tags:
Gaming
Music
K-pop
Anime
Coding
Basketball
Movies
Photography
Travel
Food
Fitness
Art
Reading
Dance

### Step 6 — Bio

Optional short bio.

Character limit:
150 characters.

### Final

Show profile preview.

CTA:
**Start Discovering**

---

# MAIN APP DASHBOARD

Create the primary authenticated desktop layout.

Left sidebar:

TCUnnect logo

Navigation:

* Discover
* Likes
* Matches
* Messages
* Campus Feed
* Notifications
* My Profile
* Premium

Bottom:
Settings
Log out

Top bar:
Search
Notifications
Profile avatar

---

# DISCOVER PAGE

This is the main social discovery experience.

Title:
**Discover**

Subtitle:
**Find people you might connect with.**

Create large profile cards.

Each card should contain:

* Large profile photo
* Name
* Department badge
* Year level
* Program
* Short bio
* Interest tags
* Shared interests indicator

Example:

**Alex Santos**
CICT · 3rd Year
BS Computer Science

“Coffee, coding, and late-night gaming.”

Shared interests:
Coding · Gaming · Music

Actions:

❤️ Like
✕ Pass
👁 View Profile

Add subtle card transitions and interaction states.

Desktop should display one large primary card with optional adjacent cards/previews.

Mobile should use a swipe/card-stack style layout.

---

# FULL PROFILE PAGE

Display:

Large profile photo

Name
Department
Year level
Program

Bio

Interest tags

Shared interests

Profile statistics:
**123 profile views**

Action buttons:
❤️ Like
✕ Pass
Report
Block

If the profile has already liked the current user, show:
**They liked you 👀**

But keep their identity hidden until mutual matching.

---

# ANONYMOUS LIKE EXPERIENCE

When someone likes the user, create a notification card:

**Someone from CICT liked you 👀**

Show:

* Department
* Year level
* Shared interests

Do NOT reveal their name or photo for free users.

For free users:
show a blurred profile preview.

CTA:
**Upgrade to see who**

For premium users:
show:

* Full profile photo
* Name
* Department
* Year
* Interests

CTA:
**Like Back**

---

# LIKES PAGE

Title:
**Who likes you**

Tabs:

* Likes
* Views

FREE USER STATE:

Display blurred profile cards.

Example:

“Someone from CICT”
“3rd Year”
“2 shared interests”

Overlay:
**Unlock with Premium**

Premium CTA:
**See Who Likes You**

PREMIUM USER STATE:

Show full profiles.

Each card:
photo
name
department
year
shared interests
Like Back button

---

# PROFILE VIEWS PAGE

Title:
**Who viewed you**

Free users see limited blurred profiles.

Premium users see unlimited full profiles.

Include:
“123 people viewed your profile”

Show timestamps:
“Viewed 5 min ago”
“Viewed yesterday”

---

# MATCH SCREEN

When two users mutually like each other:

Create an attractive celebration screen.

Headline:
**It's a Match! 🎉**

Subtext:
**You both liked each other.**

Show both profile photos.

Buttons:
**Start Chatting**
**Keep Discovering**

Use a subtle celebratory animation concept.

---

# MATCHES PAGE

Title:
**Your Matches**

Create profile cards showing:

Photo
Name
Department
Shared interests
Last active

CTA:
**Message**

Empty state:
**No matches yet**

Subtext:
“Keep discovering — your next connection might be one swipe away.”

CTA:
**Discover People**

---

# MESSAGING

Create desktop chat interface.

Left panel:
Conversations

Each conversation:
Avatar
Name
Last message
Timestamp
Unread indicator

Right panel:
Chat header:
Avatar
Name
Department
Online status

Message bubbles.

Example:

“Hey! I noticed we both like coding 😄”

“Yeah! What programming language are you learning?”

Bottom:
Emoji button
Text input
Send button

Message states:
Sent ✓
Seen ✓✓

Top-right actions:
Unmatch
Block
Report

Create mobile version with separate conversation list and chat screen.

---

# NOTIFICATIONS

Create notification center.

Types:

Someone from CICT liked you 👀

Someone from CCS viewed your profile

You matched with Alex 🎉

You received a new message

Your post received 10 upvotes

Group notifications by:
Today
Yesterday
Earlier

Include unread indicators.

---

# ANONYMOUS CAMPUS FEED

Create a Reddit-inspired but original campus feed.

Title:
**Campus Feed**

Subtitle:
**Say it anonymously.**

Top controls:
Hot
Recent
Top

Create:
**+ Create Anonymous Post**

Post card:

Anonymous
· CICT

“Anyone else struggling with this semester?”

Actions:
👍 24
💬 8
🚩 Report

Posts can contain:

* text
* optional image
* optional department tag

Maximum post length:
500 characters.

---

# CREATE ANONYMOUS POST

Modal or dedicated page.

Title:
**Share anonymously**

Textarea:
“What’s on your mind?”

Character counter:
0 / 500

Optional:
Upload image

Optional:
Department tag

Important notice:
**Your name and profile will not appear on this post.**

Buttons:
Cancel
Post Anonymously

---

# POST DETAIL

Show:

Anonymous post
Department tag
Timestamp

Full content

Upvote/downvote-style interaction or simple upvote.

Comments section.

Comment input:
“Write an anonymous comment…”

Each comment remains anonymous.

Actions:
Upvote
Report

---

# PREMIUM PAGE

Create a polished conversion page.

Headline:
**See who's interested in you.**

Price:
**₱30**
**Lifetime access**

Highlight:
**Pay once. No monthly subscription.**

Benefits:

✓ See everyone who liked you
✓ See everyone who viewed you
✓ Unlimited likes and views
✓ Instant notifications
✓ Premium profile badge

CTA:
**Get Premium — ₱30**

Include a comparison table:

FREE vs PREMIUM

Browse profiles ✓ ✓
Like profiles ✓ ✓
See who liked you Blurred ✓
See profile viewers Limited/Blurred ✓
Messaging ✓ ✓
Anonymous feed ✓ ✓
Premium badge — ✓

---

# PAYMENT CHECKOUT

Create a simple secure-looking checkout screen.

Product:
TCUnnect Premium

Price:
₱30 Lifetime

Payment options:

* GCash
* Maya
* Card

Order summary.

CTA:
**Pay ₱30**

Do not make the UI claim that payment information is stored by TCUnnect.

---

# MY PROFILE

Profile header:

Large profile photo
Name
Department
Year
Program
Premium badge if applicable

Bio

Interests

Profile views:
**123 people viewed your profile**

Buttons:
Edit Profile
Preview Profile

Profile settings:

* Edit personal information
* Edit interests
* Change photo
* Privacy
* Notifications
* Blocked users
* Account settings

---

# EDIT PROFILE

Allow editing:

Profile photo
Name
Department
Year
Program
Interests
Bio

Save button:
**Save Changes**

---

# SAFETY / REPORTING

Create report modal.

Title:
**Report this user**

Reasons:

* Spam
* Harassment
* Inappropriate content
* Fake profile
* Other

Textarea:
Additional information

Buttons:
Cancel
Submit Report

Create block confirmation:

**Block this user?**

“This person will no longer be able to see or interact with your profile.”

Buttons:
Cancel
Block User

---

# EMPTY STATES

Design polished empty states for:

No matches
No likes
No profile views
No messages
No notifications
No campus posts

Each should include:
Simple illustration/icon
Friendly headline
Short explanation
Relevant CTA

---

# ERROR / LOADING STATES

Create:

* Skeleton loading cards
* Loading spinner
* Network error
* Failed message
* Failed image upload
* Payment failure
* Session expired
* Generic error

Use friendly error messages.

---

# ADMIN / MODERATION DASHBOARD

Also create a basic admin interface.

Sidebar:
Dashboard
Users
Reports
Posts
Payments
Analytics

Dashboard cards:
Total Users
Active Users
New Signups
Reports
Premium Users
Revenue

Reports table:
Report ID
Type
Reported user/post
Reason
Date
Status
Actions

Actions:
Review
Dismiss
Suspend
Ban

Post moderation:
Preview
Report count
Remove
Keep

User moderation:
View profile
Warn
Suspend
Ban

---

# ANALYTICS DASHBOARD

Create charts/cards for:

DAU
Signups per day
Average likes per user
Match rate
Messages per match
Premium conversion rate
Day-7 retention
Day-30 retention
Anonymous feed engagement

Use clean dashboard charts.

---

# MOBILE NAVIGATION

For mobile, use bottom navigation:

🏠 Discover
❤️ Likes
💬 Matches
📰 Feed
👤 Profile

Messages and notifications should be accessible through contextual icons.

Keep important actions thumb-friendly.

---

# IMPORTANT UX RULES

1. Never use GPS or location tracking.
2. Department is the primary campus grouping.
3. Anonymous likes must never reveal identity before mutual matching.
4. Anonymous campus posts must not display the author's identity.
5. Messaging is unlocked only after mutual matching.
6. Free users see blurred/limited liker and viewer information.
7. Premium users get unlimited access.
8. Premium costs ₱30 lifetime.
9. Users can report and block others.
10. Keep the product feeling like a campus social discovery platform rather than a dating-only app.
11. Avoid excessive gradients or overly flashy visuals.
12. Prioritize accessibility and readability.
13. Use realistic sample student data and placeholder photos.
14. Do not use real students' personal information.
15. Every major interaction should have loading, empty, success, and error states.

---

# FIGMA FILE STRUCTURE

Organize the Figma file into these pages:

01 — Cover
02 — Design System
03 — Components
04 — Landing Page
05 — Authentication
06 — Onboarding
07 — Discover
08 — Profiles
09 — Likes & Views
10 — Matches
11 — Messaging
12 — Notifications
13 — Campus Feed
14 — Premium
15 — Settings
16 — Safety & Moderation
17 — Admin Dashboard
18 — Mobile Screens
19 — Prototype Flows

Create reusable components and variants instead of duplicating UI elements.

Connect the major prototype flows:

Landing → Sign Up → Onboarding → Discover

Discover → View Profile → Like → Match

Like → Likes → Premium → Checkout

Match → Messaging

Discover → Campus Feed → Create Anonymous Post → Post Detail

Profile → Settings → Edit Profile

Profile/Post → Report/Block

The final result should look like a **production-ready startup MVP**, not a wireframe.

Prioritize visual hierarchy, usability, responsive behavior, component consistency, and realistic interaction states.
