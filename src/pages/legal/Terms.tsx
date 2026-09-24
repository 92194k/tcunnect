import { Link } from "react-router-dom";
import { Compass, ChevronLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-7 w-7 bg-sky-600 rounded-lg flex items-center justify-center text-white">
              <Compass className="h-4 w-4" />
            </span>
            <span className="font-bold text-slate-900">TC<span className="text-sky-600">U</span>nnect</span>
          </Link>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-500">Terms of Service</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 mb-6 transition">
          <ChevronLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-1">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 text-sm leading-relaxed">

          <p>Welcome to TCUnnect. By using our platform, you agree to these Terms of Service. Please read them carefully before creating an account or using any features.</p>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>By registering, accessing, or using TCUnnect, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Eligibility</h2>
            <p>You must be at least 18 years old to use TCUnnect. By using the platform, you confirm that you meet this requirement and that the information you provide is accurate.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Account Responsibilities</h2>
            <p className="mb-2">You are responsible for maintaining the security of your account. You agree to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "Keep your password confidential",
                "Not share your account with others",
                "Notify TCUnnect immediately if you suspect unauthorized access",
                "Provide accurate and up-to-date information",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Acceptable Use</h2>
            <p className="mb-2">You agree to use TCUnnect only for lawful purposes and in a manner consistent with these terms. You must not:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "Post false, misleading, or harmful content",
                "Harass, bully, or threaten other users",
                "Share inappropriate, offensive, or illegal material",
                "Attempt to gain unauthorized access to any part of the platform",
                "Use TCUnnect to conduct fraudulent activities",
                "Impersonate another person or business",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Content You Post</h2>
            <p>You are responsible for the content you submit on TCUnnect, including posts, reviews, photos, and business information. By posting content, you grant TCUnnect a non-exclusive license to display and use that content on the platform. TCUnnect reserves the right to remove content that violates these terms or our community standards.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Business Listings</h2>
            <p>Businesses registered on TCUnnect are responsible for ensuring the accuracy of their listings, including location, offerings, pricing, and contact information. TCUnnect does not verify the accuracy of all business information and is not liable for any disputes between users and businesses.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Bookings</h2>
            <p>TCUnnect facilitates bookings between travelers and businesses. We do not guarantee the availability, quality, or fulfillment of any booking. Any disputes regarding bookings should be resolved directly between the traveler and the business. TCUnnect may provide assistance but is not responsible for the outcome of booking arrangements.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Premium and Business Plans</h2>
            <p className="mb-2">TCUnnect offers optional paid plans including TCUnnect Plus and Business plans. By subscribing:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "Payment is required via GCash or Maya unless otherwise stated",
                "Manual payment verification may be required — activation is not immediate",
                "Plan benefits are available after successful verification by TCUnnect administrators",
                "TCUnnect reserves the right to modify, suspend, or discontinue plan features",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Payments and Refunds</h2>
            <p>All payments made for premium or business plans are generally non-refundable unless otherwise stated by TCUnnect. If you believe a payment was made in error, please contact the TCUnnect administration as soon as possible.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Intellectual Property</h2>
            <p>TCUnnect and its original content, features, and design are the property of TCUnnect and are protected by applicable intellectual property laws. You may not copy, reproduce, or distribute any part of the platform without permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">11. Privacy</h2>
            <p>Your use of TCUnnect is also governed by our <Link to="/privacy" className="text-sky-600 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">12. Suspension and Termination</h2>
            <p>TCUnnect reserves the right to suspend or terminate accounts that violate these terms or engage in behavior harmful to users or the platform. In cases of serious violations, accounts may be removed without prior notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">13. Limitation of Liability</h2>
            <p>TCUnnect is provided on an "as is" basis. We do not guarantee uninterrupted access or that the platform will be free of errors. TCUnnect is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">14. Changes to These Terms</h2>
            <p>TCUnnect may update these Terms of Service from time to time. Continued use of the platform after changes are posted constitutes your acceptance of the updated terms. We recommend reviewing these terms periodically.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">15. Contact</h2>
            <p>For questions about these Terms, please contact TCUnnect administration through the contact information provided on the platform.</p>
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
