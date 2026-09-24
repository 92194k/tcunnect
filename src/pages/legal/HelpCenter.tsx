import { Link } from "react-router-dom";
import { Compass, ChevronLeft, ChevronDown } from "lucide-react";
import { useState } from "react";

const SECTIONS = [
  {
    emoji: "🚀",
    title: "Getting Started",
    faqs: [
      {
        q: "How do I create a TCUnnect account?",
        a: "Click Sign Up on the homepage and fill in your name, email, and password — or continue with Google for a faster setup. You'll be guided through a short onboarding to set your location and travel interests.",
      },
      {
        q: "Is TCUnnect free to use?",
        a: "Yes! TCUnnect is free for all travelers. You can browse destinations, connect with people, and join the community at no cost. TCUnnect Plus and Business plans offer additional features for those who want more.",
      },
      {
        q: "What do I need to complete my profile?",
        a: "Your profile includes your name, photo, location (region, province, city), and travel interests. A complete profile helps you connect with like-minded travelers and get better recommendations.",
      },
    ],
  },
  {
    emoji: "🗺️",
    title: "Discovering Places & People",
    faqs: [
      {
        q: "How does the Discover People feature work?",
        a: "Discover People shows you other TCUnnect users based on shared travel interests and location. You can view profiles, send messages, and find potential travel companions.",
      },
      {
        q: "What are Hidden Gems?",
        a: "Hidden Gems are lesser-known destinations, spots, and experiences submitted by the TCUnnect community. These are places that don't always appear in mainstream travel guides but are loved by locals and explorers.",
      },
      {
        q: "What is the Featured section?",
        a: "Featured highlights top-rated businesses, curated destinations, and promoted experiences available on TCUnnect. These may include tourist spots, accommodations, food spots, and activity providers.",
      },
    ],
  },
  {
    emoji: "📅",
    title: "Bookings",
    faqs: [
      {
        q: "How do I book an experience or place?",
        a: "Visit a Hidden Gem or Featured listing and click Book Now. Fill in your preferred date and details, then confirm. Your booking will be sent to the business for confirmation.",
      },
      {
        q: "Where can I view my bookings?",
        a: 'Go to the profile dropdown menu or mobile menu and select "My Bookings." You\'ll see the status of all your current and past bookings.',
      },
      {
        q: "What if I need to cancel a booking?",
        a: "Contact the business directly through TCUnnect chat or check the listing for their cancellation policy. TCUnnect currently does not process automatic cancellations or refunds — these are handled between you and the business.",
      },
    ],
  },
  {
    emoji: "👑",
    title: "TCUnnect Plus",
    faqs: [
      {
        q: "What is TCUnnect Plus?",
        a: "TCUnnect Plus is our premium plan for travelers. It unlocks features like priority access to hidden gems, exclusive community badges, the Founding Explorer badge (during the launch event), and more.",
      },
      {
        q: "How do I upgrade to TCUnnect Plus?",
        a: 'Click "Upgrade to Plus" from your profile dropdown or visit the Premium page. Choose your plan, pay via GCash or Maya, and upload your payment receipt. Our team will verify and activate your plan.',
      },
      {
        q: "How long does verification take?",
        a: "Verification is done manually by our team. It typically takes a few hours during business days. You'll receive a notification once your plan is activated.",
      },
      {
        q: "Is the ₱30 lifetime deal still available?",
        a: "The ₱30 Lifetime deal for TCUnnect Plus is a limited launch promotion offered during our Technopreneurship Day event. Once the event ends, pricing will return to regular rates. Check the Premium page for current offers.",
      },
    ],
  },
  {
    emoji: "🏢",
    title: "Business Accounts",
    faqs: [
      {
        q: "How do I register my business on TCUnnect?",
        a: "Sign up for a Business plan through the Premium page. Once verified, you'll be able to list your business, manage bookings, and connect with travelers.",
      },
      {
        q: "What business plans are available?",
        a: "TCUnnect offers Business Starter (great for trying it out), Founding Business (our best value launch plan), Business Pro (for established operators), and Business Partner (custom enterprise plan). Visit the Premium page for current pricing.",
      },
      {
        q: "Can I list multiple locations or services?",
        a: "Business Pro and Business Partner plans support multiple listings. Starter and Founding plans are designed for a single primary listing. Contact us for custom arrangements.",
      },
    ],
  },
  {
    emoji: "💬",
    title: "Chat & Community",
    faqs: [
      {
        q: "How does the chat feature work?",
        a: "You can start a conversation with any user by visiting their profile or from the Discover People section. The Chat page shows all your active conversations.",
      },
      {
        q: "What is the Community section?",
        a: "The Community section is a shared space where TCUnnect users can post travel updates, tips, questions, and recommendations. It's a place to share and discover travel stories from around the Philippines.",
      },
      {
        q: "Can I block or report a user?",
        a: "Yes. Visit the user's profile and use the report or block option. You can also report content directly from posts and messages. Our team reviews all reports and takes appropriate action.",
      },
    ],
  },
  {
    emoji: "🔒",
    title: "Privacy & Account",
    faqs: [
      {
        q: "How do I update my profile or location?",
        a: 'Go to your Profile page from the navigation menu. You can edit your name, photo, location, travel interests, and bio from there.',
      },
      {
        q: "How do I change my password?",
        a: "If you signed up with email, you can use the \"Forgot Password\" option on the login page to reset it. If you use Google login, your password is managed through your Google account.",
      },
      {
        q: "Can I delete my account?",
        a: "If you'd like to delete your account, please contact TCUnnect administration through the platform. We'll process your request and remove your data in accordance with our Privacy Policy.",
      },
    ],
  },
  {
    emoji: "📩",
    title: "Contact & Support",
    faqs: [
      {
        q: "How do I contact TCUnnect support?",
        a: "You can reach us through the contact information on the platform. For payment issues or plan activation, include your receipt and registered email when reaching out.",
      },
      {
        q: "I found a bug or issue — how do I report it?",
        a: "We appreciate your help! Send us a message describing the issue, what page it occurred on, and any screenshots if possible. Our team will look into it.",
      },
    ],
  },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left bg-white hover:bg-slate-50 transition"
      >
        <span className="text-sm font-medium text-slate-800 pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-white text-sm text-slate-600 leading-relaxed border-t border-slate-100">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpCenter() {
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
          <span className="text-sm text-slate-500">Help Center</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 mb-6 transition">
          <ChevronLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-1">Help Center</h1>
        <p className="text-sm text-slate-400 mb-8">Answers to common questions about TCUnnect</p>

        <div className="space-y-10">
          {SECTIONS.map(section => (
            <section key={section.title}>
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span>{section.emoji}</span> {section.title}
              </h2>
              <div className="space-y-2">
                {section.faqs.map(faq => (
                  <FAQ key={faq.q} q={faq.q} a={faq.a} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 bg-sky-50 border border-sky-100 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-slate-800 mb-1">Still need help?</p>
          <p className="text-sm text-slate-500 mb-4">Contact the TCUnnect team directly and we'll get back to you as soon as we can.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-sky-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-sky-700 transition"
          >
            Contact Us
          </Link>
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
