import Logo from "../components/Logo";

type Props = { page: "terms" | "privacy"; onNavigate: (v: string) => void };

export default function LegalPage({ page, onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Logo />
        </div>
        <button onClick={() => onNavigate("signup")} className="text-sm text-primary font-semibold hover:underline mb-6">
          ← Back
        </button>

        {page === "terms" ? <TermsContent /> : <PrivacyContent />}

        <button onClick={() => onNavigate("signup")} className="mt-10 text-sm text-primary font-semibold hover:underline">
          ← Back to sign up
        </button>
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <article className="prose prose-sm max-w-none text-[#1A1033]">
      <h1 className="text-2xl font-extrabold font-display mb-1">TCUnnect — Terms of Service</h1>
      <p className="text-xs text-slate-400 mb-6">Last updated: September 10, 2026</p>

      <p className="text-sm leading-relaxed mb-4">
        These Terms of Service govern your access to and use of TCUnnect, operated for Taguig City University (TCU)
        students. By creating an account, you agree to these Terms.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">1. Eligibility</h2>
      <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
        <li>You must be 18 years of age or older — no exceptions, no restricted accounts for anyone under 18.</li>
        <li>You must be able to provide a valid TCU student ID or Certificate of Enrollment (COE).</li>
        <li>All information you provide must be accurate and belong to you.</li>
      </ul>

      <h2 className="text-lg font-bold mt-6 mb-2">2. Account & Verification</h2>
      <p className="text-sm leading-relaxed">
        Accounts require ID/COE and selfie verification, reviewed by our team before full access is granted. You may
        not create multiple accounts, impersonate another person, or use a photo/ID that isn't your own.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">3. Acceptable Use</h2>
      <p className="text-sm leading-relaxed">
        No harassment, hate speech, illegal content, spam, impersonation, or sharing others' private information
        without consent. Violations may lead to a warning, suspension, or permanent ban.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">4. Matching, Messaging & Blocking</h2>
      <p className="text-sm leading-relaxed">
        Blocking is one-directional and silent: the blocked person isn't notified. Your conversation record stays on
        your side; it disappears from theirs. Unmatching makes both of you visible to each other in Discover again.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">5. Anonymous Campus Feed</h2>
      <p className="text-sm leading-relaxed">
        Posts and comments are never attributed to your account. We may still remove content or act on the account
        behind it if it violates these Terms.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">6. Premium Subscription & Payments</h2>
      <p className="text-sm leading-relaxed">
        A one-time Premium upgrade (₱30) is available via GCash, Maya, or QRPh through PayMongo. We never store your
        payment credentials. Refund requests within 7 days of purchase will be considered if features weren't
        delivered as described.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">7. Moderation</h2>
      <p className="text-sm leading-relaxed">
        Reports are reviewed by our team, who may dismiss the report or take action — suspension, ban, or content
        removal — at our discretion.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">8. Account Deletion</h2>
      <p className="text-sm leading-relaxed">
        You can request deletion any time via Settings. This clears your visible profile and permanently removes
        your matches, messages, likes, and other activity data. A minimal record may be kept to prevent the deleted
        login from being reused, and for safety/audit purposes as permitted by law.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">9. Disclaimers & Liability</h2>
      <p className="text-sm leading-relaxed">
        TCUnnect is provided "as is." We don't guarantee matches or that all users are who they claim. We're not
        liable for interactions, meetings, or relationships resulting from use of the app.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">10. Contact</h2>
      <p className="text-sm leading-relaxed">Questions about these Terms: [insert contact email]</p>

      <p className="text-xs text-slate-400 mt-8 italic">
        This is a starting template and has not been reviewed by a licensed attorney — have it reviewed before
        treating it as your live legal Terms.
      </p>
    </article>
  );
}

function PrivacyContent() {
  return (
    <article className="prose prose-sm max-w-none text-[#1A1033]">
      <h1 className="text-2xl font-extrabold font-display mb-1">TCUnnect — Privacy Policy</h1>
      <p className="text-xs text-slate-400 mb-6">Last updated: [insert date before publishing]</p>

      <p className="text-sm leading-relaxed mb-4">
        This Privacy Policy explains what information TCUnnect collects, how we use it, and your rights, in
        accordance with the Philippine Data Privacy Act of 2012 (RA 10173).
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">1. What We Collect</h2>
      <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
        <li>Account info: email, password (encrypted), name</li>
        <li>Profile info: department, year, program, bio, interests, photo</li>
        <li>Verification: school ID/COE photo, live selfie</li>
        <li>Activity: likes, matches, messages, views, feed posts, votes</li>
        <li>Payment: method chosen and purchase record — actual credentials handled entirely by PayMongo</li>
        <li>Reports and moderation records</li>
        <li>Technical data: IP, device info, login timestamps</li>
      </ul>

      <h2 className="text-lg font-bold mt-6 mb-2">2. Your ID and Selfie Photos</h2>
      <p className="text-sm leading-relaxed">
        Stored in a private, access-restricted location — only you and our verification reviewers can see them.
        Never shown publicly or to other users, never used for anything but confirming you're a real TCU student.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">3. What Other Users Can See</h2>
      <p className="text-sm leading-relaxed">
        Your profile photo, department, year, bio, and interests are visible to other verified users. Free users see
        blurred identities of who liked/viewed them; Premium users see full identities. Feed posts are never
        attributed to you. Your email, ID/selfie, exact birthdate, and payment details are never visible to other users.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">4. Third Parties</h2>
      <p className="text-sm leading-relaxed">
        We share data only with the providers necessary to run the app: Supabase (database/auth/storage) and
        PayMongo (payments). We don't share your data with advertisers or data brokers.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">5. Data Retention & Deletion</h2>
      <p className="text-sm leading-relaxed">
        Requesting deletion permanently removes your profile, matches, messages, likes, and activity data from our
        active database. A minimal, non-personal record is kept only to block the deleted login from being reused.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">6. Your Rights</h2>
      <p className="text-sm leading-relaxed">
        Under the Data Privacy Act, you can access, correct, or request deletion of your data, and lodge a complaint
        with the National Privacy Commission if you believe your rights were violated.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">7. Children's Privacy</h2>
      <p className="text-sm leading-relaxed">
        TCUnnect is restricted to users 18 and older. Accounts found to belong to anyone under 18 will be removed.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">8. Contact</h2>
      <p className="text-sm leading-relaxed">Questions or data requests: [insert contact email]</p>

      <p className="text-xs text-slate-400 mt-8 italic">
        This is a starting template and has not been reviewed by a licensed attorney or Data Privacy Officer. Before
        publishing this live, note that TCUnnect processes sensitive personal information (ID documents, selfies) at
        a scale that legally requires registering with the National Privacy Commission.
      </p>
    </article>
  );
}
