import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Missing coupon code." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const snapshot = await adminDb
      .collection("spins")
      .where("couponCode", "==", cleanCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

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

    return NextResponse.json({
      success: true,
      coupon: {
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
      },
    });
  } catch (error: any) {
    console.error("Coupon verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify coupon." },
      { status: 500 }
    );
  }
}
