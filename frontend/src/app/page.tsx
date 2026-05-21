"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats, type DashboardStats, type Asset } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Cpu,
  Code2,
  FileKey,
  Plus,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-600",
  maintenance: "bg-amber-100 text-amber-800",
  disposed: "bg-red-100 text-red-700",
  lost: "bg-red-100 text-red-700",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  hardware: <Cpu className="w-4 h-4" />,
  software: <Code2 className="w-4 h-4" />,
  license: <FileKey className="w-4 h-4" />,
  other: <Package className="w-4 h-4" />,
};

function StatCard({
  title,
  value,
  icon,
  color,
  sub,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
  return (
    <tr className="border-b last:border-b-0 hover:bg-slate-50 transition-colors">
      <td className="py-2 px-3">
        <Link href={`/assets/${asset.id}`} className="font-medium text-slate-800 hover:text-emerald-600">
          {asset.name}
        </Link>
        <div className="text-xs text-slate-400">{asset.asset_tag}</div>
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-1 text-sm text-slate-600">
          {TYPE_ICONS[asset.asset_type]}
          <span className="capitalize">{asset.asset_type}</span>
        </div>
      </td>
      <td className="py-2 px-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[asset.status] ?? ""}`}>
          {asset.status}
        </span>
      </td>
      <td className="py-2 px-3 text-sm text-slate-500">
        {asset.assigned_to ?? <span className="text-slate-300">—</span>}
      </td>
    </tr>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-sm">Failed to load: {error}</div>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">IT Asset Overview</p>
        </div>
        <Link href="/assets">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Asset
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Assets"
          value={s.total_assets}
          icon={<Package className="w-5 h-5 text-emerald-600" />}
          color="bg-emerald-50"
        />
        <StatCard
          title="Active"
          value={s.active_assets}
          icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="In Maintenance"
          value={s.maintenance_assets}
          icon={<Wrench className="w-5 h-5 text-amber-600" />}
          color="bg-amber-50"
        />
        <StatCard
          title="Warranty Expiring"
          value={s.warranty_expiring_30_days}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          color="bg-red-50"
          sub="within 30 days"
        />
      </div>

      {/* Type breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Hardware"
          value={s.hardware_count}
          icon={<Cpu className="w-5 h-5 text-violet-600" />}
          color="bg-violet-50"
        />
        <StatCard
          title="Software"
          value={s.software_count}
          icon={<Code2 className="w-5 h-5 text-sky-600" />}
          color="bg-sky-50"
        />
        <StatCard
          title="Licenses"
          value={s.license_count}
          icon={<FileKey className="w-5 h-5 text-orange-600" />}
          color="bg-orange-50"
        />
      </div>

      {/* Recent Assets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base">Recently Added</CardTitle>
          <Link href="/assets" className="text-sm text-emerald-600 hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {s.recently_added.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No assets yet.{" "}
              <Link href="/assets" className="text-emerald-600 hover:underline">
                Add your first asset
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase">
                  <th className="text-left py-2 px-3">Asset</th>
                  <th className="text-left py-2 px-3">Type</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {s.recently_added.map((a) => (
                  <AssetRow key={a.id} asset={a} />
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
