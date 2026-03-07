"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function NotFoundBackButton() {
  const { user } = useAuth();

  return (
    <Button asChild>
      <Link href={user ? "/calendar" : "/login"}>Go home</Link>
    </Button>
  );
}
