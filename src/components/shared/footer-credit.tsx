"use client";
import Link from "next/link";
import { Instagram } from "lucide-react";

// Footer credit link — must remain visible & clickable on every page,
// open in a new tab, exact text "made by fikriadarmouch".
export function FooterCredit() {
  return (
    <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
      <span>made by</span>
      <Link
        href="https://www.instagram.com/fikriadarmouch/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="made by fikriadarmouch — Instagram profile"
        className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
      >
        fikriadarmouch
        <Instagram className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
