"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useLanguage } from "@/context/LanguageContext";
import { Leaf, User as UserIcon, RefreshCw, LogOut, Globe } from "lucide-react";

export default function Header() {
  const { currentUser, swappableUsers, setCurrentUserById, logout, loading, initialRole } = useUser();
  const { pageLanguage, setPageLanguage } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const foundUser = swappableUsers.find((u) => u.id === selectedId);
    if (foundUser) {
      setCurrentUserById(selectedId);
      let targetPath = "/";
      switch (foundUser.role) {
        case "FARMER": targetPath = "/farmer"; break;
        case "BUYER": targetPath = "/buyer"; break;
        case "TRANSPORTER": targetPath = "/transporter"; break;
        case "ADMIN": targetPath = "/admin"; break;
        default: targetPath = "/";
      }
      router.push(targetPath);
    }
  };

  const isAdminSession = initialRole === "ADMIN" || currentUser?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition">
              <Leaf className="h-7 w-7 fill-emerald-100" />
              <span className="font-bold text-xl tracking-tight text-slate-800">
                Krishi<span className="text-emerald-600">Link</span>
              </span>
            </Link>
            <span className="hidden sm:inline bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-emerald-200">
              SIH26132 MVP
            </span>
          </div>

          <nav className="hidden md:flex space-x-4 items-center">
            {isAdminSession && (
              <>
                <Link
                  href="/admin"
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded transition ${
                    pathname === "/admin" ? "bg-purple-100 text-purple-800" : "text-slate-600 hover:text-purple-700"
                  }`}
                >
                  Admin Console
                </Link>
                <Link
                  href="/farmer"
                  className={`text-xs font-semibold px-2.5 py-1 rounded transition ${
                    pathname === "/farmer" ? "text-emerald-600 font-bold bg-emerald-50" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Farmer View
                </Link>
                <Link
                  href="/buyer"
                  className={`text-xs font-semibold px-2.5 py-1 rounded transition ${
                    pathname === "/buyer" ? "text-blue-600 font-bold bg-blue-50" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Buyer View
                </Link>
                <Link
                  href="/transporter"
                  className={`text-xs font-semibold px-2.5 py-1 rounded transition ${
                    pathname === "/transporter" ? "text-amber-600 font-bold bg-amber-50" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Transporter View
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-3">
            {/* Multilingual Switcher Widget */}
            <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200 text-xs">
              <Globe className="h-3.5 w-3.5 text-slate-400 ml-1.5 mr-1" />
              <button
                type="button"
                onClick={() => setPageLanguage("en")}
                className={`px-2 py-0.5 rounded-full font-semibold transition ${
                  pageLanguage === "en" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setPageLanguage("mr")}
                className={`px-2 py-0.5 rounded-full font-semibold transition ${
                  pageLanguage === "mr" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => setPageLanguage("bn")}
                className={`px-2 py-0.5 rounded-full font-semibold transition ${
                  pageLanguage === "bn" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                বাংলা
              </button>
            </div>

            {currentUser ? (
              <div className="flex items-center space-x-2">
                <select
                  value={currentUser.id}
                  onChange={handleUserChange}
                  className="bg-slate-100 text-xs font-medium text-slate-700 py-1.5 px-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {swappableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-700 hover:text-emerald-600 px-2.5 py-1.5 rounded transition"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-medium bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow-sm transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
