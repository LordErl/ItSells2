import { useEffect, useRef } from 'react'
import anime from 'animejs'

export default function Logo({ size = 'md', animated = false, className = '' }) {
  const logoRef = useRef(null)
  const dollarRef = useRef(null)

  const sizes = {
    xs: { container: 'w-8 h-8', text: 'text-sm', dollar: 'text-xs' },
    sm: { container: 'w-12 h-12', text: 'text-lg', dollar: 'text-sm' },
    md: { container: 'w-16 h-16', text: 'text-2xl', dollar: 'text-lg' },
    lg: { container: 'w-20 h-20', text: 'text-3xl', dollar: 'text-xl' },
    xl: { container: 'w-24 h-24', text: 'text-4xl', dollar: 'text-2xl' }
  }

  useEffect(() => {
    if (animated && logoRef.current) {
      // Animate logo entrance
      anime({
        targets: logoRef.current,
        scale: [0, 1],
        opacity: [0, 1],
        duration: 1000,
        easing: 'easeOutElastic(1, .8)'
      })

      // Animate dollar sign with special effect
      if (dollarRef.current) {
        anime({
          targets: dollarRef.current,
          scale: [1, 1.2, 1],
          color: ['#FFD700', '#00FFFF', '#FFD700'],
          duration: 2000,
          delay: 500,
          loop: true,
          easing: 'easeInOutSine'
        })
      }
    }
  }, [animated])

  return (
    <div 
      ref={logoRef}
      className={`${sizes[size].container} ${className} relative flex items-center justify-center`}
    >
      {/* Background Circle with Gradient */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-lg">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-white/40"></div>
      </div>
      
      {/* Logo Text */}
      <div className={`relative z-10 font-bold text-black ${sizes[size].text} tracking-tight`}>
        <span className="relative">
          It
          <span 
            ref={dollarRef}
            className={`${sizes[size].dollar} font-extrabold text-green-600 relative inline-block mx-0.5`}
            style={{
              textShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
              filter: 'drop-shadow(0 0 3px rgba(0, 255, 0, 0.8))'
            }}
          >
            $
          </span>
          ell's
        </span>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-white/60 rounded-full blur-sm animate-pulse"></div>
      </div>
    </div>
  )
}

// Logo with Text variant
export function LogoWithText({ size = 'md', animated = false, className = '' }) {
  const containerRef = useRef(null)

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm', 
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  }

  useEffect(() => {
    if (animated && containerRef.current) {
      anime({
        targets: containerRef.current.children,
        translateX: [-50, 0],
        opacity: [0, 1],
        duration: 800,
        delay: anime.stagger(200),
        easing: 'easeOutCubic'
      })
    }
  }, [animated])

  return (
    <div ref={containerRef} className={`flex items-center space-x-3 ${className}`}>
      <Logo size={size} animated={animated} />
      <div className="flex flex-col">
        <h1 className={`font-bold text-gold-gradient ${textSizes[size]} tracking-wide`}>
          It<span className="text-green-400">$</span>ell's
        </h1>
        <p className="text-gold/80 text-xs">
          Sistema de Gestão Premium
        </p>
      </div>
    </div>
  )
}

// Animated Logo for Loading Screens
export function AnimatedLogo({ size = 'xl' }) {
  const containerRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    if (containerRef.current) {
      // Main logo animation
      anime({
        targets: containerRef.current,
        scale: [0, 1],
        rotate: [0, 360],
        opacity: [0, 1],
        duration: 1500,
        easing: 'easeOutElastic(1, .6)'
      })

      // Floating particles animation
      particlesRef.current.forEach((particle, index) => {
        if (particle) {
          anime({
            targets: particle,
            translateY: [-20, 20],
            opacity: [0.3, 1, 0.3],
            scale: [0.5, 1, 0.5],
            duration: 2000 + (index * 200),
            loop: true,
            easing: 'easeInOutSine',
            delay: index * 300
          })
        }
      })
    }
  }, [])

  return (
    <div className="relative flex items-center justify-center">
      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          ref={el => particlesRef.current[i] = el}
          className="absolute w-2 h-2 bg-gold rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: `translate(-50%, -50%)`
          }}
        />
      ))}
      
      {/* Main Logo */}
      <div ref={containerRef}>
        <Logo size={size} animated={true} />
      </div>
    </div>
  )
}

