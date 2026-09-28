// supabase/functions/scan-receipt/index.ts
// Google Cloud Vision OCR for GCash/Maya payment receipts
// Deploy: supabase functions deploy scan-receipt
// Secret required: supabase secrets set GOOGLE_CLOUD_API_KEY=<your-key>

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ── OCR field extractors ──────────────────────────────────────────

/** GCash reference: 13-digit number, often preceded by "Ref No." or "Reference" */
function extractReferenceId(text: string, method: string): string | null {
  const lines = text.split(/\n|\r/);

  // GCash: 13-digit number on a line labelled "Ref No" or standalone
  if (method === "GCash") {
    // Look for "Ref No" or "Reference" label followed by 13 digits on same or next line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/ref(?:erence)?[\s#.:]*no\.?/i.test(line)) {
        // Try same line
        const same = line.match(/\b(\d{13})\b/);
        if (same) return same[1];
        // Try next line
        if (lines[i + 1]) {
          const next = lines[i + 1].match(/\b(\d{13})\b/);
          if (next) return next[1];
        }
      }
    }
    // Fallback: any standalone 13-digit number in the text
    const m = text.match(/\b(\d{13})\b/);
    if (m) return m[1];
  }

  // Maya: 12-digit number or alphanumeric transaction ID
  if (method === "Maya") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/ref(?:erence)?|transaction\s*id|trx\s*id/i.test(line)) {
        // Try alphanumeric ref on same line (Maya uses mixed)
        const same = line.match(/\b([A-Z0-9]{10,16})\b/);
        if (same) return same[1];
        if (lines[i + 1]) {
          const next = lines[i + 1].match(/\b([A-Z0-9]{10,16})\b/);
          if (next) return next[1];
        }
      }
    }
    // Fallback: 12-digit number
    const m = text.match(/\b(\d{12})\b/);
    if (m) return m[1];
  }

  // Generic fallback for any payment method
  const generic = text.match(/\b(\d{12,14})\b/);
  return generic ? generic[1] : null;
}

/** Extract amount — looks for ₱ or PHP followed by digits */
function extractAmount(text: string): number | null {
  // Look for explicit total/amount labels
  const lines = text.split(/\n|\r/);
  for (const line of lines) {
    if (/total|amount|paid|bayad/i.test(line)) {
      const m = line.match(/[₱P]?(\d{1,6}(?:[.,]\d{2})?)/);
      if (m) return parseFloat(m[1].replace(",", "."));
    }
  }
  // Fallback: first ₱ amount in text
  const m = text.match(/[₱P]\s*(\d{1,6}(?:[.,]\d{2})?)/);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

/** Extract date from text, return ISO string or null */
function extractDate(text: string): string | null {
  // Common formats: "Jan 15, 2025", "01/15/2025", "2025-01-15", "15 January 2025"
  const patterns = [
    /(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}/,
    /(\d{4}-\d{2}-\d{2})/,
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const d = new Date(m[1]);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }
  return null;
}

/** Detect payment method from receipt text */
function detectMethod(text: string): "GCash" | "Maya" | null {
  if (/gcash/i.test(text)) return "GCash";
  if (/maya|paymaya/i.test(text)) return "Maya";
  return null;
}

/** Confidence score 0-1 — how complete the extraction is */
function confidence(referenceId: string | null, amount: number | null, date: string | null, method: string | null): number {
  let score = 0;
  if (referenceId) score += 0.5;
  if (amount) score += 0.2;
  if (date) score += 0.15;
  if (method) score += 0.15;
  return score;
}

// ── Main handler ──────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Verify authenticated user
  const authHeader = req.headers.get("authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await client.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  // Parse request body
  let body: { imageBase64: string; mimeType: string; method?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { imageBase64, mimeType, method: hintedMethod } = body;
  if (!imageBase64 || !mimeType) {
    return json({ error: "imageBase64 and mimeType are required" }, 400);
  }

  // Call Google Cloud Vision API
  const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
  if (!apiKey) {
    return json({ error: "GOOGLE_CLOUD_API_KEY secret not configured" }, 500);
  }

  const visionRes = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64 },
          features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
        }],
      }),
    }
  );

  if (!visionRes.ok) {
    const err = await visionRes.text();
    console.error("Vision API error:", err);
    return json({ error: "Google Vision API error", details: err }, 502);
  }

  const visionData = await visionRes.json();
  const rawText: string =
    visionData.responses?.[0]?.fullTextAnnotation?.text ?? "";

  if (!rawText) {
    return json({
      referenceId: null,
      amount: null,
      date: null,
      method: hintedMethod ?? null,
      rawText: "",
      confidence: 0,
      message: "No text detected in image. Please ensure the receipt is clear and well-lit.",
    });
  }

  // Parse fields
  const detectedMethod = detectMethod(rawText) ?? hintedMethod ?? null;
  const methodStr = detectedMethod as "GCash" | "Maya" | null;
  const referenceId = extractReferenceId(rawText, methodStr ?? "GCash");
  const amount      = extractAmount(rawText);
  const date        = extractDate(rawText);
  const conf        = confidence(referenceId, amount, date, methodStr);

  return json({
    referenceId,
    amount,
    date,
    method: methodStr,
    rawText,
    confidence: conf,
  });
});
