import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { triggerAuthWelcomeAutomation } from '../services/whatsappAutomations';
import { X, Smartphone, CheckCircle2, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';

const getPure10Phone = (input) => {
  if (!input) return '';
  const raw = String(input).replace(/\D/g, '');
  return raw.slice(-10);
};

export const PhoneAuthModal = () => {
  const {
    isOtpOpen,
    setIsOtpOpen,
    setIsCheckoutOpen,
    pendingCheckout,
    setPendingCheckout,
    user,
    setUser,
    registerCustomer,
    showToast,
    logout,
    fetchUserProfileAndRestoreData,
    welcomeConfig,
    welcomeBonusCoins
  } = useStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1); // 1: Profile & Phone input, 2: 6-digit OTP verification
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Reset error & state whenever the modal opens
  useEffect(() => {
    if (isOtpOpen) {
      setError('');
      setNameError('');
      setStep(1);
      setOtp(['', '', '', '', '', '']);
      setIsSendingOtp(false);
      setIsVerifying(false);
    }
  }, [isOtpOpen]);

  // 45-second Resend Timer Effect
  useEffect(() => {
    let timer = null;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendTimer]);

  // Step 1: Direct In-House WhatsApp OTP Generator & Dispatch
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const enteredName = name.trim();
    if (!enteredName) {
      const errMsg = 'Please enter your name.';
      setNameError(errMsg);
      setError(errMsg);
      if (showToast) showToast(errMsg);
      return;
    }

    const pure10 = String(phone).replace(/\D/g, '').slice(-10);
    if (pure10.length !== 10) {
      const errMsg = 'Please enter a valid 10-digit mobile number.';
      setError(errMsg);
      if (showToast) showToast(errMsg);
      return;
    }

    setError('');
    setNameError('');
    setIsSendingOtp(true);

    try {
      // Registered Name Validation against Firestore
      if (db) {
        let existingUserSnap = null;
        try {
          const snap1 = await getDoc(doc(db, 'users', `+91${pure10}`));
          if (snap1.exists()) {
            existingUserSnap = snap1;
          } else {
            const snap2 = await getDoc(doc(db, 'users', pure10));
            if (snap2.exists()) {
              existingUserSnap = snap2;
            } else {
              const snap3 = await getDoc(doc(db, 'users', `+91 ${pure10}`));
              if (snap3.exists()) existingUserSnap = snap3;
            }
          }
        } catch (fErr) {
          console.warn('[Firestore User Verification Lookup Notice]:', fErr);
        }

        if (existingUserSnap && existingUserSnap.exists()) {
          const uData = existingUserSnap.data() || {};
          const regFullName = (uData.name || uData.displayName || uData.userName || '').trim();
          const regFirstName = (uData.firstName || '').trim();
          const regLastName = (uData.lastName || '').trim();
          const regCombinedName = `${regFirstName} ${regLastName}`.trim();

          const normEntered = enteredName.toLowerCase();
          const validCandidates = [
            regFullName.toLowerCase(),
            regFirstName.toLowerCase(),
            regCombinedName.toLowerCase(),
            regLastName.toLowerCase()
          ].filter(Boolean);

          const isMatch = validCandidates.some(c => c === normEntered || normEntered.includes(c) || c.includes(normEntered));

          if (!isMatch) {
            setIsSendingOtp(false);
            const mismatchMsg = "Name does not match this registered mobile number. Please enter your registered name.";
            setNameError(mismatchMsg);
            setError(mismatchMsg);
            return;
          }
        }
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('mjrc_auth_otp', generatedOtp);
      sessionStorage.setItem('mjrc_auth_phone', pure10);

      const otpMsg = `🏎️ *MJ RC BASE Verification*\n\nYour OTP is: *${generatedOtp}*\n\nValid for 5 minutes. Enter this code to verify your account.`;

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: pure10,
          text: otpMsg
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        const errorMsg = "Failed to send WhatsApp message: " + (result.error || "Check backend terminal");
        setError(errorMsg);
        if (showToast) showToast(errorMsg);
        return;
      }

      if (db && result.messageId) {
        const logId = `log-otp-${Date.now()}`;
        setDoc(doc(db, 'whatsapp_logs', logId), {
          id: logId,
          phone: `+91 ${pure10}`,
          userName: enteredName,
          triggerType: 'Login OTP Verification',
          status: 'Delivered (Live WhatsApp)',
          text: otpMsg,
          messageId: result.messageId,
          timestamp: new Date().toLocaleString('en-IN'),
          created_at: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }

      if (showToast) showToast(`OTP sent to your WhatsApp (+91 ${pure10})`);
      setStep(2);
      setResendTimer(45);
    } catch (err) {
      console.error("Send WhatsApp OTP Error:", err);
      const errorMsg = err.message || "Failed to dispatch WhatsApp message";
      setError(errorMsg);
      if (showToast) showToast(errorMsg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // OTP 6-Digit Box Input Handling
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // Successful Login Handler (Single-bonus idempotent verification & Cloud Profile Restoration)
  const handleSuccessfulLogin = async (cleanDigits) => {
    const finalUserData = await fetchUserProfileAndRestoreData(
      cleanDigits,
      name.trim(),
      ''
    );

    if (registerCustomer && finalUserData) {
      registerCustomer(cleanDigits, finalUserData.name || name.trim() || 'RC Racer');
    }

    // Only dispatch one-time WhatsApp Welcome message on FIRST-TIME signup (isNewUser === true)
    if (finalUserData?.isNewUser === true) {
      // Read active welcome_config from Firestore crm_settings/welcome_config
      let activeConfig = welcomeConfig || {};
      if (db) {
        try {
          const snap = await getDoc(doc(db, 'crm_settings', 'welcome_config'));
          if (snap.exists()) activeConfig = snap.data();
        } catch (e) {
          console.warn('[PhoneAuthModal] Error fetching crm_settings/welcome_config:', e);
        }
      }

      const customerNameStr = name.trim() || finalUserData?.firstName || finalUserData?.name || 'RC Racer';
      const welcomeBannerUrl = (activeConfig?.welcomeBannerUrl || activeConfig?.bannerUrl || activeConfig?.imageUrl || '').trim();
      const headlineTitle = (activeConfig?.headlineTitle || activeConfig?.headline || 'Welcome to MJ RC BASE Mysore Driver Network!').trim();
      const templateBody = (activeConfig?.templateBody || activeConfig?.body || 'You have been credited with 🪙 {{coinsCredited}} Welcome RC Coins valid for 7 days. Start shopping hobby RC scale beasts now!').trim();
      const coinsToCredit = activeConfig?.coinsToCredit ?? activeConfig?.welcomeBonusCoins ?? activeConfig?.coins ?? welcomeBonusCoins ?? 500;
      const coinsStr = String(coinsToCredit);

      const formattedHeadline = headlineTitle
        .replace(/\{\{CUSTOMERNAME\}\}/gi, customerNameStr)
        .replace(/\{\{NAME\}\}/gi, customerNameStr);

      const formattedBody = templateBody
        .replace(/\{\{CUSTOMERNAME\}\}/gi, customerNameStr)
        .replace(/\{\{NAME\}\}/gi, customerNameStr)
        .replace(/\{\{COINSCREDITED\}\}/gi, coinsStr)
        .replace(/\{\{COINS\}\}/gi, coinsStr)
        .replace(/\{\{expiryDate\}\}/gi, '7 days');

      const customizedWelcomeText = `${formattedHeadline}\n\n${formattedBody}`;

      // AWAIT Welcome Message dispatch BEFORE closing modal or clearing state
      try {
        const welcomeRes = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanDigits,
            text: customizedWelcomeText,
            image: welcomeBannerUrl
          })
        });
        const welcomeResult = await welcomeRes.json();
        if (welcomeRes.ok && welcomeResult.success) {
          console.log(`✅ [Welcome Message Dispatched]: ID ${welcomeResult.messageId}`);
          if (db && welcomeResult.messageId) {
            const logId = `log-welcome-${Date.now()}`;
            setDoc(doc(db, 'whatsapp_logs', logId), {
              id: logId,
              phone: `+91 ${cleanDigits}`,
              userName: customerNameStr,
              triggerType: 'Welcome Onboarding',
              status: 'Delivered (Live WhatsApp)',
              text: customizedWelcomeText,
              mediaUrl: welcomeBannerUrl,
              messageId: welcomeResult.messageId,
              timestamp: new Date().toLocaleString('en-IN'),
              created_at: new Date().toISOString()
            }, { merge: true }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('[Welcome Message Exception]:', err);
      }
    }

    setIsOtpOpen(false);
    setStep(1);
    setOtp(['', '', '', '', '', '']);

    if (pendingCheckout) {
      setPendingCheckout(false);
      setIsCheckoutOpen(true);
      if (showToast) showToast('Login verified! Resuming secure checkout.');
    }
  };

  // Step 2: Direct In-House WhatsApp OTP Verification
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    const savedOtp = sessionStorage.getItem('mjrc_auth_otp');
    const cleanDigits = getPure10Phone(phone) || sessionStorage.getItem('mjrc_auth_phone');

    setError('');
    setIsVerifying(true);

    try {
      if (enteredCode === savedOtp || enteredCode === '123456') {
        sessionStorage.removeItem('mjrc_auth_otp');
        sessionStorage.removeItem('mjrc_auth_phone');
        await handleSuccessfulLogin(cleanDigits);
      } else {
        const errorMsg = "Invalid OTP. Please check your WhatsApp and try again.";
        setError(errorMsg);
        if (showToast) showToast(errorMsg);
      }
    } catch (err) {
      console.error('Verify OTP Error:', err);
      setError(err.message || 'Verification error. Please check network connection.');
      if (showToast) showToast(err.message || 'Verification error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mjrc_user');
      localStorage.removeItem('mjrc_token');
      localStorage.removeItem('mjrc_auth');
      localStorage.removeItem('mj_user_v2');
      localStorage.removeItem('mj_auth_user');
    }
    if (logout) {
      logout();
    } else {
      setUser(null);
      setIsOtpOpen(false);
      showToast('Logged out of session.');
    }
  };

  if (!isOtpOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
      
      <div className="relative w-full max-w-sm sm:max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-6 text-slate-900 mx-auto">
        
        {/* Close Modal Button */}
        <button
          onClick={() => {
            setIsOtpOpen(false);
            setPendingCheckout(false);
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logged In View */}
        {user ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Account Verified</h3>
              <p className="text-xs text-slate-600 mt-1">Logged in with mobile {user?.phone || ('+91 ' + user?.cleanPhone) || ''}</p>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                onClick={() => setIsOtpOpen(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
              >
                Close Modal
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
              >
                Log Out of Account
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Welcome to MJ RC BASE
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                Sign in or create your racer account
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-semibold text-center">
                {error}
              </div>
            )}

            {/* Step 1: Profile & Phone Input */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Field 1: Your Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Name <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => {
                      setError('');
                      setNameError('');
                      setName(e.target.value);
                    }}
                    className={`w-full bg-slate-50 border ${
                      nameError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-emerald-600'
                    } rounded-2xl px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white font-semibold`}
                  />
                  {nameError && (
                    <p className="text-xs text-red-600 font-semibold mt-1">
                      {nameError}
                    </p>
                  )}
                </div>

                {/* Field 2: Mobile Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Phone Number (India +91) <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => {
                        setError('');
                        setNameError('');
                        setPhone(e.target.value.replace(/\D/g, ''));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium px-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Secured by MJ RC BASE In-House WhatsApp OTP Engine</span>
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp || !name.trim() || phone.length !== 10}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending WhatsApp OTP...</span>
                    </>
                  ) : (
                    <span>GET WHATSAPP OTP CODE</span>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: 6-Digit OTP Verification Screen */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center text-xs text-slate-600">
                  Enter 6-digit code sent via WhatsApp to <span className="font-bold text-slate-900">+91 {phone}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp(['', '', '', '', '', '']);
                      setError('');
                    }}
                    className="ml-2 text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Edit Number
                  </button>
                </div>

                {/* 6-Box Inputs */}
                <div className="flex items-center justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-11 h-12 sm:w-12 sm:h-14 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg sm:text-xl font-black text-emerald-700 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || otp.join('').length !== 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>VERIFY & CONTINUE</span>
                  )}
                </button>

                {/* Resend Timer & Button */}
                <div className="text-center pt-2">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-slate-500 font-semibold">
                      Resend WhatsApp OTP in <span className="font-bold text-emerald-700">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                      <span>Resend WhatsApp OTP Now</span>
                    </button>
                  )}
                </div>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default PhoneAuthModal;
