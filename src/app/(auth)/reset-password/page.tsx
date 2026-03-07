"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const checkSession = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true);
      });
    };
    checkSession();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = form.handleSubmit(async (data) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Password updated successfully");
    router.push("/calendar");
    router.refresh();
  });

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
        <CardDescription>
          {ready
            ? "Enter your new password below"
            : "Use the link from your email to reset your password"}
        </CardDescription>
      </CardHeader>
      {ready ? (
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Min 6 characters" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Repeat password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      ) : (
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">Request new link</Link>
          </Button>
        </CardFooter>
      )}
      <CardFooter className="border-t pt-4">
        <p className="w-full text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary underline">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
