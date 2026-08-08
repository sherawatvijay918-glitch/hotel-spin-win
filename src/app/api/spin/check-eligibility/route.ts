import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// Setup global mock storage for local testing when Firebase credentials are not set
const globalForMock = global as unknown as {
  mockSpins?: any[];
};
if (!globalForMock.mockSpins) {
  globalForMock.mockSpins = [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mobile } = body;

    if (!mobile) {
      return NextResponse.json({ error: "Missing mobile number." }, { status: 400 });
    }

    const cleanedMobile = mobile.trim().replace(/[^\d+]/g, "");
    if (cleanedMobile.length < 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }

    // Detect if we are using mock credentials
    const isMock = process.env.FIREBASE_PRIVATE_KEY?.includes("MOCK") || !process.env.FIREBASE_CLIENT_EMAIL;

    if (isMock) {
      console.warn("Firebase check-eligibility: Running in MOCK Fallback Mode.");
      // Check in-memory mock storage
      const existingMockSpin = globalForMock.mockSpins?.find((spin) => spin.mobile === cleanedMobile);

      if (existingMockSpin) {
        return NextResponse.json({
          eligible: false,
          message: "This mobile number has already received a Lucky Spin.",
          existingSpin: {
            customerName: existingMockSpin.customerName,
            rewardName: existingMockSpin.rewardName,
            couponCode: existingMockSpin.couponCode,
            createdAt: existingMockSpin.createdAt,
            expiresAt: existingMockSpin.expiresAt,
          },
        });
      }

      return NextResponse.json({ eligible: true });
    }

    // Real Firebase check
    const duplicateMobile = await adminDb
      .collection("spins")
      .where("mobile", "==", cleanedMobile)
      .limit(1)
      .get();

    if (!duplicateMobile.empty) {
      const existingData = duplicateMobile.docs[0].data();
      return NextResponse.json({
        eligible: false,
        message: "This mobile number has already received a Lucky Spin.",
        existingSpin: {
          customerName: existingData.customerName,
          rewardName: existingData.rewardName,
          couponCode: existingData.couponCode,
          createdAt: existingData.createdAt.toDate().toISOString(),
          expiresAt: existingData.expiresAt.toDate().toISOString(),
        },
      });
    }

    return NextResponse.json({ eligible: true });
  } catch (err: any) {
    console.error("Check eligibility error:", err);
    return NextResponse.json({ error: "Internal server validation error." }, { status: 500 });
  }
}
