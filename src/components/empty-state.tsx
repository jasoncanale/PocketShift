import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional action (e.g. Add button) */
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-12 px-6 text-center">
      {Icon && (
        <div className="rounded-full bg-muted p-4">
          <Icon className="size-8 text-muted-foreground" aria-hidden />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
