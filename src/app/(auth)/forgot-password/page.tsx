"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STYLES } from "@/lib/constants";

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
      <div className="flex flex-col items-center space-y-6">
        <Image
          src="/logo.png"
          alt="Daniel Ahart Tax"
          width={200}
          height={60}
          priority
        />
        <p className={STYLES.sectionHeader}>CHECK YOUR EMAIL</p>
        <p className="text-sm text-muted-foreground text-center">
          We sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
        </p>
        <Link
          href="/login"
          className="text-sm text-brand-red hover:underline"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <Image
        src="/logo.png"
        alt="Daniel Ahart Tax"
        width={200}
        height={60}
        priority
      />

      <p className={STYLES.sectionHeader}>FORGOT PASSWORD</p>
      <p className="text-sm text-muted-foreground text-center">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@danielahart.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-red hover:bg-brand-red-hover text-white font-semibold uppercase tracking-wider"
        >
          {loading ? "SENDING..." : "SEND RESET LINK"}
        </Button>
      </form>

      <Link
        href="/login"
        className="text-sm text-muted-foreground hover:underline"
      >
        Back to Login
      </Link>
    </div>
  );
}
