import { useEffect, useRef } from 'react'
import anime from 'animejs'
import { AnimatedLogo } from './common/Logo'

export default function LoadingScreen() {
  const containerRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      anime({
        targets: containerRef.current,
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 1000,
        easing: 'easeOutCubic'
      })
    }

    if (textRef.current) {
      anime({
        targets: textRef.current,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 800,
        delay: 500,
        easing: 'easeOutCubic'
      })
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center animated-bg">
      <div ref={containerRef} className="glass-panel p-8 text-center max-w-md">
        {/* Animated Logo */}
        <div className="mb-6">
          <AnimatedLogo size="xl" />
        </div>

        {/* Brand Text */}
        <div ref={textRef} className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gold">It</span>
            <span className="text-green-400 text-4xl">$</span>
            <span className="text-gold">ell's</span>
          </h1>
          <p className="text-gold/80 text-sm">
            Sistema de Gestão Premium
          </p>
          <p className="text-gold/60 text-xs mt-1">
            Revolucionando a experiência gastronômica
          </p>
        </div>

        {/* Loading Animation */}
        <div className="flex items-center justify-center space-x-3">
          <div className="luxury-spinner"></div>
          <span className="text-gold/80 text-sm">Carregando...</span>
        </div>

        {/* Loading Dots Animation */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gold rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gold rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}

