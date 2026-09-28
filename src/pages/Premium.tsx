import { useState, useEffect, useCallback } from "react";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  Crown, Check, Upload, X, Loader2, Shield, Building2, Star, Zap,
  Trophy, Rocket, Flame, ScanLine, AlertCircle, CheckCircle2, Edit3,
} from "lucide-react";

interface PaymentMethod {
  id: string;
  label: string;
  icon: string;
  number: string;
  name: string;
  qrUrl?: string;
}

interface OcrResult {
  referenceId: string | null;
  amount: number | null;
  date: string | null;
  method: string | null;
  rawText: string;
  confidence: number;
  message?: string;
}

// ── Feature lists ─────────────────────────────────────────────────
const USER_FREE = [
  "Discover People", "Community", "Basic Hidden Gems",
  "Basic Map", "Featured Places", "Save places",
  "Browse experiences", "View businesses", "Browse bookings",
];
const USER_PLUS = [
  "🏆 Founding Explorer badge on your profile",
  "⭐ Priority visibility in Discover Travelers",
  "🔍 Advanced traveler matching filters",
  "📌 Organize saved places into collections",
  "✈️ Personal trip planning tools",
  "💬 Priority in-app support",
  "🎨 Extra profile customization options",
  "🌟 Stand out with a Plus profile highlight",
];
const BIZ_FREE = [
  "Business profile", "Location on map", "Photos",
  "Description", "Opening hours", "Contact info",
  "Basic reviews", "Appear in search", "Receive inquiries",
];
const BIZ_STARTER = [
  "Business profile",
  "Map listing",
  "Photos",
  "Contact information",
  "Reviews",
  "Basic booking",
  "Basic inquiries",
];
const BIZ_PLUS = [
  "⭐ Featured Business badge",
  "📍 Priority map placement",
  "💎 Appear in Featured section",
  "🎟️ Create promotions/offers",
  "📸 More photos",
  "📊 Business analytics",
  "👥 Basic customer interest stats",
  "🔗 Social media links",
  "📅 Create bookable experiences",
  "🎫 Manage bookings",
  "📢 Promotional posts",
  "💬 Priority inquiries",
  "🏆 Founding Business badge",
];
const BIZ_PRO = [
  "⭐ Higher featured visibility",
  "📍 Enhanced map placement",
  "🎟️ Unlimited promotions",
  "🚌 Solo / Duo / Group booking options",
  "📅 Booking management dashboard",
  "📊 Advanced analytics",
  "💎 Exclusive Hidden Gems placement",
  "📢 Promotional campaigns",
  "🖼️ More photos & videos",
  "💬 Priority customer inquiries",
  "🏷️ Special deals for TCUnnect users",
];

type Step = "plans" | "payment" | "upload" | "done";
type PlanId = "plus-lifetime" | "biz-starter" | "biz-founding" | "biz-pro";

const PLAN_INFO: Record<PlanId, { label: string; price: string; amount: number; color: string; gradient: string }> = {
  "plus-lifetime": { label: "TCUnnect Plus (Lifetime)", price: "₱30",       amount: 30,  color: "text-amber-600",   gradient: "from-amber-500 to-orange-500" },
  "biz-starter":   { label: "Business Starter (1 mo)", price: "₱99",        amount: 99,  color: "text-sky-600",     gradient: "from-sky-500 to-blue-500" },
  "biz-founding":  { label: "Founding Business",        price: "₱199/month", amount: 199, color: "text-emerald-600", gradient: "from-emerald-500 to-teal-500" },
  "biz-pro":       { label: "Business Pro",             price: "₱599/month", amount: 599, color: "text-violet-600",  gradient: "from-violet-500 to-purple-500" },
};

