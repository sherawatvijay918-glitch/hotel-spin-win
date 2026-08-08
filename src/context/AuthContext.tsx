"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we are running in local mock fallback mode
    const isMock =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "mock-api-key-for-local-compilation" ||
      !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("mock");

    if (isMock) {
      console.warn("AuthContext: Running in offline MOCK Fallback Mode.");
      const mockLoggedIn = localStorage.getItem("mock_admin_logged_in") === "true";
      if (mockLoggedIn) {
        setUser({ email: "admin@spin.com", uid: "mock-admin-uid" } as any);
        setIsAdmin(true);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
      return; // Skip Firebase listeners
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setAuthError(null);

      if (currentUser) {
        try {
          if (!currentUser.email) {
            throw new Error("User does not have a valid email.");
          }

          // Verify if this email exists in the admins Firestore collection
          const adminDocRef = doc(db, "admins", currentUser.email.toLowerCase());
          const adminSnapshot = await getDoc(adminDocRef);

          if (adminSnapshot.exists()) {
            setUser(currentUser);
            setIsAdmin(true);
          } else {
            // Sign out immediately if they are authenticated but not an admin
            await signOut(auth);
            setUser(null);
            setIsAdmin(false);
            setAuthError("Unauthorized: Your account email is not registered as an administrator.");
          }
        } catch (err: any) {
          console.error("Auth admin check error:", err);
          await signOut(auth);
          setUser(null);
          setIsAdmin(false);
          setAuthError(err.message || "Failed to verify administrator privileges.");
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setAuthError(null);

    const isMock =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "mock-api-key-for-local-compilation" ||
      !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("mock");

    if (isMock) {
      if (email.trim().toLowerCase() === "admin@spin.com" && password === "admin123") {
        localStorage.setItem("mock_admin_logged_in", "true");
        setUser({ email: "admin@spin.com", uid: "mock-admin-uid" } as any);
        setIsAdmin(true);
        setLoading(false);
        return;
      } else {
        setLoading(false);
        const errMsg = "Invalid email address or password (use admin@spin.com / admin123 for developer bypass).";
        setAuthError(errMsg);
        throw new Error(errMsg);
      }
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoading(false);
      let errMsg = "Failed to log in. Please check your credentials.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errMsg = "Invalid email address or password.";
      } else if (err.code === "auth/too-many-requests") {
        errMsg = "Too many failed login attempts. Please try again later.";
      }
      setAuthError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    setLoading(true);

    const isMock =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "mock-api-key-for-local-compilation" ||
      !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("mock");

    if (isMock) {
      localStorage.removeItem("mock_admin_logged_in");
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        login,
        logout,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
