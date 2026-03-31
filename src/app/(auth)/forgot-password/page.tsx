"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center space-y-8">
        <div
          className="animate-slide-up flex flex-col items-center space-y-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Check Your Email
          </h1>
        </div>
        <p
          className="animate-slide-up text-sm text-muted-foreground text-center leading-relaxed"
          style={{ animationDelay: "100ms" }}
        >
          We sent a password reset link to <strong className="text-foreground">{email}</strong>. Click the link in the email to reset your password.
        </p>
        <Link
          href="/login"
          className="animate-slide-up text-sm text-brand-red hover:underline"
          style={{ animationDelay: "150ms" }}
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      <h1
        className="animate-slide-up text-lg font-semibold uppercase tracking-[0.2em] text-foreground"
      >
        Forgot Password
      </h1>
      <p
        className="animate-slide-up text-sm text-muted-foreground text-center leading-relaxed"
        style={{ animationDelay: "50ms" }}
      >
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div
          className="animate-slide-up"
          style={{ animationDelay: "150ms" }}
        >
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-brand-red hover:bg-brand-red-hover text-white font-semibold uppercase tracking-wider transition-colors duration-200"
          >
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </Button>
        </div>
      </form>

      <Link
        href="/login"
        className="animate-slide-up text-sm text-muted-foreground hover:underline"
        style={{ animationDelay: "200ms" }}
      >
        Back to Login
      </Link>
    </div>
  );
}
