"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import {
  Users,
  Boxes,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  Star,
  BookOpen
} from "lucide-react";
import RoleSubNav from "@/components/RoleSubNav";

export default function AdminDashboard() {
  const { currentUser, users, enabledSwapUserIds, toggleSwapUser } = useUser();
  const [activeTab, setActiveTab] = useState("users");

  // Voice Assistant Subpage Tab Switching Listener
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      const tab = e.detail?.tab;
      if (tab && ["users", "ledger"].includes(tab)) {
        setActiveTab(tab);
      }
    };
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialTab = params.get("tab");
      if (initialTab && ["users", "ledger"].includes(initialTab)) {
        setActiveTab(initialTab);
      }
    }
    window.addEventListener("custom:switch_tab", handleSwitchTab);
    return () => window.removeEventListener("custom:switch_tab", handleSwitchTab);
  }, []);

  const [allLots, setAllLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all crop listings globally
  const loadData = async () => {
    try {
      setLoading(true);
      const lotRes = await fetch("/api/lots");
      if (lotRes.ok) {
        const lotData = await lotRes.json();
        if (Array.isArray(lotData)) {
          setAllLots(lotData);
        }
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-md mx-auto bg-white border border-rose-200 rounded-xl p-8 shadow-sm">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Admin Access Required</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Please switch to an **Admin** session to view platform control settings and user management.
          </p>
        </div>
      </div>
    );
  }

  const navTabs = [
    { id: "users", label: "User Directory & Quick Swap Control", icon: Users, badge: users.length },
    { id: "ledger", label: "Global Crop Ledger & Audit Feed", icon: BookOpen, badge: allLots.length }
  ];

  return (
    <div>
      {/* Role Sub-Navigation Tabs */}
      <RoleSubNav tabs={navTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Page Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">System Governance & Admin Console</h1>
            <p className="text-sm text-slate-500 font-medium">
              Logged in as <span className="font-bold text-purple-700">{currentUser.name}</span>. Manage user quick-swap permissions and inspect global state.
            </p>
          </div>
        </div>

        {/* TAB 1: User Directory & Quick Swap Control */}
        {activeTab === "users" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-lg text-slate-800">Platform User Directory ({users.length})</h2>
                <p className="text-xs text-slate-500">Check the boxes below to enable Quick Swap access for specific user accounts in the header dropdown.</p>
              </div>
            </div>

            {users.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-6">No users registered in database.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((u) => {
                  const isEnabled = enabledSwapUserIds.includes(u.id);

                  return (
                    <div key={u.id} className="p-4 border border-slate-200 rounded-xl bg-white flex justify-between items-center text-xs shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 text-sm">{u.name}</span>
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                            u.role === "FARMER"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : u.role === "BUYER"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : u.role === "TRANSPORTER"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-purple-50 text-purple-800 border border-purple-200"
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-slate-500">Phone: {u.phone} • Location: {u.district}, {u.state}</p>
                        <p className="text-amber-700 font-bold">Trust Rating: {u.reliabilityScore ? u.reliabilityScore.toFixed(1) : "5.0"} ⭐</p>
                      </div>

                      <label className={`flex items-center space-x-2 cursor-pointer border px-3 py-2 rounded-xl transition ${
                        isEnabled
                          ? "bg-purple-50 border-purple-300 text-purple-900 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleSwapUser(u.id)}
                          className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 border-slate-300 cursor-pointer"
                        />
                        <span className="text-xs">Quick Swap</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Global Crop Ledger & Audit Feed */}
        {activeTab === "ledger" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-800">Global Crop Lots Audit Feed ({allLots.length})</h2>
              <button onClick={loadData} className="p-2 hover:bg-slate-50 border border-slate-200 rounded-lg">
                <RefreshCw className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
              </div>
            ) : allLots.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-6">No listings exist in database.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allLots.map((lot) => (
                  <div key={lot.id} className="p-4 border border-slate-200 rounded-xl bg-white space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-base">{lot.commodity} ({lot.weight} q)</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lot.status === "ACTIVE"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : lot.status === "OFFER_ACCEPTED"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {lot.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg space-y-1 text-slate-600">
                      <p><strong>Farmer:</strong> {lot.farmer?.name || "Unknown"} ({lot.pickupLocation})</p>
                      <p><strong>Floor Price:</strong> ₹{lot.minPrice}/q • Bids Received: {lot.offers?.length || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
