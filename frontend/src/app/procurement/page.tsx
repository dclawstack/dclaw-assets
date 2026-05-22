"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listPurchaseRequests,
  createPurchaseRequest,
  transitionPurchaseRequest,
  deletePurchaseRequest,
  type PurchaseRequest,
  type ProcurementStatus,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Plus, ChevronRight, Trash2, CheckCircle2, Package } from "lucide-react";

const STATUS_COLORS: Record<ProcurementStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  ordered: "bg-violet-100 text-violet-800",
  received: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-500",
};

const NEXT_STATUS: Record<ProcurementStatus, ProcurementStatus | null> = {
  pending: "approved",
  approved: "ordered",
  ordered: "received",
  received: null,
  cancelled: null,
};

const NEXT_LABEL: Record<ProcurementStatus, string> = {
  pending: "Approve",
  approved: "Mark Ordered",
  ordered: "Mark Received",
  received: "",
  cancelled: "",
};

export default function ProcurementPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    title: "",
    requested_by: "",
    vendor: "",
    estimated_cost: "",
    quantity: "1",
    description: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPurchaseRequests(statusFilter || undefined);
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.requested_by) { setError("Title and requester are required"); return; }
    setSaving(true);
    setError(null);
    try {
      await createPurchaseRequest({
        title: form.title,
        requested_by: form.requested_by,
        vendor: form.vendor || undefined,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : undefined,
        quantity: parseInt(form.quantity) || 1,
        description: form.description || undefined,
        notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm({ title: "", requested_by: "", vendor: "", estimated_cost: "", quantity: "1", description: "", notes: "" });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create request");
    } finally {
      setSaving(false);
    }
  }

  async function handleTransition(id: string, next: ProcurementStatus) {
    try {
      await transitionPurchaseRequest(id, next);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Transition failed");
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this purchase request?")) return;
    try {
      await transitionPurchaseRequest(id, "cancelled");
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to cancel");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this purchase request? This cannot be undone.")) return;
    try {
      await deletePurchaseRequest(id);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    ordered: requests.filter((r) => r.status === "ordered").length,
    received: requests.filter((r) => r.status === "received").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Procurement</h1>
          <p className="text-sm text-slate-500 mt-0.5">Purchase request workflow</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-4 gap-3">
        {(["pending", "approved", "ordered", "received"] as const).map((s) => (
          <Card key={s} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === s ? "" : s)}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-500 capitalize">{s}</p>
              <p className="text-2xl font-bold mt-0.5">{stats[s]}</p>
              {statusFilter === s && <p className="text-xs text-emerald-600 mt-1">Filtered</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">All Statuses</option>
          {["pending", "approved", "ordered", "received", "cancelled"].map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        {statusFilter && (
          <button onClick={() => setStatusFilter("")} className="text-sm text-slate-500 hover:text-slate-800 underline">
            Clear filter
          </button>
        )}
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No purchase requests yet.{" "}
          <button onClick={() => setShowForm(true)} className="text-emerald-600 hover:underline">Create one?</button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((pr) => {
            const next = NEXT_STATUS[pr.status];
            return (
              <Card key={pr.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{pr.title}</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[pr.status]}`}>
                          {pr.status}
                        </span>
                        <span className="text-xs text-slate-400">Qty: {pr.quantity}</span>
                        {pr.estimated_cost != null && (
                          <span className="text-xs text-slate-400">${pr.estimated_cost.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        Requested by <span className="font-medium">{pr.requested_by}</span>
                        {pr.vendor && <> · Vendor: {pr.vendor}</>}
                      </div>
                      {pr.description && (
                        <p className="text-sm text-slate-600 mt-1">{pr.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {next && (
                        <Button size="sm" onClick={() => handleTransition(pr.id, next)} className="gap-1 text-xs">
                          <CheckCircle2 className="w-3 h-3" /> {NEXT_LABEL[pr.status]}
                        </Button>
                      )}
                      {pr.status !== "received" && pr.status !== "cancelled" && (
                        <Button size="sm" variant="outline" onClick={() => handleCancel(pr.id)} className="text-xs">
                          Cancel
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(pr.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">New Purchase Request</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="MacBook Pro M3 for Design Team" required />
                </div>
                <div className="space-y-1">
                  <Label>Requested By *</Label>
                  <Input value={form.requested_by} onChange={(e) => setForm((f) => ({ ...f, requested_by: e.target.value }))} placeholder="Alice Smith" required />
                </div>
                <div className="space-y-1">
                  <Label>Vendor</Label>
                  <Input value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} placeholder="Apple, Dell, etc." />
                </div>
                <div className="space-y-1">
                  <Label>Estimated Cost ($)</Label>
                  <Input type="number" step="0.01" min="0" value={form.estimated_cost} onChange={(e) => setForm((f) => ({ ...f, estimated_cost: e.target.value }))} placeholder="1299.00" />
                </div>
                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Why is this needed?" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(null); }}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create Request"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
