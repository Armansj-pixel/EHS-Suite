"use client";

import React from "react";

type StatCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
  trend?: number; // +% / -%
  icon?: React.ReactNode;
  onClick?: () => void;
};

export default function StatCard({
  label,
  value,
  subtitle,
  trend,
  icon,
  onClick,
}: StatCardProps) {
  const up = typeof trend === "number" && trend >= 0;
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-neutral-200 bg-white hover:shadow-lg transition-shadow p-4 md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm text-neutral-500">{label}</p>
          <div className="mt-1 text-3xl font-bold tracking-tight">{value}</div>
          {subtitle && (
            <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
          )}
          {typeof trend === "number" && (
            <div
              className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              <span className={`mr-1 ${up ? "rotate-0" : "rotate-180"}`}>▲</span>
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="shrink-0 rounded-lg bg-neutral-100 p-3">{icon}</div>
        )}
      </div>
    </button>
  );
}