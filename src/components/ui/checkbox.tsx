"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "checked" | "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label className={cn("relative inline-flex cursor-pointer", className)}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked as boolean)}
          className="peer sr-only"
          {...props}
        />
        <span className="flex size-4 shrink-0 items-center justify-center rounded border border-input bg-background transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
          {checked ? <Check className="size-2.5 text-primary-foreground" /> : null}
        </span>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
