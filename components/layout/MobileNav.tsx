"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, FileText, Brain, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { canAccess } from "@/lib/features";
import { useEffectivePlan } from "@/store/useAuthStore";

const TABS = [
  { label: "Home",     href: "/dashboard",        icon: LayoutDashboard, feature: null },
  { label: "Practice", href: "/practice",          icon: BookOpen,        feature: "PRACTICE_BASIC" },
  { label: "Mocks",    href: "/mock-tests",        icon: FileText,        feature: "MOCK_BASIC" },
  { label: "AI",       href: "/ai-doubt-solver",   icon: Brain,           feature: null },
  { label: "Profile",  href: "/profile",           icon: User,            feature: null },
] as const;

export default function MobileNav() {
  const pathname = usePathname();
  const effectivePlan = useEffectivePlan();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-dark-800/95 backdrop-blur-xl border-t border-white/8">
      <div className="flex items-center justify-around px-1 py-1.5 pb-safe">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const isLocked = tab.feature !== null && !canAccess(effectivePlan, tab.feature);
          const href = isLocked ? "/plan-selection" : tab.href;

          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all min-w-[52px] relative",
                isActive ? "text-neon-blue" : "text-white/35 hover:text-white/60"
              )}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-neon-blue rounded-full" />
              )}

              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive && "bg-neon-blue/15"
              )}>
                <tab.icon
                  size={19}
                  className={cn(isActive ? "text-neon-blue" : "", isLocked && "opacity-40")}
                />
              </div>

              <span className={cn(
                "text-[10px] font-semibold",
                isActive ? "text-neon-blue" : "text-white/35",
                isLocked && "opacity-40"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
