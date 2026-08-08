const fs = require("fs");
const path = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");

// Helper to load .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  console.log("Loading env from .env.local...");
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
} else {
  console.warn(".env.local file not found. Using system environment variables.");
}

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (privateKey) {
  privateKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
}

if (!clientEmail || !privateKey || !projectId) {
  console.error("Error: Missing Firebase credentials in environment variables.");
  process.exit(1);
}

// Initialize Admin SDK
initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = getFirestore();

const defaultRewards = [
  {
    rewardId: "food-10",
    rewardName: "10% OFF on Food Bill",
    description: "Get 10% discount on your total food bill at our restaurant.",
    probability: 75.0,
    active: true,
    validityDays: 7,
    usageLimit: 1000,
    usedCount: 0,
  },
  {
    rewardId: "welcome-drink",
    rewardName: "Welcome Drink FREE",
    description: "Enjoy a free welcome mocktail on your visit.",
    probability: 10.0,
    active: true,
    validityDays: 3,
    usageLimit: 2000,
    usedCount: 0,
  },
  {
    rewardId: "starter-free",
    rewardName: "Starter FREE",
    description: "Get any starter of your choice free with your food order.",
    probability: 5.0,
    active: true,
    validityDays: 5,
    usageLimit: 500,
    usedCount: 0,
  },
  {
    rewardId: "dessert-free",
    rewardName: "Dessert FREE",
    description: "End your meal on a sweet note with a free dessert.",
    probability: 5.0,
    active: true,
    validityDays: 5,
    usageLimit: 500,
    usedCount: 0,
  },
  {
    rewardId: "breakfast-2",
    rewardName: "Breakfast for 2 FREE",
    description: "Indulge in a complimentary buffet breakfast for 2 guests.",
    probability: 2.0,
    active: true,
    validityDays: 14,
    usageLimit: 100,
    usedCount: 0,
  },
  {
    rewardId: "room-15",
    rewardName: "15% OFF on Room Booking",
    description: "Get a 15% discount on room bookings made directly through our website.",
    probability: 1.0,
    active: true,
    validityDays: 30,
    usageLimit: 200,
    usedCount: 0,
  },
  {
    rewardId: "room-500",
    rewardName: "₹500 OFF on Room Booking",
    description: "Flat ₹500 discount on your room bill when booking a stay.",
    probability: 1.0,
    active: true,
    validityDays: 30,
    usageLimit: 300,
    usedCount: 0,
  },
  {
    rewardId: "room-upgrade",
    rewardName: "Room Upgrade FREE",
    description: "Complimentary upgrade to the next room tier (subject to availability).",
    probability: 1.0,
    active: true,
    validityDays: 7,
    usageLimit: 50,
    usedCount: 0,
  },
];

async function seed() {
  console.log("Seeding database...");

  // 1. Seed Rewards
  console.log("Seeding rewards...");
  for (const reward of defaultRewards) {
    await db.collection("rewards").doc(reward.rewardId).set(reward);
    console.log(`- Seeded reward: ${reward.rewardName}`);
  }

  // 2. Seed Settings
  console.log("Seeding campaign settings...");
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(startDate.getFullYear() + 1); // 1 year campaign duration

  await db.collection("settings").doc("campaign").set({
    campaignActive: true,
    spinStartDate: Timestamp.fromDate(startDate),
    spinEndDate: Timestamp.fromDate(endDate),
    spinEligibility: "one_per_mobile",
  });
  console.log("- Seeded campaign settings.");

  // 3. Seed Admin Account
  console.log("Seeding default admin email...");
  const adminEmail = "admin@7bluehills.com";
  await db.collection("admins").doc(adminEmail).set({
    email: adminEmail,
    role: "admin",
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`- Seeded admin email: ${adminEmail}`);

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
