import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { BookOpen, Download, ShieldCheck, Headphones } from 'lucide-react';

const AboutUs = () => (
  <>
    <SEOHead
      title="About Us – redkitindia Digital Bookstore"
      description="Learn about redkitindia, India's premier online digital bookstore. We offer instant PDF & EPUB eBook downloads, DRM-free reading, and a 24-hour refund guarantee."
      canonical="/about"
    />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-black text-white p-3 rounded-xl mb-2">
          <BookOpen size={28} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-display">About redkitindia</h1>
        <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
          India's premier online destination for digital eBooks — instant downloads, offline reading, and zero shipping hassles.
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-extrabold text-gray-900 font-display">Our Mission</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          At redkitindia, we believe that knowledge should be instantly accessible to every reader in India and beyond. 
          Our mission is to deliver the world's best books — from timeless classics to modern bestsellers — directly 
          to your device in seconds. No shipping delays, no plastic waste, no waiting.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          We curate over 10,000 DRM-free PDF and EPUB titles across Fiction, Self-Help, Technology, History, Science, 
          Biography, and more — all available for instant download the moment your payment is confirmed.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          { icon: Download, title: 'Instant Digital Delivery', desc: 'Download your eBooks within seconds of payment. No shipping, no waiting — just instant access.' },
          { icon: ShieldCheck, title: '100% Genuine eBooks', desc: 'Every title is verified and available in universal PDF & EPUB formats compatible with all devices.' },
          { icon: Headphones, title: '24/7 Customer Support', desc: 'Our support team is always ready to help you with downloads, refunds, or any queries.' },
          { icon: BookOpen, title: '24-Hour Refund Guarantee', desc: 'Not satisfied? Request a full refund within 24 hours — no questions asked.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex gap-4">
            <div className="p-2.5 bg-black text-white rounded-lg flex-shrink-0 h-fit">
              <Icon size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 mb-1">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="text-center pt-4">
        <Link to="/books" className="inline-flex items-center gap-2 bg-black text-white font-extrabold px-6 py-3 rounded-xl text-sm hover:bg-gray-800 transition-all">
          Browse Our eBook Collection
        </Link>
      </div>
    </div>
  </>
);

export default AboutUs;
