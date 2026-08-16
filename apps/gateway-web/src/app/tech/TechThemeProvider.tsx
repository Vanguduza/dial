"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function TechThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="dial-tech-theme"
    >
      {children}
    </ThemeProvider>
  );
}
