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

/**
 * Single regex that matches any known reference-ID label *anywhere* in a line.
 * No start/end anchors — handles "Ref No. 1234567890123" as a single line.
 * Normalised to lowercase before matching (no need for /i flag).
 */
const REF_LABEL_RE = new RegExp(
  [
    // GCash / Maya branded
    "gcash\\s*ref(?:erence)?(?:\\s*(?:no\\.?|id|number|num))?",
    "(?:pay)?maya\\s*ref(?:erence)?(?:\\s*(?:no\\.?|id|number|num))?",
    "gcash\\s*transaction\\s*(?:id|no\\.?|number|num)?",
    "(?:pay)?maya\\s*transaction\\s*(?:id|no\\.?|number|num)?",
    // Transaction / Txn / Trx
    "transaction\\s*ref(?:erence)?(?:\\s*(?:no\\.?|id|number|num))?",
    "transaction\\s*(?:id|no\\.?|number|num|code|ref)",
    "txn\\s*(?:id|no\\.?|number|num|ref)?",
    "trx\\s*(?:id|no\\.?|number|num|ref)?",
    // Payment
    "payment\\s*(?:transaction\\s*)?ref(?:erence)?(?:\\s*(?:no\\.?|id|number|num))?",
    "payment\\s*(?:id|no\\.?|number|num|code)",
    // Confirmation
    "confirmation\\s*(?:ref(?:erence)?\\s*)?(?:id|no\\.?|number|num|code)?",
    "confirm(?:ation)?\\s*(?:id|no\\.?|number|code)?",
    // Receipt
    "receipt\\s*(?:ref(?:erence)?\\s*)?(?:id|no\\.?|number|num)?",
    // Generic Reference / Ref  (keep last — broadest)
    "reference\\s*(?:no\\.?|id|number|num|#|code)?",
    "ref\\.?\\s*(?:no\\.?|id|number|num|#|code)",
    "ref\\s+(?:no\\.?|id|number|num|#|code)",
  ].join("|")
);

/**
 * Extract a reference/transaction ID from OCR text.
 *
 * Two-pass strategy:
 *   Pass 1 — labelled lines:
 *     Find any line containing a known label, then look for the ID value
 *     (a) on the SAME line after the label/colon (handles "Ref No. 1234567890123")
 *     (b) on the NEXT non-empty line        (handles label on one line, value below)
 *   Pass 2 — digit heuristics (fallback):
 *     GCash → 13-digit run, Maya → 12-digit run, generic → 10-16 digit run.
 *
 * Never invents a value — only returns text that appears in the raw OCR output.
 */
function extractReferenceId(text: string, method: string): string | null {
  // Normalise for label matching: lowercase, collapse whitespace, strip punctuation
  const normText = text.toLowerCase().replace(/[.:,#\-_]+/g, " ").replace(/\s+/g, " ");
  const rawLines  = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  const normLines = normText.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);

  // Pass 1: scan every line for a known label
  for (let i = 0; i < normLines.length; i++) {
    if (!REF_LABEL_RE.test(normLines[i])) continue;

    // (a) Value on the SAME line — strip the label part then find a code
    const afterLabel = rawLines[i]
      .replace(new RegExp(REF_LABEL_RE.source, "i"), "")  // remove the label
      .replace(/^[\s:.\-#]+/, "")                          // strip leading separators
      .trim();
    if (afterLabel) {
      // Accept alphanumeric 8-20 chars (covers numeric-only and mixed IDs)
      const m = afterLabel.match(/\b([A-Z0-9]{8,20})\b/i);
      if (m) return m[1];
    }

    // (b) Value on the NEXT non-empty line
    for (let j = i + 1; j < Math.min(i + 3, rawLines.length); j++) {
      const candidate = rawLines[j].trim();
      if (!candidate) continue;
      // Skip if this line is itself another label (multi-field receipts)
      if (REF_LABEL_RE.test(candidate.toLowerCase())) break;
      // Prefer a line that IS entirely a code
      const mWhole = candidate.match(/^([A-Z0-9]{8,20})$/i);
      if (mWhole) return mWhole[1];
      // Otherwise extract the first code-like token
      const mPart = candidate.match(/\b([A-Z0-9]{8,20})\b/i);
      if (mPart) return mPart[1];
      break; // only look at first non-empty line
    }
  }

  // Pass 2: method-specific digit-run fallbacks
  if (method === "GCash") {
    const m = text.match(/\b(\d{13})\b/);
    if (m) return m[1];
  }
  if (method === "Maya") {
    const m = text.match(/\b(\d{12})\b/);
    if (m) return m[1];
  }
  // Generic: any 10–16 digit sequence not preceded by more digits
  const gen = text.match(/(?<!\d)(\d{10,16})(?!\d)/);
  return gen ? gen[1] : null;
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
    // Return a structured response so the frontend shows the manual-entry fallback
    // rather than a generic crash — the receipt itself may be fine.
    return json({
      referenceId: null, amount: null, date: null,
      method: hintedMethod ?? null, rawText: "", confidence: 0,
      message: "Receipt scan unavailable right now. Please enter your Reference ID manually.",
      _visionError: err,
    });
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
