"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { loginSchema, type LoginInput } from "@/lib/validations";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleLogin = form.handleSubmit(async (data) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    router.push("/calendar");
    router.refresh();
  });

  const handleMagicLink = form.handleSubmit(async (data) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/calendar` : "/calendar",
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setMagicLinkSent(true);
    setLoading(false);
  });

  if (magicLinkSent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a sign-in link to {form.getValues("email")}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3">
          <Button variant="outline" className="w-full" onClick={() => setMagicLinkSent(false)}>
            Use password instead
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">PocketShift</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Your password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={handleMagicLink}
          >
            Send magic link
          </Button>
          <p className="text-sm text-muted-foreground">
            <Link href="/forgot-password" className="text-primary underline">
              Forgot password?
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary underline">
              Register
            </Link>
          </p>
        </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
