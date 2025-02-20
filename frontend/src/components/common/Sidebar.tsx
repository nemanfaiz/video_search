'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Upload, 
  Search, 
  MessageSquare,
  ChevronLeft,
  Film
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const sidebarLinks = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    title: 'Videos',
    icon: Film,
    href: '/videos',
  },
  {
    title: 'Upload',
    icon: Upload,
    href: '/upload',
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={cn(
      "h-screen border-r border-border bg-background transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center">
            <Film className="h-6 w-6" />
            <span className="ml-2 font-semibold">VideoSearch</span>
          </Link>
        )}
        {collapsed && <Film className="h-6 w-6 mx-auto" />}
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-auto" 
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform",
            collapsed && "rotate-180"
          )} />
        </Button>
      </div>
      
      <nav className="space-y-2 px-2 py-4">
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
              pathname === link.href 
                ? "bg-muted text-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <link.icon className={cn("h-5 w-5", 
              pathname === link.href ? "text-foreground" : "text-muted-foreground"
            )} />
            {!collapsed && <span className="text-sm font-medium">{link.title}</span>}
          </Link>
        ))}
      </nav>
    </div>
  )
}