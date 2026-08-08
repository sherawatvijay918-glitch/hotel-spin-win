import crypto from "crypto";

const SECRET_KEY = process.env.ADMIN_SESSION_SECRET || "7bluehills-super-secret-key-123456789";

export function generateSessionToken(email: string): string {
  const timestamp = Date.now().toString();
  const rawData = `${email}:${timestamp}`;
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(rawData).digest("hex");
  return `${email}:${timestamp}:${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [email, timestamp, signature] = parts;

  // Verify signature
  const expectedSignature = crypto.createHmac("sha256", SECRET_KEY).update(`${email}:${timestamp}`).digest("hex");
  if (signature !== expectedSignature) return false;

  // Check expiration (7 days)
  const time = parseInt(timestamp, 10);
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - time > sevenDays) return false;

  // Validate the admin email
  const cleanEmail = email.trim().toLowerCase();
  const allowedEmails = [
    "7bluehillshotel@gmail.com",
    "admin@spin.com"
  ];
  return allowedEmails.includes(cleanEmail);
}
