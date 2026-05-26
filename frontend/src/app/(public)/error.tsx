"use client";

import { useEffect } from "react";
import { ErrorContent } from "@/components/error/error-content";

export default function PublicError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("(public) error boundary:", error);
  }, [error]);
  return <ErrorContent code={500} reset={reset} />;
}
