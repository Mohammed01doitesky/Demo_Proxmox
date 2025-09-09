"use client"

import { useRouter } from 'next/navigation'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container mx-auto px-4 text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl md:text-[12rem] font-bold text-primary/20 select-none">
            404
          </h1>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Page Not Found
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            {/* Go Home Button */}
            <button 
              onClick={handleGoHome}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
            
            {/* Go to Dashboard Button   */}
            <button 
              onClick={handleGoToDashboard}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-input bg-background text-foreground rounded-md font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Search className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>

          {/* Back Button */}
          <div className="pt-4">
            {/* Go Back Button */}
            <button 
              onClick={handleGoBack}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          
          {/* Floating Elements */}
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-primary/30 rounded-full animate-pulse" />
          <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-primary/20 rounded-full animate-pulse delay-1000" />
          <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-primary/40 rounded-full animate-pulse delay-500" />
        </div>
      </div>
    </div>
  )
} 