import React from 'react';
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = "purple" }) {
  const colorClasses = {
    purple: "from-[#9B63E9] to-[#8A52D8] shadow-[#9B63E9]/20",
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    amber: "from-amber-500 to-orange-600 shadow-amber-500/20",
    rose: "from-rose-500 to-pink-600 shadow-rose-500/20",
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/60 hover:border-slate-300/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              "text-sm font-medium mt-2",
              trend > 0 ? "text-[#9B63E9]" : "text-rose-600"
            )}>
              {trend > 0 ? "+" : ""}{trend}% from last month
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-[#F4F0FC] flex items-center justify-center">
            <Icon className={cn("w-6 h-6 text-[#9B63E9]")} />
          </div>
        )}
      </div>
    </div>
  );
}