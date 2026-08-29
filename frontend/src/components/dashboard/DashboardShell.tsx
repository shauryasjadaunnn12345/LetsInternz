"use client";

import { useEffect, useState } from "react";

import BottomTabBar from "@/components/dashboard/BottomTabBar";
import Sidebar from "@/components/dashboard/Sidebar";

const COLLAPSE_STORAGE_KEY = "letsinternz-sidebar-collapsed";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    const raf = requestAnimationFrame(() => {
      if (stored === "1") setCollapsed(true);
      setHydrated(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex min-h-screen flex-1 bg-paper">
      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />

      <div
        className={`flex flex-1 flex-col transition-[margin] duration-200 ${
          hydrated && collapsed ? "lg:ml-[4.5rem]" : "lg:ml-64"
        }`}
      >
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>

      <BottomTabBar />
    </div>
  );
}
