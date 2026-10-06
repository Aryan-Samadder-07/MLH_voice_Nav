"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  TrendingUp,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Truck,
  Building,
  RefreshCw,
  ShoppingBag,
  UserPlus,
  LogIn,
  Calculator,
  CheckCircle2,
  Zap,
  DollarSign,
  BarChart3,
  Layers,
  Search,
  Sparkles,
} from "lucide-react";
import { MandiRecord } from "@/lib/mandiApi";

export default function LandingPage() {
  const { currentUser, loading: userLoading } = useUser();
  const router = useRouter();

  // Mandi Data & State
  const [mandiPrices, setMandiPrices] = useState<MandiRecord[]>([]);
  const [mandiLoading, setMandiLoading] = useState(true);
  const [mandiError, setMandiError] = useState(false);
  const [searchCommodity, setSearchCommodity] = useState("");

  // Real stats from database
  const [stats, setStats] = useState({
    activeListingsCount: 0,
    totalTradedVolume: 0,
    activeTransportsCount: 0,
  });

  // Interactive Profit Calculator State
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [lotWeight, setLotWeight] = useState(50); // quintals
  const [benchmarkPrice, setBenchmarkPrice] = useState(2800); // ₹/q

  const CROP_PRESETS: Record<string, { defaultPrice: number; traditionalFreight: number; sharedFreight: number }> = {
    Tomato: { defaultPrice: 2800, traditionalFreight: 120, sharedFreight: 35 },
    Onion: { defaultPrice: 2200, traditionalFreight: 100, sharedFreight: 28 },
    Potato: { defaultPrice: 1800, traditionalFreight: 90, sharedFreight: 25 },
    Paddy: { defaultPrice: 2400, traditionalFreight: 110, sharedFreight: 32 },
    Soybean: { defaultPrice: 4800, traditionalFreight: 130, sharedFreight: 40 },
    Cotton: { defaultPrice: 6500, traditionalFreight: 150, sharedFreight: 45 },
  };

  const handleCropSelect = (cropName: string) => {
    setSelectedCrop(cropName);
    const preset = CROP_PRESETS[cropName];
    if (preset) {
      setBenchmarkPrice(preset.defaultPrice);
    }
  };

  // Auto-redirect logged-in users directly to their active role dashboard
  useEffect(() => {
    if (!userLoading && currentUser) {
      let targetPath = "/";
      switch (currentUser.role) {
        case "FARMER":
          targetPath = "/farmer";
          break;
        case "BUYER":
          targetPath = "/buyer";
          break;
        case "TRANSPORTER":
          targetPath = "/transporter";
          break;
        case "ADMIN":
          targetPath = "/admin";
          break;
      }
      router.push(targetPath);
    }
  }, [currentUser, userLoading, router]);

  useEffect(() => {
    // Fetch live mandi prices
    const getMandiPrices = async () => {
      try {
        setMandiLoading(true);
        const response = await fetch("/api/mandi?limit=12");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setMandiPrices(data);
          } else {
            setMandiError(true);
          }
        } else {
          setMandiError(true);
        }
      } catch (err) {
        console.error("Error fetching landing page mandi data:", err);
        setMandiError(true);
      } finally {
        setMandiLoading(false);
      }
    };

    // Fetch database stats
    const getDbStats = async () => {
      try {
        const response = await fetch("/api/lots");
        if (response.ok) {
          const lots = await response.json();
          if (Array.isArray(lots)) {
            const activeListings = lots.filter(
              (l: any) => l.status === "ACTIVE",
            ).length;
            const completedLots = lots.filter(
              (l: any) => l.status === "COMPLETED",
            );
            const totalVol = completedLots.reduce(
              (acc: number, cur: any) => acc + cur.weight,
              0,
            );

            let transportCount = 0;
            lots.forEach((l: any) => {
              if (l.transportJob && l.transportJob.status !== "DELIVERED") {
                transportCount++;
              }
            });

            setStats({
              activeListingsCount: activeListings,
              totalTradedVolume: Math.round(totalVol * 100) / 100,
              activeTransportsCount: transportCount,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching database stats:", err);
      }
    };

    getMandiPrices();
    getDbStats();
  }, []);

  if (userLoading || currentUser) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50">
        <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">
          Connecting to your Dashboard Session...
        </p>
      </div>
    );
  }

  // Calculator Math
  const currentPreset = CROP_PRESETS[selectedCrop] || CROP_PRESETS["Tomato"];
  const grossValue = lotWeight * benchmarkPrice;
  // Traditional Mandi: 8% middleman commission + dedicated transport per quintal
  const traditionalCommission = grossValue * 0.08;
  const traditionalTransport = lotWeight * currentPreset.traditionalFreight;
  const traditionalNet =
    grossValue - traditionalCommission - traditionalTransport;

  // KrishiLink: 1% platform fee + shared route freight pooling per quintal
  const krishiCommission = grossValue * 0.01;
  const krishiTransport = lotWeight * currentPreset.sharedFreight;
  const krishiNet = grossValue - krishiCommission - krishiTransport;

  const extraProfit = Math.max(0, Math.round(krishiNet - traditionalNet));
  const profitPercentage =
    Math.round((extraProfit / traditionalNet) * 100) || 0;

  // Mandi Filter
  const filteredMandi = mandiPrices.filter(
    (m) =>
      m.commodity.toLowerCase().includes(searchCommodity.toLowerCase()) ||
      m.market.toLowerCase().includes(searchCommodity.toLowerCase()) ||
      m.state.toLowerCase().includes(searchCommodity.toLowerCase()),
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* SECTION 1: HERO CONTAINER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 border-b border-emerald-800/40">
        {/* Decorative Grid Mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Pill */}
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-400/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>SIH 2026 Agri-Commerce Operating System</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15]">
              Direct Agri-Sourcing. <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                Zero Middlemen Margins.
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              KrishiLink bypasses traditional Mandi commissions by matching
              farmers directly with institutional buyers, backed by live
              Agmarknet benchmark prices and shared freight route pooling.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
              <Link
                href="/signup"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition duration-200 flex items-center space-x-2 text-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/login"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl border border-white/20 backdrop-blur-sm transition duration-200 text-sm flex items-center space-x-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Portal Log In</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Cards Banner */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-5 rounded-2xl text-left space-y-1">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Average Farm Realization
              </p>
              <p className="text-3xl font-black text-white">+24.5% Higher</p>
              <p className="text-[11px] text-slate-400">
                Compared to traditional mandi auctions
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-5 rounded-2xl text-left space-y-1">
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                Platform Commission
              </p>
              <p className="text-3xl font-black text-white">Flat 1.0%</p>
              <p className="text-[11px] text-slate-400">
                Replaces 8% APMC agent fees
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-5 rounded-2xl text-left space-y-1">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Freight Cost Savings
              </p>
              <p className="text-3xl font-black text-white">Up to 65%</p>
              <p className="text-[11px] text-slate-400">
                Via shared route logistics pooling
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE PROFIT REALIZATION CALCULATOR */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-emerald-900 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Calculator className="h-4 w-4" />
                <span>Interactive Yield & Profit Estimator</span>
              </div>
              <h2 className="text-2xl font-bold">
                Calculate Your Net Farm Realization
              </h2>
              <p className="text-emerald-200 text-xs mt-1">
                Compare direct KrishiLink contracts vs traditional APMC Mandi
                deductions.
              </p>
            </div>
            <div className="bg-emerald-800/80 border border-emerald-700 px-4 py-2 rounded-xl text-center">
              <p className="text-[10px] text-emerald-300 font-bold uppercase">
                Estimated Extra Profit
              </p>
              <p className="text-2xl font-black text-emerald-300">
                +₹{extraProfit.toLocaleString()}{" "}
                <span className="text-xs font-normal">
                  ({profitPercentage}% extra)
                </span>
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Select Crop
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "Tomato",
                    "Onion",
                    "Potato",
                    "Paddy",
                    "Soybean",
                    "Cotton",
                  ].map((crop) => (
                    <button
                      key={crop}
                      onClick={() => handleCropSelect(crop)}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-center transition ${
                        selectedCrop === crop
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Lot Weight (Quintals)
                  </label>
                  <span className="font-bold text-emerald-600 text-sm">
                    {lotWeight} q ({lotWeight * 100} kg)
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={lotWeight}
                  onChange={(e) => setLotWeight(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Mandi Benchmark Price (₹/q)
                  </label>
                  <span className="font-bold text-emerald-600 text-sm">
                    ₹{benchmarkPrice}/q
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={benchmarkPrice}
                  onChange={(e) => setBenchmarkPrice(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Comparison Side-by-Side Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Traditional Mandi */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
                  <span>Traditional Mandi Sale</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">
                    Gross Lot Value
                  </p>
                  <p className="text-lg font-bold text-slate-800">
                    ₹{grossValue.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1 text-xs text-slate-500 border-t border-slate-200 pt-2">
                  <div className="flex justify-between">
                    <span>Middleman Fee (8%):</span>
                    <span className="text-rose-600 font-medium">
                      -₹{traditionalCommission.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dedicated Freight:</span>
                    <span className="text-rose-600 font-medium">
                      -₹{traditionalTransport.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">
                    Net Payout to Farmer
                  </p>
                  <p className="text-xl font-bold text-slate-700">
                    ₹{traditionalNet.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* KrishiLink Direct */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl">
                  DIRECT CONTRACT
                </div>
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>KrishiLink Direct</span>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-700 uppercase font-bold">
                    Gross Lot Value
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    ₹{grossValue.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1 text-xs text-slate-600 border-t border-emerald-200 pt-2">
                  <div className="flex justify-between">
                    <span>Platform Fee (1%):</span>
                    <span className="text-emerald-700 font-medium">
                      -₹{krishiCommission.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shared Freight Pooling:</span>
                    <span className="text-emerald-700 font-medium">
                      -₹{krishiTransport.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="border-t border-emerald-200 pt-2">
                  <p className="text-[10px] text-emerald-700 uppercase font-bold">
                    Net Payout to Farmer
                  </p>
                  <p className="text-2xl font-black text-emerald-700">
                    ₹{krishiNet.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 4-STEP HOW IT WORKS STEPPER */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            Seamless Execution
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How KrishiLink Powers the Trade
          </h3>
          <p className="text-slate-500 text-sm mt-2">
            A transparent 4-stage pipeline connecting harvest fields directly to
            buyer fulfillment centers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Harvest & Listing",
              desc: "Farmers post crop weight, grade, variety, and floor price directly from their phone.",
              icon: ShoppingBag,
            },
            {
              step: "02",
              title: "Digital Bidding",
              desc: "Verified institutional buyers place competitive bids evaluated on Net Realization.",
              icon: BarChart3,
            },
            {
              step: "03",
              title: "Freight Route Pooling",
              desc: "Nearby harvests are grouped onto shared truck routes to reduce logistics fees.",
              icon: Truck,
            },
            {
              step: "04",
              title: "Escrow Payout",
              desc: "Funds are released directly to the farmer upon delivery quality confirmation.",
              icon: ShieldCheck,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-emerald-300 transition duration-200 relative"
            >
              <span className="text-4xl font-black text-slate-100 absolute top-4 right-4">
                {item.step}
              </span>
              <div className="h-10 w-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-base mb-2">
                {item.title}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: LIVE GOVERNMENT MANDI TICKER (AGMARKNET API) */}
      <section className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
                <TrendingUp className="h-4 w-4" />
                <span>Live Government Index Feed</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Agmarknet Price Benchmark
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official daily market arrival rates fetched directly from
                api.data.gov.in
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchCommodity}
                onChange={(e) => setSearchCommodity(e.target.value)}
                placeholder="Search commodity or mandi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {mandiError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs text-center mb-4">
              Connecting to live Government data stream... Using cached
              Agmarknet benchmarks.
            </div>
          )}

          {mandiLoading && mandiPrices.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">
                      State / District
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold">
                      Market (Mandi)
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold">
                      Commodity
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold">
                      Variety
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold text-right">
                      Min Price
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold text-right">
                      Max Price
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-bold text-right bg-emerald-50 text-emerald-800"
                    >
                      Modal Price (Per Q)
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-bold text-right text-emerald-800"
                    >
                      Rate (Per Kg)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMandi.slice(0, 8).map((record, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {record.state}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({record.district})
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {record.market}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                          {record.commodity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {record.variety}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ₹{record.min_price}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ₹{record.max_price}
                      </td>
                      <td className="px-4 py-3 text-right font-bold bg-emerald-50/50 text-emerald-700">
                        ₹{record.modal_price}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                        ₹{record.modal_price_per_kg}/kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: FOOTER & GET STARTED CTA */}
      <footer className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-2xl font-black text-white">
              KrishiLink Platform
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              SIH26132 Prototype • Connecting Farmers, Institutional Buyers, and
              Transporters directly across India.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/signup"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow transition"
            >
              Sign Up Now
            </Link>
            <Link
              href="/login"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs border border-slate-700 transition"
            >
              Log In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
