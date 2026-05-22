const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new ApiError(`API error ${response.status}: ${error}`, response.status);
  }
  return response.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AssetType = "hardware" | "software" | "license" | "other";
export type AssetStatus = "active" | "inactive" | "maintenance" | "disposed" | "lost";
export type MaintenanceType = "repair" | "upgrade" | "inspection" | "cleaning" | "other";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  building: string | null;
  floor: string | null;
  room: string | null;
}

export interface Asset {
  id: string;
  name: string;
  asset_tag: string;
  serial_number: string | null;
  asset_type: AssetType;
  status: AssetStatus;
  category_id: string | null;
  location_id: string | null;
  assigned_to: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expiry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category: Category | null;
  location: Location | null;
}

export interface AssetListResponse {
  items: Asset[];
  total: number;
  page: number;
  page_size: number;
}

export interface DashboardStats {
  total_assets: number;
  active_assets: number;
  maintenance_assets: number;
  disposed_assets: number;
  hardware_count: number;
  software_count: number;
  license_count: number;
  warranty_expiring_30_days: number;
  recently_added: Asset[];
}

export interface Assignment {
  id: string;
  asset_id: string;
  assigned_to_name: string;
  assigned_to_email: string | null;
  assigned_at: string;
  returned_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  asset_id: string;
  maintenance_type: MaintenanceType;
  description: string;
  performed_by: string | null;
  cost: number | null;
  performed_at: string;
  created_at: string;
}

export interface DepreciationResponse {
  asset_id: string;
  asset_name: string;
  purchase_price: number;
  purchase_date: string;
  age_years: number;
  useful_life_years: number;
  annual_depreciation: number;
  accumulated_depreciation: number;
  book_value: number;
  fully_depreciated: boolean;
}

// ── Health ─────────────────────────────────────────────────────────────────

export async function getHealth() {
  return fetchJson<{ status: string }>("/health/");
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchJson<DashboardStats>("/api/v1/dashboard/");
}

// ── Assets ─────────────────────────────────────────────────────────────────

export interface ListAssetsParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  asset_type?: string;
  category_id?: string;
}

export async function listAssets(params: ListAssetsParams = {}): Promise<AssetListResponse> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  if (params.asset_type) q.set("asset_type", params.asset_type);
  if (params.category_id) q.set("category_id", params.category_id);
  return fetchJson<AssetListResponse>(`/api/v1/assets/?${q}`);
}

export async function getAsset(id: string): Promise<Asset> {
  return fetchJson<Asset>(`/api/v1/assets/${id}`);
}

export async function createAsset(data: Partial<Asset>): Promise<Asset> {
  return fetchJson<Asset>("/api/v1/assets/", { method: "POST", body: JSON.stringify(data) });
}

