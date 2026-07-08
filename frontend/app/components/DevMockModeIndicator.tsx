"use client";

import { useEffect, useState } from "react";
import { isMockMode } from "../utils/api";

export default function DevMockModeIndicator() {
  const [mockActive, setMockActive] = useState(false);

  useEffect(() => {
    // Check initial state
    setMockActive(isMockMode());

    const handleMockChange = () => {
      setMockActive(isMockMode());
    };

    window.addEventListener("mockModeChange", handleMockChange);
    // Periodically poll since state is stored in global variable
    const interval = setInterval(() => {
      const active = isMockMode();
      if (active !== mockActive) {
        setMockActive(active);
      }
    }, 1500);

    return () => {
      window.removeEventListener("mockModeChange", handleMockChange);
      clearInterval(interval);
    };
  }, [mockActive]);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-auto">
      {mockActive ? (
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-warning-deep/20 bg-warning-soft/90 backdrop-blur text-[10px] font-bold text-warning-deep shadow-sm tracking-wide uppercase transition-all duration-300 hover:scale-105"
          title="The application was unable to call the local NestJS API (or database entry missing), and is currently running on a fully mock simulation sandbox."
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning-deep opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-warning-deep"></span>
          </span>
          Mock Sandbox Active
        </div>
      ) : (
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-primary/10 bg-canvas-soft/95 backdrop-blur text-[10px] font-bold text-brand-primary shadow-sm tracking-wide uppercase transition-all duration-300 hover:scale-105"
          title="Connected directly to the live NestJS backend API."
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-primary"></span>
          </span>
          Live API Active
        </div>
      )}
    </div>
  );
}
