"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  Percent,
  Clock,
  Sparkles,
} from "lucide-react";

interface Reward {
  rewardId: string;
  rewardName: string;
  description: string;
  probability: number;
  active: boolean;
  validityDays: number;
  usageLimit: number;
  usedCount: number;
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form Inputs
  const [rewardId, setRewardId] = useState("");
  const [rewardName, setRewardName] = useState("");
  const [description, setDescription] = useState("");
  const [probability, setProbability] = useState(10);
  const [validityDays, setValidityDays] = useState(7);
  const [usageLimit, setUsageLimit] = useState(500);
  const [active, setActive] = useState(true);
  const [usedCount, setUsedCount] = useState(0);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/data");
      if (!response.ok) {
        throw new Error("Failed to fetch rewards data");
      }
      const apiData = await response.json();
      const rawRewards: any[] = apiData.rewards || [];
      const list: Reward[] = rawRewards.map((data) => ({
        rewardId: data.id,
        rewardName: data.rewardName,
        description: data.description || "",
        probability: Number(data.probability) || 0,
        active: data.active ?? true,
        validityDays: Number(data.validityDays) || 7,
        usageLimit: Number(data.usageLimit) || 0,
        usedCount: Number(data.usedCount) || 0,
      }));
      // Sort rewards alphabetically
      list.sort((a, b) => a.rewardName.localeCompare(b.rewardName));
      setRewards(list);
    } catch (error) {
      console.error("Error loading rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setRewardId("");
    setRewardName("");
    setDescription("");
    setProbability(10);
    setValidityDays(7);
    setUsageLimit(500);
    setActive(true);
    setUsedCount(0);
    setShowFormModal(true);
  };

  const openEditModal = (reward: Reward) => {
    setIsEditing(true);
    setRewardId(reward.rewardId);
    setRewardName(reward.rewardName);
    setDescription(reward.description);
    setProbability(reward.probability);
    setValidityDays(reward.validityDays);
    setUsageLimit(reward.usageLimit);
    setActive(reward.active);
    setUsedCount(reward.usedCount);
    setShowFormModal(true);
  };

  const handleToggleActive = async (reward: Reward) => {
    try {
      const response = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: reward.rewardId,
          rewardName: reward.rewardName,
          active: !reward.active,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle reward status");
      }

      await fetchRewards();
    } catch (err) {
      console.error("Toggle active error:", err);
      alert("Failed to toggle reward status.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLoading) return;

    if (!rewardName.trim()) {
      alert("Reward name is required.");
      return;
    }

    setSubmitLoading(true);

    // Generate unique ID if adding
    const finalId = isEditing
      ? rewardId
      : rewardName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-") + `-${Date.now().toString().slice(-4)}`;

    const rewardData = {
      rewardId: finalId,
      rewardName: rewardName.trim(),
      description: description.trim(),
      probability: Number(probability) || 0,
      active,
      validityDays: Number(validityDays) || 7,
      usageLimit: Number(usageLimit) || 0,
    };

    try {
      const response = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rewardData),
      });

      if (!response.ok) {
        throw new Error("Failed to save reward");
      }

      await fetchRewards();
      setShowFormModal(false);
    } catch (err) {
      console.error("Save reward error:", err);
      alert("Failed to save reward configurations.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reward? This could disrupt existing coupons using this reward index.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rewards?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reward");
      }

      await fetchRewards();
    } catch (err) {
      console.error("Delete reward error:", err);
      alert("Failed to delete reward.");
    }
  };

  // Calculate sum of active probabilities
  const totalProbability = rewards
    .filter((r) => r.active)
    .reduce((sum, r) => sum + r.probability, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-850">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-slate-800 tracking-wide">
            Manage Rewards
          </h1>
          <p className="text-sm text-slate-500">
            Define active wheel segments, probabilities, and limits.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl transition duration-150 flex items-center gap-1.5 text-xs uppercase tracking-wider self-start select-none cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          <span>Add Reward</span>
        </button>
      </div>

      {/* CALIBRATION STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-slate-700">
        <div className="flex items-start space-x-3.5">
          <Percent className="h-5 w-5 text-amber-600 mt-1 shrink-0" />
          <div>
            <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Calibration Weight</h4>
            <p className="text-xl font-bold text-slate-800 font-mono mt-1">
              {totalProbability.toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
              Probabilities do not need to equal 100%. The system selects rewards using relative weighted distribution.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-5">
          <Gift className="h-5 w-5 text-green-600 mt-1 shrink-0" />
          <div>
            <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Wheel Segments</h4>
            <p className="text-xl font-bold text-slate-800 font-mono mt-1">
              {rewards.filter((r) => r.active).length} Active / {rewards.length} Total
            </p>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
              Recommended: 6 to 12 active rewards for a balanced and beautiful spinning wheel presentation.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-5">
          <Info className="h-5 w-5 text-blue-650 mt-1 shrink-0" />
          <div>
            <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Auto-Exclusion</h4>
            <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
              Rewards that reach their usage limit or are set to inactive are automatically omitted from the wheel selection flow.
            </p>
          </div>
        </div>
      </div>

      {/* REWARDS DIRECTORY */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
            <p className="text-xs">Loading rewards...</p>
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs">
            No rewards defined. Click 'Add Reward' to begin populating the wheel!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Reward Name</th>
                  <th className="px-6 py-4">Relative Weight</th>
                  <th className="px-6 py-4">Validity Period</th>
                  <th className="px-6 py-4">Usage Limit</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                {rewards.map((reward) => {
                  const limitReached = reward.usedCount >= reward.usageLimit;
                  return (
                    <tr key={reward.rewardId} className="hover:bg-slate-50 transition duration-150">
                      {/* Name & desc */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{reward.rewardName}</div>
                        <div className="text-[10px] text-slate-400 mt-1 max-w-sm truncate" title={reward.description}>
                          {reward.description || "No description provided."}
                        </div>
                      </td>

                      {/* Probability */}
                      <td className="px-6 py-4 font-semibold font-mono text-slate-800">
                        {reward.probability}%
                      </td>

                      {/* Validity */}
                      <td className="px-6 py-4 text-slate-500 font-mono">
                        {reward.validityDays} Days
                      </td>

                      {/* Usage Limits */}
                      <td className="px-6 py-4">
                        <div className="font-mono">
                          <span className={limitReached ? "text-rose-600 font-semibold" : "text-green-600 font-semibold"}>
                            {reward.usedCount}
                          </span>{" "}
                          / {reward.usageLimit}
                        </div>
                        <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full ${limitReached ? "bg-rose-500" : "bg-green-500"}`}
                            style={{
                              width: `${Math.min((reward.usedCount / reward.usageLimit) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(reward)}
                          className="flex items-center select-none cursor-pointer focus:outline-none"
                        >
                          {reward.active && !limitReached ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 border border-green-200 text-green-700">
                              <CheckCircle size={10} className="mr-1 shrink-0" />
                              Active
                            </span>
                          ) : limitReached ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700">
                              <XCircle size={10} className="mr-1 shrink-0" />
                              Limit Hit
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-400">
                              <XCircle size={10} className="mr-1 shrink-0" />
                              Disabled
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(reward)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg transition select-none cursor-pointer"
                            title="Edit Reward"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(reward.rewardId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition select-none cursor-pointer"
                            title="Delete Reward"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE/EDIT FORM MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-6 relative animate-fade-in text-slate-800">
            <div className="flex items-center space-x-2 text-amber-600">
              <Sparkles size={18} />
              <h3 className="text-lg font-bold font-serif">
                {isEditing ? "Modify Reward" : "Add New Reward"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Reward Name */}
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Reward Name</label>
                <input
                  type="text"
                  placeholder="e.g., Free Welcome Drink"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  required
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-slate-800 outline-none transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Details shown to customer and staff"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-slate-800 outline-none resize-none transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Probability */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span>Weight</span>
                    <Percent size={10} className="text-amber-600" />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="15"
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    required
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-slate-800 outline-none font-mono transition"
                  />
                </div>

                {/* Validity */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span>Validity</span>
                    <Clock size={10} className="text-green-600" />
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="7"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    required
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-slate-800 outline-none font-mono transition"
                  />
                </div>

                {/* Limit */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="500"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    required
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-slate-800 outline-none font-mono transition"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <label className="flex items-center space-x-3.5 cursor-pointer py-1.5 select-none w-max">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-350 text-amber-500 focus:ring-amber-500 bg-slate-50 focus:ring-offset-white"
                />
                <span className="text-slate-700 font-bold uppercase tracking-wider">Reward Campaign Active</span>
              </label>

              {/* Actions */}
              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl transition uppercase tracking-wider text-[11px] select-none cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {submitLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                  <span>Save Config</span>
                </button>
                <button
                  type="button"
                  disabled={submitLoading}
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 font-bold py-2 rounded-xl transition uppercase tracking-wider text-[11px] select-none cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
