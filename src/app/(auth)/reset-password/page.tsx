"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      <h1
        className="animate-slide-up text-lg font-semibold uppercase tracking-[0.2em] text-foreground"
      >
        Reset Password
      </h1>
      <p
        className="animate-slide-up text-sm text-muted-foreground text-center leading-relaxed"
        style={{ animationDelay: "50ms" }}
      >
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div
          className="animate-slide-up space-y-2"
          style={{ animationDelay: "100ms" }}
        >
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div
          className="animate-slide-up space-y-2"
          style={{ animationDelay: "150ms" }}
        >
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div
          className="animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-brand-red hover:bg-brand-red-hover text-white font-semibold uppercase tracking-wider transition-colors duration-200"
          >
            {loading ? "UPDATING..." : "UPDATE PASSWORD"}
          </Button>
        </div>
      </form>

      <Link
        href="/login"
        className="animate-slide-up text-sm text-muted-foreground hover:underline"
        style={{ animationDelay: "250ms" }}
      >
        Back to Login
      </Link>
    </div>
  );
}
