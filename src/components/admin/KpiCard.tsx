"use client";

import React from "react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  progress?: number;
  progressLabel?: string;
  alert?: boolean;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  change,
  progress,
  progressLabel,
  alert,
}: KpiCardProps) {
  return (
    <div
      className={`rounded-[4px] border p-6 shadow-sm ${
        alert
          ? "border-red-200 bg-red-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>

        {change !== undefined && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              change >= 0
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}

      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                progress >= 1 ? "bg-green-600" : "bg-navy-900"
              }`}
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
          {progressLabel && (
            <p className="mt-1 text-xs text-muted-foreground">
              {progressLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
