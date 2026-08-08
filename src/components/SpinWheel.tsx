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
  "#0b0c10", // Carbon Charcoal
  "#15171e", // Slate Dark Black
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
    const radius = center - 20; // padding for border and outer bulbs

    ctx.clearRect(0, 0, size, size);

    // Draw Outer Gold Ring Frame
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    const goldGrad = ctx.createLinearGradient(0, 0, size, size);
    goldGrad.addColorStop(0, "#8a662d");
    goldGrad.addColorStop(0.25, "#d4af37");
    goldGrad.addColorStop(0.5, "#fdf0cd");
    goldGrad.addColorStop(0.75, "#d4af37");
    goldGrad.addColorStop(1, "#8a662d");
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 8;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(212, 175, 55, 0.3)";
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow

    // Inner fine gold ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
    ctx.strokeStyle = "#AA7C11";
    ctx.lineWidth = 1.5;
    ctx.stroke();

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

      // Inner divider line (Solid gold thin strokes)
      ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Text
      ctx.save();
      
      // Alternate gold and white text
      ctx.fillStyle = i % 2 === 0 ? "#FFF3D1" : "#FFFFFF";
      ctx.font = "bold 12px 'Outfit', sans-serif";
      if (size < 400) {
        ctx.font = "bold 10px 'Outfit', sans-serif";
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

      ctx.fillText(displayName, radius - 20, 0);
      ctx.restore();
    }

    // Draw Circular Golden Lights (bulbs) around the rim
    const numBulbs = 24;
    for (let b = 0; b < numBulbs; b++) {
      const bulbAngle = b * (2 * Math.PI / numBulbs);
      const bulbX = center + (radius + 8) * Math.cos(bulbAngle);
      const bulbY = center + (radius + 8) * Math.sin(bulbAngle);
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = b % 2 === 0 ? "#FFFDF5" : "#E5C158";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#FFFDF5";
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw Center Medallion (Polished Brass 3D look)
    ctx.beginPath();
    ctx.arc(center, center, 42, 0, 2 * Math.PI);
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, 42);
    gradient.addColorStop(0, "#FFF9E6");
    gradient.addColorStop(0.3, "#E5C158");
    gradient.addColorStop(0.8, "#AA7C11");
    gradient.addColorStop(1, "#5B4004");
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center medallion inner border
    ctx.beginPath();
    ctx.arc(center, center, 35, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center text - "7BH" (luxury Outfit serif-like uppercase)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 2;
    ctx.fillText("7BH", center, center);
    ctx.shadowBlur = 0;
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
