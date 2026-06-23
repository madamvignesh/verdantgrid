import type { LucideIcon } from "lucide-react";

export const StatCard = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | string }) => (
  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
        <Icon className="h-4 w-4 text-accent-foreground" />
      </div>
    </div>
    <div className="mt-3 font-display text-3xl font-bold">{value}</div>
  </div>
);
