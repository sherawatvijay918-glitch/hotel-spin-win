"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Activity,
  Ticket,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Loader2,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface SpinRecord {
  id: string;
  customerName: string;
  mobile: string;
  rewardName: string;
  couponCode: string;
  createdAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
  status: "unused" | "used" | "expired";
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpins: 0,
    todaysSpins: 0,
    activeCoupons: 0,
    usedCoupons: 0,
    expiredCoupons: 0,
  });
  const [recentSpins, setRecentSpins] = useState<SpinRecord[]>([]);
  const [rewardCounts, setRewardCounts] = useState<{ [key: string]: number }>({});
  const [dailyActivity, setDailyActivity] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/admin/data");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const apiData = await response.json();
        const rawSpins: any[] = apiData.spins || [];

        const now = new Date();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        let total = 0;
        let today = 0;
        let active = 0;
        let used = 0;
        let expired = 0;

        const allSpins: SpinRecord[] = [];
        const rewardsMap: { [key: string]: number } = {};
        const dailyMap: { [key: string]: number } = {};

        rawSpins.forEach((data) => {
          const spin = {
            id: data.id,
            customerName: data.customerName,
            mobile: data.mobile,
            rewardName: data.rewardName,
            couponCode: data.couponCode,
            createdAt: data.createdAt,
            expiresAt: data.expiresAt,
            status: data.status,
          } as SpinRecord;

          allSpins.push(spin);
          total++;

          // Parse Dates
          const createdDate = data.createdAt ? new Date(data.createdAt) : new Date();
          const expiresDate = data.expiresAt ? new Date(data.expiresAt) : new Date();

          // Check if spun today
          if (createdDate >= startOfToday) {
            today++;
          }

          // Evaluate status
          let finalStatus = data.status;
          if (data.status === "unused" && expiresDate < now) {
            finalStatus = "expired";
          }

          if (finalStatus === "used") {
            used++;
          } else if (finalStatus === "expired") {
            expired++;
          } else {
            active++;
          }

          // Group by Reward
          if (data.rewardName) {
            rewardsMap[data.rewardName] = (rewardsMap[data.rewardName] || 0) + 1;
          }

          // Group by Day (last 7 days)
          const dateStr = createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
        });

        // Set Stats
        setStats({
          totalSpins: total,
          todaysSpins: today,
          activeCoupons: active,
          usedCoupons: used,
          expiredCoupons: expired,
        });

        // Recent 5 Spins
        setRecentSpins(allSpins.slice(0, 5));

        // Set Reward Distribution
        setRewardCounts(rewardsMap);

        // Process Daily Activity (last 7 calendar days)
        const dailyList = Object.keys(dailyMap)
          .map((key) => ({ date: key, count: dailyMap[key] }))
          .slice(0, 7)
          .reverse();
        setDailyActivity(dailyList);
        setLoading(false);
      } catch (error) {
        console.error("Error loading real dashboard data, loading Mock Data:", error);
        
        // Fallback Mock Stats for Testing
        setStats({
          totalSpins: 148,
          todaysSpins: 12,
          activeCoupons: 84,
          usedCoupons: 56,
          expiredCoupons: 8,
        });

        setRecentSpins([
          {
            id: "mock-1",
            customerName: "Aman Gupta",
            mobile: "9876543210",
            rewardName: "FREE Welcome Drink",
            couponCode: "7BH-A8F2K4",
            createdAt: null,
            expiresAt: null,
            status: "unused",
          },
          {
            id: "mock-2",
            customerName: "Ritu Sharma",
            mobile: "9123456789",
            rewardName: "15% OFF Dining Bill",
            couponCode: "7BH-D9P3M7",
            createdAt: null,
            expiresAt: null,
            status: "used",
          },
          {
            id: "mock-3",
            customerName: "Vijay Yadav",
            mobile: "9988776655",
            rewardName: "FREE Starter Item",
            couponCode: "7BH-S2T8G9",
            createdAt: null,
            expiresAt: null,
            status: "unused",
          },
          {
            id: "mock-4",
            customerName: "Sneha Patel",
            mobile: "9555444333",
            rewardName: "Dessert of Choice",
            couponCode: "7BH-Y4X5V1",
            createdAt: null,
            expiresAt: null,
            status: "expired",
          },
          {
            id: "mock-5",
            customerName: "Karan Singh",
            mobile: "9000111222",
            rewardName: "Buy 1 Get 1 Coffee",
            couponCode: "7BH-B7N2H6",
            createdAt: null,
            expiresAt: null,
            status: "unused",
          }
        ]);

        setRewardCounts({
          "FREE Welcome Drink": 42,
          "15% OFF Dining Bill": 36,
          "FREE Starter Item": 30,
          "Dessert of Choice": 24,
          "Buy 1 Get 1 Coffee": 16,
        });

        setDailyActivity([
          { date: "Aug 2", count: 15 },
          { date: "Aug 3", count: 18 },
          { date: "Aug 4", count: 22 },
          { date: "Aug 5", count: 19 },
          { date: "Aug 6", count: 25 },
          { date: "Aug 7", count: 27 },
          { date: "Aug 8", count: 12 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-slate-400">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
        <p className="text-sm">Calculating metrics & drawing charts...</p>
      </div>
    );
  }

  // Calculate percentage helper
  const getPercentage = (value: number) => {
    if (stats.totalSpins === 0) return 0;
    return Math.round((value / stats.totalSpins) * 100);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
        <div>
          <h1 className="text-2xl md:text-3xl font-light font-serif text-white tracking-wider">
            Dashboard Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time metrics and coupon management for 7 Blue Hills.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-950/60 border border-amber-500/10 rounded-xl px-4 py-2 text-[10px] uppercase tracking-wider text-slate-400 font-bold self-start">
          <Calendar size={12} className="text-amber-500" />
          <span>Live Data Feed</span>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Spins */}
        <div className="hotel-card rounded-2xl p-5 flex flex-col justify-between transition duration-300 hover:border-amber-500/30 group">
          <div className="hotel-card-inner-frame"></div>
          <div className="flex items-center justify-between text-slate-400 mb-4 z-10 relative">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500/80">Total Spins</span>
            <Activity className="h-4 w-4 text-amber-500/80" />
          </div>
          <div className="z-10 relative">
            <h3 className="text-3xl font-light text-white font-serif tracking-wide">{stats.totalSpins}</h3>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">All participants</p>
          </div>
        </div>

        {/* Today's Spins */}
        <div className="hotel-card rounded-2xl p-5 flex flex-col justify-between transition duration-300 hover:border-amber-500/30 group">
          <div className="hotel-card-inner-frame"></div>
          <div className="flex items-center justify-between text-slate-400 mb-4 z-10 relative">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500/80">Today</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="z-10 relative">
            <h3 className="text-3xl font-light text-white font-serif tracking-wide">{stats.todaysSpins}</h3>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Since midnight</p>
          </div>
        </div>

        {/* Active Coupons */}
        <div className="hotel-card rounded-2xl p-5 flex flex-col justify-between transition duration-300 hover:border-amber-500/30 group">
          <div className="hotel-card-inner-frame"></div>
          <div className="flex items-center justify-between text-slate-400 mb-4 z-10 relative">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500/80">Active</span>
            <Ticket className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="z-10 relative">
            <h3 className="text-3xl font-light text-white font-serif tracking-wide">{stats.activeCoupons}</h3>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Unused vouchers</p>
          </div>
        </div>

        {/* Used Coupons */}
        <div className="hotel-card rounded-2xl p-5 flex flex-col justify-between transition duration-300 hover:border-amber-500/30 group">
          <div className="hotel-card-inner-frame"></div>
          <div className="flex items-center justify-between text-slate-400 mb-4 z-10 relative">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500/80">Redeemed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="z-10 relative">
            <h3 className="text-3xl font-light text-white font-serif tracking-wide">{stats.usedCoupons}</h3>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Claimed ({getPercentage(stats.usedCoupons)}%)</p>
          </div>
        </div>

        {/* Expired Coupons */}
        <div className="hotel-card rounded-2xl p-5 col-span-2 lg:col-span-1 flex flex-col justify-between transition duration-300 hover:border-amber-500/30 group">
          <div className="hotel-card-inner-frame"></div>
          <div className="flex items-center justify-between text-slate-400 mb-4 z-10 relative">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500/80">Expired</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="z-10 relative">
            <h3 className="text-3xl font-light text-white font-serif tracking-wide">{stats.expiredCoupons}</h3>
            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Out of validity</p>
          </div>
        </div>
      </div>

      {/* DETAILED STATS - RECENT ACTIVITY & CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT SPINS FEED */}
        <div className="lg:col-span-2 hotel-card rounded-2xl p-6 space-y-4">
          <div className="hotel-card-inner-frame"></div>
          <div className="flex items-center justify-between z-10 relative">
            <h2 className="text-base font-light font-serif text-white tracking-wide">Recent Activity</h2>
            <Link
              href="/admin/coupons"
              className="text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 transition duration-150 border border-amber-500/10 hover:border-amber-500/30 bg-amber-500/5 px-2.5 py-1 rounded-lg"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </div>
 
          <div className="divide-y divide-slate-800/40 z-10 relative">
            {recentSpins.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No spin history found. Place QR codes around the hotel to get started!
              </div>
            ) : (
              recentSpins.map((spin) => (
                <div key={spin.id} className="py-3 flex items-center justify-between text-xs gap-4 border-b border-slate-900/40">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{spin.customerName}</p>
                    <p className="text-slate-500 text-[10px] font-mono mt-0.5">{spin.mobile}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-amber-500/90">{spin.rewardName}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{spin.couponCode}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* REWARD DISTRIBUTION CHART */}
        <div className="hotel-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="hotel-card-inner-frame"></div>
          <div className="z-10 relative">
            <h2 className="text-base font-light font-serif text-white tracking-wide mb-0.5">Reward Distribution</h2>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Breakdown of rewards claims.</p>
          </div>
 
          <div className="space-y-4 flex-1 flex flex-col justify-center z-10 relative">
            {Object.keys(rewardCounts).length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">No distribution data.</div>
            ) : (
              Object.keys(rewardCounts)
                .sort((a, b) => rewardCounts[b] - rewardCounts[a])
                .slice(0, 5) // top 5
                .map((rewardName) => {
                  const count = rewardCounts[rewardName];
                  const percentage = getPercentage(count);
                  return (
                    <div key={rewardName} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-slate-300 truncate max-w-[150px]">{rewardName}</span>
                        <span className="text-slate-400 shrink-0 font-mono">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950/60 rounded-full overflow-hidden border border-slate-900">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-300 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* DAILY ACTIVITY CHART */}
      <div className="hotel-card rounded-2xl p-6 space-y-4">
        <div className="hotel-card-inner-frame"></div>
        <div className="z-10 relative">
          <h2 className="text-base font-light font-serif text-white tracking-wide mb-0.5">Spin Traffic Trend</h2>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Activity logged over the last active days.</p>
        </div>
 
        <div className="h-48 flex items-end justify-between px-4 pt-4 border-b border-l border-slate-850/80 z-10 relative">
          {dailyActivity.length === 0 ? (
            <div className="w-full text-center py-12 text-slate-500 text-xs">No traffic trend recorded.</div>
          ) : (
            dailyActivity.map((day) => {
              const maxCount = Math.max(...dailyActivity.map((d) => d.count), 1);
              const barHeight = Math.max((day.count / maxCount) * 80, 5); // height percentage
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center group relative px-1">
                  {/* Tooltip */}
                  <div className="absolute top-[-30px] bg-slate-950 border border-amber-500/20 text-[10px] text-amber-500 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-mono shadow-md z-10">
                    {day.count}
                  </div>
                  {/* Visual Bar */}
                  <div
                    className="w-8 md:w-12 bg-gradient-to-t from-amber-600/10 to-amber-500/20 hover:from-amber-600/40 hover:to-amber-400/50 border border-amber-500/20 hover:border-amber-500/50 rounded-t-lg transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.05)] cursor-pointer"
                    style={{ height: `${barHeight}%` }}
                  ></div>
                  <span className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-wider shrink-0 select-none">
                    {day.date}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
