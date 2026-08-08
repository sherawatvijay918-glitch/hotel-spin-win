# 7 Blue Hills Hotel & Restaurant - Spin & Win Reward System

A complete, production-ready premium customer engagement and lucky spin campaign platform for **7 Blue Hills Hotel & Restaurant** built with **Next.js (App Router)** and **Firebase (Firestore & Auth)**.

---

## Features

- **Premium Hotel-Themed UI**: Elegant typography, animations, canvas-drawn spin wheel, and ticket-style success cards.
- **Secure Server-Side Luck Engine**: Weighted random selection happens securely inside Next.js API Routes to prevent tampering.
- **Double-Participation Prevention**: Prevents multiple spins per customer by enforcing unique mobile number constraints in Firestore transactions.
- **Printable Branded QR Code Card**: High-resolution golden marketing poster with scan-to-spin instructions downloadable from Settings.
- **Staff Verification Panel**: Auto-fills coupon details via URL query parameter scanning, verifies validity, and handles one-click redemption.
- **Admin Dashboard**: Aggregates statistics, spin volume charts, coupon search directory, and reward configuration managers.

---

## Architecture & Project Structure

```
spin/
├── src/
│   ├── app/
│   │   ├── api/spin/claim/route.ts  # Secure spin & coupon generation engine
│   │   ├── spin/                    # Customer spin & win page
│   │   ├── admin/
│   │   │   ├── login/               # Secure admin login
│   │   │   ├── coupons/             # Coupon management directory
│   │   │   ├── rewards/             # Rewards configuration panel
│   │   │   ├── verify/              # Staff validation console
│   │   │   ├── settings/            # QR poster generator & global rules
│   │   │   ├── layout.tsx           # Route protection shell
│   │   │   └── page.tsx             # Overview analytics feed
│   │   └── layout.tsx               # Root auth context provider wrapper
│   ├── components/
│   │   ├── SpinWheel.tsx            # Animated canvas spin component
│   │   └── CouponCard.tsx           # Shareable ticket with copy/whatsapp options
│   ├── context/
│   │   └── AuthContext.tsx          # Auth state manager & listener
│   ├── lib/
│   │   ├── firebase.ts              # Client SDK
│   │   └── firebaseAdmin.ts         # Server-side SDK
│   └── globals.css                  # Custom styling and keyframes
├── scripts/
│   └── seed-db.js                   # Firestore database seed utility
├── firestore.rules                  # Firestore access security rules
└── .env.local.example               # Configuration placeholders
```

---

## Installation & Setup

### 1. Create a Firebase Project
1. Visit the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it (e.g., `7-blue-hills-spin`).
3. Turn Google Analytics on or off as preferred, and create the project.

### 2. Configure Authentication
1. In the Firebase console sidebar, navigate to **Build > Authentication**.
2. Click **Get Started**, choose **Email/Password** as the sign-in provider, enable it, and save.
3. Click the **Users** tab, then click **Add User** to register your primary administrator account (e.g., `admin@7bluehills.com`). Set a secure password.

### 3. Create Firestore Database
1. Go to **Build > Firestore Database** and click **Create Database**.
2. Start in **Production Mode**, choose your database region, and click **Create**.

### 4. Setup Firestore Security Rules
1. Click the **Rules** tab in your Firestore dashboard.
2. Copy the contents of the `firestore.rules` file in this repository and paste them into the editor.
3. Click **Publish**.

---

## Local Configuration & Seeding

### 1. Configure Environment Variables
Copy `.env.local.example` to `.env.local` in the project root:
```bash
cp .env.local.example .env.local
```

Fill in the credentials:
- **Client credentials** (`NEXT_PUBLIC_FIREBASE_*`) can be found in the Firebase Console under **Project Settings > General > Your Apps** (Create a Web app if you haven't).
- **Server credentials** (`FIREBASE_CLIENT_EMAIL` & `FIREBASE_PRIVATE_KEY`):
  1. Go to **Project Settings > Service Accounts**.
  2. Select **Firebase Admin SDK** and click **Generate new private key**.
  3. Download the JSON, copy the `client_email` and `private_key` fields, and paste them into `.env.local`. Keep the private key wrapped in quotes with `\n` characters preserved.

### 2. Run Database Seeding Script
Execute the database bootstrap script to write default rewards, settings, and authorize your admin email:
```bash
node scripts/seed-db.js
```
*Note: This script will register `admin@7bluehills.com` as an authorized administrator. If your admin login email is different, edit the email at the bottom of the script prior to execution.*

### 3. Run Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment to Vercel

1. Push your code to a GitHub/GitLab repository.
2. Link the repository in the [Vercel Dashboard](https://vercel.com).
3. Under **Environment Variables**, add all configurations listed in `.env.local.example`. Make sure the private key is pasted with actual newline spacing or `\n` literals.
4. Click **Deploy**. Vercel will build and package the application as serverless edge routes.

---

## Campaign Business Rules

Admin configs can be dynamically adjusted from the `/admin/settings` and `/admin/rewards` panels:
1. **Weighted Reward Probabilities**: Calculated relatively (e.g. 25% Food discount vs 3% Room upgrade).
2. **Campaign Lifetime**: Enter date boundaries.
3. **Usage Limits**: Once a reward is claimed up to its limit (e.g., 50 Room upgrades), it is auto-omitted from the active wheel.
4. **Duplicate Spin Blocker**: Checks user mobile number records in a transaction to block double entries.
