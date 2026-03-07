/**
 * Format API/Supabase errors for user display.
 * Handles PostgrestError, generic Error, and unknown types.
 */
export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "An unexpected error occurred. Please try again.";
}
