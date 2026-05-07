"use client";

import { useTransition } from "react";
import { switchOffice } from "@/actions/switch-office";
import { ChevronDown } from "lucide-react";

interface OfficeSwitcherProps {
  offices: { id: string; name: string; office_number: string }[];
  activeOfficeId: string;
}

export function OfficeSwitcher({ offices, activeOfficeId }: OfficeSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  if (offices.length <= 1) return null;

  return (
    <div className="relative">
      <select
        value={activeOfficeId}
        onChange={(e) => {
          startTransition(() => {
            switchOffice(e.target.value);
          });
        }}
        disabled={isPending}
        className="appearance-none w-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-[10px] font-bold uppercase tracking-wider rounded-[4px] px-3 py-2 pr-7 cursor-pointer hover:bg-brand-red/15 transition-colors disabled:opacity-50"
      >
        {offices.map((office) => (
          <option key={office.id} value={office.id}>
            {office.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-brand-red pointer-events-none" />
    </div>
  );
}
