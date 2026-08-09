"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const { user, isAdmin, loading, login, authError, setAuthError } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in and verified as admin
  useEffect(() => {
    if (!loading && user && isAdmin) {
      const params = new URLSearchParams(window.location.search);
      const dest = params.get("redirect") || "/admin";
      router.push(dest);
    }
  }, [user, isAdmin, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!email.trim() || !password.trim()) {
      setAuthError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    setAuthError(null);

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      console.error("Login submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle gold decoration bubble */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Branding header with the new Logo */}
        <div className="text-center flex flex-col items-center justify-center space-y-2">
          <img
            src="/image/logo.png"
            alt="7 Blue Hills Logo"
            className="h-16 w-auto object-contain hover:scale-105 transition duration-300"
          />
          <p className="text-slate-500 text-xs tracking-wider uppercase font-semibold">
            Control Center & Admin Panel
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 relative">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-amber-50 border border-amber-500/20 rounded-xl text-amber-600">
              <Shield className="h-6 w-6" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-center text-slate-800 mb-6">
            Sign In to Dashboard
          </h2>

          {/* Error Message */}
          {authError && (
            <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-3 text-rose-800 text-xs">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-600">Authentication Failed</p>
                <p className="mt-0.5 leading-normal">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">Admin Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="7bluehillshotel@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-sm placeholder-slate-400 text-slate-800 outline-none transition duration-200"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">Security Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-sm placeholder-slate-400 text-slate-800 outline-none transition duration-200"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold tracking-wider rounded-xl transition duration-200 disabled:opacity-50 select-none cursor-pointer text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Authenticating...
                </>
              ) : (
                "Access Dashboard"
              )}
            </button>
          </form>
        </div>

        {/* Public site link */}
        <div className="text-center">
          <a
            href="/spin"
            className="text-xs text-slate-500 hover:text-amber-600 transition duration-200 underline underline-offset-4"
          >
            Return to Customer Spin Page
          </a>
        </div>
      </div>
    </div>
  );
}
