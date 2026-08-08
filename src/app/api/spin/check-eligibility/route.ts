import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { mobile } = body;

    if (!mobile) {
      return NextResponse.json(
        {
          error: "Missing mobile number.",
        },
        {
          status: 400,
        }
      );
    }

    const cleanedMobile = String(mobile)
      .trim()
      .replace(/[^\d+]/g, "");

    if (cleanedMobile.length < 10) {
      return NextResponse.json(
        {
          error: "Please enter a valid 10-digit mobile number.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "Checking Lucky Spin eligibility for mobile:",
      cleanedMobile
    );

    const duplicateMobile = await adminDb
      .collection("spins")
      .where("mobile", "==", cleanedMobile)
      .limit(1)
      .get();

    if (!duplicateMobile.empty) {
      const existingData = duplicateMobile.docs[0].data();

      return NextResponse.json({
        eligible: false,
        message:
          "This mobile number has already received a Lucky Spin.",
        existingSpin: {
          customerName: existingData.customerName || "",
          rewardName: existingData.rewardName || "",
          couponCode: existingData.couponCode || "",
          createdAt:
            existingData.createdAt?.toDate?.()?.toISOString() || null,
          expiresAt:
            existingData.expiresAt?.toDate?.()?.toISOString() || null,
        },
      });
    }

    return NextResponse.json({
      eligible: true,
      message: "Mobile number is eligible for Lucky Spin.",
    });
  } catch (error) {
    console.error(
      "Check eligibility error:",
      error
    );

    return NextResponse.json(
      {
        error: "Internal server validation error.",
      },
      {
        status: 500,
      }
    );
  }
}