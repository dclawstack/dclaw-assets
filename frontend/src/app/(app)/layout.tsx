import Sidebar from "@/components/Sidebar";
import AICopilot from "@/components/AICopilot";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-56 p-6">{children}</main>
      <AICopilot />
    </div>
  );
}
