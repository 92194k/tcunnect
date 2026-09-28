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

// ── Provider detection ────────────────────────────────────────────

function detectMethod(text: string): "GCash" | "Maya" | null {
  if (/gcash/i.test(text)) return "GCash";
  if (/\b(?:pay)?maya\b/i.test(text)) return "Maya";
  return null;
}

// ── Normalisation helpers ─────────────────────────────────────────

/**
 * Normalise a single line for label matching:
 * - lowercase
 * - remove punctuation (periods, colons, commas, hashes, underscores, dashes)
 * - collapse whitespace
 * This lets "Ref No.", "REF NO.", "ref no", "Ref-No" all match the same pattern.
 */
function normLine(line: string): string {
  return line.toLowerCase().replace(/[.:,#\-_]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Remove all whitespace from a string — used to collapse OCR-split digit groups.
 * "123 456 789 0123" → "1234567890123"
 */
function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, "");
}

// ── GCash extraction ──────────────────────────────────────────────

/**
 * GCash Ref No. label patterns (normalised, no anchors).
 * Matches: Ref No., Ref No, REF NO., REF NO, Reference No., Reference Number,
 *          Reference ID, Ref. No., Ref ID, GCash Ref No., GCash Reference No., etc.
 */
const GCASH_LABEL_RE = /\b(?:gcash\s*)?ref(?:erence)?\s*(?:no|num(?:ber)?|id|#)?\b/;

/**
 * Extract a valid 13-digit GCash reference number.
 *
 * Strategy:
 *  1. Find a line containing a GCash-style label.
 *  2. Look for 13 consecutive digits on the SAME line (after the label)
 *     OR on the next 1–2 non-empty lines.
 *     OCR sometimes splits digits with spaces — collapse them first.
 *  3. Fallback: scan entire text for any 13-digit run.
 */
function extractGCashRef(rawLines: string[]): string | null {
  const normLines = rawLines.map(normLine);

  for (let i = 0; i < normLines.length; i++) {
    if (!GCASH_LABEL_RE.test(normLines[i])) continue;

    // (a) Same line — remove the label portion, then find 13 digits
    const afterLabel = rawLines[i]
      .replace(new RegExp(GCASH_LABEL_RE.source, "i"), "")
      .replace(/^[\s:.\-#]+/, "")
      .trim();
    if (afterLabel) {
      // Try collapsed (OCR may put spaces between digit groups)
      const collapsed = collapseSpaces(afterLabel);
      const mCollapsed = collapsed.match(/\d{13}/);
      if (mCollapsed) return mCollapsed[0];
      // Try word-boundary match on original
      const mDirect = afterLabel.match(/\b(\d{13})\b/);
      if (mDirect) return mDirect[1];
    }

    // (b) Next 1–2 lines
    for (let j = i + 1; j <= Math.min(i + 2, rawLines.length - 1); j++) {
      const candidate = rawLines[j].trim();
      if (!candidate) continue;
      // Stop if this line is another label
      if (GCASH_LABEL_RE.test(normLine(candidate)) || MAYA_LABEL_RE.test(normLine(candidate))) break;
      // Collapse spaces in case OCR split the number
      const collapsed = collapseSpaces(candidate);
      const m13 = collapsed.match(/\d{13}/);
      if (m13) return m13[0];
      // Also try without collapse (clean OCR)
      const mDirect = candidate.match(/\b(\d{13})\b/);
      if (mDirect) return mDirect[1];
      break;
    }
  }

  // Fallback: find any 13-digit number anywhere in the text
  // Collapse entire text to handle split-digit OCR artifacts
  const fullCollapsed = rawLines.join("").replace(/\s+/g, "");
  const mFull = fullCollapsed.match(/\d{13}/);
  if (mFull) return mFull[0];

  // Last resort: standard word-boundary search
  const joined = rawLines.join("\n");
  const mLast = joined.match(/(?<!\d)(\d{13})(?!\d)/);
  return mLast ? mLast[1] : null;
}

// ── Maya extraction ───────────────────────────────────────────────

/**
 * Maya Transaction ID label patterns (normalised, no anchors).
 * Matches: Transaction ID, Transaction Id, TRANSACTION ID, TransactionID,
 *          Transaction No., Transaction Number, Transaction Ref, etc.
 * Also: Maya Ref No., Maya Reference No., PayMaya Transaction ID, etc.
 */
const MAYA_LABEL_RE = /\b(?:(?:pay)?maya\s*)?(?:transaction|txn|trx)\s*(?:id|no|num(?:ber)?|ref(?:erence)?|code)?\b|\b(?:pay)?maya\s*ref(?:erence)?\s*(?:no|num(?:ber)?|id)?\b/;

/**
 * Extract Maya transaction ID.
 * Maya IDs are typically 12 alphanumeric characters but format varies.
 *
 * Strategy:
 *  1. Find a line with a Maya-style label.
 *  2. Extract alphanumeric ID (8–20 chars) from same line or next line.
 *  3. Fallback: 12-digit run anywhere.
 */
function extractMayaRef(rawLines: string[]): string | null {
  const normLines = rawLines.map(normLine);

  for (let i = 0; i < normLines.length; i++) {
    if (!MAYA_LABEL_RE.test(normLines[i])) continue;

    // (a) Same line after label
    const afterLabel = rawLines[i]
      .replace(new RegExp(MAYA_LABEL_RE.source, "i"), "")
      .replace(/^[\s:.\-#]+/, "")
      .trim();
    if (afterLabel) {
      const m = afterLabel.match(/\b([A-Z0-9]{8,20})\b/i);
      if (m) return m[1];
    }

    // (b) Next 1–2 lines
    for (let j = i + 1; j <= Math.min(i + 2, rawLines.length - 1); j++) {
      const candidate = rawLines[j].trim();
      if (!candidate) continue;
      if (GCASH_LABEL_RE.test(normLine(candidate)) || MAYA_LABEL_RE.test(normLine(candidate))) break;
      const mWhole = candidate.match(/^([A-Z0-9]{8,20})$/i);
      if (mWhole) return mWhole[1];
      const mPart = candidate.match(/\b([A-Z0-9]{8,20})\b/i);
      if (mPart) return mPart[1];
      break;
    }
  }

  // Fallback: 12-digit run
  const joined = rawLines.join("\n");
  const m12 = joined.match(/(?<!\d)(\d{12})(?!\d)/);
  if (m12) return m12[1];

  // Generic: 10–16 digit run
  const gen = joined.match(/(?<!\d)(\d{10,16})(?!\d)/);
  return gen ? gen[1] : null;
}

// ── Generic fallback (unknown provider) ──────────────────────────

/**
 * Generic label patterns covering all possible reference field names.
 * Used when provider is unknown.
 */
const GENERIC_LABEL_RE = new RegExp([
  "gcash\\s*ref(?:erence)?(?:\\s*(?:no\\.?|id|number|num))?",
  "(?:pay)?maya\\s*ref(?:erence)?(?:\\s*(?:no\\.?|id|number|num))?",
  "gcash\\s*transaction\\s*(?:id|no\\.?|number|num)?",
  "(?:pay)?maya\\s*transaction\\s*(?:id|no\\.?|number|num)?",
  "transaction\\s*ref(?:erence)?(?:\\s*(?:no\\.?|id|number|num))?",
  "transaction\\s*(?:id|no\\.?|number|num|code|ref)",
  "txn\\s*(?:id|no\\.?|number|num|ref)?",
  "trx\\s*(?:id|no\\.?|number|num|ref)?",
  "payment\\s*(?:transaction\\s*)?ref(?:erence)?(?:\\s*(?:no\\.?|id|number|num))?",
  "payment\\s*(?:id|no\\.?|number|num|code)",
  "confirmation\\s*(?:ref(?:erence)?\\s*)?(?:id|no\\.?|number|num|code)?",
  "confirm(?:ation)?\\s*(?:id|no\\.?|number|code)?",
  "receipt\\s*(?:ref(?:erence)?\\s*)?(?:id|no\\.?|number|num)?",
  "reference\\s*(?:no\\.?|id|number|num|#|code)?",
  "ref\\.?\\s*(?:no\\.?|id|number|num|#|code)",
  "ref\\s+(?:no\\.?|id|number|num|#|code)",
].join("|"));

function extractGenericRef(rawLines: string[]): string | null {
  const normLines = rawLines.map(normLine);

  for (let i = 0; i < normLines.length; i++) {
    if (!GENERIC_LABEL_RE.test(normLines[i])) continue;

    const afterLabel = rawLines[i]
      .replace(new RegExp(GENERIC_LABEL_RE.source, "i"), "")
      .replace(/^[\s:.\-#]+/, "")
      .trim();
    if (afterLabel) {
      // Try 13-digit first (most common for GCash)
      const m13 = collapseSpaces(afterLabel).match(/\d{13}/);
      if (m13) return m13[0];
      const m = afterLabel.match(/\b([A-Z0-9]{8,20})\b/i);
      if (m) return m[1];
    }

    for (let j = i + 1; j <= Math.min(i + 2, rawLines.length - 1); j++) {
      const candidate = rawLines[j].trim();
      if (!candidate) continue;
      if (GENERIC_LABEL_RE.test(normLine(candidate))) break;
      const m13 = collapseSpaces(candidate).match(/\d{13}/);
      if (m13) return m13[0];
      const mWhole = candidate.match(/^([A-Z0-9]{8,20})$/i);
      if (mWhole) return mWhole[1];
      const mPart = candidate.match(/\b([A-Z0-9]{8,20})\b/i);
      if (mPart) return mPart[1];
      break;
    }
  }

  // Digit fallbacks
  const joined = rawLines.join("\n");
  const m13 = joined.match(/(?<!\d)(\d{13})(?!\d)/);
  if (m13) return m13[1];
  const m12 = joined.match(/(?<!\d)(\d{12})(?!\d)/);
  if (m12) return m12[1];
  const gen = joined.match(/(?<!\d)(\d{10,16})(?!\d)/);
  return gen ? gen[1] : null;
}

// ── Main extractor (provider-aware) ──────────────────────────────

function extractReferenceId(text: string, method: string | null): string | null {
  const rawLines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);

  if (method === "GCash") return extractGCashRef(rawLines);
  if (method === "Maya") return extractMayaRef(rawLines);

  // Unknown provider: try GCash first (13-digit), then Maya, then generic
  return extractGenericRef(rawLines);
}

// ── Amount & date extractors ──────────────────────────────────────

function extractAmount(text: string): number | null {
  const lines = text.split(/\n|\r/);
  for (const line of lines) {
    if (/total|amount|paid|bayad/i.test(line)) {
      const m = line.match(/[₱P]?(\d{1,6}(?:[.,]\d{2})?)/);
      if (m) return parseFloat(m[1].replace(",", "."));
    }
  }
  const m = text.match(/[₱P]\s*(\d{1,6}(?:[.,]\d{2})?)/);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

function extractDate(text: string): string | null {
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

function confidence(referenceId: string | null, amount: number | null, date: string | null, method: string | null): number {
  let score = 0;
  if (referenceId) score += 0.5;
  if (amount)      score += 0.2;
  if (date)        score += 0.15;
  if (method)      score += 0.15;
  return score;
}

// ── Main handler ──────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await client.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

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
    return json({
      referenceId: null, amount: null, date: null,
      method: hintedMethod ?? null, rawText: "", confidence: 0,
      message: "Receipt scan unavailable right now. Please enter your Reference ID manually.",
      _visionError: err,
    });
  }

  const visionData = await visionRes.json();
  const rawText: string = visionData.responses?.[0]?.fullTextAnnotation?.text ?? "";

  if (!rawText) {
    return json({
      referenceId: null, amount: null, date: null,
      method: hintedMethod ?? null, rawText: "", confidence: 0,
      message: "No text detected in image. Please ensure the receipt is clear and well-lit.",
    });
  }

  // Provider-aware extraction
  const detectedMethod = detectMethod(rawText) ?? (hintedMethod as "GCash" | "Maya" | null) ?? null;
  const referenceId = extractReferenceId(rawText, detectedMethod);
  const amount      = extractAmount(rawText);
  const date        = extractDate(rawText);
  const conf        = confidence(referenceId, amount, date, detectedMethod);

  console.log("OCR rawText:", rawText);
  console.log("Detected method:", detectedMethod, "| Ref ID:", referenceId);

  return json({
    referenceId,
    amount,
    date,
    method: detectedMethod,
    rawText,
    confidence: conf,
  });
});
