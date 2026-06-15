<<<<<<< HEAD
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
=======
'use client';

import { useState } from 'react';
import { Image } from 'antd';
import { useInView } from 'react-intersection-observer';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  preview?: boolean;
  fallback?: string;
>>>>>>> 962968886be726cd434c792933b5515366d34518
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
<<<<<<< HEAD
  })

  const [isLoaded, setIsLoaded] = useState(false)
=======
  });

  const [isLoaded, setIsLoaded] = useState(false);
>>>>>>> 962968886be726cd434c792933b5515366d34518

  if (!inView) {
    return (
      <div
        ref={ref}
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height }}
      />
<<<<<<< HEAD
    )
=======
    );
>>>>>>> 962968886be726cd434c792933b5515366d34518
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
<<<<<<< HEAD
        <div
          className={`bg-gray-200 animate-pulse ${className}`}
          style={{ width, height }}
        />
      }
    />
  )
}

export default LazyImage
=======
        <div className={`bg-gray-200 animate-pulse ${className}`} style={{ width, height }} />
      }
    />
  );
}

export default LazyImage;
>>>>>>> 962968886be726cd434c792933b5515366d34518
