
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, Home, Search, Users, PlayCircle, LayoutDashboard, Stethoscope, Siren, Briefcase } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ThemeSwitcher from './ThemeSwitcher';
import { toast } from 'sonner';
import SiteLogo from './SiteLogo';

/** Public FixItNow chrome — Contact lives in the footer (audit §5.1). */
const navItems = [
  { href: '/tech', label: 'Home', icon: Home },
  { href: '/tech/services', label: 'Services', icon: Search },
  { href: '/tech/find-technicians', label: 'Find Technicians', icon: Users },
  { href: '/tech/guide', label: 'Diagnose', icon: Stethoscope, testId: 'nav-diagnose' },
  { href: '/tech/emergency', label: 'Emergency', icon: Siren, testId: 'nav-emergency' },
  { href: '/tech/how-it-works', label: 'How It Works', icon: PlayCircle },
];

type IUser = {
  success: boolean,
  message: string,
  data?: {
    profile?: {
      id: string,
      name: string,
      email: string,
      phone: string,
      activeStatus: string,
      role: string,
      isVerified: boolean,
      lastLoginAt: string | null;
      userStatus: string | null;
      createdAt: string;
      updatedAt: string;
      technicianProfile?: null;
    }
  }
}


type NavbarProps = {
  user: IUser
}




export default function Navbar({ user }: NavbarProps) {

  const pathname = usePathname();

      const router = useRouter();

  // login state from props
const profile = user?.data?.profile;
const isLoggedIn = !!user?.success && !!profile;

  const handleLogout = async () => {
  try {
    toast.loading("Logging out...", { id: "logout" });

    await fetch("/api/auth/sign-out", { method: "POST" });

    toast.success("Logged out successfully!", { 
      id: "logout",
      description: "See you soon 👋"
    });

    router.replace("/");   

  } catch (error) {
    console.error("Logout error:", error);
    
    toast.error("Failed to logout", {
      id: "logout",
      description: "Please try again",
    });
  }
};

  const navLinkActive = (href: string) =>
    href === "/tech" ? pathname === "/tech" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <SiteLogo/>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-7">
            {navItems.map((item) => {
              const isActive = navLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={item.testId}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-foreground whitespace-nowrap",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side - Auth Section */}
          <div className="flex items-center gap-3">

            {/* === Theme Switcher (Dropdown) === */}
            <ThemeSwitcher />

            {isLoggedIn && profile ? (
              <>
                <Button variant="ghost" asChild className="hidden md:inline-flex">
                  <Link href="/tech/jobs" data-testid="nav-my-jobs">
                    <Briefcase className="mr-2 h-4 w-4" />
                    My jobs
                  </Link>
                </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                      <AvatarFallback>User</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.data?.profile?.name || "Name"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                       {user.data?.profile?.email || "Email"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/tech/jobs" className="cursor-pointer" data-testid="nav-my-jobs-menu">
                      <Briefcase className="mr-2 h-4 w-4" />
                      My jobs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tech/jobs" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              /* === Not Logged In: Login + Sign Up === */
              <div className="hidden md:flex items-center gap-3">
                <Button variant="ghost" asChild>
                  <Link href="/?next=/tech">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/?next=/tech">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-6 pt-8">
                  <div className="flex items-center gap-3 px-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                      <span className="text-lg font-bold text-primary-foreground">F</span>
                    </div>
                    <span className="font-semibold text-2xl">Dial a Tech</span>
                  </div>

                  {/* Nav Links */}
                  <div className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        data-testid={item.testId ? `${item.testId}-mobile` : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors",
                          navLinkActive(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {/* Auth Section in Mobile */}
                  <div className="border-t pt-6 mt-auto">
                    {isLoggedIn && profile ?(
                      <>
                        <div className="px-4 text-sm text-muted-foreground mb-4">Account</div>
                        <div className="space-y-1">
                          <Link href="/tech/jobs" className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-muted" data-testid="nav-my-jobs-mobile">
                            <Briefcase className="h-5 w-5" /> My jobs
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-destructive hover:bg-destructive/10"
                          >
                            <LogOut className="h-5 w-5" /> Log out
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-3 px-2">
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/?next=/tech">Login</Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href="/?next=/tech">Sign Up</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
