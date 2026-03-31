"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      <h1
        className="animate-slide-up text-lg font-semibold uppercase tracking-[0.2em] text-foreground"
      >
        Franchisee Portal
      </h1>

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div
          className="animate-slide-up space-y-2"
          style={{ animationDelay: "100ms" }}
        >
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@danielahart.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div
          className="animate-slide-up space-y-2"
          style={{ animationDelay: "150ms" }}
        >
          <Label htmlFor="password">Password</Label>
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

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div
          className="animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-brand-red hover:bg-brand-red-hover text-white font-semibold uppercase tracking-wider transition-colors duration-200"
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </Button>
        </div>
      </form>

      <Link
        href="/forgot-password"
        className="animate-slide-up text-sm text-muted-foreground hover:underline"
        style={{ animationDelay: "250ms" }}
      >
        Forgot your password?
      </Link>
    </div>
  );
}
