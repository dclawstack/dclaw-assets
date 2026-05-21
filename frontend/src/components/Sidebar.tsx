"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Tag,
  MapPin,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/locations", label: "Locations", icon: MapPin },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-slate-900 text-white flex flex-col z-10">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-700">
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "#10B981" }}>
          <Package className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold leading-none">DClaw Assets</div>
          <div className="text-xs text-slate-400 mt-0.5">IT Management</div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-emerald-600 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-500">
        v1.0 · DClaw Stack
      </div>
    </aside>
  );
}
