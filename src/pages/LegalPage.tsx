import Logo from "../components/Logo";

type Props = { page: "terms" | "privacy"; onNavigate: (v: string) => void };

export default function LegalPage({ page, onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Logo />
        </div>

        <button
          onClick={() => onNavigate("signup")}
          className="text-sm text-primary font-semibold hover:underline mb-6"
        >
          ← Back
        </button>

        {page === "terms" ? <TermsContent /> : <PrivacyContent />}

        <button
          onClick={() => onNavigate("signup")}
          className="mt-10 text-sm text-primary font-semibold hover:underline"
        >
          ← Back to sign up
        </button>
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <article className="prose prose-sm max-w-none text-[#1A1033]">
      <h1 className="text-2xl font-extrabold font-display mb-1">
        TCUnnect — Terms of Service
      </h1>

      <p className="text-xs text-slate-400 mb-6">
        Last updated: September 10, 2026
      </p>

      <p className="text-sm leading-relaxed mb-4">
        These Terms of Service explain the rules for using TCUnnect. By
        creating an account or using TCUnnect, you agree to follow these
        Terms.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">1. Eligibility</h2>
      <p className="text-sm leading-relaxed">
        TCUnnect is intended for TCU students who are 18 years old or older.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        To use TCUnnect, you must be able to provide a valid TCU student ID or
        Certificate of Enrollment (COE) when required for verification.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        You agree that the information you provide is accurate, belongs to
        you, and is not misleading.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        2. Account & Verification
      </h2>

      <p className="text-sm leading-relaxed">
        To help keep the community limited to legitimate TCU students,
        accounts may require student ID or COE verification and selfie
        verification before full access is granted.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        You may only create and use your own account. You may not:
      </p>

      <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
        <li>Create multiple accounts</li>
        <li>Impersonate another person</li>
        <li>Use another person's identity, ID, COE, or photos</li>
        <li>Provide false or misleading information</li>
      </ul>

      <p className="text-sm leading-relaxed mt-2">
        TCUnnect may restrict, suspend, or remove accounts that do not meet
        these requirements.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">3. Acceptable Use</h2>

      <p className="text-sm leading-relaxed">
        You are expected to use TCUnnect respectfully and responsibly.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        You may not use TCUnnect to:
      </p>

      <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
        <li>Harass, threaten, or bully other users</li>
        <li>Post hateful or abusive content</li>
        <li>Share illegal or prohibited content</li>
        <li>Spam or deliberately misuse the platform</li>
        <li>Impersonate another person</li>
        <li>
          Share another person's private or personal information without
          their consent
        </li>
        <li>Use the platform for fraudulent or harmful activities</li>
      </ul>

      <p className="text-sm leading-relaxed mt-2">
        Violations may result in content removal, warnings, temporary
        suspension, or permanent account removal depending on the situation.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        4. Matching, Messaging & Blocking
      </h2>

      <p className="text-sm leading-relaxed">
        TCUnnect allows users to discover, match, and communicate with other
        users.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        You may block another user at any time. Blocking is silent, meaning
        the blocked user will not receive a notification that they have been
        blocked.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        When you block someone, the conversation will no longer be available
        to the blocked user.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        You may also unmatch another user. When an unmatch occurs, the users
        may become eligible to appear to each other again in Discover,
        depending on the platform's matching rules.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        5. Anonymous Campus Feed
      </h2>

      <p className="text-sm leading-relaxed">
        TCUnnect's Campus Feed allows users to share posts and comments
        without publicly displaying their account identity.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Although posts and comments are displayed anonymously to other users,
        TCUnnect may be able to associate activity with the account that
        submitted it when necessary for moderation, safety, security, or
        compliance with applicable laws.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Anonymous posting does not permit harassment, abuse, illegal content,
        or other violations of these Terms.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        6. Premium Features & Payments
      </h2>

      <p className="text-sm leading-relaxed">
        TCUnnect may offer optional Premium features for a one-time fee of
        ₱30, subject to the features available at the time of purchase.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Payments may be processed through supported payment methods such as
        GCash, Maya, or QRPh using PayMongo.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        TCUnnect does not directly store your payment credentials. Payment
        information is handled by the applicable payment processor.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        If you experience a problem with a Premium purchase or the purchased
        features were not delivered as described, you may contact us regarding
        a refund request within 7 days of purchase. Refund requests will be
        reviewed on a case-by-case basis.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        7. Reports & Moderation
      </h2>

      <p className="text-sm leading-relaxed">
        Users may report accounts, messages, posts, comments, or other
        content that they believe violates these Terms.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Our moderation team may review reports and take appropriate action
        based on the circumstances.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Possible actions include removing content, issuing a warning,
        restricting features, suspending an account, or permanently removing
        an account.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Not every report will necessarily result in action.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">8. Account Deletion</h2>

      <p className="text-sm leading-relaxed">
        You may request deletion of your TCUnnect account through Settings.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        When your account is deleted, your profile and associated account
        activity, including matches, messages, likes, and other user
        activity, may be permanently removed from the platform.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Some limited information may be retained when reasonably necessary
        for security, fraud prevention, moderation records, legal
        obligations, or other purposes permitted by applicable law.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        9. Safety & Disclaimer
      </h2>

      <p className="text-sm leading-relaxed">
        TCUnnect provides a platform for students to discover and communicate
        with other users. We cannot guarantee that every user's information,
        identity, intentions, or representations are accurate.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        You are responsible for using your own judgment when communicating
        with or meeting other users. Avoid sharing sensitive personal
        information and take appropriate safety precautions when interacting
        with someone you meet through TCUnnect.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        TCUnnect does not guarantee that you will receive matches, messages,
        or connections.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        To the extent permitted by applicable law, TCUnnect is not responsible
        for the actions, conduct, or interactions of users outside the
        platform.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        10. Changes to These Terms
      </h2>

      <p className="text-sm leading-relaxed">
        We may update these Terms when necessary to reflect changes to
        TCUnnect, its features, or applicable requirements.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        When significant changes are made, we may provide notice through the
        platform or other appropriate means. Your continued use of TCUnnect
        after the updated Terms take effect means you accept the revised
        Terms.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">11. Contact</h2>

      <p className="text-sm leading-relaxed">
        If you have questions or concerns about these Terms, you may contact
        us at:
      </p>

      <p className="text-sm leading-relaxed mt-2 font-semibold">
        alaokhemberly@gmail.com
      </p>
    </article>
  );
}

