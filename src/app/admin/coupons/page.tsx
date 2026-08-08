"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Gift,
  Copy,
  Check,
  Loader2,
  Calendar,
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

export default function AdminCouponsPage() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rewardFilter, setRewardFilter] = useState("all");

  // Selection & Action states
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Unique list of reward names for filtering
  const [rewardNames, setRewardNames] = useState<string[]>([]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/data");
      if (!response.ok) {
        throw new Error("Failed to fetch coupons data");
      }
      const apiData = await response.json();
      const rawSpins: any[] = apiData.spins || [];
      const list: Coupon[] = [];
      const rewardsSet = new Set<string>();

      rawSpins.forEach((data) => {
        const coupon = {
          id: data.id,
          customerName: data.customerName,
          mobile: data.mobile,
          instagramUsername: data.instagramUsername || "",
          email: data.email || "",
          rewardId: data.rewardId,
          rewardName: data.rewardName,
          couponCode: data.couponCode,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          status: data.status,
          usedAt: data.usedAt,
          usedBy: data.usedBy || "",
        } as Coupon;

        list.push(coupon);
        if (data.rewardName) {
          rewardsSet.add(data.rewardName);
        }
      });

      // Sort by creation date descending
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setCoupons(list);
      setRewardNames(Array.from(rewardsSet));
    } catch (error) {
      console.error("Error loading coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleMarkAsUsed = async (coupon: Coupon) => {
    setUpdatingId(coupon.id);
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

      // Refresh list
      await fetchCoupons();
      setShowConfirmModal(false);
      setSelectedCoupon(null);
    } catch (error) {
      console.error("Error marking coupon as used:", error);
      alert("Failed to mark coupon as used. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const copyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  // Helper to determine expiry dynamically if status in DB is "unused"
  const getCouponStatus = (coupon: Coupon): "unused" | "used" | "expired" => {
    if (coupon.status === "used") return "used";
    const expiresDate = coupon.expiresAt ? coupon.expiresAt.toDate() : new Date(0);
    if (expiresDate < new Date()) return "expired";
    return "unused";
  };

  // Filter Logic
  const filteredCoupons = coupons.filter((coupon) => {
    const status = getCouponStatus(coupon);

    // Status filter
    if (statusFilter !== "all" && status !== statusFilter) {
      return false;
    }

    // Reward filter
    if (rewardFilter !== "all" && coupon.rewardName !== rewardFilter) {
      return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const nameMatch = coupon.customerName?.toLowerCase().includes(query);
      const codeMatch = coupon.couponCode?.toLowerCase().includes(query);
      const phoneMatch = coupon.mobile?.includes(query);
      const instaMatch = coupon.instagramUsername?.toLowerCase().includes(query);
      return nameMatch || codeMatch || phoneMatch || instaMatch;
    }

    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-serif text-white tracking-wide">
          Manage Coupons
        </h1>
        <p className="text-sm text-slate-400">
          Search, filter, and redeem customer reward vouchers.
        </p>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 border border-slate-800/80 p-5 rounded-2xl">
        {/* Search Input */}
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search by code, mobile, or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-xs placeholder-slate-600 text-white outline-none transition duration-200"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-slate-300 outline-none transition duration-200 cursor-pointer appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="unused">Active / Unused</option>
            <option value="used">Redeemed</option>
            <option value="expired">Expired</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
            <Filter size={12} />
          </div>
        </div>

        {/* Reward Filter */}
        <div className="relative">
          <select
            value={rewardFilter}
            onChange={(e) => setRewardFilter(e.target.value)}
            className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-slate-300 outline-none transition duration-200 cursor-pointer appearance-none"
          >
            <option value="all">All Rewards</option>
            {rewardNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
            <Filter size={12} />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 text-slate-500">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
            <p className="text-xs">Loading coupon records...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs">
            No matching coupons found. Refine your search query or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Instagram</th>
                  <th className="px-6 py-4">Reward</th>
                  <th className="px-6 py-4">Coupon Code</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {filteredCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-slate-950/40 transition duration-150 cursor-pointer"
                      onClick={() => setSelectedCoupon(coupon)}
                    >
                      {/* Customer Details */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">
                          {coupon.customerName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {coupon.mobile}
                        </div>
                      </td>

                      {/* Instagram username */}
                      <td className="px-6 py-4 font-semibold text-slate-400 font-mono">
                        {coupon.instagramUsername ? `@${coupon.instagramUsername}` : "N/A"}
                      </td>

                      {/* Reward won */}
                      <td className="px-6 py-4 font-medium text-amber-500">
                        {coupon.rewardName}
                      </td>

                      {/* Coupon Code */}
                      <td className="px-6 py-4 font-mono font-bold text-slate-200">
                        <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <span>{coupon.couponCode}</span>
                          <button
                            onClick={() => copyCode(coupon.id, coupon.couponCode)}
                            className="p-1 text-slate-500 hover:text-white rounded transition"
                          >
                            {copiedId === coupon.id ? (
                              <Check size={12} className="text-green-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-slate-400">
                        {coupon.createdAt
                          ? coupon.createdAt.toDate().toLocaleDateString()
                          : "N/A"}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-6 py-4 text-slate-400">
                        {coupon.expiresAt
                          ? coupon.expiresAt.toDate().toLocaleDateString()
                          : "N/A"}
                      </td>

                      {/* Status Tag */}
                      <td className="px-6 py-4">
                        {status === "used" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-950/50 border border-green-500/30 text-green-400">
                            <CheckCircle size={10} className="mr-1 shrink-0" />
                            Redeemed
                          </span>
                        )}
                        {status === "expired" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/50 border border-rose-500/30 text-rose-400">
                            <XCircle size={10} className="mr-1 shrink-0" />
                            Expired
                          </span>
                        )}
                        {status === "unused" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/40 border border-amber-500/20 text-amber-400">
                            <Clock size={10} className="mr-1 shrink-0" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {status === "unused" && (
                          <button
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setShowConfirmModal(true);
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition duration-150 tracking-wide text-[10px] uppercase select-none cursor-pointer"
                          >
                            Mark As Used
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedCoupon && !showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-6 relative animate-fade-in">
            <div>
              <h3 className="text-lg font-bold font-serif text-amber-500">Coupon Details</h3>
              <p className="text-xs text-slate-500">Full audit log for verification.</p>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center space-x-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                <User size={14} className="text-slate-500 shrink-0" />
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Customer</p>
                  <p className="font-medium text-slate-200 mt-0.5">{selectedCoupon.customerName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                <Phone size={14} className="text-slate-500 shrink-0" />
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Mobile Number</p>
                  <p className="font-medium text-slate-200 mt-0.5">{selectedCoupon.mobile}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                <svg className="h-3.5 w-3.5 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Instagram Username</p>
                  <p className="font-medium text-slate-200 mt-0.5">
                    {selectedCoupon.instagramUsername ? `@${selectedCoupon.instagramUsername}` : "N/A"}
                  </p>
                </div>
              </div>

              {selectedCoupon.email && (
                <div className="flex items-center space-x-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                  <User size={14} className="text-slate-500 shrink-0" />
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Email</p>
                    <p className="font-medium text-slate-200 mt-0.5">{selectedCoupon.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                <Gift size={14} className="text-slate-500 shrink-0" />
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Winning Reward</p>
                  <p className="font-medium text-amber-500 mt-0.5">{selectedCoupon.rewardName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                <Calendar size={14} className="text-slate-500 shrink-0" />
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Validation Period</p>
                  <p className="font-medium text-slate-200 mt-0.5">
                    {selectedCoupon.createdAt ? selectedCoupon.createdAt.toDate().toLocaleDateString() : ""} -{" "}
                    <span className="text-rose-400 font-semibold">
                      {selectedCoupon.expiresAt ? selectedCoupon.expiresAt.toDate().toLocaleDateString() : ""}
                    </span>
                  </p>
                </div>
              </div>

              {/* Status and redemption logs */}
              <div className="border-t border-slate-800/80 pt-4 space-y-2">
                <p className="font-bold text-slate-400">Audit Status</p>
                <div className="space-y-1">
                  <p>
                    <span className="text-slate-500">Redemption Status:</span>{" "}
                    <span className="font-bold uppercase">
                      {getCouponStatus(selectedCoupon)}
                    </span>
                  </p>
                  {selectedCoupon.status === "used" && (
                    <>
                      <p>
                        <span className="text-slate-500">Redeemed At:</span>{" "}
                        {selectedCoupon.usedAt ? selectedCoupon.usedAt.toDate().toLocaleString() : ""}
                      </p>
                      <p>
                        <span className="text-slate-500">Authorized By:</span> {selectedCoupon.usedBy}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              {getCouponStatus(selectedCoupon) === "unused" && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl transition duration-150 uppercase tracking-wider text-[11px] select-none cursor-pointer"
                >
                  Mark As Used
                </button>
              )}
              <button
                onClick={() => setSelectedCoupon(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl transition duration-150 uppercase tracking-wider text-[11px] select-none cursor-pointer"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION WORKFLOW MODAL */}
      {showConfirmModal && selectedCoupon && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-6 relative animate-shake">
            <div className="text-center">
              <CheckCircle size={36} className="text-amber-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Confirm Coupon Redemption</h3>
              <p className="text-xs text-slate-400 mt-2 px-2 leading-relaxed">
                Are you sure you want to mark coupon <span className="font-mono font-bold text-amber-500">{selectedCoupon.couponCode}</span> as used? This action is irreversible.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/40 text-xs space-y-1.5">
              <p>
                <span className="text-slate-500 font-semibold">Customer:</span> {selectedCoupon.customerName}
              </p>
              <p>
                <span className="text-slate-500 font-semibold">Reward:</span> {selectedCoupon.rewardName}
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                disabled={updatingId !== null}
                onClick={() => handleMarkAsUsed(selectedCoupon)}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl transition duration-150 uppercase tracking-wider text-[11px] select-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                {updatingId ? <Loader2 size={12} className="animate-spin" /> : null}
                Confirm & Redeem
              </button>
              <button
                disabled={updatingId !== null}
                onClick={() => {
                  setShowConfirmModal(false);
                  if (!selectedCoupon.usedAt) {
                    // if it wasn't detail view, clear select
                  }
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl transition duration-150 uppercase tracking-wider text-[11px] select-none cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
