"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import {
  Plus,
  TrendingUp,
  Search,
  Check,
  X,
  MapPin,
  Info,
  ChevronRight,
  Eye,
  AlertTriangle,
  RefreshCw,
  Award,
  DollarSign,
  Sparkles,
  Calendar,
  ShieldCheck,
  Truck,
  Gavel,
  Star,
  PackageCheck,
  BrainCircuit,
  Boxes,
  History,
  CheckCircle
} from "lucide-react";
import { MandiRecord } from "@/lib/mandiApi";
import RatingModal from "@/components/RatingModal";
import RoleSubNav from "@/components/RoleSubNav";
import GPSLocationPicker from "@/components/GPSLocationPicker";

export default function FarmerDashboard() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState("listings");

  // Voice Assistant Subpage Tab Switching Listener
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      const tab = e.detail?.tab;
      if (tab && ["listings", "create", "intelligence", "history"].includes(tab)) {
        setActiveTab(tab);
      }
    };
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialTab = params.get("tab");
      if (initialTab && ["listings", "create", "intelligence", "history"].includes(initialTab)) {
        setActiveTab(initialTab);
      }
    }
    window.addEventListener("custom:switch_tab", handleSwitchTab);
    return () => window.removeEventListener("custom:switch_tab", handleSwitchTab);
  }, []);

  const [myLots, setMyLots] = useState<any[]>([]);
  const [lotsLoading, setLotsLoading] = useState(true);

  // Mandi Price Intelligence Search state
  const [searchCrop, setSearchCrop] = useState("Tomato");
  const [searchState, setSearchState] = useState("");
  const [mandiResults, setMandiResults] = useState<MandiRecord[]>([]);
  const [mandiLoading, setMandiLoading] = useState(false);

  // AI Price Forecast & Sell-Now vs Wait state
  const [forecastData, setForecastData] = useState<any | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Lot Creator state
  const [formData, setFormData] = useState({
    commodity: "Tomato",
    variety: "Local",
    weight: "",
    grade: "Grade A",
    pickupLocation: "",
    minPrice: "",
    latitude: "" as number | string,
    longitude: "" as number | string
  });
  const [creatingLot, setCreatingLot] = useState(false);

  // Matching & Bids Drawer state
  const [selectedLot, setSelectedLot] = useState<any | null>(null);
  const [matchingData, setMatchingData] = useState<any | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [transporterBids, setTransporterBids] = useState<any[]>([]);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string; role: string } | null>(null);

  // Load AI Forecast Data
  const loadForecastData = async (cropName: string) => {
    try {
      setForecastLoading(true);
      const res = await fetch(
        `/api/intelligence/forecast?commodity=${cropName}&currentPrice=${formData.minPrice || 2500}&weight=${formData.weight || 50}`
      );
      if (res.ok) {
        const data = await res.json();
        setForecastData(data);
      }
    } catch (err) {
      console.error("Error loading AI forecast data:", err);
    } finally {
      setForecastLoading(false);
    }
  };

  // Load farmer's lots from database
  const loadMyLots = async () => {
    if (!currentUser) {
      setLotsLoading(false);
      return;
    }
    try {
      setLotsLoading(true);
      const response = await fetch(`/api/lots?farmerId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setMyLots(data);
        }
      }
    } catch (err) {
      console.error("Error loading farmer lots:", err);
    } finally {
      setLotsLoading(false);
    }
  };

  // Run initial mandi price search and load lots
  const searchMandiPrices = async () => {
    try {
      setMandiLoading(true);
      let query = `/api/mandi?commodity=${searchCrop}`;
      if (searchState) {
        query += `&state=${searchState}`;
      }
      const response = await fetch(query);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setMandiResults(data);
        }
      }
      loadForecastData(searchCrop);
    } catch (err) {
      console.error("Error searching mandi prices:", err);
    } finally {
      setMandiLoading(false);
    }
  };

  useEffect(() => {
    searchMandiPrices();
    if (currentUser) {
      loadMyLots();
    } else {
      setLotsLoading(false);
    }
  }, [currentUser]);

  // Handle lot creation submission
  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setCreatingLot(true);
      const response = await fetch("/api/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          farmerId: currentUser.id,
          pickupLocation: formData.pickupLocation || `${currentUser.district}, ${currentUser.state}`
        })
      });

      if (response.ok) {
        setFormData({
          commodity: "Tomato",
          variety: "Local",
          weight: "",
          grade: "Grade A",
          pickupLocation: "",
          minPrice: "",
          latitude: "",
          longitude: ""
        });
        loadMyLots();
        setActiveTab("listings");
      } else {
        const err = await response.json();
        alert(err.error || "Failed to create lot");
      }
    } catch (err) {
      console.error("Error creating lot:", err);
    } finally {
      setCreatingLot(false);
    }
  };

  // Load matching buyer offers and competing transporter bids
  const openMatchingDrawer = async (lot: any) => {
    setSelectedLot(lot);
    setSelectedBidId(null);
    setMatchingLoading(true);
    try {
      const res = await fetch(`/api/matching?lotId=${lot.id}`);
      if (res.ok) {
        const data = await res.json();
        setMatchingData(data);
      }

      if (lot.transportJob?.id) {
        const bidsRes = await fetch(`/api/logistics/bids?jobId=${lot.transportJob.id}`);
        if (bidsRes.ok) {
          const bids = await bidsRes.json();
          setTransporterBids(bids);
          const acceptedBid = bids.find((b: any) => b.status === "ACCEPTED");
          if (acceptedBid) {
            setSelectedBidId(acceptedBid.id);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching matching offers:", err);
    } finally {
      setMatchingLoading(false);
    }
  };

  // Handle buyer offer acceptance with optional transporter bid selection
  const handleAcceptOffer = async (offerId: string) => {
    if (!selectedLot) return;
    try {
      setAcceptingOfferId(offerId);
      const response = await fetch("/api/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId,
          status: "ACCEPTED",
          transporterBidId: selectedBidId || undefined
        })
      });

      if (response.ok) {
        openMatchingDrawer(selectedLot);
        loadMyLots();
        setActiveTab("history"); // Move to history tab on contract lock
      } else {
        const err = await response.json();
        alert(err.error || "Failed to accept offer");
      }
    } catch (err) {
      console.error("Error accepting offer:", err);
    } finally {
      setAcceptingOfferId(null);
    }
  };

  if (!currentUser || (currentUser.role !== "FARMER" && currentUser.role !== "ADMIN")) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-md mx-auto bg-white border border-amber-200 rounded-xl p-8 shadow-sm">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Please switch to a **Farmer** profile using the active session selector in the header to view this dashboard.
          </p>
        </div>
      </div>
    );
  }

  const activeSelectedBid = transporterBids.find((b) => b.id === selectedBidId);
  const activeLotsList = myLots.filter((lot) => lot.status === "ACTIVE");
  const completedLotsList = myLots.filter((lot) => lot.status !== "ACTIVE");

  const navTabs = [
    { id: "listings", label: "My Active Listings & Bids", icon: Boxes, badge: activeLotsList.length },
    { id: "create", label: "Publish New Harvest Lot", icon: Plus },
    { id: "intelligence", label: "Market Intelligence & AI Forecast", icon: BrainCircuit },
    { id: "history", label: "Completed Sales History", icon: History, badge: completedLotsList.length }
  ];

  return (
    <div>
      {/* Role Sub-Navigation Tabs */}
      <RoleSubNav tabs={navTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header Bar */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Farmer Direct-Commerce Hub</h1>
            <p className="text-sm text-slate-500">Welcome, {currentUser.name}. Manage produce, check AI pricing, and lock buyer contracts.</p>
          </div>

          {/* Reliability Scorecard Badge */}
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-800">Verified Farmer Rating</p>
              <p className="font-black text-slate-800 text-sm">
                {currentUser.reliabilityScore ? `${currentUser.reliabilityScore.toFixed(1)} / 5.0 ⭐` : "5.0 / 5.0 ⭐"}
              </p>
            </div>
          </div>
        </div>

        {/* TAB 1: My Active Listings & Buyer Bids */}
        {activeTab === "listings" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-lg text-slate-800 mb-6 flex justify-between items-center">
              <span>Active Harvest Lots ({activeLotsList.length})</span>
              <button onClick={loadMyLots} className="p-1 hover:bg-slate-50 rounded">
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </button>
            </h2>

            {lotsLoading ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
              </div>
            ) : activeLotsList.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <p className="text-slate-400 text-sm">No active produce listings at the moment.</p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition"
                >
                  Publish New Harvest Lot
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeLotsList.map((lot) => (
                  <div key={lot.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition bg-white space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 text-lg">{lot.commodity}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                            {lot.variety}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 mr-1" />
                          <span>{lot.pickupLocation}</span>
                        </p>
                      </div>
                      
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        ACTIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 my-2 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <p className="text-slate-400">Total Weight</p>
                        <p className="font-bold text-slate-800 text-sm">{lot.weight} q ({(lot.weight * 100).toLocaleString()} kg)</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Floor Price</p>
                        <p className="font-bold text-slate-800 text-sm">₹{lot.minPrice}/q</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Buyer Bids</p>
                        <p className="font-bold text-emerald-600 text-sm">{lot.offers?.length || 0} Offers</p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => openMatchingDrawer(lot)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition flex justify-center items-center space-x-1 shadow-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Buyer Bids & Logistics ({lot.offers?.length || 0})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Publish New Harvest Lot */}
        {activeTab === "create" && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <h2 className="font-bold text-xl text-slate-800 mb-6 flex items-center space-x-2">
              <Plus className="h-6 w-6 text-emerald-600" />
              <span>List New Crop Harvest Produce</span>
            </h2>
            
            <form onSubmit={handleCreateLot} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commodity / Crop</label>
                <select
                  value={formData.commodity}
                  onChange={(e) => {
                    setFormData({ ...formData, commodity: e.target.value });
                    loadForecastData(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Onion">Onion</option>
                  <option value="Potato">Potato</option>
                  <option value="Paddy">Paddy (Rice)</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Cotton">Cotton</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Variety</label>
                  <input
                    type="text"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    placeholder="Local, Red, Desi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Medium)</option>
                    <option value="Grade C">Grade C (Low)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Weight (Quintals)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="e.g. 20 (2,000 kg)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Floor Price (Per Q)</label>
                  <input
                    type="number"
                    value={formData.minPrice}
                    onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                    placeholder="e.g. 1500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pickup Address (Optional)</label>
                <input
                  type="text"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  placeholder={`Default: ${currentUser.district}, ${currentUser.state}`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Harvest Pickup Field GPS Location */}
              <GPSLocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={(lat, lng) => setFormData({ ...formData, latitude: lat ?? "", longitude: lng ?? "" })}
                label="Harvest Pickup Field GPS Coordinates"
              />

              <button
                type="submit"
                disabled={creatingLot}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-lg text-sm shadow transition flex justify-center items-center space-x-2 disabled:opacity-50"
              >
                {creatingLot ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Listing Produce...</span>
                  </>
                ) : (
                  <span>Publish Lot Listing</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Market Intelligence & Light-Theme AI Forecast */}
        {activeTab === "intelligence" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {forecastData && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl shadow-sm p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <h2 className="font-bold text-lg text-emerald-900">
                    AI Price Forecast & Storage Advisory
                  </h2>
                </div>

                <p className="text-xs text-emerald-800 leading-relaxed">{forecastData.forecast.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-emerald-200 p-4 rounded-xl text-center shadow-xs">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">7-Day Projected Price</p>
                    <p className="text-xl font-black text-emerald-600">₹{forecastData.forecast.price7d}/q</p>
                    <span className="text-[10px] text-emerald-700 font-bold">+{forecastData.forecast.change7dPct}% trend</span>
                  </div>

                  <div className="bg-white border border-emerald-200 p-4 rounded-xl text-center shadow-xs">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">30-Day Projected Price</p>
                    <p className="text-xl font-black text-purple-600">₹{forecastData.forecast.price30d}/q</p>
                    <span className="text-[10px] text-purple-700 font-bold">+{forecastData.forecast.change30dPct}% trend</span>
                  </div>
                </div>

                <div className="bg-white border border-emerald-200 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Sell-Now vs Wait Advisory:</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      forecastData.economics.recommendation === "HOLD_IN_STORAGE"
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}>
                      {forecastData.economics.recommendation.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {forecastData.economics.adviceText}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-lg text-slate-800 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span>Live Government Mandi Intelligence</span>
              </h2>

              <div className="flex space-x-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchCrop}
                    onChange={(e) => setSearchCrop(e.target.value)}
                    placeholder="Onion, Potato, Tomato"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={searchMandiPrices}
                  disabled={mandiLoading}
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  {mandiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Search"}
                </button>
              </div>

              {mandiResults.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">No matching records found.</p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {mandiResults.slice(0, 8).map((m, idx) => (
                    <div key={idx} className="border border-slate-100 p-3.5 rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{m.market}, {m.state}</p>
                        <p className="text-slate-400">{m.commodity} ({m.variety})</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">₹{m.modal_price}/q</p>
                        <p className="text-[10px] text-slate-400">Range: ₹{m.min_price} - ₹{m.max_price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Completed Sales History */}
        {activeTab === "history" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="font-bold text-lg text-slate-800 flex justify-between items-center pb-4 border-b border-slate-100">
              <span>Completed Sales & Locked Contracts ({completedLotsList.length})</span>
              <button onClick={loadMyLots} className="p-1 hover:bg-slate-50 rounded">
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </button>
            </h2>

            {completedLotsList.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <p>No completed sales or locked contracts recorded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedLotsList.map((lot) => {
                  const acceptedOffer = lot.offers?.find((o: any) => o.status === "ACCEPTED");
                  const buyer = acceptedOffer?.buyer;

                  return (
                    <div key={lot.id} className="border border-slate-200 p-5 rounded-xl bg-white space-y-4 shadow-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-800 text-lg">{lot.commodity}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium ml-2">
                            {lot.variety} ({lot.weight} q)
                          </span>
                        </div>

                        <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs">
                          CONTRACT LOCKED
                        </span>
                      </div>

                      <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-lg text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Buyer Partner:</span>
                          <span className="font-bold text-slate-800">{buyer?.name || "Verified Buyer"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Sale Price:</span>
                          <span className="font-bold text-slate-800">₹{acceptedOffer?.offeredPrice || lot.minPrice}/q</span>
                        </div>
                        <div className="flex justify-between border-t border-emerald-200/60 pt-1.5">
                          <span className="font-bold text-emerald-900">Net Realized Payout:</span>
                          <span className="font-black text-emerald-700 text-sm">
                            ₹{lot.transaction?.netRealization ? lot.transaction.netRealization.toLocaleString() : (acceptedOffer?.offeredPrice * lot.weight * 0.98).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {buyer && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => setRatingTarget({ id: buyer.id, name: buyer.name, role: "BUYER" })}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center space-x-1"
                          >
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span>Rate Buyer Partner ⭐</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Modal: Integrated Buyer Offers & Transporter Bids */}
      {selectedLot && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h2 className="font-bold text-xl text-slate-800">
                  Offers & Logistics Console for {selectedLot.commodity} ({selectedLot.weight} q)
                </h2>
                <p className="text-xs text-slate-500">Pick up: {selectedLot.pickupLocation}</p>
              </div>
              <button
                onClick={() => setSelectedLot(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Step 1: Integrated Transporter Selection */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-purple-900 text-sm flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Truck className="h-4 w-4 text-purple-600" />
                  <span>Step 1: Select Transporter Freight Quote</span>
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                  {transporterBids.length} Freight Quotes
                </span>
              </h3>
              <p className="text-xs text-purple-700">
                Select a logistics quote below to dynamically calculate your live Net Payout before locking the contract:
              </p>

              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {/* Default Route Pooling Option */}
                <div
                  onClick={() => setSelectedBidId(null)}
                  className={`p-3 rounded-lg border cursor-pointer transition flex justify-between items-center text-xs ${
                    selectedBidId === null
                      ? "bg-purple-100/70 border-purple-400 font-bold text-purple-900 shadow-sm"
                      : "bg-white border-purple-100 text-slate-700 hover:bg-purple-50/50"
                  }`}
                >
                  <div>
                    <p className="font-bold">Standard Shared Route Freight Pooling (Default)</p>
                    <p className="text-[10px] text-slate-500">Est. Route Rate: ~₹35/q • Open Transporter Queue</p>
                  </div>
                  <span className="font-bold text-purple-800">
                    Est. ₹{Math.max(1500, Math.round(selectedLot.weight * 35)).toLocaleString()}
                  </span>
                </div>

                {/* Transporter Custom Bids */}
                {transporterBids.map((bid) => (
                  <div
                    key={bid.id}
                    onClick={() => setSelectedBidId(bid.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex justify-between items-center text-xs ${
                      selectedBidId === bid.id
                        ? "bg-purple-100/70 border-purple-400 font-bold text-purple-900 shadow-sm"
                        : "bg-white border-purple-100 text-slate-700 hover:bg-purple-50/50"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800">{bid.transporter?.name || "Fleet Operator"}</p>
                      <p className="text-slate-500">Vehicle: {bid.vehicleType} • ETA: {bid.estimatedEtaHours}h</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-700 text-sm">₹{bid.offeredFee.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Buyer Offers Ranked by Net Realization */}
            {matchingLoading ? (
              <div className="py-16 text-center">
                <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">Ranking Buyer Offers by Net Payout...</p>
              </div>
            ) : !matchingData || !matchingData.offers || matchingData.offers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <p>No buyer bids received for this harvest lot yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Live Mandi Benchmark Banner */}
                {matchingData.mandiBenchmark && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="font-bold text-emerald-900 uppercase">Live Government Mandi Benchmark</p>
                        <p className="text-[11px] text-emerald-700">Source: {matchingData.mandiBenchmark.source} ({matchingData.mandiBenchmark.arrivalDate})</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-700 text-base">₹{matchingData.mandiBenchmark.modalPricePerQuintal}/q</p>
                      <p className="text-[10px] text-emerald-600 font-bold">Approx. ₹{matchingData.mandiBenchmark.modalPricePerKg}/kg</p>
                    </div>
                  </div>
                )}

                <h3 className="font-bold text-slate-800 text-base">Step 2: Ranked Buyer Bids</h3>
                {matchingData.offers.map((offer: any, index: number) => {
                  const grossVal = offer.offeredPrice * selectedLot.weight;
                  const platformFee = Math.round(grossVal * 0.01);
                  const effectiveLogisticsFee = activeSelectedBid
                    ? activeSelectedBid.offeredFee
                    : offer.logistics?.fee || Math.max(1500, Math.round(selectedLot.weight * 35));
                  const calculatedNetPayout = Math.max(0, Math.round(grossVal - platformFee - effectiveLogisticsFee));

                  return (
                    <div
                      key={offer.id}
                      className={`border rounded-xl p-5 space-y-4 ${
                        index === 0 ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 text-base">{offer.buyer.name}</span>
                            {index === 0 && (
                              <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                Best Net Payout
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Location: {offer.buyer.district}, {offer.buyer.state}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-400">Offered Price</p>
                          <p className="font-bold text-slate-800 text-base">₹{offer.offeredPrice}/q</p>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-lg p-3 grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-slate-400">Gross Offer</p>
                          <p className="font-bold text-slate-800">₹{grossVal.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Logistics Fee</p>
                          <p className="font-bold text-purple-700">₹{effectiveLogisticsFee.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Exact Net Payout</p>
                          <p className="font-black text-emerald-600 text-sm">₹{calculatedNetPayout.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 space-x-3 items-center">
                        <button
                          onClick={() => handleAcceptOffer(offer.id)}
                          disabled={acceptingOfferId === offer.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs shadow transition flex items-center space-x-1"
                        >
                          {acceptingOfferId === offer.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          <span>Accept Offer & Lock Contract</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Rating Modal */}
      {ratingTarget && currentUser && (
        <RatingModal
          isOpen={!!ratingTarget}
          onClose={() => setRatingTarget(null)}
          targetUser={ratingTarget}
          reviewerId={currentUser.id}
          lotId={selectedLot?.id}
          onRatingSubmitted={loadMyLots}
        />
      )}
    </div>
  );
}
