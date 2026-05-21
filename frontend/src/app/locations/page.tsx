"use client";

import { useEffect, useState } from "react";
import {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  type Location,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Check, X, MapPin } from "lucide-react";

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", address: "", building: "", floor: "", room: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setLocations(await listLocations()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startAdd() {
    setEditId(null);
    setForm({ name: "", address: "", building: "", floor: "", room: "" });
    setError(null);
    setAdding(true);
  }

  function startEdit(loc: Location) {
    setAdding(false);
    setEditId(loc.id);
    setForm({
      name: loc.name,
      address: loc.address ?? "",
      building: loc.building ?? "",
      floor: loc.floor ?? "",
      room: loc.room ?? "",
    });
    setError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    const payload = {
      name: form.name,
      address: form.address || null,
      building: form.building || null,
      floor: form.floor || null,
      room: form.room || null,
    };
    setError(null);
    if (editId) {
      await updateLocation(editId, payload);
      setEditId(null);
    } else {
      try { await createLocation(payload); }
      catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); return; }
      setAdding(false);
    }
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this location?")) return;
    await deleteLocation(id);
    load();
  }

  const FormFields = () => (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1 col-span-2">
        <Label>Name *</Label>
        <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. HQ - Server Room" autoFocus />
      </div>
      <div className="space-y-1">
        <Label>Building</Label>
        <Input value={form.building} onChange={(e) => setForm(f => ({ ...f, building: e.target.value }))} placeholder="Main Building" />
      </div>
      <div className="space-y-1">
        <Label>Floor</Label>
        <Input value={form.floor} onChange={(e) => setForm(f => ({ ...f, floor: e.target.value }))} placeholder="3rd" />
      </div>
      <div className="space-y-1">
        <Label>Room</Label>
        <Input value={form.room} onChange={(e) => setForm(f => ({ ...f, room: e.target.value }))} placeholder="Server Room" />
      </div>
      <div className="space-y-1">
        <Label>Address</Label>
        <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St" />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Locations</h1>
          <p className="text-sm text-slate-500 mt-0.5">{locations.length} locations</p>
        </div>
        <Button onClick={startAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Location
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <FormFields />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Check className="w-4 h-4 mr-1" /> Save</Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : locations.length === 0 ? (
          <div className="col-span-3 py-10 text-center text-slate-400 text-sm">
            No locations yet. <button onClick={startAdd} className="text-emerald-600 hover:underline">Add one?</button>
          </div>
        ) : (
          locations.map((loc) => (
            editId === loc.id ? (
              <Card key={loc.id} className="border-emerald-300">
                <CardContent className="pt-4 space-y-3">
                  <FormFields />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave}><Check className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setEditId(null)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card key={loc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium text-slate-800">{loc.name}</div>
                        {(loc.building || loc.floor || loc.room) && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {[loc.building, loc.floor && `Floor ${loc.floor}`, loc.room].filter(Boolean).join(" · ")}
                          </div>
                        )}
                        {loc.address && <div className="text-xs text-slate-400 mt-0.5">{loc.address}</div>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(loc)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(loc.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ))
        )}
      </div>
    </div>
  );
}
