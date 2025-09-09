"use client"

import { NavBar } from '@/components/ui/tubelight-navbar'
import { Home, LayoutDashboard, Monitor, Server, Sparkles} from 'lucide-react'

import { NavbarControls } from '@/components/ui/navbar-controls'

export default function Header() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { name: 'Cluster', url: '/cluster', icon: Server },
    { name: 'AI Assistant', url: '/mohseen', icon: Sparkles },
    { name: 'Demo', url: '/demo-dashboard', icon: Monitor }
  ]

  return (
    <header className='py-4'>
      <nav className='container max-w-7xl mx-auto px-5 md:px-10 xl:px-20 flex items-center justify-between'>
        {/* Empty space for balance */}
        <div className='w-32 hidden md:block'></div>
        
        {/* Centered Navbar */}
        <div className='flex-1 flex justify-center md:justify-center'>
          <NavBar items={navItems}/>
        </div>
        
        {/* Right side auth controls */}
        <div className='w-auto md:w-32 flex justify-end items-center gap-2'>
          <NavbarControls showAuth={true} showThemeToggle={true} />
        </div>
      </nav>
    </header>
  )
}