function PrivacyContent() {
  return (
    <article className="prose prose-sm max-w-none text-[#1A1033]">
      <h1 className="text-2xl font-extrabold font-display mb-1">
        TCUnnect — Privacy Policy
      </h1>

      <p className="text-xs text-slate-400 mb-6">
        Last updated: September 10, 2026
      </p>

      <p className="text-sm leading-relaxed mb-4">
        This Privacy Policy explains what information TCUnnect collects, how
        we use it, how we protect it, and the choices available to you. This
        policy is intended to comply with the Philippine Data Privacy Act of
        2012 (Republic Act No. 10173) and its applicable regulations.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        1. Information We Collect
      </h2>

      <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
        <li>
          <strong>Account information:</strong> email address, securely
          stored password credentials, and name
        </li>
        <li>
          <strong>Profile information:</strong> department, year level,
          program, bio, interests, and profile photo
        </li>
        <li>
          <strong>Verification information:</strong> school ID or COE photo
          and selfie verification photo
        </li>
        <li>
          <strong>Activity information:</strong> likes, matches, messages,
          profile views, feed posts, comments, and votes
        </li>
        <li>
          <strong>Payment information:</strong> purchase records and selected
          payment method; payment credentials are handled by PayMongo
        </li>
        <li>
          <strong>Reports and moderation information:</strong> reports,
          moderation actions, and related records
        </li>
        <li>
          <strong>Technical information:</strong> IP address, device
          information, and login timestamps
        </li>
      </ul>

      <h2 className="text-lg font-bold mt-6 mb-2">
        2. How We Use Your Information
      </h2>

      <p className="text-sm leading-relaxed">
        We use collected information to operate and maintain TCUnnect,
        verify eligible users, provide matching and messaging features,
        process Premium purchases, improve platform security, investigate
        reports, prevent abuse, and comply with applicable legal
        requirements.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        3. Your ID and Selfie Verification
      </h2>

      <p className="text-sm leading-relaxed">
        Student ID, COE, and selfie verification information is treated as
        restricted verification data. These materials are not displayed on
        public profiles or made available to other users.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Access to verification information is limited to authorized personnel
        or service providers who need it for account verification, security,
        or other legitimate purposes.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        4. What Other Users Can See
      </h2>

      <p className="text-sm leading-relaxed">
        Depending on the features you use, other verified users may be able
        to see information such as your profile photo, department, year
        level, program, bio, and interests.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Premium features may provide additional visibility into certain
        interactions, such as users who liked or viewed your profile.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Your email address, student ID or COE, selfie verification photo,
        exact birthdate, and payment credentials are not displayed to other
        users.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Campus Feed posts and comments are displayed anonymously to other
        users. However, TCUnnect may associate anonymous activity with the
        account that submitted it when necessary for moderation, safety,
        security, or legal compliance.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        5. Third-Party Services
      </h2>

      <p className="text-sm leading-relaxed">
        TCUnnect may use third-party service providers necessary to operate
        the platform, including Supabase for database, authentication, and
        storage services, and PayMongo for payment processing.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        We do not sell your personal information to advertisers or data
        brokers.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        6. Data Retention & Deletion
      </h2>

      <p className="text-sm leading-relaxed">
        You may request deletion of your TCUnnect account through Settings.
        When an account is deleted, your profile and associated activity,
        including matches, messages, likes, and other account activity, may
        be permanently removed from our active systems.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        Some information may be retained when reasonably necessary for
        security, fraud prevention, moderation, legal obligations, or other
        purposes permitted by applicable law.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        7. Your Privacy Rights
      </h2>

      <p className="text-sm leading-relaxed">
        Subject to applicable law, you may have rights to access and correct
        your personal information and request its deletion or other
        appropriate processing restrictions.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        You may also raise privacy concerns with the National Privacy
        Commission if you believe your rights under the Data Privacy Act
        have not been properly addressed.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        8. Children's Privacy
      </h2>

      <p className="text-sm leading-relaxed">
        TCUnnect is intended only for users who are 18 years old or older.
        Accounts found to belong to individuals under 18 may be removed.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">
        9. Changes to This Privacy Policy
      </h2>

      <p className="text-sm leading-relaxed">
        We may update this Privacy Policy when necessary to reflect changes
        to TCUnnect, its features, or applicable privacy requirements.
      </p>

      <p className="text-sm leading-relaxed mt-2">
        When significant changes are made, we may provide notice through the
        platform or other appropriate means.
      </p>

      <h2 className="text-lg font-bold mt-6 mb-2">10. Contact</h2>

      <p className="text-sm leading-relaxed">
        For privacy questions, data requests, or concerns, you may contact us
        at:
      </p>

      <p className="text-sm leading-relaxed mt-2 font-semibold">
        alaokhemberly@gmail.com
      </p>
    </article>
  );
}
```
