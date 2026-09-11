/**
 * TCUnnect PremiumView Component (UPDATED for QRPH Payments)
 *
 * This replaces the current PremiumView function in Dashboard.tsx
 * Copy the entire function and replace lines ~1635-1794
 */

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // Adjust path as needed
import {
  initiatePremiumCheckout,
  checkPremiumStatus,
  subscribeToPremiumStatus,
} from "../lib/api"; // Your new API client

function PremiumView({
  isPremium,
  onPurchase,
}: {
  isPremium: boolean;
  onPurchase: () => void;
}) {
  const [checkout, setCheckout] = useState(false);
  const [payment, setPayment] = useState<"gcash" | "maya" | "qrph">("qrph");
  const [redirecting, setRedirecting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Get current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUser(data.user);
      }
    });
  }, []);

  // Listen for real-time premium status updates (webhook confirmation)
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsub = subscribeToPremiumStatus(currentUser.id, (newPremiumStatus) => {
      if (newPremiumStatus && redirecting) {
        // Premium was activated by webhook!
        console.log("✅ Premium activated by webhook!");
        setRedirecting(false);
        setDone(true);
        setTimeout(() => {
          setCheckout(false);
          setDone(false);
          onPurchase(); // Trigger app-wide premium UI update
        }, 2000);
      }
    });

    setUnsubscribe(() => unsub);
    return () => unsub?.();
  }, [currentUser, redirecting, onPurchase]);

  /**
   * REAL PAYMENT FLOW
   * 1. Call backend to create QRPH payment
   * 2. Get checkout URL or QR code
   * 3. Redirect to QRPH or show QR
   * 4. QRPH redirects back after payment
   * 5. Webhook confirms payment → activates premium
   */
  async function handlePay() {
    try {
      if (!currentUser?.id) {
        setError("Please log in first");
        return;
      }

      setError(null);
      setRedirecting(true);

      console.log(`[PremiumView] Initiating ${payment} payment for user ${currentUser.id}`);

      // Call backend to create QRPH payment
      const { checkoutUrl, qrCode } = await initiatePremiumCheckout(
        currentUser.id,
        payment
      );

      console.log("[PremiumView] Got checkout URL:", !!checkoutUrl, "QR:", !!qrCode);

      // Option 1: Redirect to QRPH checkout
      if (checkoutUrl) {
        console.log("[PremiumView] Redirecting to QRPH checkout...");
        // Don't close modal - user will return via success_url
        window.location.href = checkoutUrl;
      }
      // Option 2: Show QR code (for future enhancement)
      else if (qrCode) {
        console.log("[PremiumView] Showing QR code");
        // TODO: Implement QR code modal
        setError("QR code payment not yet implemented in UI");
        setRedirecting(false);
      } else {
        setError("No payment method available");
        setRedirecting(false);
      }
    } catch (err) {
      console.error("[PremiumView] Payment error:", err);
      setError(err.message || "Payment error. Please try again.");
      setRedirecting(false);
    }
  }

  // Comparison table data
  const comparison = [
    ["Browse profiles", true, true],
    ["Like profiles", true, true],
    ["Anonymous Campus Feed", true, true],
    ["Messaging (after match)", true, true],
    ["See who liked you", false, true],
    ["See profile viewers", false, true],
    ["Unlimited likes & views", false, true],
    ["Instant notifications", false, true],
    ["Premium profile badge", false, true],
  ];

  return (
    <div>
      {/* CHECKOUT MODAL */}
      {checkout && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl slide-up">
            {done ? (
              // SUCCESS STATE
              <div className="text-center py-8">
                <div className="text-6xl mb-4 match-pop">🎉</div>
                <h3 className="text-2xl font-extrabold text-match font-display">
                  Welcome to Premium!
                </h3>
                <p className="text-slate-500 mt-2">You now have unlimited access.</p>
              </div>
            ) : redirecting ? (
              // LOADING/REDIRECTING STATE
              <div className="text-center py-12">
                <div className="w-10 h-10 mx-auto mb-4 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
                <h3 className="text-lg font-extrabold text-[#1A1033] font-display">
                  Redirecting to checkout…
                </h3>
                <p className="text-slate-400 text-sm mt-2">
                  Complete payment on our secure partner page.
                </p>
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
              </div>
            ) : (
              // PAYMENT METHOD SELECTION
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-extrabold text-[#1A1033] font-display">
                    Checkout
                  </h3>
                  <button
                    onClick={() => {
                      setCheckout(false);
                      setError(null);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                {/* PRICE DISPLAY */}
                <div className="bg-[#F8F7FF] rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[#1A1033]">
                        TCUnnect Premium
                      </p>
                      <p className="text-xs text-slate-400">
                        Lifetime access · No subscription
                      </p>
                    </div>
                    <p className="text-2xl font-extrabold text-primary">₱30</p>
                  </div>
                </div>

                {/* PAYMENT METHOD SELECTION */}
                <p className="text-sm font-bold text-[#1A1033] mb-3">
                  Payment method
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { id: "gcash" as const, label: "GCash", emoji: "💙" },
                    { id: "maya" as const, label: "Maya", emoji: "💚" },
                    { id: "qrph" as const, label: "QRPh", emoji: "🔳" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPayment(p.id)}
                      className={`py-4 rounded-2xl border-2 flex flex-col items-center gap-1 text-sm font-bold transition-all ${
                        payment === p.id
                          ? "border-primary bg-primary-light text-primary"
                          : "border-slate-200 text-slate-600 hover:border-primary-light"
                      }`}
                    >
                      <span className="text-2xl">{p.emoji}</span>
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* ERROR DISPLAY */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* SECURITY NOTE */}
                <p className="text-xs text-slate-400 text-center mb-5">
                  Payment is processed securely. TCUnnect does not store your
                  payment details.
                </p>

                {/* PAY BUTTON */}
                <button
                  onClick={handlePay}
                  disabled={redirecting}
                  className="w-full bg-primary text-white font-extrabold py-4 rounded-2xl hover:bg-primary-dark transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {redirecting ? "Processing..." : "Continue to Pay ₱30"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MAIN PREMIUM VIEW */}
      <div className="max-w-3xl">
        {isPremium ? (
          // ALREADY PREMIUM
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-3xl font-extrabold text-premium font-display">
              You're Premium!
            </h2>
            <p className="text-slate-500 mt-3">
              You have lifetime access to all premium features.
            </p>
          </div>
        ) : (
          // NOT PREMIUM - SHOW FEATURES
          <>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-premium/10 text-premium text-sm font-bold px-4 py-2 rounded-full mb-6">
                ⭐ TCUnnect Premium
              </div>
              <h1 className="text-4xl font-extrabold text-[#1A1033] font-display mb-3">
                See who's interested in you.
              </h1>
              <p className="text-5xl font-extrabold text-primary mb-2">₱30</p>
              <p className="text-slate-400 text-lg">Lifetime access</p>
              <p className="text-sm font-bold text-match mt-1">
                Pay once. No monthly subscription.
              </p>
            </div>

            {/* BENEFITS GRID */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {[
                {
                  icon: "👀",
                  title: "See everyone who liked you",
                  desc: "Full profiles revealed — not just blurs.",
                },
                {
                  icon: "🔍",
                  title: "See everyone who viewed you",
                  desc: "Know exactly who's been checking you out.",
                },
                {
                  icon: "♾️",
                  title: "Unlimited likes & views",
                  desc: "No limits. See as many as you want.",
                },
                {
                  icon: "🔔",
                  title: "Instant notifications",
                  desc: "Get notified the moment someone likes you.",
                },
                {
                  icon: "⭐",
                  title: "Premium profile badge",
                  desc: "Stand out with a premium badge on your profile.",
                },
              ].map((b) => (
                <div
                  key={b.title}
                  className="bg-white rounded-2xl p-5 border border-slate-100 flex gap-4 items-start"
                >
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="font-bold text-[#1A1033] text-sm">{b.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* GET PREMIUM BUTTON */}
            <button
              onClick={() => {
                setCheckout(true);
                setError(null);
              }}
              className="w-full bg-primary text-white font-extrabold py-5 rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/30 text-xl mb-12"
            >
              Get Premium — ₱30
            </button>

            {/* COMPARISON TABLE */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-3 bg-[#F8F7FF] px-6 py-4 font-bold text-sm">
                <span className="text-slate-400">Feature</span>
                <span className="text-center text-slate-400">Free</span>
                <span className="text-center text-primary">Premium ⭐</span>
              </div>
              {comparison.map(([feature, free, premium]) => (
                <div
                  key={String(feature)}
                  className="grid grid-cols-3 px-6 py-4 border-t border-slate-50 text-sm items-center"
                >
                  <span className="text-[#1A1033] font-medium">{feature as string}</span>
                  <span className="text-center">
                    {free ? "✅" : <span className="text-slate-300 text-xs">Blurred</span>}
                  </span>
                  <span className="text-center text-match font-bold">✅</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PremiumView;
