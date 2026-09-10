import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly at startup rather than silently hitting undefined endpoints —
  // easy to miss otherwise since Supabase calls would just error individually.
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env " +
      "and fill in your Supabase project's values (Project Settings > API)."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

// ---------------------------------------------------------------------------
// Typed helpers matching the RPC functions in supabase/migrations/004_rpc_functions.sql
// ---------------------------------------------------------------------------

export type LikeUserResult = { matched: boolean; match_id: string | null };

/** Calls like_user() — server-side mutual-match detection, replaces the old
 * frontend `Math.random() > 0.5` simulation in DiscoverView. */
export async function likeUser(targetUserId: string): Promise<LikeUserResult> {
  const { data, error } = await supabase.rpc("like_user", { target_user_id: targetUserId });
  if (error) throw error;
  return data[0] as LikeUserResult;
}

export type Liker = {
  like_id: string;
  liked_at: string;
  dept: string;
  year_level: string;
  shared_interest_count: number;
  user_id: string | null; // null unless viewer is premium
  name: string | null;
  photo_url: string | null;
  interests: string[] | null;
};

/** Calls get_my_likers() — gating between blurred/free and full/premium
 * profiles happens server-side, not by hiding fields in the UI. */
export async function getMyLikers(): Promise<Liker[]> {
  const { data, error } = await supabase.rpc("get_my_likers");
  if (error) throw error;
  return data as Liker[];
}

export type MatchWithUser = {
  match_id: string;
  matched_at: string;
  other_user_id: string;
  name: string;
  dept: string;
  year_level: string;
  photo_url: string | null;
  interests: string[];
  blockedByMe: boolean; // true if YOU blocked them — conversation stays visible to you, marked
};

/** Active (non-unmatched) matches, joined with the other participant's info.
 * Blocking is asymmetric on purpose: if you blocked someone, their
 * conversation stays in YOUR list (marked blockedByMe) so you keep a
 * record — but if THEY blocked you, it disappears from your list entirely,
 * silently, per the no-notification block design. */
