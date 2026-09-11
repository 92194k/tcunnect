// STEP 4: FRONTEND API CLIENT
// Copy this file to: src/lib/api.ts
// This file contains all API calls for premium checkout flow

import { supabase } from "./supabaseClient";

const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/**
 * Initiate premium checkout with QRPH
 * Calls the premium-checkout edge function to create a payment and get checkout URL
 */
export async function initiatePremiumCheckout(
  userId: string,
  paymentMethod: "gcash" | "maya" | "qrph"
): Promise<{
  paymentId: string;
  qrphPaymentId: string;
  checkoutUrl: string | null;
  qrCode: string | null;
}> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/premium-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify({
        userId,
        paymentMethod,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Checkout failed");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[API] initiatePremiumCheckout error:", error);
    throw error;
  }
}

/**
 * Check current premium status for a user
 * Returns whether the user has purchased premium
 */
export async function checkPremiumStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("is_premium")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[API] checkPremiumStatus error:", error);
      return false;
    }

    return data?.is_premium || false;
  } catch (error) {
    console.error("[API] checkPremiumStatus error:", error);
    return false;
  }
}

/**
 * Subscribe to real-time premium status changes
 * Calls the callback whenever the user's premium status changes (via webhook)
 * Returns unsubscribe function
 */
export function subscribeToPremiumStatus(
  userId: string,
  callback: (isPremium: boolean) => void
): () => void {
  try {
    // Initial check
    checkPremiumStatus(userId).then((isPremium) => {
      callback(isPremium);
    });

    // Subscribe to real-time changes on users table
    const subscription = supabase
      .from(`users:id=eq.${userId}`)
      .on("UPDATE", (payload) => {
        const newPremiumStatus = (payload.new as any)?.is_premium || false;
        console.log("[API] Premium status changed:", newPremiumStatus);
        callback(newPremiumStatus);
      })
      .subscribe();

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error("[API] subscribeToPremiumStatus error:", error);
    return () => {};
  }
}

/**
 * Get payment history for a user
 * Returns list of all payment attempts (paid, pending, failed)
 */
export async function getPaymentHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from("premium_purchases")
      .select("id, amount_php, payment_method, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API] getPaymentHistory error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[API] getPaymentHistory error:", error);
    return [];
  }
}

/**
 * Poll payment status (alternative to real-time)
 * Useful if webhook is delayed or for manual status checks
 * Polls every 1 second for up to 60 seconds
 */
export async function pollPaymentStatus(
  paymentId: string,
  maxAttempts: number = 60
): Promise<{ status: string; isPaid: boolean }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data, error } = await supabase
        .from("premium_purchases")
        .select("status")
        .eq("id", paymentId)
        .single();

      if (error) {
        console.error("[API] pollPaymentStatus error:", error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      const status = data?.status || "unknown";
      const isPaid = status === "paid";

      if (isPaid) {
        console.log("[API] Payment confirmed as paid");
        return { status, isPaid };
      }

      if (status === "failed" || status === "cancelled") {
        console.log("[API] Payment failed with status:", status);
        return { status, isPaid: false };
      }

      // Still pending, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("[API] pollPaymentStatus error:", error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { status: "unknown", isPaid: false };
}

/**
 * Get who liked/viewed the current user (free version - blurred)
 * Returns anonymous info: department, year, shared interests
 */
export async function getAnonymousLikersAndViewers(userId: string) {
  try {
    // Get limited list of likes (for free users, show blurred)
    const { data: likes, error: likesError } = await supabase
      .from("likes")
      .select(
        `
        id,
        liker:users!liker_id(id, department, year_level),
        common_interests
      `
      )
      .eq("liked_user_id", userId)
      .limit(5);

    // Get limited list of views
    const { data: views, error: viewsError } = await supabase
      .from("profile_views")
      .select(
        `
        id,
        viewer:users!viewer_id(id, department, year_level),
        created_at
      `
      )
      .eq("viewed_user_id", userId)
      .limit(5);

    return {
      likes: likes || [],
      views: views || [],
    };
  } catch (error) {
    console.error("[API] getAnonymousLikersAndViewers error:", error);
    return { likes: [], views: [] };
  }
}

/**
 * Get full profiles of likers/viewers for premium users
 * Premium users see full profiles, non-premium see blurred
 */
export async function getPremiumLikersAndViewers(userId: string, isPremium: boolean) {
  if (!isPremium) {
    return getAnonymousLikersAndViewers(userId);
  }

  try {
    // Premium users see full profiles
    const { data: likes, error: likesError } = await supabase
      .from("likes")
      .select(
        `
        id,
        liker:users!liker_id(
          id,
          name,
          profile_photo,
          department,
          year_level,
          interests
        ),
        common_interests,
        created_at
      `
      )
      .eq("liked_user_id", userId)
      .order("created_at", { ascending: false });

    const { data: views, error: viewsError } = await supabase
      .from("profile_views")
      .select(
        `
        id,
        viewer:users!viewer_id(
          id,
          name,
          profile_photo,
          department,
          year_level,
          interests
        ),
        created_at
      `
      )
      .eq("viewed_user_id", userId)
      .order("created_at", { ascending: false });

    return {
      likes: likes || [],
      views: views || [],
    };
  } catch (error) {
    console.error("[API] getPremiumLikersAndViewers error:", error);
    return { likes: [], views: [] };
  }
}
