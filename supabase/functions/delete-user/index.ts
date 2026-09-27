// supabase/functions/delete-user/index.ts
// Secure server-side Edge Function for deleting a user from Supabase Auth.
// Uses the service role key (never exposed to the frontend).
// Cascade chain: auth.users → profiles → likes, matches, messages,
//   notifications, bookings, posts, payments, reports, blocks (all ON DELETE CASCADE)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // ── 1. Require Authorization header ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const callerToken = authHeader.slice(7);

    // ── 2. Build an admin client (service role bypasses RLS) ─────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 3. Verify the caller is a real, authenticated user ───────────────────
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(callerToken);
    if (authErr || !caller) {
      return json({ error: "Invalid or expired token" }, 401);
    }

    // ── 4. Verify the caller has is_admin = true ─────────────────────────────
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", caller.id)
      .single();

    if (!callerProfile?.is_admin) {
      return json({ error: "Forbidden: admin access required" }, 403);
    }

    // ── 5. Parse request body ────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { userId } = body as { userId?: string };

    if (!userId) {
      return json({ error: "userId is required" }, 400);
    }

    // ── 6. Prevent admin from deleting their own account ─────────────────────
    if (userId === caller.id) {
      return json({ error: "You cannot delete your own account" }, 400);
    }

    // ── 7. Verify target user exists ─────────────────────────────────────────
    const { data: targetUser, error: lookupErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (lookupErr || !targetUser?.user) {
      return json({ error: "Target user not found" }, 404);
    }

    // ── 8. Delete auth user — cascades to profiles → all child tables ─────────
    //   profiles.id REFERENCES auth.users(id) ON DELETE CASCADE
    //   → likes, matches, messages, notifications, bookings,
    //     posts, payments, reports, blocks all ON DELETE CASCADE from profiles
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error("deleteUser error:", deleteErr);
      return json({ error: deleteErr.message }, 500);
    }

    return json({ success: true, deletedUserId: userId });
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
