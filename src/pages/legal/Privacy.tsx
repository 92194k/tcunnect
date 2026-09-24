import { Link } from "react-router-dom";
import { Compass, ChevronLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-7 w-7 bg-sky-600 rounded-lg flex items-center justify-center text-white">
              <Compass className="h-4 w-4" />
            </span>
            <span className="font-bold text-slate-900">TC<span className="text-sky-600">U</span>nnect</span>
          </Link>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-500">Privacy Policy</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 mb-6 transition">
          <ChevronLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 text-sm leading-relaxed">

          <p>At TCUnnect, we respect your privacy. This Privacy Policy explains what information we collect, how we use it, and how we protect it when you use our platform.</p>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Information We Collect</h2>
            <p className="mb-3">When you use TCUnnect, we may collect information you provide, including:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {["Name and profile information","Email address","Profile photo","Travel interests","Region, province, and city","Posts, reviews, and other content you submit","Booking information","Payment receipts submitted for Premium or Business plans","Information provided when registering a business"].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {["Create and manage your account","Help you discover travel companions","Recommend hidden gems and featured places","Show locations and destinations relevant to you","Process and manage bookings","Provide chat, notifications, and community features","Verify Premium and Business payments","Improve TCUnnect and its features","Keep the platform safe and prevent abuse"].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Location Information</h2>
            <p>TCUnnect asks for your region, province, and city to provide location-based travel recommendations. If you choose to use location features, your location may also be used to display relevant places and travelers on the map. You can change your selected location through your account settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Public Information</h2>
            <p>Some information you choose to share may be visible to other TCUnnect users, including your profile, interests, posts, reviews, and business information. Do not publicly share sensitive personal information.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Payments</h2>
            <p>TCUnnect may allow payments through methods such as GCash or Maya for Premium and Business subscriptions. For manual payment verification, you may be asked to upload a payment receipt or transaction reference. TCUnnect does not ask for your payment PIN, password, or other private banking credentials.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Information Sharing</h2>
            <p>TCUnnect does not sell your personal information. Information may be shared when necessary to provide a requested service, process a booking, verify a transaction, respond to legal requirements, or protect users and the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Account Security</h2>
            <p>Please keep your password and account information private. Contact TCUnnect if you believe your account has been accessed without your permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Your Choices</h2>
            <p>You may update information in your profile and change your selected location. You may also request assistance regarding your personal information or account.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy when necessary. Any changes will be posted on this page.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Contact</h2>
            <p>For privacy concerns, please contact the TCUnnect administration through the contact information provided on the platform.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400">
        <p>© 2026 TCUnnect. Made for curious Filipino travelers.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link to="/help" className="hover:text-sky-600">Help Center</Link>
          <Link to="/privacy" className="hover:text-sky-600">Privacy</Link>
          <Link to="/terms" className="hover:text-sky-600">Terms</Link>
          <Link to="/safety" className="hover:text-sky-600">Safety</Link>
        </div>
      </footer>
    </div>
  );
}
