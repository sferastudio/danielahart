import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-[4px] border border-slate-200 p-10 text-center max-w-md">
        <FileQuestion className="mx-auto mb-4 text-slate-400" size={40} />
        <h2 className="text-lg font-bold text-navy-900 uppercase tracking-tight mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/admin/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
