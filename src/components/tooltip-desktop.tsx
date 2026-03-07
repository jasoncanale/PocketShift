"use client";

import { useIsMobile } from "@/lib/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipDesktopProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function TooltipDesktop({ content, children }: TooltipDesktopProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}