export async function updateAsset(id: string, data: Partial<Asset>): Promise<Asset> {
  return fetchJson<Asset>(`/api/v1/assets/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteAsset(id: string): Promise<void> {
  await fetchJson<void>(`/api/v1/assets/${id}`, { method: "DELETE" });
}

export async function getExpiringAssets(days = 30): Promise<Asset[]> {
  return fetchJson<Asset[]>(`/api/v1/assets/expiring?days=${days}`);
}

export async function assignAsset(
  id: string,
  data: { assigned_to_name: string; assigned_to_email?: string; notes?: string }
): Promise<Assignment> {
  return fetchJson<Assignment>(`/api/v1/assets/${id}/assign`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function returnAsset(id: string): Promise<Assignment> {
  return fetchJson<Assignment>(`/api/v1/assets/${id}/return`, { method: "POST" });
}

export async function getAssignments(id: string): Promise<Assignment[]> {
  return fetchJson<Assignment[]>(`/api/v1/assets/${id}/assignments`);
}

export async function getMaintenance(id: string): Promise<MaintenanceRecord[]> {
  return fetchJson<MaintenanceRecord[]>(`/api/v1/assets/${id}/maintenance`);
}

export async function logMaintenance(
  id: string,
  data: { maintenance_type: MaintenanceType; description: string; performed_by?: string; cost?: number }
): Promise<MaintenanceRecord> {
  return fetchJson<MaintenanceRecord>(`/api/v1/assets/${id}/maintenance`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getDepreciation(id: string, useful_life_years = 3): Promise<DepreciationResponse> {
  return fetchJson<DepreciationResponse>(
    `/api/v1/assets/${id}/depreciation?useful_life_years=${useful_life_years}`
  );
}

export function getExportUrl(): string {
  return `${API_BASE}/api/v1/assets/export`;
}

export function getQrCodeUrl(id: string): string {
  const base = encodeURIComponent(window.location.origin);
  return `${API_BASE}/api/v1/assets/${id}/qr?base_url=${base}`;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export async function importAssets(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);
  const url = `${API_BASE}/api/v1/assets/import`;
  const response = await fetch(url, { method: "POST", body: form });
  if (!response.ok) {
    const error = await response.text();
    throw new ApiError(`API error ${response.status}: ${error}`, response.status);
  }
  return response.json();
}

// ── Categories ─────────────────────────────────────────────────────────────

export async function listCategories(): Promise<Category[]> {
  return fetchJson<Category[]>("/api/v1/categories/");
}

export async function createCategory(data: { name: string; description?: string; color?: string }): Promise<Category> {
  return fetchJson<Category>("/api/v1/categories/", { method: "POST", body: JSON.stringify(data) });
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<Category> {
  return fetchJson<Category>(`/api/v1/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await fetchJson<void>(`/api/v1/categories/${id}`, { method: "DELETE" });
}

// ── Locations ──────────────────────────────────────────────────────────────

export async function listLocations(): Promise<Location[]> {
  return fetchJson<Location[]>("/api/v1/locations/");
}

export async function createLocation(data: Partial<Location>): Promise<Location> {
  return fetchJson<Location>("/api/v1/locations/", { method: "POST", body: JSON.stringify(data) });
}

export async function updateLocation(id: string, data: Partial<Location>): Promise<Location> {
  return fetchJson<Location>(`/api/v1/locations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteLocation(id: string): Promise<void> {
  await fetchJson<void>(`/api/v1/locations/${id}`, { method: "DELETE" });
}

// ── Compliance Report ──────────────────────────────────────────────────────

export async function getComplianceReport(fromDate: string, toDate: string) {
  return fetchJson<unknown>(`/api/v1/reports/compliance?from=${fromDate}&to=${toDate}`);
}

// ── Procurement ────────────────────────────────────────────────────────────

export type ProcurementStatus = "pending" | "approved" | "ordered" | "received" | "cancelled";

export interface PurchaseRequest {
  id: string;
  title: string;
  description: string | null;
  requested_by: string;
  vendor: string | null;
  estimated_cost: number | null;
  quantity: number;
  status: ProcurementStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function listPurchaseRequests(status?: string): Promise<PurchaseRequest[]> {
  const q = status ? `?status=${status}` : "";
  return fetchJson<PurchaseRequest[]>(`/api/v1/procurement/${q}`);
}

export async function createPurchaseRequest(data: Partial<PurchaseRequest>): Promise<PurchaseRequest> {
  return fetchJson<PurchaseRequest>("/api/v1/procurement/", { method: "POST", body: JSON.stringify(data) });
}

export async function transitionPurchaseRequest(id: string, newStatus: ProcurementStatus): Promise<PurchaseRequest> {
  return fetchJson<PurchaseRequest>(`/api/v1/procurement/${id}/transition`, {
    method: "POST",
    body: JSON.stringify({ new_status: newStatus }),
  });
}

export async function deletePurchaseRequest(id: string): Promise<void> {
  await fetchJson<void>(`/api/v1/procurement/${id}`, { method: "DELETE" });
}

// ── Refresh Predictions ────────────────────────────────────────────────────

export interface RefreshPrediction {
  asset_id: string;
  name: string;
  asset_tag: string;
  assigned_to: string | null;
  refresh_score: number;
  reasons: string[];
}

export async function getRefreshPredictions(): Promise<RefreshPrediction[]> {
  return fetchJson<RefreshPrediction[]>("/api/v1/assets/refresh-predictions");
}

// ── License Waste ──────────────────────────────────────────────────────────

export interface LicenseWasteItem {
  asset_id: string;
  name: string;
  asset_tag: string;
  asset_type: string;
  utilization_pct: number;
  is_assigned: boolean;
  purchase_price: number | null;
}

export async function getLicenseWaste(threshold = 50): Promise<LicenseWasteItem[]> {
  return fetchJson<LicenseWasteItem[]>(`/api/v1/assets/license-waste?threshold=${threshold}`);
}

// ── AI Copilot ─────────────────────────────────────────────────────────────

export interface CopilotResponse {
  reply: string;
  context_summary: string;
}

export async function copilotChat(message: string): Promise<CopilotResponse> {
  return fetchJson<CopilotResponse>("/api/v1/copilot/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// ── Seed / Clear ───────────────────────────────────────────────────────────

export const seedData = () =>
  fetchJson<{ seeded: Record<string, number> }>("/api/v1/seed", { method: "POST" });

export const clearData = () =>
  fetchJson<{ cleared: boolean }>("/api/v1/seed", { method: "DELETE" });

export { ApiError };
