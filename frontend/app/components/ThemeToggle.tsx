"use client";

import { useEffect, useState } from "react";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-md bg-canvas-soft border border-hairline animate-pulse" />
    );
  }

  return (
    <AnimatedThemeToggler
      variant="rectangle"
      aria-label="Toggle theme"
      className="flex items-center justify-center w-8 h-8 rounded-md bg-canvas-soft border border-hairline text-body hover:text-foreground hover:bg-canvas-soft-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-primary outline-none focus-visible:ring-offset-2 cursor-pointer"
    />
  );
}
