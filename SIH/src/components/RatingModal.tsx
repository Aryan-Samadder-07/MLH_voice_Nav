"use client";

import React, { useState } from "react";
import { Star, X, Check, RefreshCw, MessageSquare } from "lucide-react";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: { id: string; name: string; role: string };
  reviewerId: string;
  lotId?: string;
  onRatingSubmitted?: () => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  targetUser,
  reviewerId,
  lotId,
  onRatingSubmitted
}: RatingModalProps) {
  const [score, setScore] = useState(5);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          comment,
          reviewerId,
          targetUserId: targetUser.id,
          lotId
        })
      });

      if (res.ok) {
        setSubmittedSuccess(true);
        setTimeout(() => {
          setSubmittedSuccess(false);
          if (onRatingSubmitted) onRatingSubmitted();
          onClose();
        }, 1500);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit rating");
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {submittedSuccess ? (
          <div className="text-center py-8 space-y-3">
            <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Rating Submitted!</h3>
            <p className="text-xs text-slate-500">
              Thank you! Your feedback has updated {targetUser.name}&apos;s verified reliability scorecard.
            </p>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-100">
                Rate Transaction Partner
              </span>
              <h2 className="font-bold text-xl text-slate-800 mt-2">Rate {targetUser.name}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Role: <span className="font-semibold text-slate-700">{targetUser.role}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Selection */}
              <div className="text-center">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Select Rating Score (1 to 5 Stars)
                </label>
                <div className="flex justify-center items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverScore || score);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setScore(star)}
                        onMouseEnter={() => setHoverScore(star)}
                        onMouseLeave={() => setHoverScore(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 transition ${
                            active
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-bold text-amber-600 mt-2">
                  {score === 5 && "⭐ 5.0 - Excellent Experience"}
                  {score === 4 && "⭐ 4.0 - Very Good"}
                  {score === 3 && "⭐ 3.0 - Satisfactory"}
                  {score === 2 && "⭐ 2.0 - Poor"}
                  {score === 1 && "⭐ 1.0 - Very Dissatisfied"}
                </p>
              </div>

              {/* Review Comment Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center space-x-1">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                  <span>Review Comments (Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share feedback regarding produce quality, prompt payment, or transport safety..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2.5 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 bg-purple-600 hover:bg-purple-700 text-white font-bold p-2.5 rounded-xl text-xs shadow transition flex justify-center items-center space-x-1"
                >
                  {submitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
