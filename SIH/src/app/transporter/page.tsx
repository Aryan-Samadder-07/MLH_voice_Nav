"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import {
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Navigation,
  Compass,
  FileText,
  Boxes,
  Briefcase,
  DollarSign,
  Gavel,
  Settings,
  ShieldCheck,
  Star,
  PackageCheck,
  Sliders,
  History,
  CheckCircle
} from "lucide-react";
import RatingModal from "@/components/RatingModal";
import RoleSubNav from "@/components/RoleSubNav";

export default function TransporterDashboard() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState("jobs");

  // Voice Assistant Subpage Tab Switching Listener
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      const tab = e.detail?.tab;
      if (tab && ["jobs", "deliveries", "history", "settings"].includes(tab)) {
        setActiveTab(tab);
      }
    };
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialTab = params.get("tab");
      if (initialTab && ["jobs", "deliveries", "history", "settings"].includes(initialTab)) {
        setActiveTab(initialTab);
      }
    }
    window.addEventListener("custom:switch_tab", handleSwitchTab);
    return () => window.removeEventListener("custom:switch_tab", handleSwitchTab);
  }, []);

  const [unassignedJobs, setUnassignedJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(true);
  const [loadingMyJobs, setLoadingMyJobs] = useState(true);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  // Custom Freight Quote Modal State
  const [biddingJob, setBiddingJob] = useState<any | null>(null);
  const [customBidFee, setCustomBidFee] = useState("");
  const [customEta, setCustomEta] = useState("24");
  const [customVehicle, setCustomVehicle] = useState("Bolero Pickup (1.5 Ton)");
  const [submittingBid, setSubmittingBid] = useState(false);

  // Profile Settings state
  const [vehicleType, setVehicleType] = useState("Bolero Pickup (1.5 Ton)");
  const [perKmRate, setPerKmRate] = useState("3.5");
  const [baseFare, setBaseFare] = useState("1500");
  const [savingSettings, setSavingSettings] = useState(false);

  const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string; role: string } | null>(null);

  // Fetch Transporter Rate Profile
  useEffect(() => {
    if (currentUser) {
      if (currentUser.vehicleType) setVehicleType(currentUser.vehicleType);
      if (currentUser.perKmRate) setPerKmRate(currentUser.perKmRate.toString());
      if (currentUser.baseFare) setBaseFare(currentUser.baseFare.toString());
    }
  }, [currentUser]);

  // Load unassigned jobs waiting for haulage
  const loadUnassignedJobs = async () => {
    try {
      setLoadingUnassigned(true);
      const response = await fetch("/api/logistics");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setUnassignedJobs(data);
        }
      }
    } catch (err) {
      console.error("Error loading unassigned jobs:", err);
    } finally {
      setLoadingUnassigned(false);
    }
  };

  // Load my active/completed claimed jobs
  const loadMyJobs = async () => {
    if (!currentUser) {
      setLoadingMyJobs(false);
      return;
    }
    try {
      setLoadingMyJobs(true);
      const response = await fetch(`/api/logistics?transporterId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setMyJobs(data);
        }
      }
    } catch (err) {
      console.error("Error loading my jobs:", err);
    } finally {
      setLoadingMyJobs(false);
    }
  };

  useEffect(() => {
    loadUnassignedJobs();
    if (currentUser) {
      loadMyJobs();
    } else {
      setLoadingMyJobs(false);
    }
  }, [currentUser]);

  // Save Fleet Rate Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      setSavingSettings(true);
      const res = await fetch("/api/transporter/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          perKmRate,
          baseFare,
          vehicleType
        })
      });
      if (res.ok) {
        alert("Fleet Rate Settings Saved Successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Submit Freight Bid Quote
  const handleSubmitCustomBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !biddingJob) return;
    try {
      setSubmittingBid(true);
      const res = await fetch("/api/logistics/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: biddingJob.id,
          transporterId: currentUser.id,
          offeredFee: parseFloat(customBidFee),
          vehicleType: customVehicle,
          estimatedEtaHours: parseInt(customEta)
        })
      });

      if (res.ok) {
        alert("Custom Freight Quote Submitted to Farmer!");
        setBiddingJob(null);
        loadUnassignedJobs();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit quote");
      }
    } catch (err) {
      console.error("Error submitting bid:", err);
    } finally {
      setSubmittingBid(false);
    }
  };

  // Update cargo shipping status
  const handleUpdateStatus = async (jobId: string, nextStatus: "IN_TRANSIT" | "DELIVERED") => {
    try {
      setUpdatingJobId(jobId);
      const response = await fetch("/api/logistics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          status: nextStatus
        })
      });

      if (response.ok) {
        loadMyJobs();
        if (nextStatus === "DELIVERED") {
          setActiveTab("history"); // Move to history tab on delivery completion
        }
      } else {
        const err = await response.json();
        alert(err.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingJobId(null);
    }
  };

  if (!currentUser || (currentUser.role !== "TRANSPORTER" && currentUser.role !== "ADMIN")) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-md mx-auto bg-white border border-amber-200 rounded-xl p-8 shadow-sm">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Please switch to a **Transporter** profile using the active session selector in the header to view this dashboard.
          </p>
        </div>
      </div>
    );
  }

  const myActiveJobs = myJobs.filter((job) => job.status !== "DELIVERED");
  const myCompletedJobs = myJobs.filter((job) => job.status === "DELIVERED");

  const navTabs = [
    { id: "jobs", label: "Freight Cargo Desk (Open Jobs)", icon: Truck, badge: unassignedJobs.length },
    { id: "deliveries", label: "My Active Deliveries", icon: PackageCheck, badge: myActiveJobs.length },
    { id: "history", label: "Delivery History & Earnings", icon: History, badge: myCompletedJobs.length },
    { id: "settings", label: "Fleet & Freight Rate Settings", icon: Settings }
  ];

  return (
    <div>
      {/* Role Sub-Navigation Tabs */}
      <RoleSubNav tabs={navTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Transporter Operations Desk</h1>
            <p className="text-sm text-slate-500">Welcome, {currentUser.name}. Route logistics loads, submit custom freight bids, and track cargo.</p>
          </div>
          
          {/* Reliability Score Badge */}
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-800">Fleet Trust Rating</p>
              <p className="font-black text-slate-800 text-sm">
                {currentUser.reliabilityScore ? `${currentUser.reliabilityScore.toFixed(1)} / 5.0 ⭐` : "5.0 / 5.0 ⭐"}
              </p>
            </div>
          </div>
        </div>

        {/* TAB 1: Available Freight Cargo Jobs */}
        {activeTab === "jobs" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-800">Available Freight Cargo Jobs ({unassignedJobs.length})</h2>
              <button onClick={loadUnassignedJobs} className="p-2 hover:bg-slate-50 rounded border border-slate-200">
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {loadingUnassigned ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
              </div>
            ) : unassignedJobs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <p>No new logistics jobs are currently awaiting transporter assignment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unassignedJobs.map((job) => {
                  const acceptedOffer = job.lot.offers?.find((o: any) => o.status === "ACCEPTED");
                  const buyer = acceptedOffer?.buyer;

                  return (
                    <div key={job.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition bg-white space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-800 text-base">{job.lot.commodity}</span>
                          <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded ml-2">
                            {job.mode}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-700 text-base">₹{job.fee.toLocaleString()}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 border border-slate-100">
                        <p className="text-slate-600">
                          <strong>Pickup:</strong> {job.lot.farmer.name} ({job.lot.pickupLocation})
                        </p>
                        <p className="text-slate-600">
                          <strong>Delivery:</strong> {buyer ? `${buyer.name} (${buyer.district})` : "Destination Mandi"}
                        </p>
                        <p className="text-slate-500">
                          <strong>Volume:</strong> {job.lot.weight} q • Distance: {job.distance} km
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setBiddingJob(job);
                          setCustomBidFee(job.fee.toString());
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold p-2.5 rounded-lg text-xs shadow transition flex justify-center items-center space-x-1"
                      >
                        <Gavel className="h-4 w-4" />
                        <span>Submit Custom Freight Quote</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: My Active Deliveries */}
        {activeTab === "deliveries" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-800">My Active Deliveries ({myActiveJobs.length})</h2>
              <button onClick={loadMyJobs} className="p-2 hover:bg-slate-50 rounded border border-slate-200">
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {loadingMyJobs ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
              </div>
            ) : myActiveJobs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <p>You have no active deliveries in progress.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myActiveJobs.map((job) => {
                  const acceptedOffer = job.lot.offers?.find((o: any) => o.status === "ACCEPTED");
                  const buyer = acceptedOffer?.buyer;

                  return (
                    <div key={job.id} className="border border-slate-200 p-5 rounded-xl bg-white space-y-4 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-base">{job.lot.commodity} ({job.lot.weight} q)</span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                          {job.status}
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 border border-slate-100">
                        <p><strong>From:</strong> {job.lot.pickupLocation}</p>
                        <p><strong>To:</strong> {buyer ? `${buyer.district}, ${buyer.state}` : "Buyer Warehouse"}</p>
                        <p><strong>Freight Fee:</strong> <span className="font-bold text-emerald-600">₹{job.fee.toLocaleString()}</span></p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        {job.status === "LOADING" ? (
                          <button
                            onClick={() => handleUpdateStatus(job.id, "IN_TRANSIT")}
                            disabled={updatingJobId === job.id}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-lg text-xs shadow transition"
                          >
                            Mark as In Transit
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(job.id, "DELIVERED")}
                            disabled={updatingJobId === job.id}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-lg text-xs shadow transition"
                          >
                            Confirm Delivery & Quality
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Delivery History & Earnings */}
        {activeTab === "history" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-800">Completed Deliveries & Earned Payouts ({myCompletedJobs.length})</h2>
              <button onClick={loadMyJobs} className="p-2 hover:bg-slate-50 rounded border border-slate-200">
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {myCompletedJobs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <p>No completed deliveries recorded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myCompletedJobs.map((job) => {
                  const acceptedOffer = job.lot.offers?.find((o: any) => o.status === "ACCEPTED");
                  const buyer = acceptedOffer?.buyer;

                  return (
                    <div key={job.id} className="border border-slate-200 p-5 rounded-xl bg-white space-y-4 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-base">{job.lot.commodity} ({job.lot.weight} q)</span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          <span>DELIVERED & PAID</span>
                        </span>
                      </div>
                      
                      <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-900 p-4 rounded-lg text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Farmer Origin:</span>
                          <span className="font-bold text-slate-800">{job.lot.farmer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Buyer Destination:</span>
                          <span className="font-bold text-slate-800">{buyer ? buyer.name : "Warehouse Fulfillment"}</span>
                        </div>
                        <div className="flex justify-between border-t border-emerald-200 pt-2">
                          <span className="font-bold text-emerald-900">Freight Payout Earned:</span>
                          <span className="font-black text-emerald-700 text-sm">₹{job.fee.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setRatingTarget({ id: job.lot.farmer.id, name: job.lot.farmer.name, role: "FARMER" })}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center space-x-1"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span>Rate Farmer Partner ⭐</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Fleet & Rate Settings */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-8 space-y-6">
            <h2 className="font-bold text-xl text-slate-800 flex items-center space-x-2">
              <Settings className="h-6 w-6 text-emerald-600" />
              <span>Fleet & Custom Freight Pricing Settings</span>
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Bolero Pickup (1.5 Ton)">Bolero Pickup (1.5 Ton)</option>
                  <option value="Tata 407 (3.5 Ton)">Tata 407 (3.5 Ton)</option>
                  <option value="Eicher 14ft (4 Ton)">Eicher 14ft (4 Ton)</option>
                  <option value="10-Wheeler Truck (16 Ton)">10-Wheeler Truck (16 Ton)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Per-KM Rate (₹/KM/Q)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={perKmRate}
                    onChange={(e) => setPerKmRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Base Trip Fare (₹)</label>
                  <input
                    type="number"
                    value={baseFare}
                    onChange={(e) => setBaseFare(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold p-3 rounded-lg text-sm shadow transition flex justify-center items-center space-x-2"
              >
                {savingSettings ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Save Rate Profile</span>}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Custom Freight Quote Modal */}
      {biddingJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-800">
              Submit Freight Quote for {biddingJob.lot.commodity} ({biddingJob.lot.weight} q)
            </h3>

            <form onSubmit={handleSubmitCustomBid} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehicle Selected</label>
                <select
                  value={customVehicle}
                  onChange={(e) => setCustomVehicle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold"
                >
                  <option value="Bolero Pickup (1.5 Ton)">Bolero Pickup (1.5 Ton)</option>
                  <option value="Tata 407 (3.5 Ton)">Tata 407 (3.5 Ton)</option>
                  <option value="Eicher 14ft (4 Ton)">Eicher 14ft (4 Ton)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Freight Fee Quote (₹)</label>
                  <input
                    type="number"
                    value={customBidFee}
                    onChange={(e) => setCustomBidFee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ETA (Hours)</label>
                  <input
                    type="number"
                    value={customEta}
                    onChange={(e) => setCustomEta(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBiddingJob(null)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2.5 rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBid}
                  className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white font-bold p-2.5 rounded-lg text-xs shadow transition flex justify-center items-center space-x-1"
                >
                  {submittingBid ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Submit Freight Quote</span>}
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
          onRatingSubmitted={loadMyJobs}
        />
      )}
    </div>
  );
}
