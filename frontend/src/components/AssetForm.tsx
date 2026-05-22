"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import {
  type Asset,
  type AssetType,
  type AssetStatus,
  type Category,
  type Location,
  createAsset,
  updateAsset,
  listCategories,
  listLocations,
} from "@/lib/api";

interface Props {
  asset?: Asset;
  onSaved: (asset: Asset) => void;
  onCancel: () => void;
}

const ASSET_TYPES: AssetType[] = ["hardware", "software", "license", "other"];
const ASSET_STATUSES: AssetStatus[] = ["active", "inactive", "maintenance", "disposed", "lost"];

export default function AssetForm({ asset, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    name: asset?.name ?? "",
    asset_tag: asset?.asset_tag ?? "",
    serial_number: asset?.serial_number ?? "",
    asset_type: (asset?.asset_type ?? "hardware") as AssetType,
    status: (asset?.status ?? "active") as AssetStatus,
    category_id: asset?.category_id ?? "",
    location_id: asset?.location_id ?? "",
    assigned_to: asset?.assigned_to ?? "",
    purchase_date: asset?.purchase_date ?? "",
    purchase_price: asset?.purchase_price != null ? String(asset.purchase_price) : "",
    warranty_expiry: asset?.warranty_expiry ?? "",
    notes: asset?.notes ?? "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setError("Could not load categories"));
    listLocations().then(setLocations).catch(() => setError("Could not load locations"));
  }, []);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.asset_tag) {
      setError("Name and Asset Tag are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        asset_tag: form.asset_tag,
        asset_type: form.asset_type,
        status: form.status,
        serial_number: form.serial_number || null,
        category_id: form.category_id || null,
        location_id: form.location_id || null,
        assigned_to: form.assigned_to || null,
        purchase_date: form.purchase_date || null,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        warranty_expiry: form.warranty_expiry || null,
        notes: form.notes || null,
      };
      const saved = asset
        ? await updateAsset(asset.id, payload)
        : await createAsset(payload);
      onSaved(saved);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="MacBook Pro M3" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="asset_tag">Asset Tag *</Label>
          <Input id="asset_tag" value={form.asset_tag} onChange={(e) => set("asset_tag", e.target.value)} placeholder="ASSET-001" required />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <select
            value={form.asset_type}
            onChange={(e) => set("asset_type", e.target.value)}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <select
            value={form.category_id}
            onChange={(e) => set("category_id", e.target.value)}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Location</Label>
          <select
            value={form.location_id}
            onChange={(e) => set("location_id", e.target.value)}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">— None —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="serial">Serial Number</Label>
          <Input id="serial" value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} placeholder="SN-XXXXX" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="assigned_to">Assigned To</Label>
          <Input id="assigned_to" value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} placeholder="alice@company.com" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="purchase_date">Purchase Date</Label>
          <Input id="purchase_date" type="date" value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="purchase_price">Purchase Price ($)</Label>
          <Input id="purchase_price" type="number" step="0.01" min="0" value={form.purchase_price} onChange={(e) => set("purchase_price", e.target.value)} placeholder="1299.00" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
          <Input id="warranty_expiry" type="date" value={form.warranty_expiry} onChange={(e) => set("warranty_expiry", e.target.value)} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any notes…" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : asset ? "Save Changes" : "Create Asset"}
        </Button>
      </div>
    </form>
  );
}
