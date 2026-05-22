"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { listAssets, deleteAsset, importAssets, getExportUrl, type Asset, type ImportResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import AssetForm from "@/components/AssetForm";
import { Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight, Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";

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

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
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
  }, [page, search, statusFilter, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

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
    try {
      await deleteAsset(id);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete asset");
    }
  }

  function handleSaved(_asset: Asset) {
    setShowForm(false);
    load();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const result = await importAssets(file);
      setImportResult(result);
      if (result.created > 0) load();
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assets</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total</p>
        </div>
        <div className="flex gap-2">
          <a href={getExportUrl()} download="assets.csv">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </a>
          <Button variant="outline" className="gap-2" onClick={() => { setShowImport(true); setImportResult(null); }}>
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Asset
          </Button>
        </div>
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

      {/* Import CSV Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-1">Import Assets from CSV</h2>
            <p className="text-sm text-slate-500 mb-4">
              Upload a CSV with headers:{" "}
              <span className="font-mono text-xs bg-slate-100 px-1 rounded">
                asset_tag, name, asset_type, status, serial_number, assigned_to, purchase_date, purchase_price, warranty_expiry, notes
              </span>
            </p>

            <div className="mb-4">
              <a
                href={`data:text/csv;charset=utf-8,asset_tag,name,serial_number,asset_type,status,assigned_to,purchase_date,purchase_price,warranty_expiry,notes%0AASSET-001,Sample Laptop,SN12345,hardware,active,,2023-01-15,1200,,`}
                download="sample_assets.csv"
                className="text-sm text-emerald-600 hover:underline"
              >
                Download sample CSV
              </a>
            </div>

            {!importResult ? (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  disabled={importLoading}
                  className="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {importLoading && <p className="text-sm text-slate-400">Importing…</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${importResult.created > 0 ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600"}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span><strong>{importResult.created}</strong> asset{importResult.created !== 1 ? "s" : ""} imported</span>
                </div>
                {importResult.skipped > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span><strong>{importResult.skipped}</strong> row{importResult.skipped !== 1 ? "s" : ""} skipped</span>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.map((e, i) => (
                      <div key={i}>Row {e.row}: {e.reason}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => { setShowImport(false); setImportResult(null); }}>
                {importResult ? "Close" : "Cancel"}
              </Button>
              {importResult && (
                <Button variant="outline" onClick={() => { setImportResult(null); }}>
                  Import Another
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
