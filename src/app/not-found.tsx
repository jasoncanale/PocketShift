import { FileQuestion } from "lucide-react";
import { NotFoundBackButton } from "@/components/not-found-back-button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <FileQuestion className="size-16 text-muted-foreground" aria-hidden />
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="max-w-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <NotFoundBackButton />
    </div>
  );
}
