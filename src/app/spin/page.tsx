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

type Step = "preview" | "form" | "wheel" | "coupon" | "blocked";

export default function SpinPage() {
  const [step, setStep] = useState<Step>("preview");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
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
      
      // If won reward is FREE Cold Coffee, select one of the three segments on the wheel randomly
      if (data.spin.rewardId === "cold-coffee") {
        const coldCoffeeIds = ["cold-coffee", "cold-coffee-2", "cold-coffee-3"];
        const randomTargetId = coldCoffeeIds[Math.floor(Math.random() * coldCoffeeIds.length)];
        setTargetRewardId(randomTargetId);
      } else {
        setTargetRewardId(data.spin.rewardId);
      }
      
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

  // Pre-configured wheel segments (FREE Cold Coffee in 3 places as requested)
  const activeRewardsList = [
    { rewardId: "cold-coffee", rewardName: "FREE Cold Coffee", probability: 25 },
    { rewardId: "welcome-drink", rewardName: "Welcome Drink FREE", probability: 20 },
    { rewardId: "starter-free", rewardName: "Starter FREE", probability: 15 },
    { rewardId: "cold-coffee-2", rewardName: "FREE Cold Coffee", probability: 25 },
    { rewardId: "dessert-free", rewardName: "Dessert FREE", probability: 15 },
    { rewardId: "breakfast-2", rewardName: "Breakfast for 2 FREE", probability: 10 },
    { rewardId: "cold-coffee-3", rewardName: "FREE Cold Coffee", probability: 25 },
    { rewardId: "room-upgrade", rewardName: "Room Upgrade FREE", probability: 5 },
  ];  return (
    <div className="min-h-screen text-slate-800 font-sans flex flex-col justify-between py-8 px-4 md:px-8 relative overflow-hidden bg-[url('/hotel_lobby_bg.png')] bg-cover bg-center">
      {/* Light overlay with blur for luxury aesthetic */}
      <div className="absolute inset-0 bg-white/92 backdrop-blur-md z-0"></div>

      {/* Header Branding */}
      <header className="text-center z-10 flex flex-col items-center justify-center space-y-2">
        <img
          src="/image/logo.png"
          alt="7 Blue Hills Logo"
          className="h-16 w-auto object-contain hover:scale-105 transition duration-300"
        />
        <p className="text-slate-500 text-[10px] tracking-[0.4em] uppercase font-bold">
          Hotel & Restaurant
        </p>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 z-10 max-w-lg mx-auto w-full">


        {/* STEP 1: PREVIEW LOCK SCREEN (WHEEL PREVIEW) */}
        {step === "preview" && (
          <div className="w-full flex flex-col items-center space-y-6 animate-fade-in-up">
            <div className="text-center space-y-1">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-widest bg-amber-50 border border-amber-500/20 px-3 py-1 rounded-full">
                Step 1 of 4
              </span>
              <h2 className="text-2xl font-serif font-light text-slate-800 tracking-wider mt-2">
                Spin & Win Exciting Rewards
              </h2>
              <div className="w-16 h-[1px] bg-amber-500/30 mx-auto my-3"></div>
              <p className="text-xs text-slate-550 px-4">
                Unlock your lucky spin at 7 Blue Hills. Tap spin below to register and win.
              </p>
            </div>

            {/* Canvas Wheel Wrapper - Clickable to unlock form */}
            <div 
              onClick={() => setStep("form")}
              className="w-full py-2 cursor-pointer transition transform hover:scale-[1.02] duration-300"
            >
              <SpinWheel
                rewards={activeRewardsList}
                targetRewardId={null}
                onFinished={() => {}}
                isSpinning={false}
                setIsSpinning={() => {}}
              />
            </div>

            {/* Unlock Button */}
            <button
              onClick={() => setStep("form")}
              className="w-full max-w-[280px] py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest select-none cursor-pointer flex items-center justify-center gap-2 shadow-sm animate-pulse"
            >
              <Gift size={16} />
              SPIN NOW
            </button>
          </div>
        )}

        {/* STEP 2: CUSTOMER DETAILS FORM */}
        {step === "form" && (
          <div className="w-full bg-white border border-slate-200 shadow-xl rounded-2xl p-6 md:p-8 space-y-6 animate-fade-in-up relative">
            <div className="text-center space-y-1 z-10 relative">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-widest bg-amber-50 border border-amber-500/20 px-3 py-1 rounded-full">
                Step 2 of 4
              </span>
              <h2 className="text-2xl font-serif font-light text-slate-800 tracking-wider mt-2">
                Enter Your Details
              </h2>
              <div className="w-16 h-[1px] bg-amber-500/30 mx-auto my-3"></div>
              <p className="text-xs text-slate-500">
                Just one step before your lucky spin
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2 text-left text-rose-800 text-xs animate-shake z-10 relative">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-normal">{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 z-10 relative">
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Full Name</label>
                  <div className="relative text-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User size={14} />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitLoading}
                      required
                      className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl text-slate-850 outline-none transition"
                    />
                  </div>
                </div>

                {/* Mobile number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Mobile Number</label>
                  <div className="relative text-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={14} />
                    </div>
                    <input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ""); // strictly numbers only
                        setMobile(val);
                      }}
                      maxLength={10}
                      disabled={submitLoading}
                      required
                      className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl text-slate-850 outline-none font-mono transition"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Email Address (Optional)</label>
                  <div className="relative text-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={14} />
                    </div>
                    <input
                      type="email"
                      placeholder="Enter email address (optional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitLoading}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl text-slate-850 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Message */}
              <div className="text-[10px] text-slate-555 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                <ShieldCheck size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>Your details are used only for this offer and coupon verification. We value your privacy.</span>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start space-x-3 cursor-pointer py-1 select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={submitLoading}
                  className="mt-0.5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 bg-slate-50 focus:ring-offset-white"
                />
                <span className="text-[10px] text-slate-500 leading-normal">
                  I agree that I am eligible for only one spin under the terms of this marketing campaign.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full flex items-center justify-center py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition duration-200 text-xs uppercase select-none cursor-pointer shadow-sm"
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
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-widest bg-amber-50 border border-amber-500/20 px-3 py-1 rounded-full">
                Step 3 of 4
              </span>
              <h2 className="text-2xl font-serif font-light text-slate-800 tracking-wider mt-2">
                Your Lucky Spin Awaits
              </h2>
              <div className="w-16 h-[1px] bg-amber-500/30 mx-auto my-3"></div>
              <p className="text-xs text-slate-550 px-4">
                One spin. One special reward. Tap spin below to discover your fortune.
              </p>
            </div>

            {error && (
              <div className="w-full bg-rose-50 border border-rose-250 rounded-xl p-3 flex items-start space-x-2 text-rose-800 text-xs animate-shake">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-normal">{error}</span>
              </div>
            )}

            {/* Canvas Wheel - Clickable to spin when active */}
            <div 
              onClick={() => {
                if (!isSpinning && !submitLoading) {
                  triggerSpin();
                }
              }}
              className={`w-full py-2 ${!isSpinning && !submitLoading ? "cursor-pointer transition transform hover:scale-[1.02] duration-300" : ""}`}
            >
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
                className="w-full max-w-[280px] py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest select-none cursor-pointer flex items-center justify-center gap-2 shadow-sm"
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
                <Loader2 className="animate-spin text-amber-650 h-8 w-8" />
                <p className="text-xs font-semibold text-amber-650 animate-pulse uppercase tracking-wider">
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
              <h2 className="text-2xl font-serif font-bold text-amber-600 flex items-center justify-center gap-1.5">
                <Sparkles className="text-amber-400" />
                Congratulations!
                <Sparkles className="text-amber-400" />
              </h2>
              <p className="text-xs text-slate-600">
                You won an exclusive reward. Show this card at our desk:
              </p>
            </div>
            <CouponCard coupon={wonCoupon} />
          </div>
        )}

        {/* DUPLICATE BLOCKED STATE */}
        {step === "blocked" && existingCoupon && (
          <div className="w-full space-y-6 text-center animate-fade-in-up">
            <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 md:p-8 space-y-6 relative">
              <div className="space-y-2 z-10 relative">
                <div className="w-12 h-12 bg-amber-50 border border-amber-500/20 text-amber-650 rounded-full flex items-center justify-center mx-auto">
                  <Ticket size={24} />
                </div>
                <h2 className="text-xl font-serif font-light text-slate-800 tracking-wider mt-2">
                  Already Participated
                </h2>
                <p className="text-xs text-slate-500 px-2 leading-relaxed">
                  Our system shows that you have already received your Lucky Spin. We have loaded your existing active reward voucher below:
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 z-10 relative">
                <CouponCard coupon={existingCoupon} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Copyright */}
      <footer className="text-center text-[10px] text-slate-500 z-10 pt-6">
        &copy; {new Date().getFullYear()} 7 Blue Hills Hotel & Restaurant. All Rights Reserved.
      </footer>
    </div>
  );
}
