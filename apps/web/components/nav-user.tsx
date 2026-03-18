"use client"

import * as React from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useSidebar } from "@workspace/ui/components/sidebar"
import { signOut } from "next-auth/react"
import { BadgeCheckIcon, BellIcon, LogOutIcon, UserIcon } from "lucide-react"
import { SettingsDialog } from "@/components/settings-dialog"

export function NavUser({
  user,
}: {
  user: {
    id: string
    name: string
    email: string
    phone: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const [profileDialogOpen, setProfileDialogOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="focus-visible:outline-none shrink-0">
          <Avatar className="h-9 w-9 rounded-full border hover:border-primary transition-colors cursor-pointer">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-lg"
          align="end"
          side={isMobile ? "bottom" : "bottom"}
          sideOffset={8}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-full border">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full bg-muted text-xs">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setProfileDialogOpen(true)} className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              Profil Saya
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive cursor-pointer"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOutIcon className="mr-2 h-4 w-4" />
            Keluar Sistem
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsDialog
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        }}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </>
  )
}
