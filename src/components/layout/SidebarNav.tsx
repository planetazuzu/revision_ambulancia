"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/config/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';


interface SidebarNavProps {
  items: NavItem[];
  isCollapsed?: boolean;
}

export function SidebarNav({ items, isCollapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const { open } = useSidebar(); // Using useSidebar to get collapsed state for tooltip logic

  return (
    <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const linkContent = (
          <>
            <item.icon className={cn(
              "h-5 w-5",
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} />
            <span className={cn(
              "text-sm font-medium group-[[data-collapsed=true]]:hidden",
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {item.label}
            </span>
          </>
        );

        const linkElement = (
            <Link
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground",
                item.disabled && "cursor-not-allowed opacity-50",
                open ? "" : "justify-center" // 'open' refers to expanded state from useSidebar
              )}
              aria-disabled={item.disabled}
              tabIndex={item.disabled ? -1 : undefined}
            >
              {linkContent}
            </Link>
        );
        
        if (!open) { // Show tooltip only when sidebar is collapsed
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkElement}
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-4">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
        }

        return linkElement;

      })}
    </nav>
  );
}
