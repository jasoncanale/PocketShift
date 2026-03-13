"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type PersonAvatarProps = {
  src: string | null | undefined;
  fallback: string;
  className?: string;
  size?: "sm" | "default" | "lg";
};

const sizeMap = {
  sm: "size-6",
  default: "size-10",
  lg: "size-14",
};

/**
 * Avatar for people/contacts that uses Next.js Image for remote URLs (e.g. Supabase storage).
 * Falls back to initials when no src or on error.
 */
export function PersonAvatar({
  src,
  fallback,
  className,
  size = "default",
}: PersonAvatarProps) {
  const sizeClass = sizeMap[size];

  if (src) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-muted",
          sizeClass,
          className
        )}
      >
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 40px, 56px"
          className="object-cover"
        />
      </div>
    );
  }

  const initials = fallback.slice(0, 2).toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground",
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
