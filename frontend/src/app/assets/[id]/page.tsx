"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAsset,
  deleteAsset,
  getAssignments,
  getMaintenance,
  getDepreciation,
  assignAsset,
  returnAsset,
  type Asset,
  type Assignment,
  type MaintenanceRecord,
  type DepreciationResponse,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AssetForm from "@/components/AssetForm";
import {
  ArrowLeft, Pencil, Trash2, User, Wrench, TrendingDown,
  CheckCircle2, Clock, AlertTriangle, Package,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-600",
  maintenance: "bg-amber-100 text-amber-800",
  disposed: "bg-red-100 text-red-700",
  lost: "bg-red-100 text-red-700",
};

const TYPE_COLORS: Record<string, string> = {
  hardware: "bg-violet-100 text-violet-800",
  software: "bg-sky-100 text-sky-800",
  license: "bg-orange-100 text-orange-800",
  other: "bg-slate-100 text-slate-600",
};

function WarrantyBanner({ expiry }: { expiry: string | null }) {
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0)
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Warranty expired {Math.abs(days)} days ago ({expiry})
      </div>
    );
  if (days <= 30)
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Warranty expires in {days} days ({expiry})
      </div>
    );
  if (days <= 90)
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
        <Clock className="w-4 h-4 shrink-0" />
        Warranty expires in {days} days ({expiry})
      </div>
    );
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      Warranty valid until {expiry} ({days} days remaining)
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b last:border-0 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium text-right max-w-[60%]">{value ?? "—"}</span>
    </div>
  );
}

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [depreciation, setDepreciation] = useState<DepreciationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Assign form state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignName, setAssignName] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  async function loadAll(assetId: string) {
    try {
      const [a, asgn, maint] = await Promise.all([
        getAsset(assetId),
        getAssignments(assetId),
        getMaintenance(assetId),
      ]);
      setAsset(a);
      setAssignments(asgn);
      setMaintenance(maint);
      if (a.purchase_price && a.purchase_date) {
        getDepreciation(assetId).then(setDepreciation).catch(() => {});
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load asset");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (id) loadAll(id); }, [id]);

  async function handleDelete() {
    if (!confirm(`Delete asset "${asset?.name}"? This cannot be undone.`)) return;
    await deleteAsset(id);
    router.push("/assets");
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignName.trim()) return;
    setAssignLoading(true);
    try {
      await assignAsset(id, { assigned_to_name: assignName, assigned_to_email: assignEmail || undefined });
      setShowAssignForm(false);
      setAssignName("");
      setAssignEmail("");
      loadAll(id);
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleReturn() {
    if (!confirm("Mark this asset as returned?")) return;
    await returnAsset(id);
    loadAll(id);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;
  if (error || !asset) return <div className="flex items-center justify-center h-64 text-red-500">{error ?? "Asset not found"}</div>;

  const activeAssignment = assignments.find((a) => !a.returned_at);

  if (editing) {
    return (
      <div className="space-y-5 max-w-2xl">
        <Button variant="ghost" onClick={() => setEditing(false)} className="gap-1 text-slate-500">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <h1 className="text-xl font-bold">Edit Asset</h1>
        <AssetForm asset={asset} onSaved={(updated) => { setAsset(updated); setEditing(false); }} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/assets">
            <Button variant="ghost" size="sm" className="gap-1 text-slate-500 mt-0.5">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{asset.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-400 font-mono">{asset.asset_tag}</span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_COLORS[asset.asset_type] ?? ""}`}>{asset.asset_type}</span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[asset.status] ?? ""}`}>{asset.status}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </div>

      <WarrantyBanner expiry={asset.warranty_expiry} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Asset Info */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2"><Package className="w-4 h-4" /> Asset Details</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <InfoRow label="Name" value={asset.name} />
            <InfoRow label="Tag" value={<span className="font-mono">{asset.asset_tag}</span>} />
            <InfoRow label="Serial" value={asset.serial_number} />
            <InfoRow label="Category" value={asset.category?.name ?? null} />
            <InfoRow label="Location" value={asset.location?.name ?? null} />
            <InfoRow label="Assigned To" value={asset.assigned_to} />
            <InfoRow label="Purchase Date" value={asset.purchase_date} />
            <InfoRow label="Purchase Price" value={asset.purchase_price != null ? `$${asset.purchase_price.toFixed(2)}` : null} />
            <InfoRow label="Warranty Expiry" value={asset.warranty_expiry} />
            {asset.notes && <InfoRow label="Notes" value={asset.notes} />}
          </CardContent>
        </Card>

        {/* Current Assignment + Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> Assignment</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {activeAssignment ? (
                <>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <div className="font-medium text-emerald-800">{activeAssignment.assigned_to_name}</div>
                    {activeAssignment.assigned_to_email && (
                      <div className="text-xs text-emerald-600">{activeAssignment.assigned_to_email}</div>
                    )}
                    <div className="text-xs text-slate-400 mt-1">
                      Since {new Date(activeAssignment.assigned_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleReturn} className="w-full">
                    Mark Returned
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-400">Not currently assigned</p>
                  {showAssignForm ? (
                    <form onSubmit={handleAssign} className="space-y-2">
                      <div>
                        <Label>Name *</Label>
                        <Input value={assignName} onChange={(e) => setAssignName(e.target.value)} placeholder="Full name" autoFocus required />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={assignEmail} onChange={(e) => setAssignEmail(e.target.value)} placeholder="user@company.com" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" type="submit" disabled={assignLoading}>{assignLoading ? "Assigning…" : "Assign"}</Button>
                        <Button size="sm" variant="outline" type="button" onClick={() => setShowAssignForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setShowAssignForm(true)} className="w-full">
                      Assign Asset
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Depreciation */}
          {depreciation && (
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="w-4 h-4" /> Depreciation</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <InfoRow label="Purchase Price" value={`$${depreciation.purchase_price.toFixed(2)}`} />
                <InfoRow label="Age" value={`${depreciation.age_years} years`} />
                <InfoRow label="Annual Depreciation" value={`$${depreciation.annual_depreciation.toFixed(2)}`} />
                <InfoRow label="Accumulated" value={`$${depreciation.accumulated_depreciation.toFixed(2)}`} />
                <InfoRow
                  label="Book Value"
                  value={
                    <span className={depreciation.fully_depreciated ? "text-red-600" : "text-emerald-700"}>
                      ${depreciation.book_value.toFixed(2)}
                      {depreciation.fully_depreciated && " (fully depreciated)"}
                    </span>
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Assignment History */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> Assignment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {assignments.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-400">No assignment history.</p>
          ) : (
            <div className="divide-y">
              {assignments.map((a) => (
                <div key={a.id} className="px-4 py-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{a.assigned_to_name}</div>
                    {a.assigned_to_email && <div className="text-xs text-slate-400">{a.assigned_to_email}</div>}
                    {a.notes && <div className="text-xs text-slate-500 mt-0.5 italic">{a.notes}</div>}
                  </div>
                  <div className="text-right text-xs text-slate-400 space-y-0.5">
                    <div>From: {new Date(a.assigned_at).toLocaleDateString()}</div>
                    {a.returned_at ? (
                      <div>To: {new Date(a.returned_at).toLocaleDateString()}</div>
                    ) : (
                      <Badge variant="secondary" className="text-emerald-700 bg-emerald-50">Active</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Records */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><Wrench className="w-4 h-4" /> Maintenance History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {maintenance.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-400">No maintenance records.</p>
          ) : (
            <div className="divide-y">
              {maintenance.map((m) => (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-amber-100 text-amber-800 mr-2">
                        {m.maintenance_type}
                      </span>
                      <span className="text-sm font-medium">{m.description}</span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(m.performed_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-slate-500">
                    {m.performed_by && <span>By: {m.performed_by}</span>}
                    {m.cost != null && <span>Cost: ${m.cost.toFixed(2)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
