import React from 'react';
import SEOHead from '../components/SEOHead';

const Section = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

const PrivacyPolicy = () => (
  <>
    <SEOHead
      title="Privacy Policy – redkitindia"
      description="Read redkitindia's Privacy Policy. Learn how we collect, use, and protect your personal data when you use our digital eBook platform."
      canonical="/privacy-policy"
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 font-display">Privacy Policy</h1>
        <p className="text-xs text-gray-400">Last updated: November 2026</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <Section title="1. Information We Collect">
          <p>We collect information you provide when creating an account, making a purchase, or contacting support. This includes your name, email address, and payment details (processed securely via Razorpay).</p>
        </Section>
        <Section title="2. How We Use Your Information">
          <p>We use your data to process orders, deliver digital downloads, send order confirmations, and improve our services. We do not sell your personal information to third parties.</p>
        </Section>
        <Section title="3. Data Security">
          <p>All transactions are encrypted via SSL. Payment information is processed by Razorpay and is not stored on our servers. We implement industry-standard security measures to protect your data.</p>
        </Section>
        <Section title="4. Cookies">
          <p>We use essential cookies to maintain your session and preferences. We may use analytics cookies to understand how users interact with our platform. You can disable cookies in your browser settings.</p>
        </Section>
        <Section title="5. Third-Party Services">
          <p>We use Razorpay for payment processing, Google Drive for file storage, and ImageKit for image delivery. Each of these services has its own privacy policy.</p>
        </Section>
        <Section title="6. Your Rights">
          <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at support@redkitindia.com.</p>
        </Section>
        <Section title="7. Contact">
          <p>For privacy-related queries, email us at: <strong>support@redkitindia.com</strong></p>
        </Section>
      </div>
    </div>
  </>
);

export default PrivacyPolicy;
