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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 z-30">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-amber-600" />
          <span className="font-serif font-bold text-amber-600 tracking-wider">7BH ADMIN</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-500 hover:text-slate-900 focus:outline-none"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white/95 z-20 flex flex-col pt-20 px-6 space-y-4 shadow-xl">
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
                      ? "bg-amber-50 border-amber-500/20 text-amber-700 shadow-sm"
                      : "text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => logout()}
              className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition duration-200 cursor-pointer"
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200 flex-col justify-between shrink-0 p-6 z-10 shadow-sm">
        <div className="space-y-8">
          {/* Logo Branding */}
          <div className="flex items-center space-x-3 px-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <div>
              <h2 className="font-serif font-bold text-amber-600 tracking-[0.15em] text-sm uppercase">
                7 BLUE HILLS
              </h2>
              <p className="text-[9px] text-slate-400 tracking-[0.25em] uppercase font-bold">
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
                      ? "bg-amber-50 border-amber-500/20 text-amber-700 shadow-sm"
                      : "text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-900"
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
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div className="px-2">
            <p className="text-xs text-slate-400 font-medium">Logged in as:</p>
            <p className="text-xs font-semibold text-slate-700 truncate max-w-[200px]" title={user.email || ""}>
              {user.email}
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 transition duration-200 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-6 md:p-10 relative overflow-y-auto max-h-screen bg-slate-50">
        {children}
      </main>
    </div>
  );
}
