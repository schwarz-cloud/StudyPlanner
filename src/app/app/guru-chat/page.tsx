"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Clapperboard, 
  Home,
  ListChecks, 
  LogOut,
  Settings,
  UserCircle,
  Lightbulb, 
  Target, // Icon for Focus Mode
  MessageCircle, // Icon for Guru Chat
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: Home },
  { href: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/app/study-plan', label: 'Study Plan', icon: Lightbulb }, 
  { href: '/app/focus-mode', label: 'Focus Mode', icon: Target },
  // { href: '/app/guru-chat', label: 'Guru Chat', icon: MessageCircle }, // Removed Guru Chat
  { href: '/app/exams', label: 'Exams', icon: BookOpen },
  { href: '/app/lectures', label: 'Lectures', icon: Clapperboard },
  { href: '/app/quizzes', label: 'Quizzes', icon: ListChecks },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

function AppHeader() {
  const { isMobile } = useSidebar();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b shrink-0 bg-background md:px-6 print-hide">
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger />}
        {!isMobile && <div className="w-8" /> /* Placeholder for trigger alignment */}
        <div className="hidden md:block">
          <Logo iconSize={28} textSize="text-2xl" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="w-5 h-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative w-8 h-8 rounded-full">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="person avatar" />
                <AvatarFallback>SP</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon" className="print-hide">
      <SidebarHeader className="p-4">
        <div className="group-data-[collapsible=icon]:hidden">
          <Logo iconSize={28} textSize="text-2xl" />
        </div>
        <div className="hidden group-data-[collapsible=icon]:block mx-auto">
          <Logo iconSize={28} textSize="text-2xl" className="flex flex-col items-center">
             <span className="hidden">StudyPlanner</span> 
          </Logo>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/app/dashboard' && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, side: 'right', className: 'bg-primary text-primary-foreground' }}
                  asChild
                >
                  <a>
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {/* Add footer items if needed */}
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full">
          <AppHeader />
          <SidebarInset>
            <motion.main 
              key={usePathname()} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "tween", duration: 0.3 }}
              className="flex-1 p-4 md:p-6 lg:p-8 print:p-0"
            >
              {children}
            </motion.main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}