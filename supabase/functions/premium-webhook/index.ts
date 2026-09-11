// STEP 3: WEBHOOK FUNCTION
// Copy this file to: supabase/functions/premium-webhook/index.ts
// Then run: supabase functions deploy premium-webhook --project-ref YOUR_PROJECT_REF

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const QRPH_WEBHOOK_SECRET = Deno.env.get("QRPH_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  // Handle OPTIONS for CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-QRPH-Signature",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.text();
    const payload = JSON.parse(body);

    console.log("[Webhook] Received QRPH webhook:", JSON.stringify(payload, null, 2));

    // Verify webhook signature if secret is set
    if (QRPH_WEBHOOK_SECRET) {
      const signature = req.headers.get("X-QRPH-Signature");
      if (!signature) {
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Note: Signature verification depends on QRPH's exact algorithm
      // This is a placeholder - adjust based on QRPH documentation
      const crypto = await import("https://deno.land/std@0.208.0/crypto/mod.ts");
      const encoder = new TextEncoder();
      const data = encoder.encode(body + QRPH_WEBHOOK_SECRET);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedSignature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      if (signature !== computedSignature) {
        console.log("[Webhook] Signature mismatch");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Extract payment details from QRPH webhook
    const { payment_id, status, merchant_ref_id, amount } = payload;

    if (!payment_id || !status || !merchant_ref_id) {
      return new Response(
        JSON.stringify({ error: "Missing required webhook fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find the payment record by merchant_ref_id (which is our payment.id)
    const { data: payment, error: paymentError } = await supabase
      .from("premium_purchases")
      .select("id, user_id")
      .eq("id", merchant_ref_id)
      .single();

    if (paymentError || !payment) {
      console.log("[Webhook] Payment record not found:", merchant_ref_id);
      return new Response(
        JSON.stringify({ error: "Payment record not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine if payment was successful
    const successStatuses = ["paid", "completed", "success"];
    const failureStatuses = ["failed", "cancelled", "expired"];

    if (successStatuses.includes(status.toLowerCase())) {
      // Payment successful - activate premium
      console.log("[Webhook] Payment successful for user:", payment.user_id);

      // Update payment record
      await supabase
        .from("premium_purchases")
        .update({
          status: "paid",
          qrph_payment_id: payment_id,
        })
        .eq("id", payment.id);

      // Update user to premium
      await supabase
        .from("users")
        .update({ is_premium: true })
        .eq("id", payment.user_id);

      // Log the success event
      await supabase.from("payment_logs").insert({
        user_id: payment.user_id,
        payment_id: payment.id,
        event: "payment_confirmed",
        details: {
          qrph_payment_id: payment_id,
          amount,
          timestamp: new Date().toISOString(),
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Premium activated",
          user_id: payment.user_id,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } else if (failureStatuses.includes(status.toLowerCase())) {
      // Payment failed
      console.log("[Webhook] Payment failed for user:", payment.user_id);

      // Update payment record with failure status
      await supabase
        .from("premium_purchases")
        .update({
          status: status.toLowerCase(),
          qrph_payment_id: payment_id,
        })
        .eq("id", payment.id);

      // Log the failure event
      await supabase.from("payment_logs").insert({
        user_id: payment.user_id,
        payment_id: payment.id,
        event: "payment_failed",
        details: {
          qrph_payment_id: payment_id,
          failure_status: status,
          timestamp: new Date().toISOString(),
        },
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: "Payment failed",
          status,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } else {
      // Unknown status
      console.log("[Webhook] Unknown payment status:", status);

      await supabase.from("payment_logs").insert({
        user_id: payment.user_id,
        payment_id: payment.id,
        event: "payment_status_unknown",
        details: {
          qrph_payment_id: payment_id,
          status,
          timestamp: new Date().toISOString(),
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Webhook received (unknown status)",
          status,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
