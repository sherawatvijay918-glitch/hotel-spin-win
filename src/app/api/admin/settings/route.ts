import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const docSnap = await adminDb.collection("settings").doc("campaign").get();
    if (!docSnap.exists) {
      // return default settings structure
      return NextResponse.json({
        campaignActive: true,
        spinStartDate: null,
        spinEndDate: null,
        spinEligibility: "one_per_mobile",
      });
    }
    const data = docSnap.data();
    return NextResponse.json({
      campaignActive: data?.campaignActive ?? true,
      spinStartDate: data?.spinStartDate ? (data.spinStartDate.toDate ? data.spinStartDate.toDate().toISOString() : new Date(data.spinStartDate).toISOString()) : null,
      spinEndDate: data?.spinEndDate ? (data.spinEndDate.toDate ? data.spinEndDate.toDate().toISOString() : new Date(data.spinEndDate).toISOString()) : null,
      spinEligibility: data?.spinEligibility || "one_per_mobile",
    });
  } catch (error: any) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: error.message || "Failed to load settings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignActive, spinStartDate, spinEndDate, spinEligibility } = body;

    const settingsRef = adminDb.collection("settings").doc("campaign");

    await settingsRef.set({
      campaignActive: campaignActive ?? true,
      spinStartDate: spinStartDate ? new Date(spinStartDate) : null,
      spinEndDate: spinEndDate ? new Date(spinEndDate) : null,
      spinEligibility: spinEligibility || "one_per_mobile",
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully.",
    });
  } catch (error: any) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: error.message || "Failed to save settings." }, { status: 500 });
  }
}

export async function PUT() {
  try {
    // Bootstrap database settings & rewards
    const defaultRewards = [
      {
        rewardId: "food-10",
        rewardName: "10% OFF on Food Bill",
        description: "Get 10% discount on food orders at our restaurant.",
        probability: 25.0,
        active: true,
        validityDays: 7,
        usageLimit: 1000,
        usedCount: 0,
      },
      {
        rewardId: "welcome-drink",
        rewardName: "Welcome Drink FREE",
        description: "Enjoy a free welcome mocktail on your visit.",
        probability: 20.0,
        active: true,
        validityDays: 3,
        usageLimit: 2000,
        usedCount: 0,
      },
      {
        rewardId: "starter-free",
        rewardName: "Starter FREE",
        description: "Get any starter of your choice free with your food order.",
        probability: 15.0,
        active: true,
        validityDays: 5,
        usageLimit: 500,
        usedCount: 0,
      },
      {
        rewardId: "dessert-free",
        rewardName: "Dessert FREE",
        description: "End your meal on a sweet note with a free dessert.",
        probability: 15.0,
        active: true,
        validityDays: 5,
        usageLimit: 500,
        usedCount: 0,
      },
      {
        rewardId: "breakfast-2",
        rewardName: "Breakfast for 2 FREE",
        description: "Complimentary buffet breakfast for 2 guests.",
        probability: 10.0,
        active: true,
        validityDays: 14,
        usageLimit: 100,
        usedCount: 0,
      },
      {
        rewardId: "room-15",
        rewardName: "15% OFF on Room Booking",
        description: "Get a 15% discount on room bookings made directly.",
        probability: 7.0,
        active: true,
        validityDays: 30,
        usageLimit: 200,
        usedCount: 0,
      },
      {
        rewardId: "room-500",
        rewardName: "₹500 OFF on Room Booking",
        description: "Flat ₹500 discount on your room bill.",
        probability: 5.0,
        active: true,
        validityDays: 30,
        usageLimit: 300,
        usedCount: 0,
      },
      {
        rewardId: "room-upgrade",
        rewardName: "Room Upgrade FREE",
        description: "Complimentary upgrade to the next room tier.",
        probability: 3.0,
        active: true,
        validityDays: 7,
        usageLimit: 50,
        usedCount: 0,
      },
    ];

    // 1. Delete all existing rewards, then seed new ones
    const rewardsCol = await adminDb.collection("rewards").get();
    const batch = adminDb.batch();
    rewardsCol.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    // 2. Write new rewards
    for (const r of defaultRewards) {
      await adminDb.collection("rewards").doc(r.rewardId).set(r);
    }

    // 3. Seed Settings
    const start = new Date();
    const end = new Date();
    end.setFullYear(start.getFullYear() + 1);

    await adminDb.collection("settings").doc("campaign").set({
      campaignActive: true,
      spinStartDate: start,
      spinEndDate: end,
      spinEligibility: "one_per_mobile",
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded and initialized successfully.",
    });
  } catch (error: any) {
    console.error("Bootstrap database error:", error);
    return NextResponse.json({ error: error.message || "Failed to bootstrap database." }, { status: 500 });
  }
}
