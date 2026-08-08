"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Ticket,
  CheckSquare,
  Gift,
  Settings,
  LogOut,
  Menu,
  X,
  Loader2,
  Shield,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!loading && !isLoginPage) {
      if (!user || !isAdmin) {
        router.push("/admin/login");
      }
    }
  }, [user, isAdmin, loading, isLoginPage, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // If we are on the login page, render children directly without dashboard shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white px-4">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Loading session...</p>
      </div>
    );
  }

  // Double check authorization
  if (!user || !isAdmin) {
    return null; // Will redirect via useEffect
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Verify Coupon", href: "/admin/verify", icon: CheckSquare },
    { name: "Manage Coupons", href: "/admin/coupons", icon: Ticket },
    { name: "Manage Rewards", href: "/admin/rewards", icon: Gift },
    { name: "Settings & QR", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 z-30">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-amber-500" />
          <span className="font-serif font-bold text-amber-500 tracking-wider">7BH ADMIN</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-400 hover:text-white focus:outline-none"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-950/95 z-20 flex flex-col pt-20 px-6 space-y-4">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition duration-200 border ${
                    isActive
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/5"
                      : "text-slate-400 border-transparent hover:bg-slate-900/50 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-900 pt-4">
            <button
              onClick={() => logout()}
              className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/20 transition duration-200 cursor-pointer"
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0 p-6 z-10">
        <div className="space-y-8">
          {/* Logo Branding */}
          <div className="flex items-center space-x-3 px-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="font-serif font-light text-amber-500 tracking-[0.2em] text-sm uppercase">
                7 BLUE HILLS
              </h2>
              <p className="text-[9px] text-slate-500 tracking-[0.3em] uppercase font-bold">
                Hotel & Restaurant
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 border ${
                    isActive
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/5"
                      : "text-slate-400 border-transparent hover:bg-slate-950/60 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info / Log out */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <div className="px-2">
            <p className="text-xs text-slate-500 font-medium">Logged in as:</p>
            <p className="text-xs font-semibold text-slate-300 truncate max-w-[200px]" title={user.email || ""}>
              {user.email}
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-950/20 transition duration-200 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-6 md:p-10 relative overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
