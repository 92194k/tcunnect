import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Label patterns (all lowercase) ─────────────────────────────────────────
const REFERENCE_LABELS = [
  "ref no", "ref. no", "ref.no", "refno",
  "reference no", "reference no.", "reference number", "reference num",
  "ref id", "ref. id", "reference id",
  "transaction id", "transaction no", "transaction no.", "transaction number", "transaction num",
  "transaction ref", "transaction ref.",
  "transac id", "transac no", "transac no.", "transac number", "transac num",
  "txn id", "txn no", "txn no.",
  "payment reference", "payment ref", "payment id",
  "confirmation number", "confirmation no", "confirmation id",
  "trace no", "trace no.", "trace number", "trace id",
];

function looksLikeAmount(s: string): boolean {
  const n = parseFloat(s.replace(/,/g, ""));
  return !isNaN(n) && n < 10000 && s.includes(".");
}
function looksLikePhone(s: string): boolean {
  return /^09\d{9}$/.test(s) || /^639\d{9}$/.test(s);
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[:\-–—]/g, " ").replace(/\s+/g, " ").trim();
}

function extractReferenceNumber(ocrText: string): { ref: string | null; debug: string[] } {
  const debug: string[] = [];
  const flat = normalize(ocrText.replace(/\n/g, " "));
  const multiline = normalize(ocrText);
  debug.push(`OCR (flat): ${flat.substring(0, 400)}`);

  const candidates: Array<{ value: string; score: number; label: string }> = [];

  for (const label of REFERENCE_LABELS) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");
    const pattern = new RegExp(`${escaped}[\\s\\.:\\-]*([\\d\\s]{8,25})`, "i");

    for (const source of [flat, multiline]) {
      const match = source.match(pattern);
      if (match) {
        const raw = match[1].replace(/\s+/g, "").trim();
        if (raw.length >= 8 && raw.length <= 20 && !looksLikeAmount(raw) && !looksLikePhone(raw)) {
          const score =
            (raw.length >= 12 && raw.length <= 14 ? 30 : 10) +
            (label.startsWith("ref") ? 5 : 0) +
            5;
          debug.push(`LABEL: "${label}" → CANDIDATE: ${raw} (score ${score})`);
          candidates.push({ value: raw, score, label });
        }
      }
    }
  }

  // Fallback: any standalone 13-digit number
  if (candidates.length === 0) {
    const allNums = (ocrText.match(/\b\d[\d\s]{11,13}\d\b/g) ?? []).map((m) => m.replace(/\s+/g, ""));
    for (const num of allNums) {
      if (num.length === 13 && !looksLikePhone(num)) {
        debug.push(`FALLBACK 13-DIGIT: ${num}`);
        candidates.push({ value: num, score: 5, label: "fallback" });
      }
    }
  }

  if (candidates.length === 0) {
    debug.push("NO CANDIDATE FOUND");
    return { ref: null, debug };
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  debug.push(`SELECTED: ${best.value} via "${best.label}"`);
  return { ref: best.value, debug };
}

// ── Generate a Google OAuth2 access token from the service-account JSON ────
async function getGoogleAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Build JWT header.payload
  const encoder = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signingInput = `${header}.${body}`;

  // Import the private key
  const privateKeyPem = sa.private_key.replace(/\\n/g, "\n");
  const pemBody = privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
  const keyBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Sign
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(signingInput));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwt = `${signingInput}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

// ── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64 || !mediaType) {
      return new Response(JSON.stringify({ error: "Missing imageBase64 or mediaType" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const googleKeyJson = Deno.env.get("GOOGLE_VISION_KEY");
    if (!googleKeyJson) {
      return new Response(JSON.stringify({ error: "GOOGLE_VISION_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Get access token
    const accessToken = await getGoogleAccessToken(googleKeyJson);

    // Step 2: Call Google Cloud Vision OCR
    const visionRes = await fetch(
      "https://vision.googleapis.com/v1/images:annotate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
          }],
        }),
      }
    );

    const visionData = await visionRes.json();
    const ocrText = visionData.responses?.[0]?.fullTextAnnotation?.text ?? "";
    console.log("GOOGLE VISION OCR:", ocrText.substring(0, 500));

    if (!ocrText) {
      return new Response(JSON.stringify({ referenceNumber: "NONE", debug: ["Google Vision returned no text"] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Extract reference number from OCR text
    const { ref, debug } = extractReferenceNumber(ocrText);
    console.log("DEBUG:", debug.join(" | "));
    console.log("RESULT:", ref ?? "NONE");

    return new Response(
      JSON.stringify({ referenceNumber: ref ?? "NONE", ocrText, debug }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("scan-receipt error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
