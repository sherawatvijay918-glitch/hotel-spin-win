"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { QRCodeCanvas } from "qrcode.react";
import {
  Settings,
  QrCode,
  Download,
  Save,
  Loader2,
  Calendar,
  AlertTriangle,
  Database,
  Sparkles,
  CheckCircle,
} from "lucide-react";

interface CampaignSettings {
  campaignActive: boolean;
  spinStartDate: string;
  spinEndDate: string;
  spinEligibility: "one_per_mobile" | "unlimited";
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Campaign configurations
  const [active, setActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eligibility, setEligibility] = useState<"one_per_mobile" | "unlimited">("one_per_mobile");

  // Local site origin for QR code
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data = await response.json();
        setActive(data.campaignActive ?? true);

        // Convert firestore timestamp or date string to YYYY-MM-DDTHH:MM format for input type="datetime-local"
        if (data.spinStartDate) {
          const start = new Date(data.spinStartDate);
          setStartDate(start.toISOString().slice(0, 16));
        }
        if (data.spinEndDate) {
          const end = new Date(data.spinEndDate);
          setEndDate(end.toISOString().slice(0, 16));
        }

        setEligibility(data.spinEligibility || "one_per_mobile");
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const settingsData = {
        campaignActive: active,
        spinStartDate: startDate ? new Date(startDate) : null,
        spinEndDate: endDate ? new Date(endDate) : null,
        spinEligibility: eligibility,
      };

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Failed to save configurations.");
    } finally {
      setSaving(false);
    }
  };

  const handleBootstrap = async () => {
    if (
      !confirm(
        "Are you sure you want to bootstrap/reset the rewards database? This will set up the standard 8 rewards, campaign settings, and default admin configuration."
      )
    ) {
      return;
    }

    setBootstrapping(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to bootstrap database");
      }

      // Update local state variables
      const start = new Date();
      const end = new Date();
      end.setFullYear(start.getFullYear() + 1);

      setActive(true);
      setStartDate(start.toISOString().slice(0, 16));
      setEndDate(end.toISOString().slice(0, 16));
      setEligibility("one_per_mobile");

      alert("Rewards database successfully seeded!");
    } catch (err) {
      console.error(err);
      alert("Failed to seed database.");
    } finally {
      setBootstrapping(false);
    }
  };

  const downloadQRCodeImage = () => {
    // Generate a high-resolution print card with QR code, instructions, and logo
    const qrCanvas = document.getElementById("campaign-qr-canvas") as HTMLCanvasElement;
    if (!qrCanvas) return;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Luxury Dark Blue / Slate Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1100);
    bgGrad.addColorStop(0, "#0F172A");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 1100);

    // 2. Gold Borders
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 740, 1040);

    ctx.strokeStyle = "#C5A880";
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, 716, 1016);

    // 3. Hotel Branding
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 36px serif";
    ctx.textAlign = "center";
    ctx.fillText("7 BLUE HILLS", 400, 120);

    ctx.fillStyle = "#E2E8F0";
    ctx.font = "18px 'Inter', sans-serif";
    ctx.fillText("HOTEL & RESTAURANT", 400, 160);

    // Divider
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
    ctx.beginPath();
    ctx.moveTo(150, 190);
    ctx.lineTo(650, 190);
    ctx.stroke();

    // 4. Headline
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 42px serif";
    ctx.fillText("SPIN & WIN!", 400, 260);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "italic 20px serif";
    ctx.fillText("Try your luck and win exclusive rewards", 400, 305);

    // 5. White card box for QR code (high contrast)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(175, 360, 450, 450);

    // Draw QR code onto the canvas card
    // Draw the image of the rendered qrCanvas inside the white box
    ctx.drawImage(qrCanvas, 225, 410, 350, 350);

    // 6. Footer Instructions
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.fillText("SCAN THE QR CODE TO SPIN", 400, 880);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "14px 'Inter', sans-serif";
    ctx.fillText("Available at Reception, Dining Tables, & Billing Counters", 400, 920);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillText("1 Spin per customer • Coupons redeemable at hotel desk only", 400, 965);

    // Download action
    const link = document.createElement("a");
    link.download = "7BlueHills_SpinAndWin_QR_Poster.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const spinPageUrl = `${origin}/spin`;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-slate-400">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
        <p className="text-sm">Loading campaign configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-850">
      {/* Title block */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-serif text-slate-800 tracking-wide">
          Campaign Settings
        </h1>
        <p className="text-sm text-slate-500">
          Configure rule conditions and manage print-ready QR codes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SETTINGS CONFIGURATION FORM */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-600 border-b border-slate-100 pb-4">
            <Settings size={18} />
            <h2 className="text-base font-bold text-slate-800 font-serif">Rules & Validity</h2>
          </div>

          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center space-x-2 text-green-800 text-xs animate-fade-in">
              <CheckCircle size={14} className="text-green-600 shrink-0" />
              <span className="font-semibold">Settings successfully updated!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Active Switch */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div>
                <h4 className="text-slate-800 font-bold uppercase tracking-wider mb-0.5">Campaign Status</h4>
                <p className="text-[10px] text-slate-450">Instantly enable or disable the spin wheel page.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Date validation picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} className="text-amber-600" />
                  <span>Start Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl text-slate-800 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} className="text-rose-600" />
                  <span>End Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl text-slate-800 outline-none font-mono"
                />
              </div>
            </div>

            {/* Cooldown/Participation rules */}
            <div className="space-y-1.5">
              <label className="text-slate-500 font-bold uppercase tracking-wider">
                Participation Limit
              </label>
              <select
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value as any)}
                className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl text-slate-700 outline-none cursor-pointer"
              >
                <option value="one_per_mobile">Strictly One Spin Per Mobile Number</option>
                <option value="unlimited">Unlimited Spins (Mainly for Testing)</option>
              </select>
              <p className="text-[10px] text-slate-450 leading-relaxed mt-1.5">
                Checking 'Strictly One Spin' verifies if the client mobile number has already spun in the Firestore collection prior to allowing a spin animation.
              </p>
            </div>

            {/* Submit settings button */}
            <button
              type="submit"
              disabled={saving}
              className="w-max flex items-center justify-center px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold tracking-wider rounded-xl transition duration-150 uppercase text-[10px] select-none cursor-pointer shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin mr-1.5" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={12} className="mr-1.5" />
                  Save Configurations
                </>
              )}
            </button>
          </form>

          {/* BOOTSTRAP DATABASE PANEL */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex items-center space-x-2 text-rose-600">
              <Database size={16} />
              <h3 className="text-sm font-bold uppercase tracking-wider font-serif">Setup Helper & Maintenance</h3>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-xs">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-3">
                <p className="text-rose-750 leading-normal font-medium">
                  If the Firestore collection is empty or you need to re-seed default rewards (10% Food Discount, Starter, Room Upgrades, etc.), click below to seed default settings.
                </p>
                <button
                  type="button"
                  disabled={bootstrapping}
                  onClick={handleBootstrap}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2 rounded-xl transition uppercase text-[10px] tracking-wider select-none cursor-pointer flex items-center gap-1.5"
                >
                  {bootstrapping ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Database size={12} />
                  )}
                  Reset / Bootstrap Database
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* QR CODE POSTER EXPORT PANEL */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-amber-600 border-b border-slate-100 pb-4">
              <QrCode size={18} />
              <h2 className="text-base font-bold text-slate-800 font-serif">Print QR Poster</h2>
            </div>
            <p className="text-xs text-slate-450 leading-normal">
              Below is the QR code pointing directly to your customer spin page. Download the print-ready poster to place at hotel tables, counters, or lobbies.
            </p>

            {/* Canvas QR Code (Hidden/Rendered for reference) */}
            <div className="bg-white p-4 rounded-2xl inline-block border border-slate-150 shadow-sm mx-auto relative group">
              <QRCodeCanvas
                id="campaign-qr-canvas"
                value={spinPageUrl}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* URL label */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Destination Link</span>
              <p className="text-[11px] font-mono text-amber-600 truncate max-w-full bg-slate-50 p-2 rounded-lg border border-slate-200" title={spinPageUrl}>
                {spinPageUrl}
              </p>
            </div>
          </div>

          <button
            onClick={downloadQRCodeImage}
            className="w-full flex items-center justify-center py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold tracking-wider rounded-xl transition duration-150 text-xs uppercase select-none cursor-pointer gap-1.5 shadow-sm"
          >
            <Download size={14} />
            Download Print Poster
          </button>
        </div>
      </div>
    </div>
  );
}
