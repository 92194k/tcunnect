import { Link } from "react-router-dom";
import { Compass, ChevronLeft } from "lucide-react";

export default function Safety() {
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
          <span className="text-sm text-slate-500">Safety Guidelines</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 mb-6 transition">
          <ChevronLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-1">Safety Guidelines</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 text-sm leading-relaxed">

          <p>At TCUnnect, your safety is our priority. Whether you're meeting new travel companions, booking an experience, or exploring hidden gems, we want you to feel safe and supported every step of the way. Please follow these guidelines to help us maintain a safe and respectful community.</p>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Protect Your Personal Information</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "Do not share sensitive personal details publicly, such as your home address, phone number, or financial information",
                "Be cautious about sharing your real-time location with people you don't know well",
                "Never share your TCUnnect password or payment credentials with anyone",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Meeting Other Travelers</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "When meeting someone you connected with on TCUnnect for the first time, choose a public location",
                "Let a trusted friend or family member know where you're going and who you're meeting",
                "Trust your instincts — if something feels off, it's okay to cancel or leave",
                "Avoid sharing your exact address before you've built trust with someone",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Respectful Communication</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "Treat all users with respect, regardless of background, location, or travel style",
                "Do not send unsolicited messages or make other users feel uncomfortable",
                "Harassment, threats, discrimination, or abusive language will not be tolerated",
                "If someone asks you to stop contacting them, honor that immediately",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Accurate Profiles and Listings</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "Use your real name and a genuine profile photo",
                "Do not create fake profiles or impersonate others",
                "Business owners must ensure that their listings are truthful and up to date",
                "Misleading information about experiences, prices, or services is not allowed",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Safe Payments</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "Only make payments through the official channels supported by TCUnnect (GCash or Maya)",
                "Never send money to other users directly outside of the platform's booking system",
                "Be cautious of any user or business asking for unusual payment methods",
                "TCUnnect will never ask for your payment PIN, OTP, or banking password",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Reporting Problems</h2>
            <p className="mb-2">If you experience or witness any of the following, please report it to TCUnnect immediately:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "Harassment or threatening behavior",
                "Suspicious or fake accounts",
                "Fraudulent listings or payment requests",
                "Inappropriate content",
                "Any activity that feels unsafe",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
            <p className="mt-3">You can report users, businesses, or content using the report button available throughout the platform, or contact us through the <Link to="/help" className="text-sky-600 hover:underline">Help Center</Link>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Travel Safety Tips</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "Research the destination and check local advisories before traveling",
                "Keep emergency contacts saved and accessible",
                "Inform someone of your travel plans and expected return",
                "Be aware of local laws and customs when visiting new places in the Philippines",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Content Standards</h2>
            <p className="mb-2">All content posted on TCUnnect must be appropriate for a general audience. The following types of content are not allowed:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "Explicit or adult content",
                "Content that promotes violence or discrimination",
                "Spam or repetitive promotional material",
                "Content that violates the rights or privacy of others",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Account Security</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              {[
                "Use a strong and unique password for your TCUnnect account",
                "Do not log in on shared or public devices and leave your session open",
                "Contact us immediately if you believe your account has been compromised",
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Our Commitment to You</h2>
            <p>TCUnnect is committed to continuously improving safety on our platform. We review reports, take action on violations, and work to create a community where Filipino travelers feel welcome, respected, and safe. Thank you for doing your part.</p>
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
