import React from 'react';
import SEOHead from '../components/SEOHead';

const Section = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

const TermsOfService = () => (
  <>
    <SEOHead
      title="Terms of Service – redkitindia"
      description="Read redkitindia's Terms of Service. Understand the rules and conditions for using our digital eBook download platform."
      canonical="/terms-of-service"
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 font-display">Terms of Service</h1>
        <p className="text-xs text-gray-400">Last updated: November 2026</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <Section title="1. Acceptance of Terms">
          <p>By accessing and using redkitindia, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use of our platform.</p>
        </Section>
        <Section title="2. Digital Products">
          <p>All products sold on redkitindia are digital eBooks (PDF/EPUB format). Upon successful payment, download links are delivered instantly. Physical products are not available.</p>
        </Section>
        <Section title="3. Refund Policy">
          <p>We offer a 24-hour refund guarantee. If you are not satisfied with your purchase, contact us within 24 hours of purchase at support@redkitindia.com for a full refund.</p>
        </Section>
        <Section title="4. Intellectual Property">
          <p>All eBooks are for personal use only. Redistribution, reselling, or sharing of purchased digital files is strictly prohibited and may result in account termination.</p>
        </Section>
        <Section title="5. User Accounts">
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must not share your account with others or use it for commercial redistribution.</p>
        </Section>
        <Section title="6. Limitation of Liability">
          <p>redkitindia is not liable for any indirect, incidental, or consequential damages arising from your use of our platform. Our liability is limited to the amount paid for the disputed order.</p>
        </Section>
        <Section title="7. Governing Law">
          <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India.</p>
        </Section>
        <Section title="8. Contact">
          <p>For terms-related queries, email us at: <strong>support@redkitindia.com</strong></p>
        </Section>
      </div>
    </div>
  </>
);

export default TermsOfService;
