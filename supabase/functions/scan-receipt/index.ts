import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64 || !mediaType) {
      return new Response(JSON.stringify({ error: "Missing imageBase64 or mediaType" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 150,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 }
            },
            {
              type: "text",
              text: `You are reading a GCash or Maya mobile payment receipt.

Your task: find the payment reference or transaction number.

This number may appear next to ANY of these labels (variations in capitalization, spacing, punctuation are all fine):
- Ref No / Ref. No. / Ref No.
- Reference No / Reference No. / Reference Number
- Reference ID / Ref ID
- Transaction ID / Transaction No / Transaction No. / Transaction Number
- Transac ID / Transac No / Transac No. / Transac Number
- Transaction Ref / Transaction Ref.
- Payment Reference / Payment ID
- Confirmation Number / Confirmation ID
- Trace No / Trace No. / Trace Number

Detection strategy (in order of confidence):
1. LABEL FIRST: Find a label from the list above, then read the number immediately after it (after any colon, dash, or space). This is the most reliable method.
2. CONTEXT: If the label is partially cut off or unclear, use surrounding receipt context — amounts, dates, merchant names — to identify which number is the reference.
3. PATTERN: GCash reference numbers are typically 13 digits. Maya may vary. Use digit length as a supporting signal, not the primary one.

Important rules:
- Return ONLY the digits of the reference number — no label, no punctuation, no spaces, no explanation.
- Do NOT grab just any 13-digit number. It must be contextually identified as the reference/transaction identifier.
- Normalize: ignore colons, dashes, spaces between the label and the number.
- If you find it, return the number. If you genuinely cannot find any payment reference or transaction identifier, return exactly: NONE`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const raw = (data.content?.[0]?.text ?? "NONE").trim();
    // Clean up: strip any accidental label text, keep only the digits if it looks like a number
    const cleaned = raw.replace(/[^0-9A-Za-z-]/g, "").trim();
    const result = cleaned.length >= 6 ? cleaned : "NONE";

    return new Response(JSON.stringify({ referenceNumber: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
