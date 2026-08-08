import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rewardId, rewardName, description, probability, active, validityDays, usageLimit } = body;

    if (!rewardId || !rewardName) {
      return NextResponse.json({ error: "Reward ID and Name are required." }, { status: 400 });
    }

    const rewardRef = adminDb.collection("rewards").doc(rewardId);
    
    // Save or update reward data
    await rewardRef.set({
      rewardName: rewardName.trim(),
      description: description ? description.trim() : "",
      probability: Number(probability) || 0,
      active: active ?? true,
      validityDays: Number(validityDays) || 7,
      usageLimit: Number(usageLimit) || 0,
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Reward saved successfully.",
    });
  } catch (error: any) {
    console.error("Save reward error:", error);
    return NextResponse.json({ error: error.message || "Failed to save reward." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing reward ID." }, { status: 400 });
    }

    await adminDb.collection("rewards").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Reward deleted successfully.",
    });
  } catch (error: any) {
    console.error("Delete reward error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete reward." }, { status: 500 });
  }
}
