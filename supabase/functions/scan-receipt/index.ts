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
 * Normalise a line of OCR text for label matching:
 * lowercase, collapse whitespace, remove trailing punctuation.
 */
function normalise(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").replace(/[.:,#\-_]+/g, " ").trim();
}

/**
 * Returns true if the normalised line looks like a reference-ID label.
 * Covers every variant the user listed plus common OCR mis-reads.
 */
function isRefLabel(norm: string): boolean {
  // Anchor patterns — the line must START with or purely BE one of these.
  const patterns = [
    // Reference / Ref variants
    /^ref(?:erence)?\s*(?:id|no|number|num|#|code)?$/,
    /^ref\s*\.\s*(?:id|no|number|num)?$/,
    // Transaction variants
    /^transaction\s*(?:id|no|number|num|ref(?:erence)?|code|reference\s*no|reference\s*number|ref\s*no)?$/,
    /^txn\s*(?:id|no|number|ref)?$/,
    /^trx\s*(?:id|no|number|ref)?$/,
    // Payment variants
    /^payment\s*(?:id|no|number|ref(?:erence)?|reference\s*(?:id|no|number)?|transaction\s*(?:id|no))?$/,
    // Confirmation variants
    /^confirmation\s*(?:id|no|number|code|ref(?:erence)?)?$/,
    /^confirm\s*(?:id|no|number|code)?$/,
    // Receipt variants
    /^receipt\s*(?:id|no|number|ref(?:erence)?|reference\s*no)?$/,
    // GCash-specific
    /^gcash\s*(?:ref(?:erence)?\s*(?:id|no|number)?|transaction\s*(?:id|no))?$/,
    // Maya / PayMaya-specific
    /^(?:pay)?maya\s*(?:ref(?:erence)?\s*(?:id|no|number)?|transaction\s*(?:id|no))?$/,
  ];
  return patterns.some(re => re.test(norm));
}

/**
 * Extract a reference/transaction ID from OCR text.
 * Strategy:
 *   1. Find lines whose content matches any known label.
 *   2. Look for the value on the same line (after the label) or the very next line.
 *   3. Fall back to method-specific digit-run heuristics.
 *
 * Never generates or invents a value — only returns text found in the receipt.
 */
function extractReferenceId(text: string, method: string): string | null {
  const rawLines = text.split(/[\n\r]+/);
  const lines = rawLines.map(l => l.trim());

  for (let i = 0; i < lines.length; i++) {
    const norm = normalise(lines[i]);
    if (!isRefLabel(norm)) continue;

    // Value may follow a colon/separator on the same line
    // e.g. "Ref No.: 1234567890123"  or  "Transaction ID 9876543210"
    const afterColon = lines[i].replace(/^[^:]+:?\s*/i, "").trim();
    if (afterColon) {
      // Match alphanumeric code (8–20 chars) — covers both numeric and mixed IDs
      const m = afterColon.match(/\b([A-Z0-9]{8,20})\b/i);
      if (m) return m[1];
    }

    // Value on the next non-empty line
    for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
      const candidate = lines[j].trim();
      if (!candidate) continue;
      const m = candidate.match(/^([A-Z0-9]{8,20})$/i) // whole line is the code
        ?? candidate.match(/\b([A-Z0-9]{8,20})\b/i);   // code embedded in line
      if (m) return m[1];
      break; // stop at first non-empty line after label
    }
  }

  // Fallback: method-specific digit-run heuristics
  if (method === "GCash") {
    const m = text.match(/\b(\d{13})\b/);
    if (m) return m[1];
  }
  if (method === "Maya") {
    const m = text.match(/\b(\d{12})\b/);
    if (m) return m[1];
  }
  // Generic: any 10–16 digit sequence
  const gen = text.match(/\b(\d{10,16})\b/);
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
