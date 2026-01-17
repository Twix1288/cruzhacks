'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface GradientTextProps {
  children: ReactNode
  className?: string
  variant?: 'emerald' | 'purple' | 'blue' | 'orange' | 'rainbow'
  animate?: boolean
}

const gradientVariants = {
  emerald: 'from-emerald-400 via-emerald-300 to-emerald-500',
  purple: 'from-purple-400 via-pink-300 to-purple-500',
  blue: 'from-blue-400 via-cyan-300 to-blue-500',
  orange: 'from-orange-400 via-red-300 to-orange-500',
  rainbow: 'from-emerald-400 via-blue-400 via-purple-400 to-pink-400',
}

export function GradientText({
  children,
  className,
  variant = 'emerald',
  animate = true,
}: GradientTextProps) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r bg-clip-text text-transparent',
        gradientVariants[variant],
        animate && 'bg-[length:200%_auto] animate-gradient-shift'
      )}
      style={animate ? {
        backgroundSize: '200% auto',
      } : undefined}
    >
      {children}
    </span>
  )
}
