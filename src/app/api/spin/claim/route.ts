import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp, QueryDocumentSnapshot, Transaction } from "firebase-admin/firestore";

// Setup global mock storage for local testing when Firebase credentials are not set
const globalForMock = global as unknown as {
  mockSpins?: any[];
};
if (!globalForMock.mockSpins) {
  globalForMock.mockSpins = [];
}

// Helper to generate a unique coupon code: 7BH-XXXXXX
function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `7BH-${code}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, mobile, email, termsAccepted } = body;

    // 1. Validation
    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    }

    if (!mobile || !mobile.trim()) {
      return NextResponse.json({ error: "Mobile number is required." }, { status: 400 });
    }

    const cleanedMobile = mobile.trim().replace(/[^\d+]/g, "");
    if (cleanedMobile.length < 10) {
      return NextResponse.json({ error: "Please enter a valid mobile number." }, { status: 400 });
    }

    if (!termsAccepted) {
      return NextResponse.json({ error: "You must accept the terms and conditions." }, { status: 400 });
    }

    const isMock = process.env.FIREBASE_PRIVATE_KEY?.includes("MOCK") || !process.env.FIREBASE_CLIENT_EMAIL;

    // --- MOCK FALLBACK MODE ---
    if (isMock) {
      console.warn("Firebase claim: Running in MOCK Fallback Mode.");
      
      // Check duplicate mobile in mock storage
      const existingMockSpin = globalForMock.mockSpins?.find((spin) => spin.mobile === cleanedMobile);
      if (existingMockSpin) {
        return NextResponse.json(
          {
            error: "already_participated",
            message: "This mobile number has already received a Lucky Spin.",
            existingSpin: {
              customerName: existingMockSpin.customerName,
              rewardName: existingMockSpin.rewardName,
              couponCode: existingMockSpin.couponCode,
              createdAt: existingMockSpin.createdAt,
              expiresAt: existingMockSpin.expiresAt,
            },
          },
          { status: 400 }
        );
      }

      const rand = Math.random() * 100;
      let selectedRewardId = "food-10";
      let selectedRewardName = "10% OFF on Food Bill";
      
      if (rand < 50) {
        selectedRewardId = "food-10";
        selectedRewardName = "10% OFF on Food Bill";
      } else if (rand < 66.67) {
        selectedRewardId = "cold-coffee";
        selectedRewardName = "FREE Cold Coffee";
      } else if (rand < 83.33) {
        selectedRewardId = "french-fries";
        selectedRewardName = "FREE French Fries";
      } else {
        selectedRewardId = "burger";
        selectedRewardName = "FREE Burger";
      }

      const couponCode = generateCouponCode();
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const mockSpinData = {
        id: `mock-${Math.random().toString(36).substring(2, 9)}`,
        customerName: customerName.trim(),
        mobile: cleanedMobile,
        instagramUsername: "",
        instagramUsernameNormalized: "",
        email: email ? email.trim() : "",
        followConfirmed: true,
        rewardId: selectedRewardId,
        rewardName: selectedRewardName,
        couponCode,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: "unused",
        usedAt: null,
        usedBy: null,
      };

      globalForMock.mockSpins?.push(mockSpinData);

      return NextResponse.json({
        success: true,
        spin: mockSpinData,
      });
    }

    // --- REAL FIREBASE MODE ---
    // Ensure "cold-coffee" reward exists
    const coldCoffeeRef = adminDb.collection("rewards").doc("cold-coffee");
    const coldCoffeeDoc = await coldCoffeeRef.get();
    if (!coldCoffeeDoc.exists) {
      await coldCoffeeRef.set({
        rewardId: "cold-coffee",
        rewardName: "FREE Cold Coffee",
        description: "Enjoy a complimentary Cold Coffee with your meal.",
        probability: 16.67,
        active: true,
        validityDays: 7,
        usageLimit: 5000,
        usedCount: 0,
      });
    }

    // Ensure "french-fries" reward exists
    const frenchFriesRef = adminDb.collection("rewards").doc("french-fries");
    const frenchFriesDoc = await frenchFriesRef.get();
    if (!frenchFriesDoc.exists) {
      await frenchFriesRef.set({
        rewardId: "french-fries",
        rewardName: "FREE French Fries",
        description: "Enjoy a complimentary portion of French Fries with your order.",
        probability: 16.67,
        active: true,
        validityDays: 7,
        usageLimit: 5000,
        usedCount: 0,
      });
    }

    // Ensure "burger" reward exists
    const burgerRef = adminDb.collection("rewards").doc("burger");
    const burgerDoc = await burgerRef.get();
    if (!burgerDoc.exists) {
      await burgerRef.set({
        rewardId: "burger",
        rewardName: "FREE Burger",
        description: "Enjoy a complimentary Burger with your meal.",
        probability: 16.66,
        active: true,
        validityDays: 7,
        usageLimit: 5000,
        usedCount: 0,
      });
    }

    // 2. Check Campaign Settings
    const campaignDoc = await adminDb.collection("settings").doc("campaign").get();
    if (!campaignDoc.exists) {
      return NextResponse.json({ error: "Campaign configurations are missing." }, { status: 500 });
    }

    const campaignSettings = campaignDoc.data();
    const now = new Date();

    if (!campaignSettings?.campaignActive) {
      return NextResponse.json({ error: "The Spin & Win campaign is currently inactive." }, { status: 400 });
    }

    if (campaignSettings.spinStartDate) {
      const startDate = campaignSettings.spinStartDate.toDate();
      if (now < startDate) {
        return NextResponse.json({ error: "The Spin & Win campaign has not started yet." }, { status: 400 });
      }
    }

    if (campaignSettings.spinEndDate) {
      const endDate = campaignSettings.spinEndDate.toDate();
      if (now > endDate) {
        return NextResponse.json({ error: "The Spin & Win campaign has ended." }, { status: 400 });
      }
    }

    // 3. Check for Multiple Spins (Strict duplicate check for Mobile)
    if (campaignSettings.spinEligibility === "one_per_mobile") {
      const duplicateMobile = await adminDb
        .collection("spins")
        .where("mobile", "==", cleanedMobile)
        .limit(1)
        .get();

      if (!duplicateMobile.empty) {
        const existingData = duplicateMobile.docs[0].data();
        return NextResponse.json(
          {
            error: "already_participated",
            message: "This mobile number has already received a Lucky Spin.",
            existingSpin: {
              customerName: existingData.customerName,
              rewardName: existingData.rewardName,
              couponCode: existingData.couponCode,
              createdAt: existingData.createdAt.toDate().toISOString(),
              expiresAt: existingData.expiresAt.toDate().toISOString(),
            },
          },
          { status: 400 }
        );
      }
    }

    // 4. Retrieve Active Rewards
    const rewardsSnapshot = await adminDb
      .collection("rewards")
      .where("active", "==", true)
      .get();

    if (rewardsSnapshot.empty) {
      return NextResponse.json({ error: "No active rewards available at the moment." }, { status: 500 });
    }

    const rewards: any[] = [];
    rewardsSnapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      const usedCount = data.usedCount || 0;
      const usageLimit = data.usageLimit || 0;
      if (usedCount < usageLimit) {
        rewards.push({ id: doc.id, ...data });
      }
    });

    if (rewards.length === 0) {
      return NextResponse.json({ error: "All rewards have reached their limit." }, { status: 500 });
    }

    // 5. Select one of the four allowed rewards based on probabilities:
    // 10% OFF (50%), FREE Cold Coffee (16.67%), FREE French Fries (16.67%), FREE Burger (16.66%)
    const rand = Math.random() * 100;
    let targetRewardId = "food-10";
    if (rand < 50) {
      targetRewardId = "food-10";
    } else if (rand < 66.67) {
      targetRewardId = "cold-coffee";
    } else if (rand < 83.33) {
      targetRewardId = "french-fries";
    } else {
      targetRewardId = "burger";
    }

    let selectedReward = rewards.find((r) => r.id === targetRewardId || r.rewardId === targetRewardId);
    if (!selectedReward) {
      // fallback
      selectedReward = rewards[0];
    }

    // 6. Generate a Unique, Non-Colliding Coupon Code
    let couponCode = "";
    let isUnique = false;
    let retries = 0;

    while (!isUnique && retries < 5) {
      couponCode = generateCouponCode();
      const duplicateCheck = await adminDb
        .collection("spins")
        .where("couponCode", "==", couponCode)
        .limit(1)
        .get();

      if (duplicateCheck.empty) {
        isUnique = true;
      } else {
        retries++;
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: "Failed to generate a unique coupon code. Please try again." }, { status: 500 });
    }

    // 7. Calculate Expiry Date
    const validityDays = Number(selectedReward.validityDays) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // 8. Save Spin and Coupon in a transaction to ensure integrity and atomicity
    const spinId = adminDb.collection("spins").doc().id;
    const spinDocRef = adminDb.collection("spins").doc(spinId);
    const rewardDocRef = adminDb.collection("rewards").doc(selectedReward.id);

    const spinData = {
      id: spinId,
      customerName: customerName.trim(),
      mobile: cleanedMobile,
      instagramUsername: "",
      instagramUsernameNormalized: "",
      email: email ? email.trim() : "",
      followConfirmed: true,
      rewardId: selectedReward.id,
      rewardName: selectedReward.rewardName,
      couponCode,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      status: "unused",
      usedAt: null,
      usedBy: null,
    };

    await adminDb.runTransaction(async (transaction: Transaction) => {
      const freshRewardDoc = await transaction.get(rewardDocRef);
      if (!freshRewardDoc.exists) {
        throw new Error("Reward does not exist.");
      }
      const data = freshRewardDoc.data();
      const freshUsedCount = data?.usedCount || 0;
      const freshUsageLimit = data?.usageLimit || 0;
      if (freshUsedCount >= freshUsageLimit) {
        throw new Error("This reward is no longer available.");
      }

      transaction.set(spinDocRef, spinData);
      transaction.update(rewardDocRef, {
        usedCount: FieldValue.increment(1),
      });
    });

    return NextResponse.json({
      success: true,
      spin: {
        id: spinId,
        customerName: spinData.customerName,
        mobile: spinData.mobile,
        email: spinData.email,
        rewardId: spinData.rewardId,
        rewardName: spinData.rewardName,
        couponCode: spinData.couponCode,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: spinData.status,
      },
    });
  } catch (error: any) {
    console.error("Spin claim error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