function FeatureList({ items, checkColor = "text-sky-600" }: { items: string[]; checkColor?: string }) {
  return (
    <ul className="space-y-2">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
          <Check className={`h-4 w-4 shrink-0 mt-0.5 ${checkColor}`} />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

function CountdownBanner() {
  return (
    <div className="bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-2xl p-4 mb-6 flex items-center gap-3 shadow-lg shadow-orange-200">
      <Flame className="h-7 w-7 shrink-0 animate-pulse" />
      <div className="flex-1">
        <p className="font-black text-sm">🎪 TECHNOPRENEURSHIP DAY — LAUNCH OFFER</p>
        <p className="text-xs text-orange-100 mt-0.5">These special prices are available <strong>only during today's event</strong>. Don't miss it!</p>
      </div>
    </div>
  );
}

/** Convert a File to base64 string (without data: prefix) */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip "data:<mime>;base64," prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Premium() {
  const { user } = useAuthStore();
  const [step, setStep]                         = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan]         = useState<PlanId>("plus-lifetime");
  const [paymentMethod, setPaymentMethod]       = useState("gcash");
  const [receiptFile, setReceiptFile]           = useState<File | null>(null);
  const [isScanning, setIsScanning]             = useState(false);
  const [isProcessing, setIsProcessing]         = useState(false);
  const [submitError, setSubmitError]           = useState("");
  const [ocrResult, setOcrResult]               = useState<OcrResult | null>(null);
  const [ocrError, setOcrError]                 = useState("");
  const [referenceIdInput, setReferenceIdInput] = useState("");
  const [previewUrl, setPreviewUrl]             = useState<string | null>(null);
  const [refIdMode, setRefIdMode]               = useState<"scan" | "manual" | null>(null);
  const [paymentMethods, setPaymentMethods]     = useState<PaymentMethod[]>([
    { id: "gcash", label: "GCash", icon: "💙", number: "09XX XXX XXXX", name: "TCUnnect Official" },
    { id: "maya",  label: "Maya",  icon: "💚", number: "09XX XXX XXXX", name: "TCUnnect Official" },
  ]);

  // Load real payment numbers from platform_settings
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from("platform_settings")
      .select("gcash_number, maya_number, account_name, gcash_qr_url, maya_qr_url")
      .eq("id", true)
      .single()
      .then(({ data }) => {
        if (data) {
          setPaymentMethods([
            { id: "gcash", label: "GCash", icon: "💙", number: data.gcash_number, name: data.account_name, qrUrl: data.gcash_qr_url || "" },
            { id: "maya",  label: "Maya",  icon: "💚", number: data.maya_number,  name: data.account_name, qrUrl: data.maya_qr_url  || "" },
          ]);
        }
      });
  }, []);

  /** Auto-scan receipt via Edge Function after file selection */
  const scanReceipt = useCallback(async (file: File) => {
    if (!isSupabaseConfigured || !user) return;

    setIsScanning(true);
    setOcrError("");
    setOcrResult(null);
    setReferenceIdInput("");

    try {
      const imageBase64 = await fileToBase64(file);
      const methodLabel = paymentMethod === "gcash" ? "GCash" : "Maya";

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      // Get the Supabase project URL for Edge Functions
      const supabaseUrl = (supabase as any).supabaseUrl as string;
      const functionUrl = `${supabaseUrl}/functions/v1/scan-receipt`;

      const res = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageBase64,
          mimeType: file.type,
          method: methodLabel,
        }),
      });

      const result: OcrResult & { error?: string } = await res.json();

      if (!res.ok || result.error) {
        setOcrError(result.error ?? "OCR failed. You can enter the Reference ID manually.");
        setIsScanning(false);
        return;
      }

      setOcrResult(result);
      // Pre-fill reference ID if OCR found it
      if (result.referenceId) {
        setReferenceIdInput(result.referenceId);
      }

      if (!result.referenceId) {
        setOcrError("Couldn't extract Reference ID automatically. Please enter it from your receipt.");
      }
    } catch (e) {
      console.error("OCR error:", e);
      setOcrError("Receipt scan failed. Please enter the Reference ID manually.");
    }

    setIsScanning(false);
  }, [paymentMethod, user]);

  // Revoke old preview URL when file changes
  useEffect(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [receiptFile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (file: File | null) => {
    setReceiptFile(file);
    setOcrResult(null);
    setOcrError("");
    setReferenceIdInput("");
    setRefIdMode(null);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!receiptFile || !user) return;

    const refId = referenceIdInput.trim();
    if (!refId) {
      setSubmitError("Reference ID is required. Check your GCash/Maya receipt for the Ref No.");
      return;
    }

    setIsProcessing(true);
    setSubmitError("");

    try {
      let receiptUrl: string | null = null;

      if (isSupabaseConfigured) {
        // 1. Upload receipt to Supabase Storage
        const ext  = receiptFile.name.split(".").pop() ?? "jpg";
        const path = `receipts/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("payment-receipts")
          .upload(path, receiptFile, { contentType: receiptFile.type, upsert: true });

        if (uploadError) {
          console.error("Receipt upload error:", uploadError.message);
          // Non-fatal — continue without receipt URL
        } else {
          const { data: urlData } = supabase.storage.from("payment-receipts").getPublicUrl(path);
          receiptUrl = urlData.publicUrl;
        }

        // 2. Check for duplicate reference_id
        const { data: existing } = await supabase
          .from("payments")
          .select("id")
          .eq("reference_id", refId)
          .maybeSingle();

        if (existing) {
          setSubmitError(
            `A payment with Reference ID "${refId}" was already submitted. ` +
            `If you think this is a mistake, contact support.`
          );
          setIsProcessing(false);
          return;
        }

        // 3. Insert payment record with reference_id and ocr_data
        const plan = PLAN_INFO[selectedPlan];
        const { error: insertError } = await supabase.from("payments").insert({
          user_id:     user.id,
          plan_id:     selectedPlan,
          plan_label:  plan.label,
          amount:      plan.amount,
          method:      paymentMethod === "gcash" ? "GCash" : "Maya",
          receipt_url: receiptUrl,
          reference_id: refId,
          ocr_data:    ocrResult ? {
            rawText:    ocrResult.rawText,
            confidence: ocrResult.confidence,
            extracted:  {
              referenceId: ocrResult.referenceId,
              amount:      ocrResult.amount,
              date:        ocrResult.date,
              method:      ocrResult.method,
            },
          } : null,
          status: "pending",
        });

        if (insertError) {
          console.error("Payment insert error:", insertError);
          setSubmitError(`Failed to submit payment: ${insertError.message}`);
          setIsProcessing(false);
          return;
        }
      }

      setIsProcessing(false);
      setStep("done");
    } catch (e) {
      console.error("Submit error:", e);
      setSubmitError("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  const selectAndPay = (plan: PlanId) => {
    setSelectedPlan(plan);
    setStep("payment");
  };

  // ── Done screen ───────────────────────────────────────────────
  if (step === "done") {
    const isLifetime = selectedPlan === "plus-lifetime";
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            {isLifetime ? <Trophy className="h-10 w-10 text-amber-500" /> : <Crown className="h-10 w-10 text-amber-500" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isLifetime ? "Welcome, Founding Explorer! 🏆" : "Payment Submitted! 🎉"}
          </h1>
          <p className="text-slate-500 text-sm mb-2">
            Your <strong>{PLAN_INFO[selectedPlan].label}</strong> receipt has been sent for admin review.
          </p>
          <p className="text-xs text-slate-400 mb-8">You'll be notified once your payment is verified and your plan is activated — usually within 24 hours.</p>
          <button onClick={() => window.history.back()} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition">
            Back to Exploring ✨
          </button>
        </div>
      </AppShell>
    );
  }

  // ── Payment / Upload screen ───────────────────────────────────
  if (step === "payment" || step === "upload") {
    const info = PLAN_INFO[selectedPlan];
    const pm   = paymentMethods.find(p => p.id === paymentMethod)!;
    const isLifetime = selectedPlan === "plus-lifetime";

    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Plan summary */}
          <div className={`bg-gradient-to-r ${info.gradient} rounded-2xl p-5 text-white mb-6 shadow-lg`}>
            {isLifetime && (
              <span className="inline-block text-xs bg-white/20 rounded-full px-2.5 py-0.5 font-bold mb-2">
                🎪 TECHNOPRENEURSHIP DAY OFFER
              </span>
            )}
            <p className="text-white/80 text-xs font-medium mb-0.5">Subscribing to</p>
            <h2 className="text-xl font-bold">{info.label}</h2>
            <p className="text-3xl font-black mt-1">{info.price}</p>
            {selectedPlan === "biz-founding" && (
              <p className="text-xs text-white/70 mt-1">First 3 months · then ₱299/month</p>
            )}
            {isLifetime && (
              <p className="text-xs text-white/70 mt-1">One payment · Lifetime access 🏆</p>
            )}
          </div>

          {step === "payment" && (
            <>
              <h3 className="font-bold text-slate-900 mb-1">Choose Payment</h3>
              <p className="text-slate-500 text-sm mb-4">Send the exact amount to one of these accounts</p>
              <div className="space-y-3 mb-5">
                {paymentMethods.map((p) => (
                  <button key={p.id} onClick={() => setPaymentMethod(p.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                      paymentMethod === p.id ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-sky-200"
                    }`}>
                    <span className="text-3xl">{p.icon}</span>
                    <div className="text-left flex-1">
                      <p className="font-bold text-slate-900">{p.label}</p>
                      <p className="text-sm text-slate-600">{p.number}</p>
                      <p className="text-xs text-slate-400">Account name: {p.name}</p>
                    </div>
                    {paymentMethod === p.id && <Check className="h-5 w-5 text-sky-500" />}
                  </button>
                ))}
              </div>
              {/* QR Code for selected payment method */}
              {pm.qrUrl && (
                <div className="flex flex-col items-center bg-white border-2 border-slate-200 rounded-2xl p-5 mb-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    {pm.label} QR Code — Scan to Pay
                  </p>
                  <img
                    src={pm.qrUrl}
                    alt={`${pm.label} QR code`}
                    className="w-52 h-52 object-contain rounded-xl border border-slate-100"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    Scan with your <strong>{pm.label}</strong> app · Pay <strong>{info.price.replace("/month", "")}</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">To: {pm.name}</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <p className="text-sm font-bold text-amber-800 mb-2">How to pay:</p>
                <ol className="text-xs text-amber-700 space-y-1 list-decimal pl-4">
                  <li>Open your {pm.label} app</li>
                  {pm.qrUrl
                    ? <li>Scan the QR code above <strong>or</strong> send to <strong>{pm.number}</strong></li>
                    : <li>Send <strong>{info.price.replace("/month", "")}</strong> to <strong>{pm.number}</strong></li>
                  }
                  <li>Screenshot your receipt — it will be <strong>automatically scanned</strong></li>
                  <li>Verify the extracted details and submit</li>
                </ol>
              </div>
              <button onClick={() => setStep("upload")}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition">
                I've Sent the Payment →
              </button>
              <button onClick={() => setStep("plans")} className="w-full text-slate-400 text-sm py-2 mt-2">← Back</button>
            </>
          )}

          {step === "upload" && (
            <>
              {/* Step header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  <span className="text-sky-700 font-black text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">Upload your receipt</h3>
                  <p className="text-xs text-slate-400">Take a screenshot of your {paymentMethod === "gcash" ? "GCash" : "Maya"} transaction</p>
                </div>
              </div>

              {/* ── PHASE 1: Upload zone (always shown when no file) ── */}
              {!receiptFile && (
                <label className="relative flex flex-col items-center justify-center w-full min-h-[160px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50 cursor-pointer transition-all mb-5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center gap-2 py-8">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">Tap to upload receipt</p>
                    <p className="text-xs text-slate-400">PNG · JPG · Screenshot</p>
                  </div>
                </label>
              )}

              {/* ── PHASE 2: Receipt preview (shown after upload) ── */}
              {receiptFile && previewUrl && (
                <div className="mb-5">
                  {/* Preview image */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-300 bg-emerald-50 mb-2">
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="w-full max-h-72 object-contain bg-white"
                    />
                    {/* Remove / replace overlay */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <label className="flex items-center gap-1 bg-white/90 hover:bg-white border border-slate-200 text-xs text-slate-600 font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer shadow-sm transition">
                        <Upload className="h-3 w-3" /> Replace
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                          className="sr-only"
                        />
                      </label>
                      <button
                        onClick={() => handleFileChange(null)}
                        className="flex items-center gap-1 bg-white/90 hover:bg-red-50 border border-slate-200 hover:border-red-300 text-xs text-red-500 font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition"
                      >
                        <X className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">{receiptFile.name}</p>
                </div>
              )}

              {/* ── PHASE 3: Choose Ref ID method (shown after upload, before choice) ── */}
              {receiptFile && !refIdMode && (
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-700 mb-3 text-center">
                    How would you like to get the Reference ID?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setRefIdMode("scan");
                        if (receiptFile) scanReceipt(receiptFile);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-sky-200 bg-sky-50 hover:bg-sky-100 hover:border-sky-400 transition text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                        <ScanLine className="h-5 w-5 text-sky-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-sky-800">Scan Receipt</p>
                        <p className="text-[10px] text-sky-500 mt-0.5 leading-relaxed">Auto-detect Ref No. using OCR</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setRefIdMode("manual")}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Edit3 className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700">Enter Manually</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Type your Ref No. from receipt</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* ── PHASE 4A: Scanning state ── */}
              {refIdMode === "scan" && isScanning && (
                <div className="flex flex-col items-center gap-3 py-6 mb-5 rounded-2xl bg-sky-50 border border-sky-200">
                  <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center">
                    <ScanLine className="h-6 w-6 text-sky-600 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-sky-700">Scanning receipt…</p>
                    <p className="text-xs text-sky-400 mt-0.5">Extracting Ref No., amount &amp; date</p>
                  </div>
                </div>
              )}

              {/* ── PHASE 4A: Scan results ── */}
              {refIdMode === "scan" && !isScanning && ocrResult && (
                <div className={`rounded-2xl border p-4 mb-4 ${
                  ocrResult.confidence >= 0.5 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {ocrResult.confidence >= 0.5
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                    <span className={`text-xs font-bold ${ocrResult.confidence >= 0.5 ? "text-emerald-700" : "text-amber-700"}`}>
                      {ocrResult.confidence >= 0.5 ? "Receipt scanned successfully" : "Partial scan — please verify below"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {ocrResult.method && (
                      <div className="bg-white rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Method</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{ocrResult.method}</p>
                      </div>
                    )}
                    {ocrResult.amount != null && (
                      <div className="bg-white rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Amount</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">₱{ocrResult.amount.toFixed(2)}</p>
                      </div>
                    )}
                    {ocrResult.date && (
                      <div className="bg-white rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Date</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">
                          {new Date(ocrResult.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setRefIdMode(null); setOcrResult(null); setOcrError(""); setReferenceIdInput(""); }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 transition underline"
                  >
                    ← Change method
                  </button>
                </div>
              )}

              {/* OCR error */}
              {refIdMode === "scan" && !isScanning && ocrError && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-amber-700 leading-relaxed">{ocrError}</p>
                    <button
                      onClick={() => { setRefIdMode(null); setOcrError(""); setReferenceIdInput(""); }}
                      className="text-[10px] text-amber-600 underline mt-1"
                    >
                      Try another method
                    </button>
                  </div>
                </div>
              )}

              {/* ── PHASE 4: Reference ID input (scan filled or manual) ── */}
              {receiptFile && (refIdMode === "manual" || (refIdMode === "scan" && !isScanning)) && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Reference ID <span className="text-red-500">*</span>
                    </label>
                    {refIdMode === "scan" && ocrResult?.referenceId && referenceIdInput && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                        <ScanLine className="h-3 w-3" /> Detected from scan
                      </span>
                    )}
                    {refIdMode === "manual" && (
                      <button
                        onClick={() => { setRefIdMode(null); setReferenceIdInput(""); }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 underline transition"
                      >
                        ← Back
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode={refIdMode === "manual" ? "text" : "numeric"}
                      value={referenceIdInput}
                      onChange={e => setReferenceIdInput(e.target.value)}
                      placeholder={paymentMethod === "gcash" ? "e.g. 1234567890123" : "e.g. TXN123ABC456"}
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm font-mono tracking-wider focus:outline-none transition ${
                        referenceIdInput
                          ? "border-emerald-400 bg-white text-slate-800"
                          : "border-slate-200 bg-white text-slate-800 focus:border-sky-400"
                      }`}
                    />
                    {referenceIdInput && (
                      <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    {paymentMethod === "gcash"
                      ? "13-digit GCash Ref No. — shown on your receipt as \"Ref No.\""
                      : "Maya transaction reference — shown as \"Reference\" or \"Transaction ID\""}
                  </p>
                  {refIdMode === "scan" && !referenceIdInput && !isScanning && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      OCR couldn't detect a Reference ID — type it from your receipt above
                    </p>
                  )}
                </div>
              )}

              {/* Submit error */}
              {submitError && (
                <div className="flex items-start gap-2.5 mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-relaxed">{submitError}</p>
                </div>
              )}

              {/* Admin note */}
              <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-5">
                <Shield className="h-4 w-4 shrink-0 mt-0.5 text-slate-300" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our admin team will verify your receipt within <strong>24 hours</strong> and activate your plan. You'll get a notification when it's done.
                </p>
              </div>

              {/* CTA — only enabled when reference ID is filled */}
              <button
                onClick={handleSubmit}
                disabled={!receiptFile || isProcessing || isScanning || !referenceIdInput.trim()}
                className="w-full bg-sky-600 hover:bg-sky-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-sky-200"
              >
                {isProcessing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  : <>Submit Receipt <span className="opacity-70">→</span></>}
              </button>

              {!referenceIdInput.trim() && receiptFile && !isScanning && refIdMode && (
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  Enter your Reference ID above to continue
                </p>
              )}

              <button onClick={() => setStep("payment")} className="w-full text-slate-400 text-xs py-3 mt-1 hover:text-slate-600 transition">
                ← Back to payment details
              </button>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  // ── Main plans page ───────────────────────────────────────────
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">TCUnnect Plans</h1>
          <p className="text-slate-500 text-sm mt-1">For travelers and businesses across the Philippines</p>
        </div>

        {/* 🔥 Promo Banner */}
        <CountdownBanner />

        {/* ── FOR TRAVELERS ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-3">
          <span className="h-7 w-7 bg-sky-100 rounded-lg flex items-center justify-center text-base">👤</span>
          <h2 className="font-bold text-slate-800">For Travelers</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900">Free</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">CURRENT</span>
            </div>
            <p className="text-3xl font-black text-slate-800 mb-4">₱0</p>
            <FeatureList items={USER_FREE} />
          </div>

          {/* TCUnnect Plus — Lifetime */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-400 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-bl-xl">
              🎪 LAUNCH DAY ONLY
            </div>
            <div className="flex items-center gap-2 mb-1 mt-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-slate-900">TCUnnect Plus</h3>
            </div>
            <div className="mb-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-amber-600">₱30</span>
                <span className="text-sm font-bold text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">LIFETIME</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-through">Regular: ₱30/month</p>
            </div>
            <p className="text-xs text-amber-700 font-semibold bg-amber-100 rounded-lg px-3 py-2 mb-4">
              🏆 Pay once. Enjoy Plus <strong>forever.</strong> Become a Founding Explorer — badge, priority visibility &amp; more.
            </p>
            <FeatureList items={USER_PLUS} checkColor="text-amber-500" />
            <button onClick={() => selectAndPay("plus-lifetime")}
              className="w-full mt-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-md shadow-amber-200">
              Become a Founding Explorer 🏆
            </button>
          </div>
        </div>

        {/* ── FOR BUSINESSES ────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-1 mt-2">
          <span className="h-7 w-7 bg-emerald-100 rounded-lg flex items-center justify-center text-base">🏢</span>
          <h2 className="font-bold text-slate-800">For Businesses</h2>
        </div>
        <p className="text-slate-500 text-sm mb-4">Put your business in front of travelers, students, couples, and local explorers.</p>

        <div className="grid gap-4 mb-4">
          {/* Business Free */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <h3 className="font-bold text-slate-900">Business Free</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Get discovered — no cost</p>
              </div>
              <p className="text-xl font-black text-slate-700">₱0</p>
            </div>
            <FeatureList items={BIZ_FREE} />
          </div>

          {/* 🎪 EVENT PLANS side by side */}
          <div className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 p-0.5 shadow-lg shadow-orange-200">
            <div className="bg-white rounded-[14px] overflow-hidden">
              <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-white" />
                <p className="text-white font-black text-sm">🎪 TECHNOPRENEURSHIP DAY — BUSINESS OFFERS</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 p-4">
                {/* Business Starter */}
                <div className="bg-sky-50 rounded-xl border border-sky-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-sky-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Business Starter</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Try TCUnnect for 1 month</p>
                  <div className="mb-3">
                    <span className="text-3xl font-black text-sky-600">₱99</span>
                    <span className="text-xs text-sky-500 ml-1">/ 1 month</span>
                  </div>
                  <FeatureList items={BIZ_STARTER} checkColor="text-sky-500" />
                  <button onClick={() => selectAndPay("biz-starter")}
                    className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 rounded-xl transition text-xs">
                    Get Starter
                  </button>
                </div>

                {/* Founding Business */}
                <div className="bg-emerald-50 rounded-xl border-2 border-emerald-400 p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg">
                    BEST VALUE
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Founding Business</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Business Plus · First 3 months</p>
                  <div className="mb-1">
                    <span className="text-3xl font-black text-emerald-600">₱199</span>
                    <span className="text-xs text-emerald-500 ml-1">/ month</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-1 line-through">Regular: ₱299/month</p>
                  <p className="text-xs text-emerald-700 font-semibold bg-emerald-100 rounded px-2 py-1 mb-3">
                    After 3 months → ₱299/month
                  </p>
                  <FeatureList items={BIZ_PLUS} checkColor="text-emerald-600" />
                  <button onClick={() => selectAndPay("biz-founding")}
                    className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-2 rounded-xl transition text-xs shadow-md shadow-emerald-200">
                    Become a Founding Business 🏆
                  </button>
                </div>
              </div>
              <p className="text-xs text-center text-slate-400 pb-3 px-4">
                🏆 Founding Business slots are <strong>limited</strong>. Only available during today's event.
              </p>
            </div>
          </div>

          {/* Business Pro */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border-2 border-violet-300 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-violet-600" />
                  <h3 className="font-bold text-slate-900">Business Pro</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">For businesses that want maximum visibility</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-violet-600">₱599</p>
                <p className="text-xs text-violet-500">per month</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3">Everything in Business Plus, plus:</p>
            <FeatureList items={BIZ_PRO} checkColor="text-violet-600" />
            <button onClick={() => selectAndPay("biz-pro")}
              className="w-full mt-5 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl transition text-sm">
              Get Business Pro
            </button>
          </div>

          {/* Business Partner */}
          <div className="bg-slate-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-slate-300" />
              <h3 className="font-bold">Business Partner</h3>
              <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded-full">Custom pricing</span>
            </div>
            <p className="text-slate-400 text-xs mb-3">For hotels, resorts, tour operators, travel agencies, multi-branch businesses</p>
            <ul className="space-y-1.5 text-sm text-slate-300 mb-5">
              {["Multiple locations", "Multiple staff accounts", "Advanced booking management", "Featured campaigns", "Custom promotions", "Partner offers & analytics", "Dedicated business support"].map(f => (
                <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-slate-500 shrink-0" />{f}</li>
              ))}
            </ul>
            <a href="mailto:alaokhemberly@gmail.com?subject=TCUnnect Business Partner Inquiry"
              className="block w-full text-center border border-slate-600 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">
              Contact Us →
            </a>
            <p className="text-xs text-slate-400 text-center mt-2">TCUnnect Admin: alaokhemberly@gmail.com</p>
          </div>
        </div>

        {/* Pricing summary table */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mt-2">
          <h3 className="font-bold text-slate-800 text-sm mb-3">📊 Pricing Summary</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className="text-left pb-2 font-semibold">Plan</th>
                <th className="text-right pb-2 font-semibold">Regular</th>
                <th className="text-right pb-2 font-semibold text-rose-600">🎪 Event Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 text-slate-700">TCUnnect Plus (Traveler)</td>
                <td className="py-2 text-right text-slate-400">₱30/month</td>
                <td className="py-2 text-right font-black text-amber-600">₱30 LIFETIME 💎</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-700">Business Starter</td>
                <td className="py-2 text-right text-slate-400">—</td>
                <td className="py-2 text-right font-black text-sky-600">₱99 / 1 mo</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-700">Founding Business</td>
                <td className="py-2 text-right text-slate-400">₱299/mo</td>
                <td className="py-2 text-right font-black text-emerald-600">₱199/mo × 3 🚀</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-700">Business Pro</td>
                <td className="py-2 text-right text-slate-600">₱599/mo</td>
                <td className="py-2 text-right text-slate-400">₱599/mo</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </AppShell>
  );
}
