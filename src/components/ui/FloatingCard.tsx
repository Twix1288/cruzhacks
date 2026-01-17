'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface FloatingCardProps {
  children: ReactNode
  className?: string
  floatSpeed?: 'slow' | 'medium' | 'fast'
  floatDistance?: 'small' | 'medium' | 'large'
}

const speedMap = {
  slow: 'animate-float-slow',
  medium: 'animate-float-medium',
  fast: 'animate-float-fast',
}

const distanceMap = {
  small: 'translate-y-2',
  medium: 'translate-y-4',
  large: 'translate-y-6',
}

export function FloatingCard({
  children,
  className,
  floatSpeed = 'medium',
  floatDistance = 'medium',
}: FloatingCardProps) {
  return (
    <div
      className={cn(
        'transition-transform duration-300 hover:scale-105',
        speedMap[floatSpeed],
        className
      )}
    >
      {children}
    </div>
  )
}
