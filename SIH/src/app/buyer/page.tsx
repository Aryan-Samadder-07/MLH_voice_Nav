"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import {
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ShoppingBag,
  Award,
  MapPin,
  ChevronRight,
  DollarSign,
  Gavel,
  Truck,
  ShieldCheck,
  Star,
  FileCheck,
  Store,
  History
} from "lucide-react";
import RatingModal from "@/components/RatingModal";
import RoleSubNav from "@/components/RoleSubNav";

export default function BuyerDashboard() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState("marketplace");

  // Voice Assistant Subpage Tab Switching Listener
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      const tab = e.detail?.tab;
      if (tab && ["marketplace", "bids", "history"].includes(tab)) {
        setActiveTab(tab);
      }
    };
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialTab = params.get("tab");
      if (initialTab && ["marketplace", "bids", "history"].includes(initialTab)) {
        setActiveTab(initialTab);
      }
    }
    window.addEventListener("custom:switch_tab", handleSwitchTab);
    return () => window.removeEventListener("custom:switch_tab", handleSwitchTab);
  }, []);

  const [activeLots, setActiveLots] = useState<any[]>([]);
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const [lotsLoading, setLotsLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);

  // Filter state
  const [filterCommodity, setFilterCommodity] = useState("");

  // Place Bid Modal state
  const [biddingLot, setBiddingLot] = useState<any | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string; role: string } | null>(null);

  // Load active lots available for sourcing
  const loadActiveLots = async () => {
    try {
      setLotsLoading(true);
      const query = `/api/lots?status=ACTIVE`;
      const response = await fetch(query);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setActiveLots(data);
        }
      }
    } catch (err) {
      console.error("Error loading active lots:", err);
    } finally {
      setLotsLoading(false);
    }
  };

  // Load user's submitted offers
  const loadMyOffers = async () => {
    if (!currentUser) {
      setOffersLoading(false);
      return;
    }
    try {
      setOffersLoading(true);
      const response = await fetch(`/api/offers?buyerId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setMyOffers(data);
        }
      }
    } catch (err) {
      console.error("Error loading buyer offers:", err);
    } finally {
      setOffersLoading(false);
    }
  };

  useEffect(() => {
    loadActiveLots();
    if (currentUser) {
      loadMyOffers();
    } else {
      setOffersLoading(false);
    }
  }, [currentUser]);

  // Handle bid submission
  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !biddingLot) return;

    try {
      setSubmittingBid(true);
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeredPrice: parseFloat(bidPrice),
          quantity: biddingLot.weight,
          buyerId: currentUser.id,
          lotId: biddingLot.id
        })
      });

      if (response.ok) {
        setBiddingLot(null);
        setBidPrice("");
        loadMyOffers();
        loadActiveLots();
        setActiveTab("bids");
      } else {
        const err = await response.json();
        alert(err.error || "Failed to place bid");
      }
    } catch (err) {
      console.error("Error placing bid:", err);
    } finally {
      setSubmittingBid(false);
    }
  };

  if (!currentUser || (currentUser.role !== "BUYER" && currentUser.role !== "ADMIN")) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-md mx-auto bg-white border border-amber-200 rounded-xl p-8 shadow-sm">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Please switch to a **Buyer** profile (e.g. BigBasket Agri or Reliance Retail) using the active session selector in the header to view this dashboard.
          </p>
        </div>
      </div>
    );
  }

  const filteredLots = activeLots.filter((lot) =>
    filterCommodity ? lot.commodity.toLowerCase().includes(filterCommodity.toLowerCase()) : true
  );

  const pendingBids = myOffers.filter((o) => o.status === "PENDING");
  const acceptedContracts = myOffers.filter((o) => o.status === "ACCEPTED");

  const navTabs = [
    { id: "marketplace", label: "Harvest Sourcing Marketplace", icon: Store, badge: activeLots.length },
    { id: "bids", label: "My Active Bids", icon: Clock, badge: pendingBids.length },
    { id: "history", label: "Secured Contracts History", icon: History, badge: acceptedContracts.length }
  ];

  return (
    <div>
      {/* Role Sub-Navigation Tabs */}
      <RoleSubNav tabs={navTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 font-sans">Buyer Procurement Dashboard</h1>
            <p className="text-sm text-slate-500">Welcome, {currentUser.name}. Discover verified harvests, submit offers, and track contracts.</p>
          </div>

          {/* Reliability Scorecard Badge */}
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-800">Verified Buyer Trust Rating</p>
              <p className="font-black text-slate-800 text-sm">
                {currentUser.reliabilityScore ? `${currentUser.reliabilityScore.toFixed(1)} / 5.0 ⭐` : "5.0 / 5.0 ⭐"}
              </p>
            </div>
          </div>
        </div>

        {/* TAB 1: Sourcing Marketplace */}
        {activeTab === "marketplace" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-800">Available Produce Lots ({filteredLots.length})</h2>
              
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="relative flex-grow sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={filterCommodity}
                    onChange={(e) => setFilterCommodity(e.target.value)}
                    placeholder="Filter Tomato, Potato, Paddy..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <button onClick={loadActiveLots} className="p-2 hover:bg-slate-100 border border-slate-200 rounded-lg">
                  <RefreshCw className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>

            {lotsLoading ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
              </div>
            ) : filteredLots.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <p>No active produce listings available at this moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLots.map((lot) => (
                  <div key={lot.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition bg-white flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-800 text-lg">{lot.commodity}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium ml-2">
                            {lot.variety}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {lot.grade}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 mr-1 shrink-0" />
                        <span>Farmer: <strong>{lot.farmer.name}</strong> ({lot.pickupLocation})</span>
                      </p>

                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg text-xs border border-slate-100">
                        <div>
                          <p className="text-slate-400">Total Volume</p>
                          <p className="font-bold text-slate-800 mt-0.5">{lot.weight} q ({(lot.weight * 100).toLocaleString()} kg)</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Floor Price</p>
                          <p className="font-bold text-emerald-600 text-sm mt-0.5">₹{lot.minPrice}/q</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setBiddingLot(lot)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-lg text-xs shadow transition flex justify-center items-center space-x-1"
                    >
                      <Gavel className="h-4 w-4" />
                      <span>Place Purchase Offer Bid</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: My Active Bids */}
        {activeTab === "bids" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="font-bold text-lg text-slate-800 flex justify-between items-center pb-4 border-b border-slate-100">
              <span>My Active Pending Bids ({pendingBids.length})</span>
              <button onClick={loadMyOffers} className="p-1 hover:bg-slate-50 rounded">
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </button>
            </h2>

            {offersLoading ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
              </div>
            ) : pendingBids.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <p>You have no active pending bids. Switch to Sourcing Marketplace to view active produce.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingBids.map((offer) => (
                  <div key={offer.id} className="border border-slate-200 p-5 rounded-xl bg-white space-y-3 shadow-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800 text-base">{offer.lot.commodity}</span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium ml-2">
                          {offer.lot.variety}
                        </span>
                      </div>
                      
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>PENDING REVIEW</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg text-xs border border-slate-100">
                      <div>
                        <p className="text-slate-400">Offered Price</p>
                        <p className="font-bold text-slate-800 mt-0.5">₹{offer.offeredPrice}/q</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Total Volume</p>
                        <p className="font-bold text-slate-800 mt-0.5">{offer.quantity} q</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400">Farmer</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{offer.lot.farmer.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Secured Contracts History */}
        {activeTab === "history" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="font-bold text-lg text-slate-800 flex justify-between items-center pb-4 border-b border-slate-100">
              <span>Secured Winning Contracts ({acceptedContracts.length})</span>
              <button onClick={loadMyOffers} className="p-1 hover:bg-slate-50 rounded">
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </button>
            </h2>

            {acceptedContracts.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <p>No secured winning contracts recorded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {acceptedContracts.map((offer) => (
                  <div key={offer.id} className="border border-slate-200 p-5 rounded-xl bg-white space-y-4 shadow-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800 text-base">{offer.lot.commodity}</span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium ml-2">
                          {offer.lot.variety} ({offer.quantity} q)
                        </span>
                      </div>
                      
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center">
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        <span>CONTRACT SECURED</span>
                      </span>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-900 p-4 rounded-lg text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Produce Seller:</span>
                        <span className="font-bold text-slate-800">{offer.lot.farmer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Agreed Unit Price:</span>
                        <span className="font-bold text-slate-800">₹{offer.offeredPrice}/q</span>
                      </div>
                      <div className="flex justify-between border-t border-emerald-200 pt-2">
                        <span className="font-bold text-emerald-900">Total Purchase Invoice:</span>
                        <span className="font-black text-emerald-700 text-sm">
                          ₹{(offer.offeredPrice * offer.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setRatingTarget({ id: offer.lot.farmer.id, name: offer.lot.farmer.name, role: "FARMER" })}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center space-x-1 shrink-0"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>Rate Farmer Partner ⭐</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Place Bid Modal */}
      {biddingLot && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-800">
              Submit Offer for {biddingLot.commodity} ({biddingLot.weight} q)
            </h3>
            <p className="text-xs text-slate-500">
              Farmer: <strong>{biddingLot.farmer.name}</strong> • Pickup: {biddingLot.pickupLocation}
            </p>

            <form onSubmit={handlePlaceBid} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Your Bid Price per Quintal (Floor: ₹{biddingLot.minPrice}/q)
                </label>
                <input
                  type="number"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  placeholder={`Min ₹${biddingLot.minPrice}`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Gross Payout:</span>
                  <span className="font-bold">₹{((parseFloat(bidPrice) || 0) * biddingLot.weight).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBiddingLot(null)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2.5 rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBid}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-lg text-xs shadow transition flex justify-center items-center space-x-1"
                >
                  {submittingBid ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Confirm Offer</span>}
                </button>
              </div>
            </form>
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
          onRatingSubmitted={loadMyOffers}
        />
      )}
    </div>
  );
}
