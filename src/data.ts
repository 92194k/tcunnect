export type Student = {
  id: number;
  name: string;
  dept: string;
  year: string;
  program: string;
  bio: string;
  interests: string[];
  sharedInterests: string[];
  photo: string;
  online: boolean;
  views: number;
  likedAt?: string;
};

export type Message = {
  id: number;
  from: "me" | "them";
  text: string;
  time: string;
  seen?: boolean;
};

export const ME: Student = {
  id: 0,
  name: "Jordan Reyes",
  dept: "CICT",
  year: "3rd Year",
  program: "BS Information Technology",
  bio: "Building things, breaking stuff, and having fun. Coffee-powered. 💻",
  interests: ["Coding", "Gaming", "Music", "Coffee", "Anime", "Fitness"],
  sharedInterests: [],
  photo: "https://images.unsplash.com/photo-1681097561932-36d0df02b379?w=400&h=400&fit=crop&auto=format",
  online: true,
  views: 123,
};

export const STUDENTS: Student[] = [
  {
    id: 1,
    name: "Alex Santos",
    dept: "CICT",
    year: "3rd Year",
    program: "BS Computer Science",
    bio: "Coffee, coding, and late-night gaming. Always up for a hackathon! 🎮",
    interests: ["Coding", "Gaming", "Music", "Coffee", "Anime"],
    sharedInterests: ["Coding", "Gaming", "Music"],
    photo: "https://images.unsplash.com/photo-1544168190-79c17527004f?w=600&h=700&fit=crop&auto=format",
    online: true,
    views: 89,
  },
  {
    id: 2,
    name: "Maya Cruz",
    dept: "COED",
    year: "2nd Year",
    program: "BS Education",
    bio: "Future teacher. K-pop enthusiast. Books > everything. 📚",
    interests: ["K-pop", "Reading", "Art", "Travel", "Photography"],
    sharedInterests: ["Music", "Art"],
    photo: "https://images.unsplash.com/photo-1773899337978-b8d83bd9b783?w=600&h=700&fit=crop&auto=format",
    online: false,
    views: 134,
    likedAt: "10 min ago",
  },
  {
    id: 3,
    name: "Carlo Mendoza",
    dept: "CBA",
    year: "4th Year",
    program: "BS Business Administration",
    bio: "Aspiring entrepreneur. Basketball enthusiast. Future CEO. 📈",
    interests: ["Basketball", "Business", "Travel", "Food", "Fitness"],
    sharedInterests: ["Fitness"],
    photo: "https://images.unsplash.com/photo-1616326431985-b9f89ebc6ab7?w=600&h=700&fit=crop&auto=format",
    online: true,
    views: 211,
  },
  {
    id: 4,
    name: "Sofia Lim",
    dept: "CCS",
    year: "1st Year",
    program: "BS Computer Science",
    bio: "Freshie exploring campus life. Dance + tech is my vibe! 🎵",
    interests: ["Dance", "Coding", "Music", "K-pop", "Photography"],
    sharedInterests: ["Coding", "Music"],
    photo: "https://images.unsplash.com/photo-1758600587815-b654d1405e83?w=600&h=700&fit=crop&auto=format",
    online: true,
    views: 56,
  },
  {
    id: 5,
    name: "Marcus Tan",
    dept: "COE",
    year: "2nd Year",
    program: "BS Civil Engineering",
    bio: "Engineer-in-training. Loves hiking and anime marathons. 🏔️",
    interests: ["Anime", "Hiking", "Gaming", "Reading", "Fitness"],
    sharedInterests: ["Anime", "Gaming"],
    photo: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=600&h=700&fit=crop&auto=format",
    online: false,
    views: 72,
  },
  {
    id: 6,
    name: "Ria Bautista",
    dept: "CON",
    year: "3rd Year",
    program: "BS Nursing",
    bio: "Future nurse, current food lover. Always ready to help! 💊",
    interests: ["Food", "Travel", "Photography", "Art", "Dance"],
    sharedInterests: ["Music"],
    photo: "https://images.unsplash.com/photo-1556560984-36a7ec2ba544?w=600&h=700&fit=crop&auto=format",
    online: true,
    views: 98,
    likedAt: "2 hours ago",
  },
  {
    id: 7,
    name: "Ethan Go",
    dept: "CICT",
    year: "4th Year",
    program: "BS Information Systems",
    bio: "Code by day, gamer by night. Let's build something cool. 🚀",
    interests: ["Coding", "Gaming", "Anime", "Coffee", "Music"],
    sharedInterests: ["Coding", "Gaming", "Coffee"],
    photo: "https://images.unsplash.com/photo-1759852692971-a2abc6799cbd?w=600&h=700&fit=crop&auto=format",
    online: true,
    views: 167,
  },
];

