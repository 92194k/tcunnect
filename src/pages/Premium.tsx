import { useState } from "react";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { Crown, Check, Upload, X, Loader2, Shield, Building2, Star, Zap, ChevronDown, ChevronUp } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "gcash", label: "GCash", icon: "💙", number: "09XX XXX XXXX", name: "TCUnnect Travel" },
  { id: "maya",  label: "Maya",  icon: "💚", number: "09XX XXX XXXX", name: "TCUnnect Travel" },
];

// ── User plans ──────────────────────────────────────────────────
const USER_FREE = [
  "Discover People", "Community", "Basic Hidden Gems",
  "Basic Map", "Featured Places", "Save places",
  "Browse experiences", "View businesses", "Browse bookings",
];
const USER_PLUS = [
  "⭐ Priority profile visibility",
  "💎 Exclusive Hidden Gems",
  "🗺️ Advanced map filters",
  "✈️ Mini Trip Planner",
  "📋 Personalized itineraries",
  "🔖 Unlimited saved places",
  "🎒 Extra destination info",
];

// ── Business plans ──────────────────────────────────────────────
const BIZ_FREE = [
  "Business profile", "Location on map", "Photos",
  "Description", "Opening hours", "Contact info",
  "Basic reviews", "Appear in search", "Receive inquiries",
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
type PlanId = "plus" | "biz-plus" | "biz-pro";

function PlanBadge({ label, color }: { label: string; color: string }) {
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

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

function Section({ title, emoji, children, defaultOpen = false }: { title: string; emoji: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left">
        <span className="text-xl">{emoji}</span>
        <span className="font-bold text-slate-900 flex-1">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-50">{children}</div>}
    </div>
  );
}

export default function Premium() {
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("plus");
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const planInfo: Record<PlanId, { label: string; price: string; color: string }> = {
    "plus":     { label: "TCUnnect Plus",  price: "₱30/month",  color: "text-amber-600" },
    "biz-plus": { label: "Business Plus",  price: "₱299/month", color: "text-sky-600" },
    "biz-pro":  { label: "Business Pro",   price: "₱599/month", color: "text-violet-600" },
  };

  const handleSubmit = async () => {
    if (!receiptFile) return;
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setIsProcessing(false);
    setStep("done");
  };

  if (step === "done") {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Crown className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Submitted! 🎉</h1>
          <p className="text-slate-500 text-sm mb-2">
            Your {planInfo[selectedPlan].label} receipt has been sent for admin review.
          </p>
          <p className="text-xs text-slate-400 mb-8">You'll be notified once your payment is verified and your plan is activated.</p>
          <button onClick={() => window.history.back()} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl transition">
            Back to Exploring ✨
          </button>
        </div>
      </AppShell>
    );
  }

  if (step === "payment" || step === "upload") {
    const pm = PAYMENT_METHODS.find(p => p.id === paymentMethod)!;
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Plan summary */}
          <div className="bg-gradient-to-r from-sky-600 to-sky-500 rounded-2xl p-5 text-white mb-6 shadow-lg shadow-sky-200">
            <p className="text-sky-100 text-xs font-medium mb-1">Subscribing to</p>
            <h2 className="text-xl font-bold">{planInfo[selectedPlan].label}</h2>
            <p className="text-2xl font-black mt-1">{planInfo[selectedPlan].price}</p>
          </div>

          {step === "payment" && (
            <>
              <h3 className="font-bold text-slate-900 mb-1">Choose Payment</h3>
              <p className="text-slate-500 text-sm mb-4">Send the exact amount to one of these accounts</p>
              <div className="space-y-3 mb-5">
                {PAYMENT_METHODS.map((p) => (
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <p className="text-sm font-bold text-amber-800 mb-2">How to pay:</p>
                <ol className="text-xs text-amber-700 space-y-1 list-decimal pl-4">
                  <li>Open your {pm.label} app</li>
                  <li>Send <strong>{planInfo[selectedPlan].price.replace("/month", "")}</strong> to <strong>{pm.number}</strong></li>
                  <li>Screenshot your receipt</li>
                  <li>Upload it on the next screen</li>
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
              <h3 className="font-bold text-slate-900 mb-1">Upload Receipt</h3>
              <p className="text-slate-500 text-sm mb-5">Screenshot of your {pm.label} transaction</p>
              <label className={`block w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition mb-4 ${
                receiptFile ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-sky-300 hover:bg-sky-50"
              }`}>
                <input type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} className="sr-only" />
                {receiptFile ? (
                  <div>
                    <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-700">{receiptFile.name}</p>
                    <p className="text-xs text-emerald-500 mt-1">Ready to submit</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">Tap to upload receipt</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, or screenshot</p>
                  </div>
                )}
              </label>
              {receiptFile && (
                <button onClick={() => setReceiptFile(null)} className="flex items-center gap-1 text-xs text-slate-400 mb-4">
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              )}
              <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3 mb-5 text-xs text-slate-500">
                <Shield className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                Our admin team will verify your receipt within 24 hours and activate your plan.
              </div>
              <button onClick={handleSubmit} disabled={!receiptFile || isProcessing}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit Receipt"}
              </button>
              <button onClick={() => setStep("payment")} className="w-full text-slate-400 text-sm py-2 mt-2">← Back</button>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  // ── Main plans page ──────────────────────────────────────────
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">TCUnnect Pricing</h1>
          <p className="text-slate-500 text-sm mt-1">For travelers and businesses across the Philippines</p>
        </div>

        {/* ── FOR USERS ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-3">
          <span className="h-7 w-7 bg-sky-100 rounded-lg flex items-center justify-center">👤</span>
          <h2 className="font-bold text-slate-800">For Users</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900">Free</h3>
              <PlanBadge label="CURRENT" color="bg-slate-100 text-slate-600" />
            </div>
            <p className="text-3xl font-black text-slate-800 mb-4">₱0</p>
            <FeatureList items={USER_FREE} />
          </div>

          {/* TCUnnect Plus */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[10px] font-black px-3 py-1 rounded-bl-xl">POPULAR</div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-slate-900">TCUnnect Plus</h3>
            </div>
            <p className="text-3xl font-black text-amber-600 mb-1">₱30</p>
            <p className="text-xs text-amber-600 mb-4">per month</p>
            <FeatureList items={USER_PLUS} checkColor="text-amber-500" />
            <button
              onClick={() => { setSelectedPlan("plus"); setStep("payment"); }}
              className="w-full mt-5 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition text-sm">
              Get TCUnnect Plus 👑
            </button>
          </div>
        </div>

        {/* ── FOR BUSINESSES ─────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-3 mt-6">
          <span className="h-7 w-7 bg-emerald-100 rounded-lg flex items-center justify-center">🏢</span>
          <h2 className="font-bold text-slate-800">For Businesses</h2>
        </div>
        <p className="text-slate-500 text-sm mb-4">Put your business in front of students, travelers, groups, couples, and local explorers.</p>

        <div className="grid gap-4 mb-4">
          {/* Business Free */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <h3 className="font-bold text-slate-900">Business Free</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">For businesses that simply want to be discoverable</p>
              </div>
              <p className="text-xl font-black text-slate-700">₱0</p>
            </div>
            <div className="mt-3">
              <FeatureList items={BIZ_FREE} />
            </div>
          </div>

          {/* Business Plus */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl border-2 border-sky-300 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-sky-600" />
                  <h3 className="font-bold text-slate-900">Business Plus</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Get discovered by more people</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-sky-600">₱299</p>
                <p className="text-xs text-sky-500">per month</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3">Everything in Free, plus:</p>
            <FeatureList items={BIZ_PLUS} checkColor="text-sky-600" />
            <button
              onClick={() => { setSelectedPlan("biz-plus"); setStep("payment"); }}
              className="w-full mt-5 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl transition text-sm">
              Get Business Plus
            </button>
          </div>

          {/* Business Pro */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border-2 border-violet-300 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-violet-600" />
                  <h3 className="font-bold text-slate-900">Business Pro</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">For businesses that actively want bookings & promotion</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-violet-600">₱599</p>
                <p className="text-xs text-violet-500">per month</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3">Everything in Business Plus, plus:</p>
            <FeatureList items={BIZ_PRO} checkColor="text-violet-600" />
            <button
              onClick={() => { setSelectedPlan("biz-pro"); setStep("payment"); }}
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
            <p className="text-slate-400 text-xs mb-3">For hotels, resorts, tour operators, travel agencies, large restaurants, event organizers, multi-branch businesses</p>
            <ul className="space-y-1.5 text-sm text-slate-300 mb-5">
              {["Multiple locations", "Multiple staff accounts", "Advanced booking management", "Featured campaigns", "Custom promotions", "Partner offers & analytics", "Dedicated business support"].map(f => (
                <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-slate-500 shrink-0" />{f}</li>
              ))}
            </ul>
            <button className="w-full border border-slate-600 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">
              Contact Us →
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
