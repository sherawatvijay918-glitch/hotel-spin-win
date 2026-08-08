import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { couponId, usedBy } = body;

    if (!couponId) {
      return NextResponse.json({ error: "Missing coupon ID." }, { status: 400 });
    }

    const couponRef = adminDb.collection("spins").doc(couponId);
    const doc = await couponRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    const data = doc.data();
    if (data?.status === "used") {
      return NextResponse.json({ error: "Coupon already redeemed." }, { status: 400 });
    }

    await couponRef.update({
      status: "used",
      usedAt: FieldValue.serverTimestamp(),
      usedBy: usedBy || "admin",
    });

    return NextResponse.json({
      success: true,
      message: "Coupon successfully marked as redeemed.",
    });
  } catch (error: any) {
    console.error("Coupon redemption error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to redeem coupon." },
      { status: 500 }
    );
  }
}
