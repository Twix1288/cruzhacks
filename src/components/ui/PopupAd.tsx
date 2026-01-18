'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { Card } from './Card'
import { cn } from '@/utils/cn'

export function PopupAd() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [prevPathname, setPrevPathname] = useState<string | null>(null)

  useEffect(() => {
    // Show pop-up when navigating from login to home/dashboard
    if (prevPathname === '/login' && (pathname === '/' || pathname === '/ranger')) {
      setIsVisible(true)
    }
    setPrevPathname(pathname)
  }, [pathname, prevPathname])

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card 
        variant="glass" 
        className={cn(
          "relative max-w-md w-full mx-4 p-8 border-zinc-800/60 bg-zinc-900/80 backdrop-blur-xl shadow-2xl",
          "animate-in zoom-in-95 duration-200"
        )}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800/50"
          aria-label="Close ad"
        >
          <X size={20} />
        </button>

        {/* Ad content */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              enter ad here
            </h2>
          </div>
        </div>
      </Card>
    </div>
  )
}
