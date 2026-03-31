"use client";

import { useCurrentPeriod } from "@/hooks/useCurrentPeriod";

interface DeadlineCountdownProps {
  submittedCount: number;
  totalCount: number;
}

export default function DeadlineCountdown({
  submittedCount,
  totalCount,
}: DeadlineCountdownProps) {
  const { days_remaining, is_overdue, report_month } = useCurrentPeriod();

  const progressPercent =
    totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Deadline</h3>
      </div>
      <div className="px-4 py-4 flex flex-col items-center text-center">
        <span className="text-4xl font-bold text-slate-900">
          {days_remaining}
        </span>
        {is_overdue ? (
          <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
            OVERDUE
          </span>
        ) : (
          <span className="mt-1 text-sm text-slate-500">days remaining</span>
        )}
        <span className="mt-2 text-xs text-slate-400">{report_month}</span>

        <div className="w-full mt-4">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {submittedCount} of {totalCount} franchisees submitted
          </p>
        </div>
      </div>
    </div>
  );
}
