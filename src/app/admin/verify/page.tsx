"use client";

import React, { useEffect, useState, Suspense } from "react";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Loader2,
  Ticket,
  User,
  Phone,
  Gift,
  Calendar,
  Lock,
} from "lucide-react";

interface Coupon {
  id: string;
  customerName: string;
  mobile: string;
  instagramUsername: string;
  email: string;
  rewardId: string;
  rewardName: string;
  couponCode: string;
  createdAt: any;
  expiresAt: any;
  status: "unused" | "used" | "expired";
  usedAt?: any;
  usedBy?: string;
}

function VerificationForm() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Auto-verify if "code" query param is present
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode) {
      setCode(urlCode);
      verifyCoupon(urlCode);
    }
  }, [searchParams]);

  const verifyCoupon = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;

    setLoading(true);
    setChecked(false);
    setError(null);
    setCoupon(null);

    const cleanCode = codeToVerify.trim().toUpperCase();

    try {
      const response = await fetch(`/api/admin/verify?code=${encodeURIComponent(cleanCode)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Coupon code not found in system.");
        } else {
          setError("Failed to verify coupon due to server error.");
        }
        setChecked(true);
        return;
      }

      const data = await response.json();
      setCoupon(data.coupon);
      setChecked(true);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Failed to verify coupon due to network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!coupon || updating) return;

    setUpdating(true);
    try {
      const response = await fetch("/api/admin/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponId: coupon.id,
          usedBy: user?.email || "admin",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to redeem coupon");
      }

      // Refresh coupon view locally
      setCoupon({
        ...coupon,
        status: "used",
        usedAt: new Date().toISOString(),
        usedBy: user?.email || "admin",
      } as any);
      
      setChecked(true);
    } catch (err) {
      console.error("Redemption error:", err);
      alert("Failed to redeem coupon.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCoupon(code);
  };

  // Status evaluator helper
  const getCouponStatus = (cp: Coupon): "unused" | "used" | "expired" => {
    if (cp.status === "used") return "used";
    const expiresDate = cp.expiresAt ? cp.expiresAt.toDate() : new Date(0);
    if (expiresDate < new Date()) return "expired";
    return "unused";
  };

  const status = coupon ? getCouponStatus(coupon) : null;

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Verify Code Search Form */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Ticket size={16} />
          </div>
          <input
            type="text"
            placeholder="Enter Coupon Code (e.g., 7BH-8K4P2M)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            required
            className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-sm placeholder-slate-650 text-white font-mono uppercase outline-none transition duration-200"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-6 rounded-xl flex items-center gap-1.5 transition duration-150 text-sm select-none cursor-pointer"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          <span>Verify</span>
        </button>
      </form>

      {/* VERIFICATION FEEDBACK CARDS */}
      {loading && (
        <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
          <span>Searching database...</span>
        </div>
      )}

      {checked && error && (
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
          <XCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-rose-400">❌ INVALID COUPON</h3>
            <p className="text-xs text-rose-200/80 leading-normal">{error}</p>
          </div>
          <button
            onClick={() => setChecked(false)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition duration-150 select-none cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {checked && coupon && status && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl animate-fade-in">
          {/* Status Alert Panels */}
          {status === "unused" && (
            <div className="bg-green-950/50 border border-green-500/30 rounded-xl p-4 flex items-center gap-3.5 text-green-300">
              <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
              <div>
                <h4 className="font-bold text-sm tracking-wider uppercase">✅ VALID COUPON</h4>
                <p className="text-[11px] text-green-200/80 mt-0.5">This coupon is active and ready for redemption.</p>
              </div>
            </div>
          )}

          {status === "used" && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3.5 text-amber-300">
              <AlertTriangle className="h-8 w-8 text-amber-500 shrink-0" />
              <div>
                <h4 className="font-bold text-sm tracking-wider uppercase">⚠️ COUPON ALREADY USED</h4>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Redeemed on {coupon.usedAt?.toDate().toLocaleString()} by {coupon.usedBy}.
                </p>
              </div>
            </div>
          )}

          {status === "expired" && (
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3.5 text-rose-300">
              <Clock className="h-8 w-8 text-rose-500 shrink-0" />
              <div>
                <h4 className="font-bold text-sm tracking-wider uppercase">⌛ COUPON EXPIRED</h4>
                <p className="text-[11px] text-rose-200/80 mt-0.5">
                  Validity expired on {coupon.expiresAt?.toDate().toLocaleDateString()}.
                </p>
              </div>
            </div>
          )}

          {/* Coupon Info details */}
          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="flex items-center space-x-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/40">
              <User size={14} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Customer Name</p>
                <p className="font-semibold text-slate-200 mt-0.5">{coupon.customerName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/40">
              <Phone size={14} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Mobile Number</p>
                <p className="font-semibold text-slate-200 mt-0.5">{coupon.mobile}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/40">
              <svg className="h-3.5 w-3.5 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Instagram Username</p>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {coupon.instagramUsername ? `@${coupon.instagramUsername}` : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/40">
              <Gift size={14} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Winning Reward</p>
                <p className="font-semibold text-amber-400 mt-0.5">{coupon.rewardName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/40">
              <Calendar size={14} className="text-slate-500 shrink-0" />
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Valid Till Date</p>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {coupon.expiresAt ? coupon.expiresAt.toDate().toLocaleDateString() : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {status === "unused" && (
            <button
              onClick={handleRedeem}
              disabled={updating}
              className="w-full flex items-center justify-center py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold tracking-wider rounded-xl transition duration-150 text-xs uppercase select-none cursor-pointer"
            >
              {updating ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  Redeeming Coupon...
                </>
              ) : (
                <>
                  <CheckCircle size={14} className="mr-1.5" />
                  Mark As Used
                </>
              )}
            </button>
          )}

          {status !== "unused" && (
            <button
              disabled
              className="w-full flex items-center justify-center py-3 bg-slate-800 text-slate-500 font-bold tracking-wider rounded-xl text-xs uppercase select-none"
            >
              <Lock size={14} className="mr-1.5" />
              Redemption Locked
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminVerifyPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-serif text-white tracking-wide">
          Verify Reward Coupon
        </h1>
        <p className="text-sm text-slate-400">
          Enter a voucher code manually or scan the customer's ticket QR code.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="text-center py-20 text-slate-500">
            <Loader2 className="animate-spin text-amber-500 h-8 w-8 mx-auto mb-2" />
            <p className="text-xs">Loading verification scanner...</p>
          </div>
        }
      >
        <VerificationForm />
      </Suspense>
    </div>
  );
}
