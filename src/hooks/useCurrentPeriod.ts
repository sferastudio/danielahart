"use client";

import { useMemo } from "react";
import { REPORT_DEADLINE_DAY } from "@/lib/constants";

export function useCurrentPeriod() {
  return useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const current_month_date = new Date(year, month, 1);
    const deadline_date = new Date(year, month, REPORT_DEADLINE_DAY);

    const diff = deadline_date.getTime() - now.getTime();
    const days_remaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const is_overdue = days_remaining < 0;

    const current_month = current_month_date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const formatted_deadline = `DUE ${deadline_date
      .toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      })
      .toUpperCase()}`;

    // report_month is always 1st of month in ISO format
    const report_month = `${year}-${String(month + 1).padStart(2, "0")}-01`;

    return {
      current_month,
      current_month_date,
      deadline_date,
      days_remaining,
      is_overdue,
      formatted_deadline,
      report_month,
    };
  }, []);
}
