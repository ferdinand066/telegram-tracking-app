"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "~/components/theme/theme-provider";
import { Button } from "~/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} theme`}
      title={`Switch to ${isDarkMode ? "light" : "dark"} theme`}
      className="rounded-full"
    >
      {isDarkMode ? <Sun /> : <Moon />}
    </Button>
  );
}
