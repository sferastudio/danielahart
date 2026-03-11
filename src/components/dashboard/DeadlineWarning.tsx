import { AlertCircle } from "lucide-react";

export function DeadlineWarning() {
  return (
    <div className="p-6 bg-brand-red text-white rounded-[4px] shadow-lg shadow-red-100">
      <AlertCircle className="mb-4 opacity-50" size={24} />
      <h3 className="font-black text-lg uppercase tracking-tight mb-2 leading-tight">
        Deadline Approaching
      </h3>
      <p className="text-xs font-bold opacity-80 mb-6 leading-relaxed">
        Financial reports must be finalized by the 5th of each month to avoid
        platform suspension.
      </p>
      <button className="w-full py-2 border-2 border-white/20 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-[4px] transition-all">
        View Policy Handbook
      </button>
    </div>
  );
}
