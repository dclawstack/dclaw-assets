"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Asset {
  id: string;
  name: string;
  asset_type: string;
  assigned_to: string;
  warranty_expiry: string;
  deprecation_status: string;
  created_at: string
}

export default function Dashboard() {
  const [assetName, setAssetName] = useState("");
const [assetType, setAssetType] = useState("Hardware");
  const [asset, setAsset] = useState<Asset | null>(null);
  const [extraData, setExtraData] = useState<any>(null);
const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!assetName || !assetType) return;
    setLoading(true);
    try {
      const res = await fetch("/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        assetName: assetName,
        asset_type: assetType,
        }),
      });
      const data = await res.json();
      setAsset(data);
      const extraRes = await fetch(`/assets/${data.id}/history`);
      const extraData = await extraRes.json();
      setExtraData(extraData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Package className="w-8 h-8" style={{ color: "#EAB308" }} />
        <div>
          <h1 className="text-2xl font-bold">DClaw Assets</h1>
          <p className="text-sm text-slate-500">Hardware and software asset management</p>
        </div>
        <Badge className="ml-auto" style={{ backgroundColor: "#EAB308" }}>IT</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Track Asset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset name</label>
              <Input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="e.g. MacBook Pro M3" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand">
                <option value="Hardware">Hardware</option><option value="Software">Software</option><option value="License">License</option>
              </select>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={loading || !assetName || !assetType}>
            {loading ? "Processing..." : "Track Asset"}
          </Button>
        </CardContent>
      </Card>

      {asset && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Card>
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>ID:</strong> {asset.id}</p>
              <p><strong>Name:</strong> {asset.name}</p>
              <p><strong>Type:</strong> {asset.asset_type}</p>
              <p><strong>Assigned To:</strong> {asset.assigned_to}</p>
              <p><strong>Warranty Expiry:</strong> {asset.warranty_expiry}</p>
              <p><strong>Deprecation Status:</strong> {asset.deprecation_status}</p>
              <p><strong>Created:</strong> {new Date(asset.created_at).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {extraData?.map((rec: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm">{rec.date} — {rec.action}</span>
                    <Badge variant="secondary">{rec.user}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
