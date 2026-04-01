import { Clock } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  periodLabel?: string;
  periodValue?: string;
  daysRemaining?: number;
  isOverdue?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  periodLabel,
  periodValue,
  daysRemaining,
  isOverdue,
}: PageHeaderProps) {
  return (
    <header className="bg-white h-16 md:h-20 border-b border-slate-200 flex items-center justify-between px-4 md:px-10 sticky top-0 z-10 shadow-sm">
      <div>
        {subtitle && (
          <h1 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
            {subtitle}
          </h1>
        )}
        <p className="text-xl font-black text-navy-900 uppercase tracking-tight">
          {title}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-6">
        {periodLabel && periodValue && (
          <div className="text-right border-r pr-6 border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {periodLabel}
            </p>
            <p className="text-sm font-bold uppercase tracking-tight">
              {periodValue}
            </p>
          </div>
        )}
        {daysRemaining !== undefined && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-brand-red rounded-[4px] border border-red-100 text-xs font-bold uppercase tracking-tighter">
            <Clock size={12} strokeWidth={3} />
            {isOverdue
              ? "Overdue"
              : `${daysRemaining} Day${daysRemaining !== 1 ? "s" : ""} Remaining`}
          </span>
        )}
      </div>
    </header>
  );
}
