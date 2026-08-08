import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch all spins sorted by createdAt desc
    const spinsSnapshot = await adminDb
      .collection("spins")
      .orderBy("createdAt", "desc")
      .get();

    const spins: any[] = [];
    spinsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Handle conversion of timestamps safely
      let createdAtStr = null;
      if (data.createdAt) {
        createdAtStr = typeof data.createdAt.toDate === "function" 
          ? data.createdAt.toDate().toISOString() 
          : new Date(data.createdAt).toISOString();
      }
      
      let expiresAtStr = null;
      if (data.expiresAt) {
        expiresAtStr = typeof data.expiresAt.toDate === "function" 
          ? data.expiresAt.toDate().toISOString() 
          : new Date(data.expiresAt).toISOString();
      }

      let usedAtStr = null;
      if (data.usedAt) {
        usedAtStr = typeof data.usedAt.toDate === "function" 
          ? data.usedAt.toDate().toISOString() 
          : new Date(data.usedAt).toISOString();
      }

      spins.push({
        id: doc.id,
        customerName: data.customerName || "",
        mobile: data.mobile || "",
        instagramUsername: data.instagramUsername || "",
        email: data.email || "",
        rewardId: data.rewardId || "",
        rewardName: data.rewardName || "",
        couponCode: data.couponCode || "",
        status: data.status || "unused",
        createdAt: createdAtStr,
        expiresAt: expiresAtStr,
        usedAt: usedAtStr,
        usedBy: data.usedBy || "",
      });
    });

    // 2. Fetch all rewards
    const rewardsSnapshot = await adminDb.collection("rewards").get();
    const rewards: any[] = [];
    rewardsSnapshot.forEach((doc) => {
      const data = doc.data();
      rewards.push({
        id: doc.id,
        rewardName: data.rewardName || "",
        probability: data.probability || 0,
        usageLimit: data.usageLimit || 0,
        usedCount: data.usedCount || 0,
        active: data.active ?? true,
        validityDays: data.validityDays || 7,
      });
    });

    return NextResponse.json({
      success: true,
      spins,
      rewards,
    });
  } catch (error: any) {
    console.error("Admin dashboard fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error fetching admin data." },
      { status: 500 }
    );
  }
}
