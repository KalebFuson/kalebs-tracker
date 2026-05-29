"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
};

function mapSignUpError(message: string): string {
  if (message === "User already registered") {
    return "An account with this email already exists. Sign in instead.";
  }
  if (
    message.toLowerCase().includes("password") &&
    (message.toLowerCase().includes("weak") ||
      message.toLowerCase().includes("short") ||
      message.toLowerCase().includes("least"))
  ) {
    return "Password must be at least 8 characters";
  }
  return message;
}

function validateForm(
  fullName: string,
  email: string,
  password: string,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!fullName.trim()) {
    errors.fullName = "Full name is required";
  }

  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  return errors;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteToken = searchParams.get("invite");
  const prefillEmail = searchParams.get("email") ?? "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationErrors = validateForm(fullName, email, password);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    setIsLoading(false);

    if (signUpError) {
      setError(mapSignUpError(signUpError.message));
      return;
    }

    // After signup, return to the invite acceptance page if there's a pending invite
    if (inviteToken) {
      router.push(`/onboarding/accept-invite/${inviteToken}`);
    } else {
      router.push("/onboarding");
    }
  }

  const emailLocked = Boolean(prefillEmail && inviteToken);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={isLoading}
          aria-invalid={Boolean(fieldErrors.fullName)}
        />
        {fieldErrors.fullName ? (
          <p className="text-sm text-red-600" role="alert">
            {fieldErrors.fullName}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading || emailLocked}
          aria-invalid={Boolean(fieldErrors.email)}
          className={emailLocked ? "bg-gray-50 text-muted-foreground" : undefined}
        />
        {emailLocked && (
          <p className="text-xs text-muted-foreground">
            This invite can only be accepted with the email it was sent to.
          </p>
        )}
        {fieldErrors.email ? (
          <p className="text-sm text-red-600" role="alert">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
          aria-invalid={Boolean(fieldErrors.password)}
        />
        {fieldErrors.password ? (
          <p className="text-sm text-red-600" role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
        disabled={isLoading}
      >
        {isLoading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-indigo-600">
            Kalebs Tracker
          </CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <SignupForm />
          </Suspense>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
