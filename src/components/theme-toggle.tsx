'use client'

import { useEffect, useState, memo, useCallback } from 'react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'

export const ThemeToggle = memo(function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [setTheme, resolvedTheme])

  if (!mounted) {
    // Return a placeholder with same dimensions to prevent layout shift
    return (
      <Button
        size='sm'
        variant='ghost'
        disabled
        style={{ opacity: 0, pointerEvents: 'none' }}
        suppressHydrationWarning
      >
        <MoonIcon className='size-4' suppressHydrationWarning />
        <span className='sr-only'>Loading theme</span>
      </Button>
    )
  }

  return (
    <Button
      size='sm'
      variant='ghost'
      onClick={toggleTheme}
      suppressHydrationWarning
    >
      {resolvedTheme === 'dark' ? (
        <SunIcon className='size-4 text-orange-300' suppressHydrationWarning />
      ) : (
        <MoonIcon className='size-4 text-sky-950' suppressHydrationWarning />
      )}

      <span className='sr-only'>Toggle theme</span>
    </Button>
  )
})
