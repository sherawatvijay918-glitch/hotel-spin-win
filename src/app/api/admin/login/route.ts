import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Secure login validation for campaign administrators
    if (
      (cleanEmail === "admin@7bluehills.com" || cleanEmail === "admin@spin.com") &&
      password === "admin123"
    ) {
      return NextResponse.json({
        success: true,
        user: {
          email: cleanEmail,
          uid: "server-auth-admin-uid",
        },
      });
    }

    return NextResponse.json({ error: "Invalid email address or password." }, { status: 401 });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
