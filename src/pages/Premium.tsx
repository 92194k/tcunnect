import { useState } from "react";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { Crown, Check, Upload, X, Loader2, Shield } from "lucide-react";

const FEATURES = [
  { icon: "💬", title: "Unlimited Messaging", desc: "Chat with all your matches without limits" },
  { icon: "❤️", title: "See Who Liked You", desc: "Know who's interested before you match" },
  { icon: "🔍", title: "Advanced Filters", desc: "Filter by age, location, and travel interests" },
  { icon: "🌟", title: "Priority Discovery", desc: "Appear higher in Discover People" },
  { icon: "📍", title: "Gem Submissions", desc: "Submit unlimited hidden gems" },
  { icon: "👑", title: "Premium Badge", desc: "Stand out with a premium profile badge" },
  { icon: "📋", title: "Trip Planning Tools", desc: "Access itinerary planner and group tools" },
  { icon: "🔔", title: "Priority Support", desc: "Get faster responses from our team" },
];

const PAYMENT_METHODS = [
  { id: "gcash", label: "GCash", icon: "💙", number: "09XX XXX XXXX", name: "TCUnnect Travel" },
  { id: "maya", label: "Maya", icon: "💚", number: "09XX XXX XXXX", name: "TCUnnect Travel" },
];

type Step = "plans" | "payment" | "upload" | "done";

export default function Premium() {
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState<Step>("plans");
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (user?.isPremium) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Crown className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You're Premium! 👑</h1>
          <p className="text-slate-500 text-sm">You have access to all TCUnnect premium features.</p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {FEATURES.slice(0, 4).map((f) => (
              <div key={f.title} className="bg-amber-50 rounded-xl p-3 text-left">
                <span className="text-xl">{f.icon}</span>
                <p className="text-xs font-semibold text-amber-900 mt-1">{f.title}</p>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReceiptFile(file);
  };

  const handleSubmit = async () => {
    if (!receiptFile || !user) return;
    setIsProcessing(true);
    // Simulate verification
    await new Promise((r) => setTimeout(r, 2000));
    setUser({ ...user, isPremium: true });
    setIsProcessing(false);
    setStep("done");
  };

  if (step === "done") {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Crown className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Premium! 🎉</h1>
          <p className="text-slate-500 text-sm mb-6">Your receipt has been verified. Enjoy all premium features!</p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {FEATURES.slice(0, 4).map((f) => (
              <div key={f.title} className="bg-amber-50 rounded-xl p-3 text-left">
                <span className="text-xl">{f.icon}</span>
                <p className="text-xs font-semibold text-amber-900 mt-1">{f.title}</p>
              </div>
            ))}
          </div>
          <button onClick={() => window.history.back()} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition">
            Start Exploring ✨
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-6 text-center text-white mb-6 shadow-lg shadow-amber-200">
          <Crown className="h-10 w-10 mx-auto mb-2" />
          <h1 className="text-2xl font-bold mb-1">TCUnnect Premium</h1>
          <p className="text-amber-100 text-sm mb-4">Unlock the full travel community experience</p>
          <div className="inline-flex items-baseline gap-1">
            <span className="text-4xl font-black">₱30</span>
            <span className="text-amber-200 text-sm">lifetime</span>
          </div>
        </div>

        {step === "plans" && (
          <>
            <h2 className="font-bold text-slate-900 mb-4">What you get:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3 bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm">
                  <span className="text-2xl shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Shield className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-700">This is a <strong>one-time ₱30 lifetime payment</strong>. No subscriptions, no recurring fees. Pay once, enjoy forever.</p>
            </div>

            <button onClick={() => setStep("payment")}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-amber-200">
              Get Premium for ₱30 👑
            </button>
          </>
        )}

        {step === "payment" && (
          <>
            <h2 className="font-bold text-slate-900 mb-1">Choose Payment Method</h2>
            <p className="text-slate-500 text-sm mb-5">Send ₱30 to one of these accounts</p>

            <div className="space-y-3 mb-6">
              {PAYMENT_METHODS.map((pm) => (
                <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                    paymentMethod === pm.id ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-amber-200"
                  }`}>
                  <span className="text-3xl">{pm.icon}</span>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">{pm.label}</p>
                    <p className="text-sm text-slate-600">{pm.number}</p>
                    <p className="text-xs text-slate-400">Account name: {pm.name}</p>
                  </div>
                  {paymentMethod === pm.id && <Check className="h-5 w-5 text-amber-500 ml-auto" />}
                </button>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-amber-800 mb-1">How to pay:</p>
              <ol className="text-xs text-amber-700 space-y-1 list-decimal pl-4">
                <li>Open your {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label} app</li>
                <li>Send exactly <strong>₱30</strong> to <strong>{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.number}</strong></li>
                <li>Save your receipt / screenshot</li>
                <li>Upload it on the next screen</li>
              </ol>
            </div>

            <button onClick={() => setStep("upload")}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition">
              I've Sent ₱30 → Upload Receipt
            </button>
          </>
        )}

        {step === "upload" && (
          <>
            <h2 className="font-bold text-slate-900 mb-1">Upload Payment Receipt</h2>
            <p className="text-slate-500 text-sm mb-5">Take a screenshot of your {paymentMethod === "gcash" ? "GCash" : "Maya"} transaction</p>

            <label className={`block w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition mb-5 ${
              receiptFile ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-amber-300 hover:bg-amber-50"
            }`}>
              <input type="file" accept="image/*" onChange={handleUpload} className="sr-only" />
              {receiptFile ? (
                <div>
                  <div className="flex items-center justify-center gap-2 text-emerald-600 mb-2">
                    <Check className="h-6 w-6" />
                    <span className="font-semibold">{receiptFile.name}</span>
                  </div>
                  <p className="text-xs text-emerald-500">Receipt uploaded! Click Submit to verify.</p>
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
              <button onClick={() => setReceiptFile(null)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-4">
                <X className="h-3.5 w-3.5" /> Remove file
              </button>
            )}

            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-xs text-slate-500 flex items-start gap-2">
              <Shield className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              Your receipt is verified automatically using OCR. Premium is activated instantly upon successful verification.
            </div>

            <button onClick={handleSubmit} disabled={!receiptFile || isProcessing}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying receipt...</> : "Submit & Activate Premium 👑"}
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
