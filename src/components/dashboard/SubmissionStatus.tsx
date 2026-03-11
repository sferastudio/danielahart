interface MonthStatus {
  month: string;
  status: "paid" | "submitted" | "invoiced" | "draft" | "overdue" | "none";
  date?: string;
}

interface SubmissionStatusProps {
  months: MonthStatus[];
}

const STATUS_CONFIG: Record<
  MonthStatus["status"],
  { dotColor: string; label: string; textClass: string }
> = {
  paid: { dotColor: "bg-emerald-500", label: "Verified & Paid", textClass: "text-slate-400 font-medium" },
  submitted: { dotColor: "bg-blue-500", label: "Submitted", textClass: "text-slate-400 font-medium" },
  invoiced: { dotColor: "bg-amber-400", label: "Invoiced - Awaiting Payment", textClass: "text-slate-400 font-medium" },
  draft: { dotColor: "bg-amber-400", label: "Drafting - Needs Submission", textClass: "text-amber-600 font-bold italic tracking-tighter" },
  overdue: { dotColor: "bg-red-500", label: "Overdue", textClass: "text-red-500 font-bold" },
  none: { dotColor: "bg-slate-300", label: "Not Available", textClass: "text-slate-400 font-medium" },
};

export function SubmissionStatus({ months }: SubmissionStatusProps) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-[4px] shadow-sm">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
        Submission Status
      </h3>
      <div className="space-y-6 relative border-l border-slate-100 pl-4 ml-2">
        {months.map((m) => {
          const config = STATUS_CONFIG[m.status];
          return (
            <div key={m.month} className="relative">
              <div
                className={`absolute -left-[25px] top-1 h-4 w-4 rounded-full ${config.dotColor} border-4 border-white`}
              />
              <p className="text-xs font-black uppercase">{m.month}</p>
              <p className={`text-[10px] ${config.textClass}`}>
                {m.status === "paid" && m.date
                  ? `${config.label} on ${m.date}`
                  : config.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