export async function getMyMatches(): Promise<MatchWithUser[]> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");

  const { data: me, error: meError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authData.user.id)
    .single();
  if (meError || !me) throw new Error("Your profile isn't set up yet.");

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, matched_at, user_a, user_b")
    .or(`user_a.eq.${me.id},user_b.eq.${me.id}`)
    .is("unmatched_at", null)
    .order("matched_at", { ascending: false });
  if (matchesError) throw matchesError;
  if (!matches || matches.length === 0) return [];

  const { data: blocks } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${me.id},blocked_id.eq.${me.id}`);
  const iBlocked = new Set((blocks ?? []).filter((b) => b.blocker_id === me.id).map((b) => b.blocked_id));
  const blockedMe = new Set((blocks ?? []).filter((b) => b.blocked_id === me.id).map((b) => b.blocker_id));

  const visibleMatches = matches.filter((m) => {
    const otherId = m.user_a === me.id ? m.user_b : m.user_a;
    return !blockedMe.has(otherId); // silently hide if THEY blocked YOU
  });
  if (visibleMatches.length === 0) return [];

  const otherIds = visibleMatches.map((m) => (m.user_a === me.id ? m.user_b : m.user_a));
  const { data: others, error: othersError } = await supabase
    .from("users")
    .select("id, name, dept, year_level, photo_url, interests")
    .in("id", otherIds);
  if (othersError) throw othersError;

  const byId = new Map((others ?? []).map((o) => [o.id, o]));
  return visibleMatches.map((m) => {
    const otherId = m.user_a === me.id ? m.user_b : m.user_a;
    const o = byId.get(otherId);
    return {
      match_id: m.id,
      matched_at: m.matched_at,
      other_user_id: otherId,
      name: o?.name ?? "Unknown",
      dept: o?.dept ?? "",
      year_level: o?.year_level ?? "",
      photo_url: o?.photo_url ?? null,
      interests: o?.interests ?? [],
      blockedByMe: iBlocked.has(otherId),
    };
  });
}

export type ChatMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  text: string;
  sent_at: string;
  seen_at: string | null;
};

/** All messages in one match, oldest first. */
export async function getMessages(matchId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("sent_at", { ascending: true });
  if (error) throw error;
  return data as ChatMessage[];
}

/** Sends a message — RLS (003_row_level_security.sql) enforces that this
 * only succeeds if the match is active and you're a real participant. */
export async function sendMessage(matchId: string, text: string): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");
  const { data: me } = await supabase.from("users").select("id").eq("auth_id", authData.user.id).single();
  if (!me) throw new Error("Profile not found.");

  const { error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: me.id, text });
  if (error) throw error;
}

/** Silent, instant unmatch — no notification to the other party by design
 * (see Phase 1 rule 5). Just marks the match inactive; queries elsewhere
 * (getMyMatches, message RLS policies) already filter on unmatched_at. */
/** Unmatches AND clears both directions' `likes` rows (via the
 * unmatch_users RPC) — without that second part, Discover would keep
 * hiding both people from each other forever, and re-matching would be
 * structurally impossible. See 20250908350001_unmatch_allows_rematch.sql. */
export async function unmatch(matchId: string): Promise<void> {
  const { error } = await supabase.rpc("unmatch_users", { target_match_id: matchId });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Anonymous feed
// ---------------------------------------------------------------------------

/** A rotating, non-identifying hash used only for abuse-rate-limiting on the
 * anonymous feed — never tied back to a real user_id anywhere in the schema
 * (see feed_posts table comment in 002_feed_safety_payments.sql). */
function getSessionHash(): string {
  const dateKey = "tcunnect_session_date";
  const hashKey = "tcunnect_session_hash";
  const today = new Date().toISOString().split("T")[0];
  let hash = localStorage.getItem(hashKey);
  if (localStorage.getItem(dateKey) !== today || !hash) {
    hash = crypto.randomUUID();
    localStorage.setItem(dateKey, today);
    localStorage.setItem(hashKey, hash);
  }
  return hash;
}

export type FeedPost = {
  id: string;
  dept_tag: string | null;
  text: string;
  photo_url: string | null;
  upvotes: number;
  created_at: string;
  is_admin_post: boolean;
};

export async function getFeedPosts(): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select("id, dept_tag, text, photo_url, upvotes, created_at, is_admin_post")
    .eq("is_removed", false)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data as FeedPost[];
}

/** postAsAdmin only actually takes effect if the caller's session is a real
 * admin — enforced server-side (20250908280001_admin_feed_posts.sql), a
 * non-admin passing true here would just get rejected by the insert policy. */
export async function createFeedPost(text: string, postAsAdmin: boolean = false): Promise<void> {
  const { error } = await supabase
    .from("feed_posts")
    .insert({ text, poster_session_hash: getSessionHash(), is_admin_post: postAsAdmin });
  if (error) throw error;
}

export type FeedComment = {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  text: string;
  created_at: string;
  author_name: string;
  author_photo: string | null;
};

export async function getFeedComments(postId: string): Promise<FeedComment[]> {
  // Deliberately NOT joining users(...) directly in this query. That kind
  // of embed silently drops the whole comment row if the RLS check on the
  // commenter's own `users` row fails for the current viewer (e.g. a block
  // relationship between them, or any other visibility rule) — the comment
  // itself has nothing to do with that check, so it shouldn't disappear
  // over it. Fetching comments and author info as two separate steps
  // avoids that entirely: the comment always shows, worst case with a
  // generic "Unknown" author if their profile truly can't be read.
  const { data: rows, error } = await supabase
    .from("feed_comments")
    .select("id, post_id, parent_comment_id, text, created_at, user_id")
    .eq("post_id", postId)
    .eq("is_removed", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const authorIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  let authorsById = new Map<string, { name: string; photo_url: string | null }>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase.from("users").select("id, name, photo_url").in("id", authorIds);
    authorsById = new Map((authors ?? []).map((a) => [a.id, { name: a.name, photo_url: a.photo_url }]));
  }

  return rows.map((c) => ({
    id: c.id,
    post_id: c.post_id,
    parent_comment_id: c.parent_comment_id,
    text: c.text,
    created_at: c.created_at,
    author_name: (c.user_id && authorsById.get(c.user_id)?.name) || "Unknown",
    author_photo: (c.user_id && authorsById.get(c.user_id)?.photo_url) || null,
  }));
}

/** Comments show the real commenter's identity (unlike posts, which are
 * structurally anonymous) — parentCommentId is optional, set it to reply
 * to another comment instead of the post directly. */
export async function createFeedComment(postId: string, text: string, parentCommentId?: string | null): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");
  const { data: me } = await supabase.from("users").select("id").eq("auth_id", authData.user.id).single();
  if (!me) throw new Error("Profile not found.");

  const { error } = await supabase
    .from("feed_comments")
    .insert({ post_id: postId, text, user_id: me.id, parent_comment_id: parentCommentId ?? null });
  if (error) throw error;
}

/** Toggles your vote on a post server-side (SECURITY DEFINER function keeps
 * the per-user vote table and the counter in sync atomically — replaces the
 * old naive direct-counter-update approach). */
export async function toggleFeedUpvote(postId: string): Promise<{ upvotes: number; nowVoted: boolean }> {
  const { data, error } = await supabase.rpc("toggle_feed_upvote", { target_post_id: postId });
  if (error) throw error;
  const row = data[0];
  return { upvotes: row.upvotes, nowVoted: row.now_voted };
}

export async function getMyVotedPostIds(): Promise<Set<string>> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return new Set();
  const { data: me } = await supabase.from("users").select("id").eq("auth_id", authData.user.id).single();
  if (!me) return new Set();
  const { data } = await supabase.from("feed_post_votes").select("post_id").eq("voter_id", me.id);
  return new Set((data ?? []).map((v) => v.post_id as string));
}

export async function reportFeedPost(postId: string, reason: string): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");
  const { data: me } = await supabase.from("users").select("id").eq("auth_id", authData.user.id).single();
  if (!me) throw new Error("Profile not found.");

  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: me.id, target_type: "feed_post", target_id: postId, reason });
  if (error) throw error;
}

/** General-purpose report filer with an optional screenshot attachment —
 * used for reporting a user (from chat) as well as a feed post. Replaces
 * the old bare-reason window.prompt() flow. */
export async function fileReport(
  targetType: "user" | "feed_post" | "feed_comment" | "message",
  targetId: string,
  reason: string,
  screenshotFile?: File | null
): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");
  const { data: me } = await supabase.from("users").select("id").eq("auth_id", authData.user.id).single();
  if (!me) throw new Error("Profile not found.");

  let screenshotPath: string | null = null;
  if (screenshotFile) {
    const ext = screenshotFile.name.split(".").pop() || "jpg";
    screenshotPath = `${me.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("report-screenshots").upload(screenshotPath, screenshotFile);
    if (uploadError) throw uploadError;
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: me.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    screenshot_url: screenshotPath,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Own profile
// ---------------------------------------------------------------------------

export type MyProfile = {
  id: string;
  name: string;
  dept: string;
  year_level: string;
  program: string | null;
  bio: string | null;
  interests: string[];
  photo_url: string | null;
  name_changed_at: string | null;
};

export async function getMyProfile(): Promise<MyProfile> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");
  const { data, error } = await supabase
    .from("users")
    .select("id, name, dept, year_level, program, bio, interests, photo_url, name_changed_at")
    .eq("auth_id", authData.user.id)
    .single();
  if (error) throw error;
  return data as MyProfile;
}

