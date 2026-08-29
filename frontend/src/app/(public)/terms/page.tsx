import type { Metadata } from "next";

import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for LetsInternz, including account responsibilities, acceptable use, and legal disclaimers for using the platform.",
  keywords: ["LetsInternz terms of service", "terms and conditions", "user agreement"],
  alternates: { canonical: "/terms" },
};

export default function TermsOfServicePage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" lastUpdated="August 29, 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of
        LetsInternz (&ldquo;LetsInternz&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
        &ldquo;our&rdquo;), including the website, mobile experience, and related services
        (collectively, the &ldquo;Service&rdquo;).
      </p>
      <p>
        By creating an account or using the Service, you agree to these Terms. If you do
        not agree, you must not use the Service.
      </p>

      <h2>1. Eligibility and Account Responsibility</h2>
      <p>
        To use the Service, you must be at least 13 years old, or the minimum age required
        in your jurisdiction, and have the legal capacity to enter into a binding agreement.
      </p>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials
        and for all activity that occurs under your account. You agree to provide accurate,
        current, and complete information when creating an account and to update it if it
        changes.
      </p>
      <p>
        We may suspend or terminate access to your account if we believe you have violated
        these Terms or if your account is being used in a way that poses security or legal
        risk to the Service or other users.
      </p>

      <h2>2. Service Description</h2>
      <p>
        LetsInternz aggregates internship opportunities from multiple third-party sources and
        provides tools for discovering, saving, comparing, and tracking internship searches,
        applications, and related career activity.
      </p>
      <p>
        We do not guarantee that any internship listed on the Service is available, accurate,
        or still open. Internship availability, compensation, eligibility criteria, and
        application requirements are subject to the source platform and the employer.
      </p>
      <p>
        When you click through to an external platform or apply for a role, your interaction is
        governed by that third-party platform&apos;s own terms, policies, and procedures.
      </p>

      <h2>3. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for unlawful purposes or to facilitate unlawful activity.</li>
        <li>Impersonate another person or misrepresent your identity or affiliation.</li>
        <li>Submit false, misleading, or fraudulent information.</li>
        <li>Attempt to interfere with, disrupt, or compromise the integrity or security of the Service.</li>
        <li>Scrape, crawl, harvest, or extract data from the Service beyond what is reasonably necessary for personal use.</li>
        <li>Use bots, scripts, or automated processes that harm the Service or degrade user experience.</li>
        <li>Upload or distribute malicious content, spam, or abusive communications.</li>
      </ul>
      <p>
        We may remove content, restrict access, or take other action if we determine that your
        use of the Service violates these Terms or creates risk to other users, the platform,
        or our operations.
      </p>

      <h2>4. User Content</h2>
      <p>
        You may provide content such as profile details, resume information, saved internships,
        application notes, and other materials. You retain ownership of the content you submit,
        but by using the Service you grant LetsInternz a limited license to store, process,
        display, and operate the Service in connection with that content.
      </p>
      <p>
        You represent that you have the right to share any content you upload and that your
        content does not violate the rights of any third party.
      </p>
      <p>
        We may remove or refuse to display content that we believe is unlawful, abusive,
        inappropriate, or otherwise violates these Terms.
      </p>

      <h2>5. Fees and Subscription</h2>
      <p>
        LetsInternz may offer free access to certain features and may introduce paid features,
        plans, or premium tools in the future. If a paid feature is offered, additional terms
        and pricing will be disclosed before purchase.
      </p>
      <p>
        Unless otherwise stated, all fees are non-refundable except as required by applicable
        law or as expressly described in a specific offer.
      </p>

      <h2>6. Intellectual Property</h2>
      <p>
        The Service, including its design, branding, text, graphics, software, data,
        functionality, and content created by LetsInternz, is protected by intellectual
        property laws and remains the property of LetsInternz or its licensors.
      </p>
      <p>
        You may not reproduce, distribute, copy, modify, or create derivative works from the
        Service except as expressly permitted by these Terms or by prior written permission
        from LetsInternz.
      </p>

      <h2>7. Privacy and Data Use</h2>
      <p>
        Our data practices are described in our Privacy Policy. By using the Service, you
        agree to the collection, use, and disclosure of information as described in that
        Privacy Policy.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
        To the maximum extent permitted by law, LetsInternz makes no warranties, express or
        implied, including warranties of merchantability, fitness for a particular purpose,
        non-infringement, or continuous availability.
      </p>
      <p>
        We do not warrant that the Service will be error-free, uninterrupted, or free from
        harmful components, and we do not guarantee that all internship listings or related
        information will be complete or current.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, LetsInternz shall not be liable for any
        indirect, incidental, consequential, special, punitive, or similar damages arising
        from your use of or inability to use the Service.
      </p>
      <p>
        Our total liability for any claim arising out of the Service shall not exceed the
        amounts actually paid by you to LetsInternz, if any, or the amount of fees paid in
        the twelve months preceding the claim, whichever is lower.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless LetsInternz, its affiliates, officers,
        employees, and agents from any claims, liabilities, damages, losses, or expenses
        arising from your use of the Service, your content, or your violation of these Terms.
      </p>

      <h2>11. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time, with or without
        notice, if we believe you have violated these Terms or if the Service is no longer
        feasible to operate.
      </p>
      <p>
        Upon termination, your right to use the Service ends immediately, although certain
        obligations, including those relating to intellectual property, privacy, and liability,
        may continue to apply.
      </p>

      <h2>12. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time to reflect changes in the Service,
        applicable law, or our business practices. If we make material changes, we will
        update the date at the top of this page and, where appropriate, provide notice within
        the Service or via email.
      </p>
      <p>
        Continued use of the Service after changes are posted constitutes acceptance of the
        revised Terms.
      </p>

      <h2>13. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the jurisdiction in which LetsInternz is
        operated, without regard to conflict of law principles.
      </p>

      <h2>14. Contact</h2>
      <p>
        If you have questions about these Terms, please contact us through the support or
        contact channels available in the Service.
      </p>
    </LegalPage>
  );
}
