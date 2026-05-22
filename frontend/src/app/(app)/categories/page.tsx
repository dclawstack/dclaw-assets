"use client";

import { useEffect, useState } from "react";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

const PRESET_COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B",
  "#EF4444", "#EC4899", "#06B6D4", "#6B7280",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#10B981" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setCategories(await listCategories()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startAdd() {
    setEditId(null);
    setForm({ name: "", description: "", color: "#10B981" });
    setError(null);
    setAdding(true);
  }

  function startEdit(cat: Category) {
    setAdding(false);
    setEditId(cat.id);
    setForm({ name: cat.name, description: cat.description ?? "", color: cat.color });
    setError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setError(null);
    if (editId) {
      await updateCategory(editId, { name: form.name, description: form.description || null, color: form.color });
      setEditId(null);
    } else {
      try {
        await createCategory({ name: form.name, description: form.description || undefined, color: form.color });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Save failed");
        return;
      }
      setAdding(false);
    }
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    await deleteCategory(id);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500 mt-0.5">{categories.length} categories</p>
        </div>
        <Button onClick={startAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Laptops" autoFocus />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-slate-900 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <Input type="color" value={form.color} onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-7 p-0 border-0 cursor-pointer" />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Check className="w-4 h-4 mr-1" /> Save</Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          ) : categories.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              No categories yet. <button onClick={startAdd} className="text-emerald-600 hover:underline">Add one?</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase">
                  <th className="text-left py-2 px-4">Color</th>
                  <th className="text-left py-2 px-4">Name</th>
                  <th className="text-left py-2 px-4">Description</th>
                  <th className="text-right py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  editId === cat.id ? (
                    <tr key={cat.id} className="border-b bg-emerald-50">
                      <td className="py-2 px-4">
                        <Input type="color" value={form.color} onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-7 p-0 border-0 cursor-pointer" />
                      </td>
                      <td className="py-2 px-4">
                        <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                      </td>
                      <td className="py-2 px-4">
                        <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" onClick={handleSave}><Check className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="outline" onClick={() => setEditId(null)}><X className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={cat.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-2.5 px-4">
                        <span className="inline-block w-5 h-5 rounded-full" style={{ backgroundColor: cat.color }} />
                      </td>
                      <td className="py-2.5 px-4 font-medium">{cat.name}</td>
                      <td className="py-2.5 px-4 text-slate-500">{cat.description ?? <span className="text-slate-300">—</span>}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(cat)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
