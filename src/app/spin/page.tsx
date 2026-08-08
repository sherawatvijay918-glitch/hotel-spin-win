"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SpinWheel from "@/components/SpinWheel";
import CouponCard from "@/components/CouponCard";
import confetti from "canvas-confetti";
import {
  Gift,
  Loader2,
  Sparkles,
  AlertCircle,
  Phone,
  User,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Ticket,
} from "lucide-react";

interface Reward {
  rewardId: string;
  rewardName: string;
  probability: number;
}

interface SpinResult {
  customerName: string;
  rewardName: string;
  couponCode: string;
  createdAt: string;
  expiresAt: string;
}

type Step = "form" | "wheel" | "coupon" | "blocked";

export default function SpinPage() {
  const [step, setStep] = useState<Step>("form");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);



  // Spin control states
  const [targetRewardId, setTargetRewardId] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [wonCoupon, setWonCoupon] = useState<SpinResult | null>(null);

  // Existing coupon if blocked duplicate
  const [existingCoupon, setExistingCoupon] = useState<SpinResult | null>(null);

  // Fetch active rewards for the wheel
  useEffect(() => {
    const fetchActiveRewards = async () => {
      try {
        const rewardsRef = collection(db, "rewards");
        const q = query(rewardsRef, where("active", "==", true));
        const snapshot = await getDocs(q);

        const fetchedRewards: Reward[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedRewards.push({
            rewardId: doc.id,
            rewardName: data.rewardName,
            probability: data.probability || 0,
          });
        });

        fetchedRewards.sort((a, b) => a.rewardId.localeCompare(b.rewardId));
        setRewards(fetchedRewards);
      } catch (err: any) {
        console.error("Error loading rewards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveRewards();
  }, []);



  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validations
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const cleanPhone = mobile;

    if (!termsAccepted) {
      setError("You must accept the terms and conditions to proceed.");
      return;
    }

    setSubmitLoading(true);

    try {
      // Call secure eligibility API
      const response = await fetch("/api/spin/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Eligibility check failed.");
      }

      if (data.eligible) {
        // Safe to proceed to the wheel
        setStep("wheel");
      } else {
        // Duplicate blocked -> show existing coupon directly
        setExistingCoupon(data.existingSpin);
        if (data.existingSpin) {
          localStorage.setItem("user_spin_coupon", JSON.stringify(data.existingSpin));
        }
        setStep("blocked");
      }
    } catch (err: any) {
      console.error("Form eligibility check error:", err);
      setError(err.message || "Failed to validate details. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const triggerSpin = async () => {
    if (isSpinning) return;
    setError(null);
    setSubmitLoading(true);

    try {
      const cleanPhone = mobile.replace(/[^\d+]/g, "");
      const response = await fetch("/api/spin/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          mobile: cleanPhone,
          email: email.trim(),
          termsAccepted: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to process spin.");
      }

      const wonData = {
        customerName: data.spin.customerName,
        rewardName: data.spin.rewardName,
        couponCode: data.spin.couponCode,
        createdAt: data.spin.createdAt,
        expiresAt: data.spin.expiresAt,
      };

      setWonCoupon(wonData);
      setTargetRewardId(data.spin.rewardId);
      setIsSpinning(true);
    } catch (err: any) {
      console.error("Spin claim error:", err);
      setError(err.message || "Something went wrong while spinning.");
      setSubmitLoading(false);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleWheelFinished = () => {
    if (wonCoupon) {
      localStorage.setItem("user_spin_coupon", JSON.stringify(wonCoupon));
    }
    setStep("coupon");
    confetti({
      particleCount: 180,
      spread: 90,
      origin: { y: 0.55 },
      colors: ["#D4AF37", "#FFFFFF", "#1E293B", "#A87C39"],
    });
  };

  // Check local storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_spin_coupon");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.couponCode) {
            setWonCoupon(parsed);
            setStep("coupon");
          }
        } catch (e) {
          console.error("Error reading stored coupon:", e);
        }
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white px-4">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium tracking-wide">
          Loading Campaign Experience...
        </p>
      </div>
    );
  }

  // Pre-configured fallback wheel segments if database is empty
  const activeRewardsList = rewards.length > 0 ? rewards : [
    { rewardId: "1", rewardName: "10% OFF on Food Bill", probability: 25 },
    { rewardId: "2", rewardName: "Welcome Drink FREE", probability: 20 },
    { rewardId: "3", rewardName: "Starter FREE", probability: 15 },
    { rewardId: "4", rewardName: "Dessert FREE", probability: 15 },
    { rewardId: "5", rewardName: "Breakfast for 2 FREE", probability: 10 },
    { rewardId: "6", rewardName: "15% OFF on Room Booking", probability: 7 },
    { rewardId: "7", rewardName: "Room Upgrade FREE", probability: 3 },
    { rewardId: "8", rewardName: "₹500 OFF on Room Booking", probability: 5 },
  ];

  return (
    <div className="min-h-screen text-white font-sans flex flex-col justify-between py-8 px-4 md:px-8 relative overflow-hidden bg-[url('/hotel_lobby_bg.png')] bg-cover bg-center">
      {/* Dark overlay with blur for luxury aesthetic */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-0"></div>

      {/* Header Branding */}
      <header className="text-center z-10 space-y-1">
        <h1 className="text-amber-500 font-serif text-3xl font-light tracking-[0.25em] uppercase">
          7 BLUE HILLS
        </h1>
        <p className="text-slate-400 text-[10px] tracking-[0.4em] uppercase font-bold">
          Hotel & Restaurant
        </p>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 z-10 max-w-lg mx-auto w-full">


        {/* STEP 2: CUSTOMER DETAILS FORM */}
        {step === "form" && (
          <div className="w-full hotel-card rounded-2xl p-6 md:p-8 space-y-6 animate-fade-in-up">
            <div className="hotel-card-inner-frame"></div>
            <div className="text-center space-y-1 z-10 relative">
              <h2 className="text-2xl font-serif font-light text-white tracking-wider">
                Enter Your Details
              </h2>
              <div className="w-16 h-[1px] bg-amber-500/30 mx-auto my-3"></div>
              <p className="text-xs text-slate-400">
                Just one step before your lucky spin
              </p>
            </div>

            {error && (
              <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 flex items-start space-x-2 text-left text-rose-300 text-xs animate-shake z-10 relative">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-normal">{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 z-10 relative">
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">Full Name</label>
                  <div className="relative text-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User size={14} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitLoading}
                      required
                      className="block w-full pl-10 pr-3 py-3 bg-slate-950/50 border border-slate-800/80 focus:border-amber-500 rounded-xl text-white outline-none transition"
                    />
                  </div>
                </div>

                {/* Mobile number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">Mobile Number</label>
                  <div className="relative text-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Phone size={14} />
                    </div>
                    <input
                      type="tel"
                      placeholder="e.g., 9876543210"
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ""); // strictly numbers only
                        setMobile(val);
                      }}
                      maxLength={10}
                      disabled={submitLoading}
                      required
                      className="block w-full pl-10 pr-3 py-3 bg-slate-950/50 border border-slate-800/80 focus:border-amber-500 rounded-xl text-white outline-none font-mono transition"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">Email Address (Optional)</label>
                  <div className="relative text-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail size={14} />
                    </div>
                    <input
                      type="email"
                      placeholder="e.g., john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitLoading}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-950/50 border border-slate-800/80 focus:border-amber-500 rounded-xl text-white outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Message */}
              <div className="text-[10px] text-slate-500 leading-normal bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40 flex items-start gap-2">
                <ShieldCheck size={14} className="text-amber-500/70 shrink-0 mt-0.5" />
                <span>Your details are used only for this offer and coupon verification. We value your privacy.</span>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start space-x-3 cursor-pointer py-1 select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={submitLoading}
                  className="mt-0.5 rounded border-slate-850 text-amber-500 focus:ring-amber-500 bg-slate-950 focus:ring-offset-slate-900"
                />
                <span className="text-[10px] text-slate-400 leading-normal">
                  I agree that I am eligible for only one spin under the terms of this marketing campaign.
                </span>
              </label>

              <p className="text-[10px] text-amber-500/80 mt-1 font-medium tracking-wide">
                * Note: The "10% OFF on Food Bill" coupon is applicable on billing of ₹799 and above.
              </p>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full flex items-center justify-center py-3.5 btn-gold-shimmer rounded-xl transition duration-200 text-xs uppercase select-none cursor-pointer"
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Validating details...
                  </>
                ) : (
                  <>
                    Continue to Lucky Spin
                    <ArrowRight size={14} className="ml-1.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: LUCKY SPIN WHEEL SCREEN */}
        {step === "wheel" && (
          <div className="w-full flex flex-col items-center space-y-6 animate-fade-in-up">
            <div className="text-center space-y-1">
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                Step 3 of 4
              </span>
              <h2 className="text-2xl font-serif font-light text-white tracking-wider mt-2">
                Your Lucky Spin Awaits
              </h2>
              <div className="w-16 h-[1px] bg-amber-500/30 mx-auto my-3"></div>
              <p className="text-xs text-slate-400 px-4">
                One spin. One special reward. Tap spin below to discover your fortune.
              </p>
            </div>

            {error && (
              <div className="w-full bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 flex items-start space-x-2 text-rose-350 text-xs animate-shake">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-normal">{error}</span>
              </div>
            )}

            {/* Canvas Wheel */}
            <div className="w-full py-2">
              <SpinWheel
                rewards={activeRewardsList}
                targetRewardId={targetRewardId}
                onFinished={handleWheelFinished}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
              />
            </div>

            {/* Spin button */}
            {!isSpinning && (
              <button
                onClick={triggerSpin}
                disabled={submitLoading}
                className="w-full max-w-[280px] py-4 btn-gold-shimmer rounded-xl text-xs uppercase tracking-widest select-none cursor-pointer flex items-center justify-center gap-2"
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    CONTACTING HOST...
                  </>
                ) : (
                  <>
                    <Gift size={16} />
                    SPIN NOW
                  </>
                )}
              </button>
            )}

            {isSpinning && (
              <div className="flex flex-col items-center space-y-2 py-4">
                <Loader2 className="animate-spin text-amber-500 h-8 w-8" />
                <p className="text-xs font-semibold text-amber-500 animate-pulse uppercase tracking-wider">
                  The wheel is spinning! Good Luck...
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: SUCCESS / COUPON CARD VIEW */}
        {step === "coupon" && wonCoupon && (
          <div className="w-full space-y-4 animate-fade-in-up">
            <div className="text-center space-y-1 py-1">
              <h2 className="text-2xl font-serif font-bold text-amber-500 flex items-center justify-center gap-1.5">
                <Sparkles className="text-amber-400" />
                Congratulations!
                <Sparkles className="text-amber-400" />
              </h2>
              <p className="text-xs text-slate-300">
                You won an exclusive reward. Show this card at our desk:
              </p>
            </div>
            <CouponCard coupon={wonCoupon} />
          </div>
        )}

        {/* DUPLICATE BLOCKED STATE */}
        {step === "blocked" && existingCoupon && (
          <div className="w-full space-y-6 text-center animate-fade-in-up">
            <div className="hotel-card rounded-2xl p-6 md:p-8 space-y-6">
              <div className="hotel-card-inner-frame"></div>
              <div className="space-y-2 z-10 relative">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                  <Ticket size={24} />
                </div>
                <h2 className="text-xl font-serif font-light text-white tracking-wider mt-2">
                  Already Participated
                </h2>
                <p className="text-xs text-slate-400 px-2 leading-relaxed">
                  Our system shows that you have already received your Lucky Spin. We have loaded your existing active reward voucher below:
                </p>
              </div>

              <div className="border-t border-slate-800 pt-4 z-10 relative">
                <CouponCard coupon={existingCoupon} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Copyright */}
      <footer className="text-center text-[10px] text-slate-600 z-10 pt-6">
        &copy; {new Date().getFullYear()} 7 Blue Hills Hotel & Restaurant. All Rights Reserved.
      </footer>
    </div>
  );
}