export type MyVerificationStatus = {
  is_verified: boolean;
  verification_status: "pending" | "approved" | "rejected";
  rejection_notes: string | null;
};

export async function getMyVerificationStatus(): Promise<MyVerificationStatus> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");
  const { data: user, error } = await supabase
    .from("users")
    .select("id, is_verified, verification_status")
    .eq("auth_id", authData.user.id)
    .single();
  if (error) throw error;

  let rejectionNotes: string | null = null;
  if (user.verification_status === "rejected") {
    const { data: sub } = await supabase
      .from("verification_submissions")
      .select("review_notes")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    rejectionNotes = sub?.review_notes ?? null;
  }

  return {
    is_verified: user.is_verified,
    verification_status: user.verification_status,
    rejection_notes: rejectionNotes,
  };
}

export async function updateMyProfile(fields: Partial<Pick<MyProfile, "bio" | "interests" | "photo_url" | "name">>): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");
  const { error } = await supabase.from("users").update(fields).eq("auth_id", authData.user.id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Profile views
// ---------------------------------------------------------------------------

export async function recordProfileView(viewedUserId: string): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return;
  const { data: me } = await supabase.from("users").select("id").eq("auth_id", authData.user.id).single();
  if (!me || me.id === viewedUserId) return;
  // Fire-and-forget — a failed view log shouldn't interrupt browsing.
  await supabase.from("profile_views").insert({ viewer_id: me.id, viewed_id: viewedUserId }).then(
    () => {},
    (err) => console.error("Failed to record profile view:", err)
  );
}

export async function getMyProfileViewCount(): Promise<number> {
  const { data, error } = await supabase.rpc("get_my_profile_view_count");
  if (error) throw error;
  return data as number;
}

export type Viewer = {
  view_id: string;
  viewed_at: string;
  dept: string;
  year_level: string;
  user_id: string | null; // null unless caller is premium
  name: string | null;
  photo_url: string | null;
  interests: string[] | null;
};

