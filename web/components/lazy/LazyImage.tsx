'use client'

import { useState } from 'react'
import { Image } from 'antd'
import { useInView } from 'react-intersection-observer'

interface LazyImageProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  className?: string
  preview?: boolean
  fallback?: string
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  preview = false,
  fallback = '/placeholder.png',
}: LazyImageProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [isLoaded, setIsLoaded] = useState(false)

  if (!inView) {
    return (
      <div
        ref={ref}
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height }}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      preview={preview}
      fallback={fallback}
      onLoad={() => setIsLoaded(true)}
      placeholder={
        <div
          className={`bg-gray-200 animate-pulse ${className}`}
          style={{ width, height }}
        />
      }
    />
  )
}

export default LazyImage
