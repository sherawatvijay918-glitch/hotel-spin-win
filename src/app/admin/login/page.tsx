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
      router.push("/admin");
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
      // Auth context triggers status check -> will auto redirect via useEffect
    } catch (err: any) {
      console.error("Login submission error:", err);
      // Context will set authError
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Branding header */}
        <div className="text-center space-y-2">
          <h1 className="text-amber-500 font-serif text-2xl font-bold tracking-widest uppercase">
            7 BLUE HILLS
          </h1>
          <p className="text-slate-400 text-xs tracking-wider uppercase font-semibold">
            Control Center & Admin Panel
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl p-8 relative backdrop-blur-sm bg-opacity-95">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
              <Shield className="h-6 w-6" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-center text-white mb-6">
            Sign In to Dashboard
          </h2>

          {/* Error Message */}
          {authError && (
            <div className="mb-6 bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 flex items-start space-x-3 text-rose-200 text-xs">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-400">Authentication Failed</p>
                <p className="mt-0.5 leading-normal">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Admin Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="admin@7bluehills.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-sm placeholder-slate-600 text-white outline-none transition duration-200"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Security Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-sm placeholder-slate-600 text-white outline-none transition duration-200"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold tracking-wider rounded-xl transition duration-200 disabled:opacity-50 select-none cursor-pointer text-sm"
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
            className="text-xs text-slate-500 hover:text-amber-500 transition duration-200 underline underline-offset-4"
          >
            Return to Customer Spin Page
          </a>
        </div>
      </div>
    </div>
  );
}
