import { NextResponse } from "next/server";
import { generateSessionToken } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validate credentials:
    // Email: 7bluehillshotel@gmail.com
    // Password: 7bluehills@@
    if (
      (cleanEmail === "7bluehillshotel@gmail.com" || cleanEmail === "admin@spin.com") &&
      password === "7bluehills@@"
    ) {
      const user = {
        email: cleanEmail,
        uid: "server-auth-admin-uid",
      };

      const token = generateSessionToken(cleanEmail);
      const response = NextResponse.json({
        success: true,
        user,
      });

      // Set HTTP-Only Cookie securely for session verification
      response.cookies.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
        sameSite: "strict",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid email address or password." }, { status: 401 });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
