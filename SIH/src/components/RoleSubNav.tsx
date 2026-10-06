"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface SubNavTab {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
}

interface RoleSubNavProps {
  tabs: SubNavTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function RoleSubNav({ tabs, activeTab, onTabChange }: RoleSubNavProps) {
  return (
    <div className="bg-white border-b border-slate-200 mb-8 sticky top-[64px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-4 px-3 sm:px-1 inline-flex items-center space-x-2 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-emerald-600 text-emerald-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