export const MATCHES: Student[] = [STUDENTS[1], STUDENTS[5]];

export const CONVERSATIONS = [
  {
    id: 1,
    student: STUDENTS[1],
    lastMessage: "Yeah! What programming language are you learning? 😊",
    time: "2m ago",
    unread: 2,
    messages: [
      { id: 1, from: "them", text: "Hey! I noticed we both like coding 😄", time: "10:20 AM" },
      { id: 2, from: "me", text: "Yes! So cool we matched. What are you working on lately?", time: "10:22 AM" },
      { id: 3, from: "them", text: "Just finished a web project! You?", time: "10:23 AM" },
      { id: 4, from: "me", text: "Working on a mobile app for campus events 📱", time: "10:25 AM" },
      { id: 5, from: "them", text: "Yeah! What programming language are you learning? 😊", time: "10:27 AM" },
    ] as Message[],
  },
  {
    id: 2,
    student: STUDENTS[5],
    lastMessage: "Sure! Library or canteen? 😊",
    time: "1h ago",
    unread: 0,
    messages: [
      { id: 1, from: "them", text: "Hi! So glad we matched 🎉", time: "9:10 AM" },
      { id: 2, from: "me", text: "Same!! Your profile looked really cool", time: "9:12 AM" },
      { id: 3, from: "them", text: "Haha thanks! Want to study together sometime?", time: "9:15 AM" },
      { id: 4, from: "me", text: "Yes definitely! When are you free?", time: "9:20 AM" },
      { id: 5, from: "them", text: "Sure! Library or canteen? 😊", time: "9:25 AM" },
    ] as Message[],
  },
];

export const FEED_POSTS = [
  {
    id: 1,
    dept: "CICT",
    text: "Anyone else surviving finals week? The number of Red Bulls I've consumed is concerning 😭",
    upvotes: 47,
    comments: 14,
    time: "2h ago",
    tag: "CICT",
  },
  {
    id: 2,
    dept: "COED",
    text: "Looking for people to join our study group for the upcoming board exams! DM this post if you're interested 📚",
    upvotes: 31,
    comments: 8,
    time: "4h ago",
    tag: "COED",
  },
  {
    id: 3,
    dept: null,
    text: "Who else is always at the library at 11pm? We should start a 'night owl' club lol 🦉",
    upvotes: 89,
    comments: 23,
    time: "6h ago",
    tag: null,
  },
  {
    id: 4,
    dept: "CBA",
    text: "Does anyone have notes from yesterday's Business Law class? Prof was speaking too fast 😅",
    upvotes: 15,
    comments: 6,
    time: "8h ago",
    tag: "CBA",
  },
  {
    id: 5,
    dept: null,
    text: "Campus canteen needs more options fr fr. I'm so tired of the same menu every single day 😤",
    upvotes: 124,
    comments: 41,
    time: "Yesterday",
    tag: null,
  },
  {
    id: 6,
    dept: "CON",
    text: "Nursing students where are you 🩺 Let's form a review group for fundamentals!",
    upvotes: 22,
    comments: 9,
    time: "Yesterday",
    tag: "CON",
  },
];

export const NOTIFICATIONS = [
  { id: 1, icon: "👀", text: "Someone from CICT liked you", sub: "Upgrade to see who", time: "5 min ago", unread: true, type: "like" },
  { id: 2, icon: "🎉", text: "You matched with Maya!", sub: "Start a conversation now", time: "1 hour ago", unread: true, type: "match" },
  { id: 3, icon: "💬", text: "Maya sent you a message", sub: "Yeah! What programming language...", time: "2 hours ago", unread: false, type: "message" },
  { id: 4, icon: "👁️", text: "Someone from CCS viewed your profile", sub: "Upgrade to see who", time: "3 hours ago", unread: false, type: "view" },
  { id: 5, icon: "👍", text: "Your post got 24 upvotes", sub: "Anyone else surviving finals week...", time: "Yesterday", unread: false, type: "post" },
  { id: 6, icon: "👀", text: "Someone from COED liked you", sub: "Upgrade to see who", time: "Yesterday", unread: false, type: "like" },
  { id: 7, icon: "🎉", text: "You matched with Ria!", sub: "Start a conversation now", time: "2 days ago", unread: false, type: "match" },
];
