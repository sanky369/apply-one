"use client";

import { useEffect, useState } from "react";
import { IconButton } from "./ui";
import { SunIcon, MoonIcon } from "./icons";
import { saveSettings } from "@/lib/db";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("applyone-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    void saveSettings({ theme: next ? "dark" : "light" });
  };

  return (
    <IconButton
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {mounted && dark ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  );
}
