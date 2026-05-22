"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRefreshPredictions, type RefreshPrediction } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertTriangle, CheckCircle2, Activity } from "lucide-react";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-red-100 text-red-800" :
    score >= 40 ? "bg-amber-100 text-amber-800" :
    "bg-emerald-100 text-emerald-800";
  const label = score >= 70 ? "Urgent" : score >= 40 ? "Review" : "OK";
  return (
    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl font-bold shrink-0 ${color}`}>
      <span className="text-xl">{score}</span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

export default function RefreshPredictionsPage() {
  const [predictions, setPredictions] = useState<RefreshPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRefreshPredictions()
      .then(setPredictions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const urgent = predictions.filter((p) => p.refresh_score >= 70);
  const review = predictions.filter((p) => p.refresh_score >= 40 && p.refresh_score < 70);
  const ok = predictions.filter((p) => p.refresh_score < 40);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-500">{error}</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Refresh Predictions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Hardware assets scored 0-100 by refresh urgency</p>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No hardware assets to score. <Link href="/assets" className="text-emerald-600 hover:underline">Add hardware assets</Link>.
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-red-100">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-slate-500">Urgent (&ge;70)</p>
                </div>
                <p className="text-2xl font-bold text-red-600 mt-1">{urgent.length}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-100">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-500" />
                  <p className="text-sm text-slate-500">Review (40-69)</p>
                </div>
                <p className="text-2xl font-bold text-amber-600 mt-1">{review.length}</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-100">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <p className="text-sm text-slate-500">OK (&lt;40)</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{ok.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Asset list */}
          <div className="space-y-3">
            {predictions.map((p) => (
              <Card key={p.asset_id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <ScoreBadge score={p.refresh_score} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/assets/${p.asset_id}`} className="font-semibold text-slate-900 hover:text-emerald-600">
                          {p.name}
                        </Link>
                        <span className="text-xs font-mono text-slate-400">{p.asset_tag}</span>
                      </div>
                      {p.assigned_to && (
                        <p className="text-sm text-slate-500 mt-0.5">Assigned to: {p.assigned_to}</p>
                      )}
                      {p.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.reasons.map((r, i) => (
                            <span key={i} className="inline-block px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
