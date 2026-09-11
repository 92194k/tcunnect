// STEP 2: CHECKOUT FUNCTION
// Copy this file to: supabase/functions/premium-checkout/index.ts
// Then run: supabase functions deploy premium-checkout --project-ref YOUR_PROJECT_REF

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const QRPH_API_KEY = Deno.env.get("QRPH_API_KEY")!;
const QRPH_BASE_URL = "https://api.qrph.io/v1";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    const { userId, paymentMethod } = await req.json();

    if (!userId || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: "Missing userId or paymentMethod" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: payment, error: paymentError } = await supabase
      .from("premium_purchases")
      .insert({
        user_id: userId,
        amount_php: 30,
        payment_method: paymentMethod,
        status: "pending",
      })
      .select()
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: "Failed to create payment record" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const qrphPayload = {
      amount: 3000,
      merchant_ref_id: payment.id,
      description: `TCUnnect Premium - ${user.name}`,
      customer_email: user.email,
      success_url: `${APP_URL}/premium-success?payment_id=${payment.id}`,
      failure_url: `${APP_URL}/premium-failed?payment_id=${payment.id}`,
    };

    const qrphResponse = await fetch(`${QRPH_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${QRPH_API_KEY}`,
      },
      body: JSON.stringify(qrphPayload),
    });

    if (!qrphResponse.ok) {
      throw new Error(`QRPH request failed: ${qrphResponse.statusText}`);
    }

    const qrphData = await qrphResponse.json();

    await supabase
      .from("premium_purchases")
      .update({ qrph_payment_id: qrphData.payment_id })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({
        paymentId: payment.id,
        qrphPaymentId: qrphData.payment_id,
        checkoutUrl: qrphData.checkout_url || qrphData.payment_url,
        qrCode: qrphData.qr_code,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
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
