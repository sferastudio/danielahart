"use client";

import { AuditLogEntry } from "@/lib/types";

interface ActivityFeedProps {
  entries: AuditLogEntry[];
}

const ACTION_LABELS: Record<string, string> = {
  admin_save_report: "edited report",
  update_report: "updated report",
  submit_report: "submitted report",
  send_reminder: "sent reminder",
  mark_reviewed: "marked as reviewed",
};

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function getDotColor(action: string): string {
  if (action.includes("submit")) return "bg-green-500";
  if (action.includes("admin_save")) return "bg-blue-500";
  if (action.includes("update")) return "bg-yellow-500";
  return "bg-gray-400";
}

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function ActivityFeed({ entries }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-[4px] border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">
          Recent Activity
        </h3>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="px-4 py-3 text-xs text-slate-500">
            No recent activity.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <li key={entry.id} className="px-4 py-3 flex items-start gap-3">
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${getDotColor(entry.action)}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-900 truncate">
                    <span className="font-medium">
                      {entry.profile?.full_name ?? "System"}
                    </span>{" "}
                    {getActionLabel(entry.action)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {getRelativeTime(entry.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
