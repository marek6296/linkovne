import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";
import { BRAND_TITLE, SITE_DOMAIN } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that govern your use of ${BRAND_TITLE}.`,
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="22 July 2026">
      <p>
        These Terms govern your use of {BRAND_TITLE} at {SITE_DOMAIN} (the
        “Service”). By creating an account or using the Service, you agree to
        these Terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old to use {BRAND_TITLE}. By using the
        Service you confirm that you are 18 or older and legally able to enter
        into this agreement.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for the activity on your account and for keeping your
        login credentials secure. Notify us promptly of any unauthorised use. You
        must provide accurate information and keep it up to date.
      </p>

      <h2>3. Your content</h2>
      <p>
        You retain ownership of the content you add (links, text, images, and
        similar). You grant us a limited licence to host, display and deliver
        that content solely to operate the Service. You are solely responsible
        for your content and confirm that:
      </p>
      <ul>
        <li>you own it or have the rights to use and share it;</li>
        <li>it does not infringe anyone’s rights or break any law;</li>
        <li>
          it complies with the acceptable-use rules below and with the rules of
          any platform you link to.
        </li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You must not use the Service to publish, link to, or promote:</p>
      <ul>
        <li>
          any content involving minors, non-consensual material, or any content
          that is illegal in your jurisdiction or ours;
        </li>
        <li>
          malware, phishing, scams, or attempts to deceive or defraud visitors;
        </li>
        <li>
          harassment, hateful content, or infringement of intellectual-property
          or privacy rights;
        </li>
        <li>
          anything that violates applicable laws or the terms of the platforms
          you distribute your link on.
        </li>
      </ul>
      <p>
        Adult content is permitted only where it is legal, involves consenting
        adults, and is appropriately age-gated. We may remove content or suspend
        accounts that breach these rules.
      </p>

      <h2>5. Reporting</h2>
      <p>
        To report content that violates these Terms or the law, contact{" "}
        <a href="mailto:report@linkovne.com">report@linkovne.com</a>. We review
        reports and may remove content or take action on accounts as appropriate.
      </p>

      <h2>6. Subscriptions &amp; payments</h2>
      <p>
        Paid plans are billed through <strong>Stripe</strong> on a recurring
        basis (monthly) until cancelled. You can cancel at any time from your
        dashboard; cancellation stops future renewals and your paid features
        remain until the end of the current billing period. Except where required
        by law, payments already made are non-refundable. Prices may change with
        notice for future billing periods.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time. We may
        suspend or terminate accounts that breach these Terms or where required by
        law.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Service is provided “as is” without warranties of any kind. We do not
        guarantee that any link will remain accessible on any third-party
        platform, or that the Service will be uninterrupted or error-free.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {BRAND_TITLE} is not liable for
        indirect, incidental or consequential damages, or for loss of profits,
        data or goodwill arising from your use of the Service.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Slovak Republic and the
        European Union, without regard to conflict-of-law rules.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these Terms from time to time. Material changes will be
        reflected by the “Last updated” date above; continued use after changes
        means you accept them.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href="mailto:support@linkovne.com">support@linkovne.com</a>.
      </p>
    </LegalShell>
  );
}
