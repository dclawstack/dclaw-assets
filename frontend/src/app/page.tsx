import Link from "next/link";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ShoppingCart,
  FileText,
  Bot,
  RefreshCw,
  MapPin,
  Tag,
  ArrowRight,
  Zap,
  BarChart2,
  FileKey,
  Cpu,
} from "lucide-react";
// ── SEED CONTROLS — remove this import (and the <SeedControls> block below) to hide ──
import { SeedControls } from "@/components/SeedControls";
// ── END SEED CONTROLS IMPORT ──

const features = [
  {
    icon: Package,
    title: "Asset Registry",
    description:
      "Central inventory for all hardware, software, and licenses. Track serial numbers, asset tags, purchase details, and current status in one place.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: CheckCircle2,
    title: "Assignment Tracking",
    description:
      "Full assignment history per asset — who has it, since when, and when it was returned. Never lose track of who owns what.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: AlertTriangle,
    title: "Warranty Alerts",
    description:
      "Automated 30-day and 7-day warranty expiry alerts. Dashboard banner surfaces expiring assets before you're caught off-guard.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Wrench,
    title: "Maintenance Records",
    description:
      "Log every repair, upgrade, inspection, and cleaning. Full cost tracking and maintenance history per asset, always accessible.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: RefreshCw,
    title: "Refresh Predictions",
    description:
      "AI-driven hardware refresh scoring based on age, warranty status, assignment history, and maintenance frequency. Replace before it breaks.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: FileKey,
    title: "License Waste Detection",
    description:
      "Identify unused and underutilized software licenses. Surface shadow IT and reclaim budget from tools nobody uses.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: ShoppingCart,
    title: "Procurement Workflow",
    description:
      "Submit purchase requests and track them through pending → approved → ordered → received. Full audit trail with vendor and cost data.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    icon: Bot,
    title: "AI Copilot",
    description:
      "Natural language assistant with live database context. Ask \"Which laptops are expiring warranty?\" or \"Show me all unassigned hardware\" instantly.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: FileText,
    title: "Compliance Reports",
    description:
      "Generate SOX and ISO-ready asset inventory reports for any date range. Export to CSV for auditors with one click.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    icon: BarChart2,
    title: "Depreciation Tracking",
    description:
      "Straight-line and declining-balance depreciation calculations per asset. Know the book value of your entire asset portfolio at any time.",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: MapPin,
    title: "Location Management",
    description:
      "Track assets by building, floor, and room. Instantly answer \"What equipment is in the SF office?\" during audits or office moves.",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    icon: Tag,
    title: "Category System",
    description:
      "Organize assets into custom categories with color coding. Filter and report by laptops, servers, licenses, peripherals — whatever your IT taxonomy needs.",
    color: "text-lime-600",
    bg: "bg-lime-50",
  },
];

const steps = [
  {
    step: "01",
    title: "Register Your Assets",
    description:
      "Add assets manually, bulk-import via CSV, or scan QR codes. Every asset gets a unique tag, serial number, and full lifecycle record.",
  },
  {
    step: "02",
    title: "Assign & Track",
    description:
      "Assign assets to employees, set locations, and log maintenance. The system surfaces warranty expiry and refresh candidates automatically.",
  },
  {
    step: "03",
    title: "Audit with Confidence",
    description:
      "Generate compliance reports, detect license waste, and let the AI Copilot answer auditor questions in seconds — not days.",
  },
];

const stats = [
  { label: "Asset Types Supported", value: "4", icon: Package },
  { label: "Avg Audit Prep Time", value: "< 5 min", icon: FileText },
  { label: "License Waste Found", value: "23%", icon: FileKey },
  { label: "Replacement Lead Time", value: "2 wks saved", icon: RefreshCw },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">DClaw Assets</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</Link>
            <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium">
              Open Dashboard
            </Link>
          </nav>
          <Link href="/dashboard" className="md:hidden px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white">
            Dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5" />
            AI-powered IT asset management
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Every asset tracked.
            <br />
            <span className="text-emerald-600">Every dollar justified.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            DClaw Assets gives you full lifecycle management for hardware, software, and licenses — with AI that predicts
            failures, detects waste, and answers auditor questions instantly.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/assets"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Browse Assets <Package className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-emerald-600 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center text-white">
              <Icon className="h-5 w-5 mx-auto mb-2 text-emerald-200" />
              <div className="text-3xl font-bold">{value}</div>
              <div className="text-sm text-emerald-200 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Full lifecycle, zero gaps</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From procurement request to end-of-life disposal — DClaw Assets covers every stage with the visibility you
              need to pass audits and cut waste.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow bg-white group"
              >
                <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">From zero to audited in minutes</h2>
            <p className="text-lg text-gray-500">
              No agents to deploy, no spreadsheets to maintain. Import your existing inventory and you&apos;re live.
            </p>
          </div>
          <div className="space-y-8">
            {steps.map(({ step, title, description }) => (
              <div key={step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center">
                  {step}
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick navigation */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Explore the platform</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { href: "/dashboard",           label: "Dashboard",     icon: Cpu,          color: "text-emerald-600", bg: "bg-emerald-50" },
              { href: "/assets",              label: "Assets",        icon: Package,      color: "text-blue-600",    bg: "bg-blue-50" },
              { href: "/procurement",         label: "Procurement",   icon: ShoppingCart, color: "text-cyan-600",    bg: "bg-cyan-50" },
              { href: "/refresh-predictions", label: "Refresh Score", icon: RefreshCw,    color: "text-violet-600",  bg: "bg-violet-50" },
              { href: "/reports",             label: "Reports",       icon: FileText,     color: "text-teal-600",    bg: "bg-teal-50" },
              { href: "/categories",          label: "Categories",    icon: Tag,          color: "text-lime-600",    bg: "bg-lime-50" },
              { href: "/locations",           label: "Locations",     icon: MapPin,       color: "text-sky-600",     bg: "bg-sky-50" },
            ].map(({ href, label, icon: Icon, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all group text-center"
              >
                <div className={`p-3 rounded-xl ${bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <span className="font-medium text-gray-800 text-sm">{label}</span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Copilot callout */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">AI Copilot included</h3>
            <p className="text-slate-400 leading-relaxed">
              Ask questions in plain English:{" "}
              <em className="text-slate-300">&ldquo;Which servers are out of warranty?&rdquo;</em>{" "}
              or{" "}
              <em className="text-slate-300">&ldquo;Show unused licenses costing more than $1,000/year.&rdquo;</em>{" "}
              The Copilot pulls live data from your asset database to answer instantly.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to take control of your assets?</h2>
          <p className="text-emerald-100 text-lg mb-10">
            Open the dashboard and start managing your IT portfolio in seconds.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-emerald-700 font-bold hover:bg-emerald-50 transition-colors shadow-lg"
          >
            Open Dashboard <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── SEED CONTROLS — remove this section (and the SeedControls import at top) to hide ── */}
      <section className="py-16 px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-lg mx-auto">
          <SeedControls />
        </div>
      </section>
      {/* ── END SEED CONTROLS ── */}

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
              <Package className="h-3 w-3 text-white" />
            </div>
            <span className="font-medium text-gray-700">DClaw Assets</span>
            <span>— IT Asset Management for DClaw Platform</span>
          </div>
          <nav className="flex gap-6">
            <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
            <Link href="/assets" className="hover:text-gray-900 transition-colors">Assets</Link>
            <Link href="/procurement" className="hover:text-gray-900 transition-colors">Procurement</Link>
            <Link href="/reports" className="hover:text-gray-900 transition-colors">Reports</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
