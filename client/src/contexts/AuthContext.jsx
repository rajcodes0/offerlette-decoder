/**
 * AuthContext.jsx
 *
 * Provides authentication state across the entire app.
 * Persists token + user to localStorage under keys:
 *   lex_token  — JWT string
 *   lex_user   — JSON-serialised user object
 *
 * Keys match what api.js interceptors read/clear, and what Checkout.jsx reads.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "lex_token";
const USER_KEY = "lex_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we've checked localStorage

  // ── Rehydrate from localStorage on first mount ──────────────────────────────
  useEffect(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userRaw = localStorage.getItem(USER_KEY);

      if (token && userRaw) {
        const parsedUser = JSON.parse(userRaw);
        // Basic sanity check — must have at least an id field
        if (parsedUser && (parsedUser.id || parsedUser._id)) {
          setUser(parsedUser);
        } else {
          // Corrupted data — clear it
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
    } catch {
      // Corrupted JSON — wipe and start fresh
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── login — called after successful /api/auth/login response ────────────────
  const login = useCallback((token, userData) => {
    if (!token || !userData) {
      console.error("AuthContext.login called with missing token or user data");
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── logout — clears everything ───────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("lex_premium"); // clear premium flag too
    setUser(null);
    // Hard redirect to login — clears any in-memory state from other hooks
    window.location.href = "/login";
  }, []);

  // ── updateUser — for in-place updates (e.g. after premium upgrade) ───────────
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

export default AuthContext;