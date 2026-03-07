"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setLoading(true);
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : "/reset-password";

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  });

  if (sent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to {form.getValues("email")}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3">
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-primary underline"
            >
              try again
            </button>
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
