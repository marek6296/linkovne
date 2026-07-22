import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";
import { BRAND_TITLE, SITE_DOMAIN } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BRAND_TITLE} collects, uses and protects your data.`,
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="22 July 2026">
      <p>
        This Privacy Policy explains how {BRAND_TITLE} (“we”, “us”) collects,
        uses and protects your personal data when you use {SITE_DOMAIN} and the
        pages we host on your behalf. We are the data controller for the account
        data described below.
      </p>

      <h2>Who we are</h2>
      <p>
        {BRAND_TITLE} is a link-in-bio service that lets creators host a single
        page with their links, on our domain or their own. For any privacy
        question, contact us at{" "}
        <a href="mailto:privacy@linkovne.com">privacy@linkovne.com</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — your email address and a securely
          hashed password (we never see your plain password). Optional profile
          details you add: display name, bio, avatar and your links.
        </li>
        <li>
          <strong>Payment data</strong> — if you subscribe, payments are handled
          by <strong>Stripe</strong>. We do not store or see your full card
          number; we only keep a Stripe customer/subscription reference and your
          plan status.
        </li>
        <li>
          <strong>Privacy-friendly analytics</strong> — for published pages we
          count page views and link clicks. We store the visitor’s country
          (derived from IP, which we do not retain), device type (mobile /
          desktop) and referring source. We do <strong>not</strong> use
          advertising cookies, cross-site tracking or third-party pixels, and we
          do not build visitor profiles or sell data.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use only essential cookies needed to keep you signed in. We do not use
        analytics, advertising or tracking cookies, so no cookie-consent banner
        is required for optional cookies.
      </p>

      <h2>How we use your data</h2>
      <ul>
        <li>To provide and operate your account and pages.</li>
        <li>To process subscriptions and prevent fraud (via Stripe).</li>
        <li>To show you your own visit and click statistics.</li>
        <li>To send essential service emails (e.g. password resets).</li>
        <li>To keep the service secure and comply with our legal obligations.</li>
      </ul>

      <h2>Legal bases (GDPR)</h2>
      <p>
        We process data to perform our contract with you (running your account),
        on the basis of our legitimate interests (security, product analytics of
        your own pages), to comply with legal obligations, and — where required —
        with your consent, which you may withdraw at any time.
      </p>

      <h2>Who we share data with</h2>
      <p>
        We share data only with processors that help us run the service, under
        appropriate safeguards:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — database, authentication and file storage.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and content delivery.
        </li>
        <li>
          <strong>Stripe</strong> — subscription payments.
        </li>
        <li>
          <strong>Resend</strong> — transactional email delivery.
        </li>
      </ul>
      <p>
        We do not sell your personal data. Some providers may process data
        outside the EU/EEA; where they do, they rely on recognised safeguards
        such as Standard Contractual Clauses.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep account data while your account is active. If you delete your
        account, we remove your profile, pages and associated content. We may
        retain limited records where required by law (for example billing
        records).
      </p>

      <h2>Your rights</h2>
      <p>
        Under GDPR you can request access to, correction of, or deletion of your
        personal data, object to or restrict certain processing, and request
        portability. You can delete your account and pages at any time from your
        dashboard, or contact us at{" "}
        <a href="mailto:privacy@linkovne.com">privacy@linkovne.com</a>. You also
        have the right to complain to your local data-protection authority.
      </p>

      <h2>Age</h2>
      <p>
        {BRAND_TITLE} is not intended for anyone under 18. By using the service
        you confirm you are at least 18 years old.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. Material changes will be
        reflected by the “Last updated” date above.
      </p>
    </LegalShell>
  );
}
