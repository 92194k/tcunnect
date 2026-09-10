```tsx
import Logo from "../components/Logo";

type Props = {
  page: "terms" | "privacy";
  onNavigate: (v: string) => void;
};

export default function LegalPage({ page, onNavigate }: Props) {
  const isTerms = page === "terms";

  return (
    <div className="min-h-screen bg-[#F8F7FC]">
      {/* Header */}
      <header className="bg-white border-b border-[#E9E5F2]">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-5 flex items-center justify-between">
          <Logo />

          <button
            onClick={() => onNavigate("signup")}
            className="text-sm font-semibold text-primary hover:underline transition"
          >
            ← Back to sign up
          </button>
        </div>
      </header>

      {/* Page */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page heading */}
        <div className="mb-7">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-[#1A1033]">
            {isTerms ? "Terms of Service" : "Privacy Policy"}
          </h1>

          <p className="text-sm text-slate-400 mt-2">
            Last updated: September 10, 2026
          </p>
        </div>

        {/* Legal document */}
        <div className="bg-white border border-[#E9E5F2] rounded-2xl shadow-sm">
          <div className="px-6 sm:px-9 py-7 sm:py-9">
            {isTerms ? <TermsContent /> : <PrivacyContent />}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="flex justify-center mt-7">
          <button
            onClick={() => onNavigate("signup")}
            className="text-sm font-semibold text-primary hover:underline transition"
          >
            ← Back to sign up
          </button>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TERMS OF SERVICE                                                           */
/* -------------------------------------------------------------------------- */

function TermsContent() {
  return (
    <article className="text-[#1A1033]">
      <p className="text-sm sm:text-[15px] leading-7 text-slate-600 mb-7">
        These Terms of Service explain the rules for using TCUnnect. By
        creating an account or using TCUnnect, you agree to follow these
        Terms.
      </p>

      <LegalSection title="1. Eligibility">
        <p>
          TCUnnect is intended for TCU students who are 18 years old or older.
        </p>

        <p>
          To use TCUnnect, you must be able to provide a valid TCU student ID
          or Certificate of Enrollment (COE) when required for verification.
        </p>

        <p>
          You agree that the information you provide is accurate, belongs to
          you, and is not misleading.
        </p>
      </LegalSection>

      <LegalSection title="2. Account & Verification">
        <p>
          To help keep the community limited to legitimate TCU students,
          accounts may require student ID or COE verification and selfie
          verification before full access is granted.
        </p>

        <p>You may only create and use your own account. You may not:</p>

        <LegalList
          items={[
            "Create multiple accounts",
            "Impersonate another person",
            "Use another person's identity, ID, COE, or photos",
            "Provide false or misleading information",
          ]}
        />

        <p>
          TCUnnect may restrict, suspend, or remove accounts that do not meet
          these requirements.
        </p>
      </LegalSection>

      <LegalSection title="3. Acceptable Use">
        <p>
          You are expected to use TCUnnect respectfully and responsibly.
        </p>

        <p>You may not use TCUnnect to:</p>

        <LegalList
          items={[
            "Harass, threaten, or bully other users",
            "Post hateful or abusive content",
            "Share illegal or prohibited content",
            "Spam or deliberately misuse the platform",
            "Impersonate another person",
            "Share another person's private or personal information without their consent",
            "Use the platform for fraudulent or harmful activities",
          ]}
        />

        <p>
          Violations may result in content removal, warnings, temporary
          suspension, or permanent account removal depending on the situation.
        </p>
      </LegalSection>

      <LegalSection title="4. Matching, Messaging & Blocking">
        <p>
          TCUnnect allows users to discover, match, and communicate with other
          users.
        </p>

        <p>
          You may block another user at any time. Blocking is silent, meaning
          the blocked user will not receive a notification.
        </p>

        <p>
          When you block someone, the conversation will no longer be available
          to the blocked user.
        </p>

        <p>
          You may also unmatch another user. After an unmatch, the users may
          become eligible to appear to each other again in Discover, depending
          on the platform's matching rules.
        </p>
      </LegalSection>

      <LegalSection title="5. Anonymous Campus Feed">
        <p>
          TCUnnect's Campus Feed allows users to share posts and comments
          without publicly displaying their account identity.
        </p>

        <p>
          Although posts and comments are displayed anonymously to other
          users, TCUnnect may associate activity with the account that
          submitted it when necessary for moderation, safety, security, or
          compliance with applicable laws.
        </p>

        <p>
          Anonymous posting does not permit harassment, abuse, illegal
          content, or other violations of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="6. Premium Features & Payments">
        <p>
          TCUnnect may offer optional Premium features for a one-time fee of
          ₱30, subject to the features available at the time of purchase.
        </p>

        <p>
          Payments may be processed through supported payment methods such as
          GCash, Maya, or QRPh using PayMongo.
        </p>

        <p>
          TCUnnect does not directly store your payment credentials. Payment
          information is handled by the applicable payment processor.
        </p>

        <p>
          If you experience a problem with a Premium purchase or the purchased
          features were not delivered as described, you may contact us
          regarding a refund request within 7 days of purchase. Refund requests
          will be reviewed on a case-by-case basis.
        </p>
      </LegalSection>

      <LegalSection title="7. Reports & Moderation">
        <p>
          Users may report accounts, messages, posts, comments, or other
          content that they believe violates these Terms.
        </p>

        <p>
          Our moderation team may review reports and take appropriate action
          based on the circumstances.
        </p>

        <p>
          Possible actions include removing content, issuing a warning,
          restricting features, suspending an account, or permanently removing
          an account.
        </p>

        <p>Not every report will necessarily result in action.</p>
      </LegalSection>

      <LegalSection title="8. Account Deletion">
        <p>
          You may request deletion of your TCUnnect account through Settings.
        </p>

        <p>
          When your account is deleted, your profile and associated account
          activity, including matches, messages, likes, and other user
          activity, may be permanently removed from the platform.
        </p>

        <p>
          Some limited information may be retained when reasonably necessary
          for security, fraud prevention, moderation records, legal
          obligations, or other purposes permitted by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="9. Safety & Disclaimer">
        <p>
          TCUnnect provides a platform for students to discover and communicate
          with other users. We cannot guarantee that every user's information,
          identity, intentions, or representations are accurate.
        </p>

        <p>
          You are responsible for using your own judgment when communicating
          with or meeting other users. Avoid sharing sensitive personal
          information and take appropriate safety precautions when interacting
          with someone you meet through TCUnnect.
        </p>

        <p>
          TCUnnect does not guarantee that you will receive matches, messages,
          or connections.
        </p>

        <p>
          To the extent permitted by applicable law, TCUnnect is not
          responsible for the actions, conduct, or interactions of users
          outside the platform.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to These Terms">
        <p>
          We may update these Terms when necessary to reflect changes to
          TCUnnect, its features, or applicable requirements.
        </p>

        <p>
          When significant changes are made, we may provide notice through the
          platform or other appropriate means. Your continued use of TCUnnect
          after the updated Terms take effect means you accept the revised
          Terms.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact" last>
        <p>
          If you have questions or concerns about these Terms, you may contact
          us at:
        </p>

        <a
          href="mailto:alaokhemberly@gmail.com"
          className="inline-block mt-2 font-semibold text-primary hover:underline"
        >
          alaokhemberly@gmail.com
        </a>
      </LegalSection>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* PRIVACY POLICY                                                             */
/* -------------------------------------------------------------------------- */

function PrivacyContent() {
  return (
    <article className="text-[#1A1033]">
      <p className="text-sm sm:text-[15px] leading-7 text-slate-600 mb-7">
        This Privacy Policy explains what information TCUnnect collects, how
        we use and protect it, and your privacy rights. TCUnnect follows the
        principles of the Philippine Data Privacy Act of 2012 (Republic Act
        No. 10173) and applicable privacy regulations.
      </p>

      <LegalSection title="1. Information We Collect">
        <LegalList
          items={[
            "Account information: email address, securely stored password credentials, and name",
            "Profile information: department, year level, program, bio, interests, and profile photo",
            "Verification information: school ID or Certificate of Enrollment (COE) photo and selfie verification photo",
            "Activity information: likes, matches, messages, profile views, feed posts, comments, and votes",
            "Payment information: purchase records and selected payment method; payment credentials are handled by PayMongo",
            "Reports and moderation information: reports, moderation actions, and related records",
            "Technical information: IP address, device information, and login timestamps",
          ]}
        />
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <p>
          We use collected information to operate and maintain TCUnnect,
          verify eligible users, provide matching and messaging features,
          process Premium purchases, improve platform security, investigate
          reports, prevent abuse, and comply with applicable legal
          requirements.
        </p>
      </LegalSection>

      <LegalSection title="3. Your ID and Selfie Verification">
        <p>
          Student ID, COE, and selfie verification information is treated as
          restricted verification data. These materials are not displayed on
          public profiles or made available to other users.
        </p>

        <p>
          Access to verification information is limited to authorized
          personnel or service providers who need it for account verification,
          security, or other legitimate purposes.
        </p>
      </LegalSection>

      <LegalSection title="4. What Other Users Can See">
        <p>
          Depending on the features you use, other verified users may be able
          to see information such as your profile photo, department, year
          level, program, bio, and interests.
        </p>

        <p>
          Premium features may provide additional visibility into certain
          interactions, such as users who liked or viewed your profile.
        </p>

        <p>
          Your email address, student ID or COE, selfie verification photo,
          exact birthdate, and payment credentials are not displayed to other
          users.
        </p>

        <p>
          Campus Feed posts and comments are displayed anonymously to other
          users. However, TCUnnect may associate anonymous activity with the
          account that submitted it when necessary for moderation, safety,
          security, or legal compliance.
        </p>
      </LegalSection>

      <LegalSection title="5. Third-Party Services">
        <p>
          TCUnnect may use third-party service providers necessary to operate
          the platform, including Supabase for database, authentication, and
          storage services, and PayMongo for payment processing.
        </p>

        <p>
          We do not sell your personal information to advertisers or data
          brokers.
        </p>
      </LegalSection>

      <LegalSection title="6. Data Retention & Deletion">
        <p>
          You may request deletion of your TCUnnect account through Settings.
          When an account is deleted, your profile and associated activity,
          including matches, messages, likes, and other account activity, may
          be permanently removed from our active systems.
        </p>

        <p>
          Some information may be retained when reasonably necessary for
          security, fraud prevention, moderation, legal obligations, or other
          purposes permitted by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Security">
        <p>
          We take reasonable measures to protect personal information against
          unauthorized access, disclosure, alteration, or loss. Access to
          restricted information is limited based on the needs of the platform
          and its authorized personnel.
        </p>

        <p>
          However, no online service can guarantee that information will always
          remain completely secure.
        </p>
      </LegalSection>

      <LegalSection title="8. Your Privacy Rights">
        <p>
          Subject to applicable law, you may have rights to access and correct
          your personal information and request its deletion or other
          appropriate processing restrictions.
        </p>

        <p>
          You may also raise privacy concerns with the National Privacy
          Commission if you believe your rights under the Data Privacy Act
          have not been properly addressed.
        </p>
      </LegalSection>

      <LegalSection title="9. Children's Privacy">
        <p>
          TCUnnect is intended only for users who are 18 years old or older.
          Accounts found to belong to individuals under 18 may be removed.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy when necessary to reflect changes
          to TCUnnect, its features, or applicable privacy requirements.
        </p>

        <p>
          When significant changes are made, we may provide notice through
          TCUnnect or other appropriate means.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact" last>
        <p>
          For privacy questions, data requests, or concerns, you may contact
          us at:
        </p>

        <a
          href="mailto:alaokhemberly@gmail.com"
          className="inline-block mt-2 font-semibold text-primary hover:underline"
        >
          alaokhemberly@gmail.com
        </a>
      </LegalSection>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* SHARED COMPONENTS                                                          */
/* -------------------------------------------------------------------------- */

function LegalSection({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section
      className={
        last
          ? "pt-7"
          : "py-7 border-b border-[#EEEAF4]"
      }
    >
      <h2 className="text-base sm:text-lg font-bold text-[#1A1033] mb-4">
        {title}
      </h2>

      <div className="space-y-4 text-sm sm:text-[15px] leading-7 text-slate-600">
        {children}
      </div>
    </section>
  );
}

function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
      {items.map((item, index) => (
        <li key={index} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  );
}
```
