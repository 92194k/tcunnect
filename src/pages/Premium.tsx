import { useState } from "react";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { Crown, Check, Upload, X, Loader2, Shield, Building2, Star, Zap, Trophy, Rocket, Flame } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "gcash", label: "GCash", icon: "💙", number: "09XX XXX XXXX", name: "TCUnnect Travel" },
  { id: "maya",  label: "Maya",  icon: "💚", number: "09XX XXX XXXX", name: "TCUnnect Travel" },
];

// ── Feature lists ─────────────────────────────────────────────────
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
  "🏆 Founding Explorer badge",
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

const PLAN_INFO: Record<PlanId, { label: string; price: string; color: string; gradient: string }> = {
  "plus-lifetime": { label: "TCUnnect Plus (Lifetime)", price: "₱30",        color: "text-amber-600",  gradient: "from-amber-500 to-orange-500" },
  "biz-starter":   { label: "Business Starter (1 mo)", price: "₱99",         color: "text-sky-600",    gradient: "from-sky-500 to-blue-500" },
  "biz-founding":  { label: "Founding Business",        price: "₱199/month",  color: "text-emerald-600", gradient: "from-emerald-500 to-teal-500" },
  "biz-pro":       { label: "Business Pro",             price: "₱599/month",  color: "text-violet-600", gradient: "from-violet-500 to-purple-500" },
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

// ── Countdown timer (mock — replace with real end date) ──────────
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

export default function Premium() {
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("plus-lifetime");
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!receiptFile) return;
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setIsProcessing(false);
    setStep("done");
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
    const pm = PAYMENT_METHODS.find(p => p.id === paymentMethod)!;
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
                  <li>Send <strong>{info.price.replace("/month", "")}</strong> to <strong>{pm.number}</strong></li>
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
            {/* Promo ribbon */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-bl-xl">
              🎪 LAUNCH DAY ONLY
            </div>

            <div className="flex items-center gap-2 mb-1 mt-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-slate-900">TCUnnect Plus</h3>
            </div>

            {/* Pricing */}
            <div className="mb-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-amber-600">₱30</span>
                <span className="text-sm font-bold text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">LIFETIME</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-through">Regular: ₱30/month</p>
            </div>

            <p className="text-xs text-amber-700 font-semibold bg-amber-100 rounded-lg px-3 py-2 mb-4">
              🏆 Pay once. Enjoy Plus <strong>forever.</strong> Become a Founding Explorer.
            </p>

            <FeatureList items={USER_PLUS} checkColor="text-amber-500" />

            <button
              onClick={() => selectAndPay("plus-lifetime")}
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
                  <button
                    onClick={() => selectAndPay("biz-starter")}
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
                  <button
                    onClick={() => selectAndPay("biz-founding")}
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
            <button
              onClick={() => selectAndPay("biz-pro")}
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
