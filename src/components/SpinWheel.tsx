"use client";

import React, { useEffect, useRef, useState } from "react";

interface Reward {
  rewardId: string;
  rewardName: string;
  probability: number;
}

interface SpinWheelProps {
  rewards: Reward[];
  targetRewardId: string | null;
  onFinished: () => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}

const PREMIUM_COLORS = [
  "#1A365D", // Dark Navy
  "#8C7A5B", // Premium Bronze
  "#1E293B", // Slate Grey
  "#9A3412", // Rich Rust/Amber
  "#065F46", // Emerald Green
  "#701A75", // Deep Plum
  "#9F1239", // Ruby Red
  "#3B2244", // Royal Purple
];

export default function SpinWheel({
  rewards,
  targetRewardId,
  onFinished,
  isSpinning,
  setIsSpinning,
}: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentAngle, setCurrentAngle] = useState(0);
  const animationRef = useRef<number | null>(null);

  // Constants
  const numSegments = rewards.length || 8;
  const arcSize = (2 * Math.PI) / numSegments;

  // Draw the wheel static state
  const drawWheel = (angleOffset: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width / 2;
    const center = size / 2;
    const radius = center - 15; // padding for border

    ctx.clearRect(0, 0, size, size);

    // Draw Outer Gold Ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = "#D4AF37"; // Gold border
    ctx.lineWidth = 10;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(212, 175, 55, 0.4)";
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow

    // Draw segments
    for (let i = 0; i < numSegments; i++) {
      const angle = angleOffset + i * arcSize;
      const reward = rewards[i];
      const rewardName = reward ? reward.rewardName : `Reward ${i + 1}`;

      // Alternate colors
      const color = PREMIUM_COLORS[i % PREMIUM_COLORS.length];
      ctx.fillStyle = color;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arcSize);
      ctx.closePath();
      ctx.fill();

      // Inner divider line
      ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Text
      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 13px 'Inter', sans-serif";
      if (size < 400) {
        ctx.font = "bold 11px 'Inter', sans-serif";
      }
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      // Rotate text to follow segment
      ctx.translate(center, center);
      ctx.rotate(angle + arcSize / 2);
      
      // Limit text length to avoid overlapping
      let displayName = rewardName;
      if (displayName.length > 20) {
        displayName = displayName.substring(0, 18) + "...";
      }

      ctx.fillText(displayName, radius - 25, 0);
      ctx.restore();
    }

    // Draw Center Peg (Gold Button)
    ctx.beginPath();
    ctx.arc(center, center, 45, 0, 2 * Math.PI);
    const gradient = ctx.createRadialGradient(center, center, 5, center, center, 45);
    gradient.addColorStop(0, "#FFF3D1");
    gradient.addColorStop(0.5, "#D4AF37");
    gradient.addColorStop(1, "#AA7C11");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Center text - "7BH"
    ctx.fillStyle = "#0F1E36";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("7BH", center, center);
  };

  // Re-draw when rewards list changes or angle changes
  useEffect(() => {
    drawWheel(currentAngle);
  }, [rewards, currentAngle]);

  // Adjust canvas resolution for high-DPI screens
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeCanvas = () => {
      const containerWidth = canvas.parentElement?.clientWidth || 350;
      const size = Math.min(containerWidth, 450); // limit max width
      canvas.width = size * 2;
      canvas.height = size * 2;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.getContext("2d")?.scale(2, 2);
      drawWheel(currentAngle);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [rewards, currentAngle]);

  const spin = () => {
    if (!targetRewardId || rewards.length === 0 || animationRef.current) return;

    setIsSpinning(true);

    // Find the index of the winning reward
    const winningIndex = rewards.findIndex((r) => r.rewardId === targetRewardId);
    if (winningIndex === -1) {
      setIsSpinning(false);
      return;
    }

    // Target pointer is at the very top (-90 degrees, i.e., 1.5 * Math.PI)
    // The segment selected must align with the top center.
    // A segment at index `i` is drawn from: i * arcSize to (i + 1) * arcSize
    // Its center angle is: (i + 0.5) * arcSize
    // To align this center angle with the pointer (1.5 * Math.PI):
    // pointerAngle = 1.5 * Math.PI
    // targetAngleOffset = pointerAngle - centerAngleOfSegment
    // Let's also add multiple full spins (e.g. 5 full rotations = 10 * Math.PI) for duration.

    const targetPointerAngle = 1.5 * Math.PI;
    const centerSegmentAngle = (winningIndex + 0.5) * arcSize;
    
    // Normalizing angles
    const baseTargetAngle = targetPointerAngle - centerSegmentAngle;
    const totalRotation = baseTargetAngle + 2 * Math.PI * 6; // 6 full spins
    
    const startAngle = currentAngle % (2 * Math.PI);
    const deltaAngle = totalRotation - startAngle;

    const duration = 5000; // 5 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic Ease Out Easing function
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const angle = startAngle + deltaAngle * easeOut(progress);

      setCurrentAngle(angle);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        onFinished();
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Listen to external spin commands when targetRewardId is loaded
  useEffect(() => {
    if (isSpinning && targetRewardId && !animationRef.current) {
      spin();
    }
  }, [isSpinning, targetRewardId]);

  // Cleanup animation
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full max-w-[450px] aspect-square mx-auto">
      {/* Indicator Pointer (Gold Arrow pointing down) */}
      <div className="absolute top-[-5px] left-1/2 transform -translate-x-1/2 z-10 filter drop-shadow-md">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 21L3 6H21L12 21Z"
            fill="#D4AF37"
            stroke="#FFF3D1"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* The canvas representing the wheel */}
      <div className="w-full flex justify-center items-center bg-transparent rounded-full overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} className="block select-none" />
      </div>
    </div>
  );
}
