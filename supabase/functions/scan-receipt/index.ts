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
        max_tokens: 100,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 }
            },
            {
              type: "text",
              text: "This is a GCash or Maya payment receipt screenshot. Find the payment reference or transaction identifier. It may be labeled in any of these ways: 'Ref No.', 'Ref. No.', 'Ref No', 'Reference No.', 'Reference No', 'Reference Number', 'Ref ID', 'Reference ID', 'Transaction No.', 'Transaction No', 'Transaction Number', 'Transaction ID', 'Txn No.', 'Txn No', 'Txn ID', 'Transac No.', 'Transac No', 'Trace No.', 'Trace No', 'Trace Number', 'Receipt No.', 'Receipt Number', or it may simply appear as a standalone sequence of 10-15 digits on the screen. Return ONLY the number itself — digits only, no label, no punctuation, no spaces, no explanation. If you truly cannot find any such number anywhere in the image, return the single word NONE."
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const extracted = (data.content?.[0]?.text ?? "NONE").trim();

    return new Response(JSON.stringify({ referenceNumber: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
