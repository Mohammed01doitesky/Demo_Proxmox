"use client"

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from './button'
import { ThemeToggle } from '@/components/theme-toggle'
import { memo, useMemo } from 'react'

interface NavbarControlsProps {
  showAuth?: boolean
  showThemeToggle?: boolean
}

const NavbarControls = memo(function NavbarControls({ 
  showAuth = true, 
  showThemeToggle = true 
}: NavbarControlsProps) {
  // Memoize the auth section to prevent Clerk re-renders
  const authSection = useMemo(() => {
    if (!showAuth) return null
    
    return (
      <div className="flex items-center gap-2">
        <SignedOut>
          <SignInButton mode="modal">
            <Button size='sm' variant="ghost" className="h-8 px-3 text-xs">
              <span className="hidden sm:inline">Sign in</span>
              <span className="sm:hidden">Sign in</span>
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton 
            afterSignOutUrl="/" 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }}
          />
        </SignedIn>
      </div>
    )
  }, [showAuth])

  // Memoize the theme section
  const themeSection = useMemo(() => {
    if (!showThemeToggle) return null
    
    return (
      <div className="flex items-center">
        <ThemeToggle />
      </div>
    )
  }, [showThemeToggle])

  return (
    <div className="flex items-center gap-2">
      {themeSection}
      {authSection}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders when props haven't changed
  return prevProps.showAuth === nextProps.showAuth && 
         prevProps.showThemeToggle === nextProps.showThemeToggle
})

export { NavbarControls } 