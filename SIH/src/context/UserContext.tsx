"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: "FARMER" | "BUYER" | "TRANSPORTER" | "ADMIN";
  state: string;
  district: string;
  reliabilityScore?: number;
  vehicleType?: string;
  perKmRate?: number;
  baseFare?: number;
}

interface UserContextType {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  initialRole: "FARMER" | "BUYER" | "TRANSPORTER" | "ADMIN" | null;
  enabledSwapUserIds: string[];
  swappableUsers: User[];
  setCurrentUserById: (id: string) => void;
  toggleSwapUser: (userId: string) => void;
  loginUser: (user: User) => void;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialRole, setInitialRole] = useState<"FARMER" | "BUYER" | "TRANSPORTER" | "ADMIN" | null>(null);
  const [enabledSwapUserIds, setEnabledSwapUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load enabled swap IDs from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("krishi_initial_role") as any;
      if (savedRole) setInitialRole(savedRole);

      const savedSwapIds = localStorage.getItem("krishi_enabled_swap_ids");
      if (savedSwapIds) {
        try {
          setEnabledSwapUserIds(JSON.parse(savedSwapIds));
        } catch (e) {
          console.error("Error parsing saved swap IDs:", e);
        }
      }
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setUsers(data);
          
          // Restore active session
          const savedUserId = typeof window !== "undefined" ? localStorage.getItem("krishi_user_id") : null;
          if (savedUserId) {
            const savedUser = data.find((u: User) => u.id === savedUserId);
            if (savedUser) {
              setCurrentUser(savedUser);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching users in Context:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const loginUser = (user: User) => {
    setCurrentUser(user);
    setInitialRole(user.role);
    
    // Automatically enable current logged in user for quick swap
    setEnabledSwapUserIds((prev) => {
      const next = prev.includes(user.id) ? prev : [...prev, user.id];
      if (typeof window !== "undefined") {
        localStorage.setItem("krishi_enabled_swap_ids", JSON.stringify(next));
      }
      return next;
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("krishi_user_id", user.id);
      localStorage.setItem("krishi_initial_role", user.role);
    }
  };

  const toggleSwapUser = (userId: string) => {
    setEnabledSwapUserIds((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];

      if (typeof window !== "undefined") {
        localStorage.setItem("krishi_enabled_swap_ids", JSON.stringify(next));
      }
      return next;
    });
  };

  const setCurrentUserById = (id: string) => {
    const found = users.find((u) => u.id === id);
    if (found) {
      setCurrentUser(found);
      if (typeof window !== "undefined") {
        localStorage.setItem("krishi_user_id", found.id);
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setInitialRole(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("krishi_user_id");
      localStorage.removeItem("krishi_initial_role");
    }
    router.push("/");
  };

  // Swappable users list for ADMIN quick swap
  const swappableUsers = users.filter(
    (u) => enabledSwapUserIds.includes(u.id) || (currentUser && u.id === currentUser.id)
  );

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        loading,
        initialRole,
        enabledSwapUserIds,
        swappableUsers,
        setCurrentUserById,
        toggleSwapUser,
        loginUser,
        logout,
        refreshUsers: fetchUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
