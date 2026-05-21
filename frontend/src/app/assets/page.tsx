"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAssets, deleteAsset, type Asset } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import AssetForm from "@/components/AssetForm";
import { Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | undefined>();

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function load() {
    setLoading(true);
    try {
      const res = await listAssets({
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
        asset_type: typeFilter || undefined,
      });
      setAssets(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, search, statusFilter, typeFilter]); // eslint-disable-line

  function openAdd() {
    setEditAsset(undefined);
    setShowForm(true);
  }

  function openEdit(asset: Asset) {
    setEditAsset(asset);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset?")) return;
    await deleteAsset(id);
    load();
  }

  function handleSaved(_asset: Asset) {
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assets</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Asset
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search name, tag, serial…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">All Statuses</option>
          {["active", "inactive", "maintenance", "disposed", "lost"].map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">All Types</option>
          {["hardware", "software", "license", "other"].map((t) => (
            <option key={t} value={t} className="capitalize">{t}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          ) : assets.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              No assets found.{" "}
              <button onClick={openAdd} className="text-emerald-600 hover:underline">Add one?</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase">
                    <th className="text-left py-2 px-4">Asset</th>
                    <th className="text-left py-2 px-4">Type</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Location</th>
                    <th className="text-left py-2 px-4">Assigned To</th>
                    <th className="text-left py-2 px-4">Warranty</th>
                    <th className="text-right py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4">
                        <Link href={`/assets/${asset.id}`} className="font-medium text-slate-800 hover:text-emerald-600">
                          {asset.name}
                        </Link>
                        <div className="text-xs text-slate-400">{asset.asset_tag}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_COLORS[asset.asset_type] ?? ""}`}>
                          {asset.asset_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[asset.status] ?? ""}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {asset.location?.name ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {asset.assigned_to ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {asset.warranty_expiry ? (
                          <span className={
                            new Date(asset.warranty_expiry) < new Date(Date.now() + 30 * 86400000)
                              ? "text-red-600 font-medium"
                              : ""
                          }>
                            {asset.warranty_expiry}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(asset)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(asset.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-semibold mb-4">{editAsset ? "Edit Asset" : "Add Asset"}</h2>
            <AssetForm
              asset={editAsset}
              onSaved={handleSaved}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
