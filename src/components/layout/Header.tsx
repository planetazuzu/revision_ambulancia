"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Ambulance as AppIcon, Menu, UserCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { mainNavItems } from "@/config/navigation";
import { SidebarNav } from "./SidebarNav";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";


export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
         <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
      </div>


      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Placeholder for search or other actions */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <UserCircle className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user ? user.name : 'Guest'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Add other user-specific items here if needed */}
            {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
            {/* <DropdownMenuItem>Support</DropdownMenuItem> */}
            {/* <DropdownMenuSeparator /> */}
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
