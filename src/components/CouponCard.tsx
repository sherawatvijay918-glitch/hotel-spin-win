"use client";

import React, { useRef, useState } from "react";
import { Copy, Download, Share2, Check, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface CouponCardProps {
  coupon: {
    customerName: string;
    rewardName: string;
    couponCode: string;
    createdAt: string;
    expiresAt: string;
  };
}

export default function CouponCard({ coupon }: CouponCardProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const formattedExpiry = new Date(coupon.expiresAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedCreated = new Date(coupon.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Unique validation link for staff to scan
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const verificationUrl = `${origin}/admin/verify?code=${coupon.couponCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(coupon.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  const shareOnWhatsApp = () => {
    const text = `🎉 Congratulations ${coupon.customerName}! You won "${coupon.rewardName}" at 7 Blue Hills Hotel & Restaurant!\n\nCoupon Code: ${coupon.couponCode}\nValid until: ${formattedExpiry}\n\nPresent this message at the hotel counter to redeem your reward.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const downloadCoupon = () => {
    // Generate a downloadable coupon image using HTML5 Canvas
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background Gradient (Luxury Slate/Navy)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 800);
    bgGrad.addColorStop(0, "#0F172A"); // Slate 900
    bgGrad.addColorStop(1, "#020617"); // Slate 950
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 800);

    // Decorative Gold Border
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 560, 760);
    
    ctx.strokeStyle = "#C5A880";
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, 548, 748);

    // Header Branding
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 22px serif";
    ctx.textAlign = "center";
    ctx.fillText("7 BLUE HILLS", 300, 80);

    ctx.fillStyle = "#E2E8F0";
    ctx.font = "14px 'Inter', sans-serif";
    ctx.fillText("HOTEL & RESTAURANT", 300, 105);

    // Divider Line
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
    ctx.beginPath();
    ctx.moveTo(80, 130);
    ctx.lineTo(520, 130);
    ctx.stroke();

    // Reward Title Section
    ctx.fillStyle = "#94A3B8";
    ctx.font = "14px 'Inter', sans-serif";
    ctx.fillText("EXCLUSIVE REWARD", 300, 170);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px serif";
    // Multiline check for long reward names
    const words = coupon.rewardName.split(" ");
    let line1 = "";
    let line2 = "";
    if (words.length > 3) {
      line1 = words.slice(0, 3).join(" ");
      line2 = words.slice(3).join(" ");
    } else {
      line1 = coupon.rewardName;
    }
    
    ctx.fillText(line1, 300, 220);
    if (line2) {
      ctx.fillText(line2, 300, 265);
    }

    const nextY = line2 ? 310 : 275;

    // Coupon Code Box
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(100, nextY, 400, 90);
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    ctx.strokeRect(100, nextY, 400, 90);

    ctx.fillStyle = "#E2E8F0";
    ctx.font = "13px 'Inter', sans-serif";
    ctx.fillText("YOUR UNIQUE COUPON CODE", 300, nextY + 30);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 30px 'Courier New', monospace";
    ctx.fillText(coupon.couponCode, 300, nextY + 68);

    // Customer Name & Date info
    ctx.fillStyle = "#94A3B8";
    ctx.font = "14px 'Inter', sans-serif";
    ctx.fillText(`Presented to: ${coupon.customerName}`, 300, nextY + 130);
    ctx.fillText(`Issued: ${formattedCreated}`, 300, nextY + 160);

    // Draw QR code onto canvas
    // We render a quick QR image placeholder or text in the download canvas,
    // or draw QR modules manually. Since drawing QR is complex, let's embed the verification URL.
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillText("VALID FOR REDEMPTION AT HOTEL COUNTER", 300, nextY + 205);
    ctx.fillStyle = "#EF4444";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText(`Expiry Date: ${formattedExpiry}`, 300, nextY + 235);

    // Terms and Conditions footer
    ctx.fillStyle = "#64748B";
    ctx.font = "italic 11px 'Inter', sans-serif";
    if (coupon.rewardName.includes("10%")) {
      ctx.fillStyle = "#D4AF37";
      ctx.fillText("Terms: * Applicable on a minimum billing of ₹799.", 300, 700);
      ctx.fillStyle = "#64748B";
      ctx.fillText("Valid for one-time use only. Present coupon code before billing.", 300, 722);
      ctx.fillText("Cannot be redeemed for cash or combined with other promotions.", 300, 742);
    } else {
      ctx.fillText("Terms: Valid for one-time use only. Present coupon code before billing.", 300, 720);
      ctx.fillText("Cannot be redeemed for cash or combined with other promotions.", 300, 740);
    }

    // Download action
    const link = document.createElement("a");
    link.download = `7BH_Coupon_${coupon.couponCode}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Premium Ticket Card */}
      <div
        ref={cardRef}
        className="relative bg-slate-900 text-white rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl p-6 md:p-8 backdrop-blur-md bg-opacity-95"
      >
        {/* Top/Bottom Ticket Cutouts */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-slate-950 rounded-full border-r border-amber-500/30"></div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-slate-950 rounded-full border-l border-amber-500/30"></div>

        {/* Inner Border */}
        <div className="absolute inset-2 border border-amber-500/10 pointer-events-none rounded-xl"></div>

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Logo / Header */}
          <div className="space-y-1">
            <h2 className="text-amber-500 font-serif text-xl md:text-2xl font-bold tracking-widest">
              7 BLUE HILLS
            </h2>
            <p className="text-slate-400 text-xs tracking-wider uppercase font-semibold">
              Hotel & Restaurant
            </p>
          </div>

          <div className="w-full border-t border-slate-800 my-1"></div>

          {/* Reward Name */}
          <div className="space-y-1">
            <span className="text-xs text-amber-500/70 font-semibold tracking-widest uppercase">
              Exclusive Reward
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-white font-serif tracking-normal leading-tight px-4">
              {coupon.rewardName}
            </h3>
          </div>

          {/* Coupon Code Panel */}
          <div className="w-full bg-slate-950/80 rounded-xl border border-amber-500/20 py-4 px-6 flex flex-col items-center justify-center space-y-2 relative group overflow-hidden">
            <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
              Your Unique Coupon Code
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xl md:text-2xl font-mono font-bold tracking-widest text-amber-400">
                {coupon.couponCode}
              </span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="text-slate-300 text-sm space-y-1 my-2">
            <p>
              <span className="text-slate-500 font-medium">Winner:</span> {coupon.customerName}
            </p>
            <p className="text-xs text-slate-400">
              <span className="text-slate-500">Won on:</span> {formattedCreated}
            </p>
          </div>

          {/* QR Code section for Verification */}
          <div className="bg-white p-2.5 rounded-lg inline-block shadow-md">
            <QRCodeSVG value={verificationUrl} size={110} level="M" includeMargin={false} />
          </div>
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <span>Staff scan to verify coupon</span>
            <ExternalLink size={10} className="text-amber-500/70" />
          </p>

          <div className="w-full border-t border-slate-800 my-1"></div>

          {/* Validity & Terms */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-rose-400">
              Valid Till: {formattedExpiry}
            </p>
            <div className="text-[10px] text-slate-500 px-4 leading-normal italic space-y-1">
              {coupon.rewardName.includes("10%") && (
                <p className="text-amber-500/90 font-medium not-italic">
                  * Applicable on a minimum spend/billing of ₹799.
                </p>
              )}
              <p>
                * Present this coupon to our staff before placing order/billing. Valid for 1 spin only. Cannot be combined with other offers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-2 px-2">
        <button
          onClick={copyToClipboard}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white transition duration-200"
        >
          {copied ? (
            <>
              <Check className="h-5 w-5 text-green-500 mb-1" />
              <span className="text-[11px] font-medium text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-5 w-5 mb-1 text-slate-400" />
              <span className="text-[11px] font-medium">Copy Code</span>
            </>
          )}
        </button>

        <button
          onClick={downloadCoupon}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white transition duration-200"
        >
          <Download className="h-5 w-5 mb-1 text-slate-400" />
          <span className="text-[11px] font-medium">Save Image</span>
        </button>

        <button
          onClick={shareOnWhatsApp}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white transition duration-200"
        >
          <Share2 className="h-5 w-5 mb-1 text-slate-400" />
          <span className="text-[11px] font-medium">WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
