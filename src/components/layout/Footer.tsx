export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 md:px-10 py-4">
      <p className="text-xs text-slate-400 text-center">
        &copy; {new Date().getFullYear()} Daniel Ahart Tax Services. All rights reserved.
      </p>
    </footer>
  );
}
