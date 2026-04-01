"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex items-center justify-center min-h-screen bg-[#F8FAFC] font-sans">
        <div className="bg-white rounded p-10 text-center max-w-md border border-slate-200">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-500 mb-6">
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#E31B23] text-white font-bold text-sm uppercase rounded hover:bg-[#B91C1C] transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
