import { useState, useEffect, type ReactNode } from "react";
import Logo from "../components/Logo";
import FooterPagesNav from "../components/FooterPagesNav";

type Props = {
  page: "terms" | "privacy";
  onNavigate: (v: string) => void;
};

export default function LegalPage({ page, onNavigate }: Props) {
  const isTerms = page === "terms";
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    function onScroll() {
      setAtTop(window.scrollY < 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F7FC]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#E9E5F2]">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-5 flex items-center justify-between">
          <Logo />

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("landing")}
              className="text-sm font-semibold text-slate-500 hover:text-primary transition"
            >
              ← Home
            </button>
            <button
              onClick={() => onNavigate("signup")}
              className="text-sm font-semibold text-primary hover:underline transition"
            >
              Log In / Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Page */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-28">
        <FooterPagesNav current={page} onNavigate={onNavigate} />

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
      </main>

      {/* Pinned bottom nav — always reachable, same idea as the sticky header */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-t border-[#E9E5F2]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center gap-6">
          <button
            onClick={() => onNavigate("landing")}
            className="text-sm font-semibold text-slate-500 hover:text-primary transition"
          >
            ← Back to Home
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="text-sm font-semibold text-primary hover:underline transition"
          >
            Log In / Sign Up
          </button>
        </div>
      </div>

      {/* Scroll to top / bottom toggle */}
      <button
        onClick={() =>
          atTop
            ? window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
            : window.scrollTo({ top: 0, behavior: "smooth" })
        }
        aria-label={atTop ? "Scroll to bottom" : "Scroll to top"}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-[#EC4899] text-white shadow-lg shadow-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300" style={{ transform: atTop ? "rotate(180deg)" : "rotate(0deg)" }}>
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TERMS OF SERVICE                                                           */
/* -------------------------------------------------------------------------- */

function TermsContent() {
  return (
    <article className="text-[#1A1033]">
      <p className="text-sm sm:text-[15px] leading-7 text-slate-600 mb-7 text-justify">
        These Terms of Service explain the rules for using TCUnnect. By
        creating an account or using TCUnnect, you agree to follow these
        Terms and use the platform responsibly.
      </p>

      <LegalSection title="1. Eligibility">
        <p>
          TCUnnect is intended for Taguig City University (TCU) students who
          are 18 years old or older.
        </p>

        <p>
          To use TCUnnect, you must be able to provide a valid TCU student ID
          or Certificate of Enrollment (COE) when required for verification.
        </p>

        <p>
          You agree that the information you provide is accurate, belongs to
          you, and is not intentionally false or misleading.
        </p>
      </LegalSection>

      <LegalSection title="2. Account & Verification">
        <p>
          To help keep TCUnnect limited to legitimate TCU students, your
          account may require student ID or COE verification and selfie
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
          TCUnnect may restrict, suspend, or remove an account if the
          information provided cannot be verified or if the account does not
          meet these requirements.
        </p>
      </LegalSection>

      <LegalSection title="3. Acceptable Use">
        <p>
          You are expected to use TCUnnect respectfully and responsibly. The
          platform should be used for genuine social connection and
          communication within the TCU community.
        </p>

        <p>You may not use TCUnnect to:</p>

        <LegalList
          items={[
            "Harass, threaten, bully, or intimidate other users",
            "Post hateful, abusive, or seriously offensive content",
            "Share illegal or prohibited content",
            "Send spam or deliberately misuse platform features",
            "Impersonate another person",
            "Share another person's private or personal information without their consent",
            "Use the platform for scams, fraud, or other harmful activities",
          ]}
        />

        <p>
          Depending on the situation, violations may result in content
          removal, a warning, temporary suspension, restricted features, or
          permanent account removal.
        </p>
      </LegalSection>

      <LegalSection title="4. Matching, Messaging & Blocking">
        <p>
          TCUnnect lets you discover other verified users, show interest,
          match with someone, and communicate through private messages.
        </p>

        <p>
          You can block another user at any time if you no longer want to
          interact with them or feel uncomfortable with the conversation.
          Blocking is silent, which means the other user will not receive a
          notification that they have been blocked.
        </p>

        <p>
          After you block someone, they will no longer be able to interact
          with you through the platform, and the conversation will no longer
          be available to them.
        </p>

        <p>
          You can also unmatch with someone at any time. Unmatching ends the
          current match and removes the connection between both users.
          Depending on the platform's matching rules, you may be able to see
          and match with each other again in Discover later.
        </p>

        <p>
          Please use matching and messaging responsibly. Do not use these
          features to harass, threaten, pressure, deceive, or repeatedly
          contact someone who has made it clear that they do not want to
          communicate with you.
        </p>
      </LegalSection>

      <LegalSection title="5. Anonymous Campus Feed">
        <p>
          TCUnnect's Campus Feed allows users to share posts and comments
          without publicly displaying their account identity.
        </p>

        <p>
          Posts and comments appear anonymously to other users. However,
          TCUnnect may still associate anonymous activity with the account
          that submitted it when necessary for moderation, safety, security,
          or compliance with applicable laws.
        </p>

        <p>
          Anonymous posting does not allow harassment, abuse, illegal
          content, or other behavior that violates these Terms.
        </p>
      </LegalSection>

      <LegalSection title="6. Premium Features & Payments">
        <p>
          TCUnnect may offer optional Premium features for a one-time fee of
          ₱30. The features included with Premium may depend on what is
          available at the time of purchase.
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
          If you experience a problem with a Premium purchase or the
          purchased features were not provided as described, you may contact
          us within 7 days of the purchase to request a refund. Refund
          requests will be reviewed based on the circumstances of the
          request.
        </p>
      </LegalSection>

      <LegalSection title="7. Reports & Moderation">
        <p>
          You may report accounts, messages, posts, comments, or other
          content that you believe violates these Terms or creates a safety
          concern.
        </p>

        <p>
          Our moderation team may review reports and take action when
          appropriate. This may include reviewing the reported content,
          account activity, or other information needed to understand the
          situation.
        </p>

        <p>
          Possible actions include removing content, issuing a warning,
          restricting features, suspending an account, or permanently
          removing an account.
        </p>

        <p>
          Not every report will necessarily result in action. Decisions may
          depend on the available information and the seriousness of the
          reported behavior.
        </p>
      </LegalSection>

      <LegalSection title="8. Account Deletion">
        <p>
          You may request deletion of your TCUnnect account through Settings.
        </p>

        <p>
          When your account is deleted, your profile and associated activity,
          including matches, messages, likes, and other user activity, may be
          permanently removed from the platform.
        </p>

        <p>
          Some limited information may be retained when reasonably necessary
          for security, fraud prevention, moderation records, legal
          obligations, or other purposes permitted by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="9. Safety & Disclaimer">
        <p>
          TCUnnect provides a platform for students to discover and
          communicate with other users. We cannot guarantee that every user's
          information, identity, intentions, or representations are accurate.
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
          When significant changes are made, we may provide notice through
          TCUnnect or another appropriate method. Your continued use of
          TCUnnect after the updated Terms take effect means that you accept
          the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact" last>
        <p>
          If you have questions, concerns, or requests regarding these Terms,
          you may contact us at:
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
      <p className="text-sm sm:text-[15px] leading-7 text-slate-600 mb-7 text-justify">
        This Privacy Policy explains what information TCUnnect collects, how
        we use and protect it, and what choices and rights are available to
        you. TCUnnect follows the principles of the Philippine Data Privacy
        Act of 2012 (Republic Act No. 10173) and applicable privacy
        regulations.
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
          We use the information we collect to operate and maintain TCUnnect,
          verify eligible users, provide matching and messaging features,
          process Premium purchases, maintain platform security, investigate
          reports, prevent abuse, and meet applicable legal requirements.
        </p>

        <p>
          Information may also be used to improve the reliability,
          functionality, and safety of the platform.
        </p>
      </LegalSection>

      <LegalSection title="3. Your ID and Selfie Verification">
        <p>
          Student ID, COE, and selfie verification information is treated as
          restricted verification data. These materials are not displayed on
          public profiles and are not made available to other users.
        </p>

        <p>
          Access to verification information is limited to authorized
          personnel or service providers who need it for account
          verification, security, or another legitimate purpose.
        </p>
      </LegalSection>

      <LegalSection title="4. What Other Users Can See">
        <p>
          Depending on the features you use, other verified users may be able
          to see information such as your profile photo, department, year
          level, program, bio, and interests.
        </p>

        <p>
          Some Premium features may provide additional visibility into
          certain interactions, such as users who liked or viewed your
          profile.
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
          TCUnnect may use third-party service providers that are necessary
          to operate the platform. These may include Supabase for database,
          authentication, and storage services, and PayMongo for payment
          processing.
        </p>

        <p>
          These providers may process information only as needed to provide
          their services to TCUnnect and according to their applicable
          policies and agreements.
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
          restricted information is limited based on the needs of the
          platform and its authorized personnel.
        </p>

        <p>
          However, no online service can guarantee that information will
          always remain completely secure. Users should also take reasonable
          steps to protect their account information and login credentials.
        </p>
      </LegalSection>

      <LegalSection title="8. Your Privacy Rights">
        <p>
          Subject to applicable law, you may have the right to access and
          correct your personal information and request its deletion or other
          appropriate action regarding how your information is processed.
        </p>

        <p>
          If you have a privacy concern, you may contact us first so we can
          review and address the issue. You may also raise a concern with the
          National Privacy Commission if you believe your rights under the
          Data Privacy Act have not been properly addressed.
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
          TCUnnect or another appropriate method. The updated version will
          include a revised "Last updated" date.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact" last>
        <p>
          For privacy questions, data requests, or concerns about how your
          information is handled, you may contact us at:
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
  children: ReactNode;
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

      <div className="space-y-4 text-sm sm:text-[15px] leading-7 text-slate-600 text-justify">
        {children}
      </div>
    </section>
  );
}

function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-2 marker:text-slate-400 text-left">
      {items.map((item, index) => (
        <li key={index} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  );
}
