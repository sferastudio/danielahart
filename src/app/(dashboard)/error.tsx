"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-[4px] border border-slate-200 p-10 text-center max-w-md">
        <AlertTriangle className="mx-auto mb-4 text-brand-red" size={40} />
        <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
