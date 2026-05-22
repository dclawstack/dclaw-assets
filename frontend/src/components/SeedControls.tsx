"use client";

import { useState } from "react";
import { seedData, clearData } from "@/lib/api";

export function SeedControls() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<"fill" | "clear" | null>(null);

  async function handleSeed() {
    setLoading("fill");
    setStatus(null);
    try {
      const result = await seedData();
      const s = result.seeded;
      setStatus(
        `Seeded: ${s.assets} assets · ${s.categories} categories · ${s.locations} locations · ${s.assignments} assignments · ${s.maintenance_records} maintenance records · ${s.purchase_requests} purchase requests`
      );
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  }

  async function handleClear() {
    setLoading("clear");
    setStatus(null);
    try {
      await clearData();
      setStatus("All data cleared successfully.");
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-6">
      <p className="text-sm font-semibold text-emerald-800 mb-1">Demo Data Controls</p>
      <p className="text-xs text-emerald-600 mb-4">
        Populate with realistic IT assets, assignments, and procurement data — or wipe everything for a clean state.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSeed}
          disabled={loading !== null}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading === "fill" ? "Seeding…" : "Fill with Demo Data"}
        </button>
        <button
          onClick={handleClear}
          disabled={loading !== null}
          className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading === "clear" ? "Clearing…" : "Clear All Data"}
        </button>
      </div>
      {status && (
        <p className="mt-3 text-xs text-emerald-700 bg-white border border-emerald-100 rounded-lg px-3 py-2">
          {status}
        </p>
      )}
    </div>
  );
}
