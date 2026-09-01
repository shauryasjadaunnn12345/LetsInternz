"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Bookmark,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  User as UserIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthStore } from "@/store/authStore";
import BrandLogo from "@/components/BrandLogo";

const NAV_LINKS = [
  { href: "/internships", label: "Browse Internships" },
  { href: "/how-it-works", label: "How It Works" },
];

function Logo() {
  return <BrandLogo size="md" />;
}

function initials(nameOrEmail: string) {
  const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  return base.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, profile, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    setDrawerOpen(false);
    router.push("/");
  };

  const displayName = profile?.full_name || user?.username || user?.email || "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper-raised/95 backdrop-blur supports-[backdrop-filter]:bg-paper-raised/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden md:flex md:items-center md:gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop auth area */}
        <div className="hidden md:flex md:items-center md:gap-3">
          {!isAuthenticated ? (
            <>
              {/* Login/signup are intentionally disabled for the public browsing flow. */}
            </>
          ) : (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-sm font-medium text-ink transition-colors hover:border-ink-soft"
                  aria-label="Account menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-marigold text-xs font-bold text-ink">
                    {initials(displayName)}
                  </span>
                  <span className="max-w-[10rem] truncate">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-slate" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-[14rem] rounded-xl border border-border bg-paper-raised p-1.5 shadow-lg"
                >
                  <DropdownMenuLink href="/dashboard" icon={LayoutDashboard}>
                    Dashboard
                  </DropdownMenuLink>
                  <DropdownMenuLink href="/applications" icon={ClipboardList}>
                    My Applications
                  </DropdownMenuLink>
                  <DropdownMenuLink href="/saved" icon={Bookmark}>
                    Saved
                  </DropdownMenuLink>
                  <DropdownMenuLink href="/profile" icon={UserIcon}>
                    Profile
                  </DropdownMenuLink>
                  <DropdownMenu.Separator className="my-1.5 h-px bg-border" />
                  <DropdownMenu.Item
                    onSelect={handleLogout}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-coral outline-none transition-colors hover:bg-coral/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>

        {/* Mobile hamburger */}
        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Dialog.Trigger asChild>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-ink md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-xs flex-col bg-paper-raised px-5 py-4 shadow-xl transition-transform focus:outline-none">
              <div className="flex items-center justify-between">
                <Dialog.Title asChild>
                  <span className="font-display text-base font-semibold text-ink">Menu</span>
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-paper"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="mt-6 flex flex-1 flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-paper"
                  >
                    {link.label}
                  </Link>
                ))}

                {isAuthenticated && (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <Link
                      href="/dashboard"
                      onClick={() => setDrawerOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-paper"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/applications"
                      onClick={() => setDrawerOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-paper"
                    >
                      My Applications
                    </Link>
                    <Link
                      href="/saved"
                      onClick={() => setDrawerOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-paper"
                    >
                      Saved
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setDrawerOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-paper"
                    >
                      Profile
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
                {!isAuthenticated ? (
                  <>
                    {/* Login/signup are intentionally disabled for the public browsing flow. */}
                  </>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 rounded-lg border border-coral/30 px-4 py-2.5 text-sm font-semibold text-coral hover:bg-coral/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </nav>
    </header>
  );
}

function DropdownMenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={href}
        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft outline-none transition-colors hover:bg-paper hover:text-ink"
      >
        <Icon className="h-4 w-4" />
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}
