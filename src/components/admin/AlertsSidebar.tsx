"use client";

import { useCurrentPeriod } from "@/hooks/useCurrentPeriod";
import { OfficeWithReport } from "@/lib/types";

interface AlertsSidebarProps {
  offices: OfficeWithReport[];
}

export default function AlertsSidebar({ offices }: AlertsSidebarProps) {
  const { days_remaining, is_overdue } = useCurrentPeriod();

  const redAlerts = offices.filter(
    (o) =>
      o.status === "active" &&
      (!o.currentReport || o.currentReport.status === "overdue")
  );

  const yellowAlerts = offices.filter(
    (o) =>
      o.currentReport?.status === "submitted" ||
      o.currentReport?.status === "invoiced"
  );

  const orangeAlerts =
    !is_overdue && days_remaining <= 3
      ? offices.filter(
          (o) =>
            o.status === "active" &&
            o.currentReport &&
            o.currentReport.status === "draft"
        )
      : [];

  const hasAlerts =
    redAlerts.length > 0 || yellowAlerts.length > 0 || orangeAlerts.length > 0;

  if (!hasAlerts) {
    return (
      <div className="bg-green-50 rounded-[4px] border border-green-200 shadow-sm p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
            ✓
          </span>
          <span className="text-sm font-medium text-green-800">All Clear</span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          No alerts at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {redAlerts.length > 0 && (
        <AlertCard
          color="red"
          label="Overdue"
          count={redAlerts.length}
          offices={redAlerts}
        />
      )}
      {orangeAlerts.length > 0 && (
        <AlertCard
          color="orange"
          label="Deadline Approaching"
          count={orangeAlerts.length}
          offices={orangeAlerts}
        />
      )}
      {yellowAlerts.length > 0 && (
        <AlertCard
          color="yellow"
          label="Awaiting Payment"
          count={yellowAlerts.length}
          offices={yellowAlerts}
        />
      )}
    </div>
  );
}

function AlertCard({
  color,
  label,
  count,
  offices,
}: {
  color: "red" | "yellow" | "orange";
  label: string;
  count: number;
  offices: OfficeWithReport[];
}) {
  const colorMap = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-800",
      text: "text-red-700",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800",
      text: "text-yellow-700",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      badge: "bg-orange-100 text-orange-800",
      text: "text-orange-700",
    },
  };

  const styles = colorMap[color];
  const maxVisible = 5;
  const visible = offices.slice(0, maxVisible);
  const remaining = offices.length - maxVisible;

  return (
    <div
      className={`${styles.bg} rounded-[4px] border ${styles.border} shadow-sm p-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${styles.badge}`}
        >
          {count}
        </span>
        <span className={`text-sm font-medium ${styles.text}`}>{label}</span>
      </div>
      <ul className="space-y-1">
        {visible.map((office) => (
          <li key={office.id} className={`text-xs ${styles.text}`}>
            {office.name}
          </li>
        ))}
        {remaining > 0 && (
          <li className={`text-xs ${styles.text} font-medium`}>
            +{remaining} more
          </li>
        )}
      </ul>
    </div>
  );
}
