'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/utils/cn'

interface TypeTextProps {
  text: string | string[]
  speed?: number
  deleteSpeed?: number
  delay?: number
  loop?: boolean
  className?: string
  cursor?: boolean
  cursorChar?: string
  cursorClassName?: string
}

export function TypeText({
  text,
  speed = 100,
  deleteSpeed = 50,
  delay = 0,
  loop = false,
  className,
  cursor = true,
  cursorChar = '|',
  cursorClassName,
}: TypeTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(true)

  const texts = Array.isArray(text) ? text : [text]

  useEffect(() => {
    if (delay > 0 && isPaused) {
      const delayTimer = setTimeout(() => setIsPaused(false), delay)
      return () => clearTimeout(delayTimer)
    }

    if (isPaused) return

    const currentText = texts[currentIndex]
    const currentSpeed = isDeleting ? deleteSpeed : speed

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayedText.length < currentText.length) {
          setDisplayedText(currentText.slice(0, displayedText.length + 1))
        } else {
          // Finished typing, wait before deleting (if loop)
          if (loop) {
            setTimeout(() => setIsDeleting(true), 2000)
          }
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1))
        } else {
          setIsDeleting(false)
          setCurrentIndex((prev) => (prev + 1) % texts.length)
        }
      }
    }, currentSpeed)

    return () => clearTimeout(timer)
  }, [displayedText, isDeleting, currentIndex, texts, speed, deleteSpeed, loop, delay, isPaused])

  return (
    <span className={cn('inline-block', className)}>
      {displayedText}
      {cursor && (
        <span
          className={cn(
            'inline-block ml-1 animate-pulse',
            cursorClassName
          )}
        >
          {cursorChar}
        </span>
      )}
    </span>
  )
}