export async function getMyViewers(): Promise<Viewer[]> {
  const { data, error } = await supabase.rpc("get_my_viewers");
  if (error) throw error;
  return data as Viewer[];
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationRow = {
  id: string;
  type: "like" | "match" | "message" | "admin";
  text: string;
  icon: string;
  is_read: boolean;
  created_at: string;
};

export async function getMyNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, text, icon, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as NotificationRow[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Admin: reports, users, posts
// ---------------------------------------------------------------------------

export type AdminReport = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter_name: string | null;
  screenshot_url: string | null; // signed URL, private bucket
  preview: string; // human-readable snapshot of the reported content itself
};

export async function getReports(): Promise<AdminReport[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, target_type, target_id, reason, details, status, created_at, screenshot_url, users!reports_reporter_id_fkey(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  return Promise.all(
    (data ?? []).map(async (r: any) => {
      let preview = "(content not found — may have already been deleted)";
      let screenshotSignedUrl: string | null = null;

      try {
        if (r.target_type === "user") {
          const { data: u } = await supabase.from("users").select("name, dept, year_level").eq("id", r.target_id).maybeSingle();
          if (u) preview = `${u.name} — ${u.dept}, ${u.year_level}`;
        } else if (r.target_type === "feed_post") {
          const { data: p } = await supabase.from("feed_posts").select("text, is_removed").eq("id", r.target_id).maybeSingle();
          if (p) preview = p.is_removed ? `[already hidden] ${p.text}` : p.text;
        } else if (r.target_type === "feed_comment") {
          const { data: c } = await supabase.from("feed_comments").select("text").eq("id", r.target_id).maybeSingle();
          if (c) preview = c.text;
        } else if (r.target_type === "message") {
          const { data: m } = await supabase.from("messages").select("text").eq("id", r.target_id).maybeSingle();
          if (m) preview = m.text;
        }
      } catch {
        // leave the "not found" fallback — RLS or a missing row shouldn't
        // break the whole reports list
      }

      if (r.screenshot_url) {
        const { data: signed } = await supabase.storage.from("report-screenshots").createSignedUrl(r.screenshot_url, 300);
        screenshotSignedUrl = signed?.signedUrl ?? null;
      }

      return {
        id: r.id, target_type: r.target_type, target_id: r.target_id, reason: r.reason,
        details: r.details, status: r.status, created_at: r.created_at,
        reporter_name: r.users?.name ?? null,
        screenshot_url: screenshotSignedUrl,
        preview,
      };
    })
  );
}

export async function resolveReport(id: string, status: "actioned" | "dismissed"): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");
  const { data: me } = await supabase.from("users").select("id").eq("auth_id", authData.user.id).single();
  const { error } = await supabase
    .from("reports")
    .update({ status, resolved_by: me?.id, resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function banReportedUser(userId: string, reason: string): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");
  const { data: me } = await supabase.from("users").select("id").eq("auth_id", authData.user.id).single();
  if (!me) throw new Error("Not an admin.");

  const { error: banError } = await supabase.from("users").update({ is_banned: true }).eq("id", userId);
  if (banError) throw banError;

  const { error: logError } = await supabase
    .from("moderation_actions")
    .insert({ target_user: userId, action: "ban", reason, actioned_by: me.id });
  if (logError) throw logError;
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  dept: string;
  is_verified: boolean;
  is_premium: boolean;
  is_banned: boolean;
  is_suspended_until: string | null;
  created_at: string;
};

export async function getAllUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, dept, is_verified, is_premium, is_banned, is_suspended_until, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as AdminUser[];
}

export async function setUserBanned(userId: string, banned: boolean): Promise<void> {
  const { error } = await supabase.from("users").update({ is_banned: banned }).eq("id", userId);
  if (error) throw error;
}

export async function suspendUser(userId: string, days: number): Promise<void> {
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("users").update({ is_suspended_until: until }).eq("id", userId);
  if (error) throw error;
}

export async function unsuspendUser(userId: string): Promise<void> {
  const { error } = await supabase.from("users").update({ is_suspended_until: null }).eq("id", userId);
  if (error) throw error;
}

export async function deleteReport(reportId: string): Promise<void> {
  const { error } = await supabase.from("reports").delete().eq("id", reportId);
  if (error) throw error;
}

/** This is what the Reports tab's "Delete" button actually calls — it
 * deletes the REPORTED CONTENT itself (post/comment/message), not the
 * report record (that stays, marked resolved, as an audit trail — same
 * pattern as Ban/Suspend/Remove Post). "user" reports can't be fully
 * deleted this way: removing an auth account requires Supabase's
 * admin/service-role API, which can't run safely from frontend code with
 * just the anon key — Ban is the real enforcement for user reports. */
export async function deleteReportedContent(targetType: string, targetId: string): Promise<void> {
  if (targetType === "feed_post") {
    const { error } = await supabase.from("feed_posts").delete().eq("id", targetId);
    if (error) throw error;
  } else if (targetType === "feed_comment") {
    const { error } = await supabase.from("feed_comments").delete().eq("id", targetId);
    if (error) throw error;
  } else if (targetType === "message") {
    const { error } = await supabase.from("messages").delete().eq("id", targetId);
    if (error) throw error;
  } else {
    throw new Error(
      "Can't permanently delete a reported user account from here — that needs Supabase's admin API, " +
      "not available in frontend code. Use Ban instead, which is fully enforced."
    );
  }
}

export async function deleteFeedPostAdmin(postId: string): Promise<void> {
  const { error } = await supabase.from("feed_posts").delete().eq("id", postId);
  if (error) throw error;
}

export type AdminFeedPost = {
  id: string;
  text: string;
  dept_tag: string | null;
  upvotes: number;
  is_removed: boolean;
  created_at: string;
};

export async function getAllFeedPostsAdmin(): Promise<AdminFeedPost[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select("id, text, dept_tag, upvotes, is_removed, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as AdminFeedPost[];
}

export async function setFeedPostRemoved(postId: string, removed: boolean): Promise<void> {
  const { error } = await supabase.from("feed_posts").update({ is_removed: removed }).eq("id", postId);
  if (error) throw error;
}

export type AdminStats = {
  totalUsers: number;
  verifiedUsers: number;
  newSignups24h: number;
  openReports: number;
  premiumUsers: number;
  revenuePhp: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [totalUsers, verifiedUsers, newSignups24h, openReports, premiumUsers, purchases] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("is_verified", true),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("is_premium", true),
    supabase.from("premium_purchases").select("amount_php").eq("status", "paid"),
  ]);
  const revenuePhp = (purchases.data ?? []).reduce((sum, p: any) => sum + Number(p.amount_php), 0);
  return {
    totalUsers: totalUsers.count ?? 0,
    verifiedUsers: verifiedUsers.count ?? 0,
    newSignups24h: newSignups24h.count ?? 0,
    openReports: openReports.count ?? 0,
    premiumUsers: premiumUsers.count ?? 0,
    revenuePhp,
  };
}

// ---------------------------------------------------------------------------
// Blocked users
// ---------------------------------------------------------------------------

export type BlockedUser = { block_id: string; user_id: string; name: string; dept: string; blocked_at: string };

export async function getMyBlockedUsers(): Promise<BlockedUser[]> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");
  const { data: me } = await supabase.from("users").select("id").eq("auth_id", authData.user.id).single();
  if (!me) throw new Error("Profile not found.");

  const { data: blocks, error } = await supabase
    .from("blocks")
    .select("id, blocked_id, created_at")
    .eq("blocker_id", me.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!blocks || blocks.length === 0) return [];

  const { data: users } = await supabase.from("users").select("id, name, dept").in("id", blocks.map((b) => b.blocked_id));
  const byId = new Map((users ?? []).map((u) => [u.id, u]));
  return blocks.map((b) => ({
    block_id: b.id,
    user_id: b.blocked_id,
    name: byId.get(b.blocked_id)?.name ?? "Unknown",
    dept: byId.get(b.blocked_id)?.dept ?? "",
    blocked_at: b.created_at,
  }));
}

export async function unblockUser(blockId: string): Promise<void> {
  const { error } = await supabase.from("blocks").delete().eq("id", blockId);
  if (error) throw error;
}

/** Convenience wrapper for unblocking by the OTHER person's user id (e.g.
 * from the chat header), instead of needing the blocks row's own id. */
export async function unblockUserByTargetId(targetUserId: string): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Not signed in.");
  const { data: me } = await supabase.from("users").select("id").eq("auth_id", authData.user.id).single();
  if (!me) throw new Error("Profile not found.");
  const { error } = await supabase.from("blocks").delete().eq("blocker_id", me.id).eq("blocked_id", targetUserId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Account deletion
// ---------------------------------------------------------------------------

/** Real hard-deletion of every relational row tied to this account — see
 * 20250908360001_hard_delete_account_data.sql for the exact scope and the
 * one honest limitation (the auth login credential itself needs Supabase's
 * admin API, which this frontend can't call — only an admin finishing the
 * job with the provided SQL script can remove that last piece). */
export async function requestAccountDeletion(): Promise<void> {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw error;
  await supabase.auth.signOut();
}
