import React from 'react';
import SEOHead from '../components/SEOHead';
import { Mail, MessageCircle, Clock } from 'lucide-react';

const ContactUs = () => (
  <>
    <SEOHead
      title="Contact Us – redkitindia Support"
      description="Get in touch with redkitindia support team. We're here to help with eBook downloads, orders, refunds, and any queries about our digital bookstore."
      canonical="/contact"
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 font-display">Contact Us</h1>
        <p className="text-sm text-gray-500">We're here to help. Reach out to our support team anytime.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { icon: Mail, title: 'Email Support', info: 'support@redkitindia.com', sub: 'We reply within 24 hours' },
          { icon: MessageCircle, title: 'Live Chat', info: 'Available on site', sub: 'Mon–Sat, 9 AM – 8 PM IST' },
          { icon: Clock, title: 'Support Hours', info: 'Mon – Sat', sub: '9:00 AM – 8:00 PM IST' },
        ].map(({ icon: Icon, title, info, sub }) => (
          <div key={title} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center space-y-2">
            <div className="inline-flex p-2.5 bg-black text-white rounded-lg">
              <Icon size={20} />
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">{title}</h3>
            <p className="text-xs text-gray-700 font-medium">{info}</p>
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-gray-900">Send a Message</h2>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
              <input type="text" placeholder="Your name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
              <input type="email" placeholder="your@email.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Message</label>
            <textarea rows={4} placeholder="Describe your query..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black resize-none" />
          </div>
          <button type="submit" className="bg-black text-white font-extrabold px-6 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition-all">
            Send Message
          </button>
        </form>
      </div>
    </div>
  </>
);

export default ContactUs;
