"use client";

import { useState } from "react";
import { getComplianceReport, getLicenseWaste, type LicenseWasteItem } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, DollarSign, Download, AlertTriangle } from "lucide-react";

export default function ReportsPage() {
  // Compliance report
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceResult, setComplianceResult] = useState<Record<string, unknown> | null>(null);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  // License waste
  const [threshold, setThreshold] = useState("50");
  const [wasteLoading, setWasteLoading] = useState(false);
  const [wasteItems, setWasteItems] = useState<LicenseWasteItem[] | null>(null);
  const [wasteError, setWasteError] = useState<string | null>(null);

  async function handleCompliance(e: React.FormEvent) {
    e.preventDefault();
    if (!fromDate || !toDate) return;
    setComplianceLoading(true);
    setComplianceError(null);
    try {
      const data = await getComplianceReport(fromDate, toDate) as Record<string, unknown>;
      setComplianceResult(data);
    } catch (e: unknown) {
      setComplianceError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setComplianceLoading(false);
    }
  }

  function downloadComplianceJson() {
    if (!complianceResult) return;
    const blob = new Blob([JSON.stringify(complianceResult, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-${fromDate}-to-${toDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLicenseWaste() {
    setWasteLoading(true);
    setWasteError(null);
    try {
      const data = await getLicenseWaste(parseInt(threshold) || 50);
      setWasteItems(data);
    } catch (e: unknown) {
      setWasteError(e instanceof Error ? e.message : "Failed to load license waste");
    } finally {
      setWasteLoading(false);
    }
  }

  const summary = complianceResult?.summary as Record<string, number> | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Compliance reports and license optimization</p>
      </div>

      {/* Compliance Report */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> SOX/ISO Compliance Report
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <p className="text-sm text-slate-500">
            Generate a full audit report for a date range — all assets, assignments, maintenance, and disposals.
          </p>
          <form onSubmit={handleCompliance} className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
            </div>
            <Button type="submit" disabled={complianceLoading}>
              {complianceLoading ? "Generating…" : "Generate Report"}
            </Button>
          </form>

          {complianceError && <p className="text-sm text-red-500">{complianceError}</p>}

          {complianceResult && summary && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(summary).map(([key, val]) => (
                  <div key={key} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 capitalize">{key.replace(/_/g, " ")}</p>
                    <p className="text-xl font-bold mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={downloadComplianceJson} className="gap-2">
                <Download className="w-3.5 h-3.5" /> Download JSON
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* License Waste */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> License Waste Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <p className="text-sm text-slate-500">
            Find software and license assets with utilization below the threshold.
          </p>
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label>Utilization Threshold (%)</Label>
              <Input
                type="number" min="0" max="100" value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-32"
              />
            </div>
            <Button onClick={handleLicenseWaste} disabled={wasteLoading}>
              {wasteLoading ? "Loading…" : "Scan for Waste"}
            </Button>
          </div>

          {wasteError && <p className="text-sm text-red-500">{wasteError}</p>}

          {wasteItems !== null && (
            wasteItems.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm">
                No underutilized licenses found at {threshold}% threshold.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  <AlertTriangle className="w-4 h-4 inline text-amber-500 mr-1" />
                  {wasteItems.length} underutilized license{wasteItems.length !== 1 ? "s" : ""} found
                </p>
                <div className="divide-y border rounded-lg overflow-hidden">
                  {wasteItems.map((item) => (
                    <div key={item.asset_id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-slate-400 font-mono ml-2">{item.asset_tag}</span>
                        <span className="text-xs text-slate-400 ml-2 capitalize">({item.asset_type})</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {item.purchase_price != null && <span>${item.purchase_price.toFixed(2)}</span>}
                        <span className={item.is_assigned ? "text-emerald-600" : "text-slate-400"}>
                          {item.is_assigned ? "Assigned" : "Unassigned"}
                        </span>
                        <span className={`font-semibold ${item.utilization_pct < 50 ? "text-red-600" : "text-amber-600"}`}>
                          {item.utilization_pct}% utilization
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
