"use client";

import React, { useState } from "react";
import { MapPin, Navigation, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface GPSLocationPickerProps {
  latitude: number | string;
  longitude: number | string;
  onChange: (lat: number | null, lng: number | null) => void;
  label?: string;
}

export default function GPSLocationPicker({
  latitude,
  longitude,
  onChange,
  label = "GPS Geolocation Coordinates"
}: GPSLocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      setStatusMessage("Browser does not support HTML5 Geolocation.");
      return;
    }

    setLoading(true);
    setStatusMessage("Fetching GPS coordinates from device...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy);

        onChange(lat, lng);
        setAccuracy(acc);
        setStatusMessage(`GPS Location Captured (Accuracy: ±${acc}m)`);
        setLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setStatusMessage("Location permission denied. Please enter coordinates manually below.");
        } else {
          setStatusMessage("Unable to retrieve device GPS location. Enter manually below.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
      <div className="flex justify-between items-center">
        <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
          <MapPin className="h-4 w-4 text-emerald-600" />
          <span>{label}</span>
        </label>

        {/* Auto-Detect Button */}
        <button
          type="button"
          onClick={handleAutoDetect}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Navigation className="h-3.5 w-3.5" />
          )}
          <span>{loading ? "Acquiring GPS..." : "Detect My Location 📍"}</span>
        </button>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div className={`p-2 rounded-lg text-[11px] font-medium flex items-center space-x-1.5 ${
          accuracy !== null
            ? "bg-emerald-100/70 text-emerald-800 border border-emerald-200"
            : "bg-amber-100/70 text-amber-800 border border-amber-200"
        }`}>
          {accuracy !== null ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Manual Coordinates Development & Testing Inputs */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Latitude (Dev Manual Input)
          </label>
          <input
            type="number"
            step="any"
            value={latitude ?? ""}
            onChange={(e) => {
              const val = e.target.value ? parseFloat(e.target.value) : null;
              onChange(val, longitude ? parseFloat(longitude.toString()) : null);
            }}
            placeholder="e.g. 18.5204"
            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Longitude (Dev Manual Input)
          </label>
          <input
            type="number"
            step="any"
            value={longitude ?? ""}
            onChange={(e) => {
              const val = e.target.value ? parseFloat(e.target.value) : null;
              onChange(latitude ? parseFloat(latitude.toString()) : null, val);
            }}
            placeholder="e.g. 73.8567"
            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
