"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type CompanyLogoProps = {
  src: string | null | undefined;
  fallback: string;
  className?: string;
  size?: "xs" | "sm" | "default" | "lg";
};

const sizeClasses = {
  xs: "size-5 min-w-5",
  sm: "size-6 min-w-6",
  default: "size-10 min-w-10",
  lg: "size-16 min-w-16",
};

/**
 * Renders a company logo with any aspect ratio (square, wide, tall).
 * Uses object-contain so the full logo is visible without cropping.
 */
export function CompanyLogo({
  src,
  fallback,
  className,
  size = "default",
}: CompanyLogoProps) {
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted",
        sizeClass,
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={64}
          height={64}
          className="size-full object-contain p-0.5"
        />
      ) : (
        <span className="text-sm font-medium text-muted-foreground">
          {fallback.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
