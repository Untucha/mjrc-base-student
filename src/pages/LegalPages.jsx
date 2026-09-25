import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, ShieldAlert, FileText, Lock, MessageCircle, CheckCircle2, ShieldCheck, Box, Phone } from 'lucide-react';

const LegalPageLayout = ({ icon: Icon, title, subtitle, badgeText, children }) => {
  const navigate = useNavigate();

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-[75vh] font-sans text-slate-900 space-y-6">
      
      {/* Top Back Navigation Button */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-emerald-600" />
        <span>← Back to Storefront</span>
      </button>

      {/* Hero Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{badgeText || 'Shiprocket & Payment Verified'}</span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{title}</h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 leading-relaxed text-sm text-slate-700 font-medium">
        {children}
      </div>

      {/* Support Footer Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-sm">Need Policy Assistance or Order Queries?</div>
            <div className="text-slate-600 font-semibold">Our Mysore Hub technical team is available 10 AM - 7 PM</div>
          </div>
        </div>

        <a
          href="https://wa.me/919686078395?text=Hi%20MJ%20RC%20BASE%2C%20I%20have%20a%20query%20regarding%20store%20policies."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>

    </div>
  );
};

// 1. Shipping & Delivery Policy
export const ShippingPolicyPage = () => {
  return (
    <LegalPageLayout
      icon={Truck}
      title="Shipping & Delivery Policy"
      subtitle="Domestic dispatch guidelines via Shiprocket logistics network"
      badgeText="Shiprocket Verified Logistics"
    >
      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          1. Mysore Central Hub Order Fulfillment
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          All orders placed on <strong>MJ RC BASE</strong> are processed, bench-tested, and dispatched directly from our central fulfillment hub in Mysuru (Mysore), Karnataka, India via our integrated <strong>Shiprocket logistics network</strong>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          2. Dispatch Timeframe (24-48 Business Hours)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Orders are packed, quality-inspected, and handed over to premier courier partners (BlueDart, Delhivery, Express Air, DTDC) within <strong>24 to 48 business hours</strong> of payment confirmation. Orders placed on Sundays or national holidays are dispatched on the next working day.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          3. Delivery Transit Time (3 to 7 Business Days)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Standard domestic delivery across India takes approximately <strong>3 to 7 business days</strong> depending on your delivery address, state location, and courier pin-code serviceability. Remote tier-3 locations may require 1-2 additional transit days.
        </p>
      </section>

      <section className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          4. Live Order Tracking & Dispatch Alerts
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Once your package is handed over to the courier partner, an automated dispatch alert containing your <strong>Shiprocket AWB tracking number</strong> and live courier tracking link will be sent directly to your registered WhatsApp number, SMS, and Email.
        </p>
      </section>
    </LegalPageLayout>
  );
};

// 2. Replacement & Return Policy
export const ReplacementPolicyPage = () => {
  return (
    <LegalPageLayout
      icon={ShieldAlert}
      title="Replacement & Return Policy"
      subtitle="Dead-on-Arrival protection & hobby-grade machine guidelines"
      badgeText="48-Hour DOA Protection"
    >
      {/* Important Disclaimer Alert Box */}
      <div className="bg-amber-500/10 border border-amber-400/80 rounded-2xl p-4 space-y-2 text-amber-950">
        <div className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-900">
          ⚠️ Important Hobby-Grade Disclaimer
        </div>
        <p className="text-xs leading-relaxed font-semibold">
          High-performance scale RC cars are technical hobby machines built for extreme speeds. Due to their physical nature, products do <strong>NOT carry after-use or post-run warranties</strong> against crashing, water damage, improper LiPo battery voltage usage, collision, or mechanical wear.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          1. 48-Hour Dead-On-Arrival (DOA) / In-Box Defect Replacement
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          If your product arrives physically broken, damaged, or defective right out of the sealed manufacturer box, customers must notify our support team within <strong>48 hours of parcel delivery</strong>.
        </p>
      </section>

      <section className="space-y-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
        <h2 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          2. Mandatory Requirement: Uncut Parcel Unboxing Video
        </h2>
        <p className="text-xs sm:text-sm text-emerald-900 font-semibold">
          To qualify for a replacement claim, customers MUST provide a <strong>continuous, uncut, single-take video recording</strong> starting from opening the outer sealed courier parcel, showing the shipping label, inspecting the box contents, and performing initial power-on testing. Claims without an uncut unboxing video cannot be approved.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          3. Factory In-Box Accessories & Spares Coverage
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Every vehicle kit strictly includes the original factory-supplied accessories (2.4GHz transmitter, stock battery, charger, wheel wrench, and manual) as listed in the manufacturer box contents. Additional external spare parts or crash replacements are sold separately.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          4. Change of Mind Policy
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Returns, refunds, or exchanges for change of mind are strictly not accepted once the outer manufacturer seal or package seal has been opened.
        </p>
      </section>
    </LegalPageLayout>
  );
};

// 3. Terms & Conditions
export const TermsConditionsPage = () => {
  return (
    <LegalPageLayout
      icon={FileText}
      title="Terms & Conditions"
      subtitle="Official terms of service & store agreement"
      badgeText="Legal Agreement"
    >
      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          1. Enterprise & Business Operations
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          <strong>MJ RC BASE</strong> is an e-commerce hobby storefront operating out of Mysuru (Mysore), Karnataka, India. By accessing our website, placing an order, or utilizing our services, you agree to be bound by these terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          2. Real-Time Pricing & Stock Availability
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          All prices, MRPs, promotional offers, and stock availability on our storefront are subject to real-time adjustments without prior notice. In the rare event of a pricing typo or stock discrepancy, we reserve the right to cancel the affected order and issue a full refund.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          3. Buyer Usage & Hobby Safety Responsibility
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Buyers acknowledge that high-speed scale RC vehicles are motorized hobby products requiring responsible operation, adult supervision for minors, proper LiPo battery handling, and periodic maintenance. MJ RC BASE is not liable for injury or damage resulting from reckless operation.
        </p>
      </section>
    </LegalPageLayout>
  );
};

// 4. Privacy Policy
export const PrivacyPolicyPage = () => {
  return (
    <LegalPageLayout
      icon={Lock}
      title="Privacy Policy"
      subtitle="Customer data security & payment gateway encryption details"
      badgeText="256-Bit Encrypted Safety"
    >
      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          1. Customer Data Safety & Courier Logistics
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Customer details collected during checkout (full name, shipping address, phone number, and email) are strictly used for order fulfillment. Data is shared exclusively with <strong>Shiprocket</strong> and assigned courier partners solely for accurate parcel delivery.
        </p>
      </section>

      <section className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          2. Encrypted Payment Processing
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          No credit card numbers, debit card details, CVVs, or UPI PINs are ever stored or accessible on our servers. All online payment transactions are processed directly via certified gateway partners utilizing <strong>256-Bit SSL Bank-Grade Encryption</strong>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          3. WhatsApp & Order Communications
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Order updates, Shiprocket tracking numbers, and AWB dispatches are communicated via automated WhatsApp and SMS alerts to keep you informed of your shipment status.
        </p>
      </section>
    </LegalPageLayout>
  );
};
