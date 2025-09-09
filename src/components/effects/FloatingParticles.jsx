import React, { useEffect, useRef } from 'react';

export default function FloatingParticles({ count = 12, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Criar partículas dinamicamente para melhor performance
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Posicionamento aleatório
      const left = Math.random() * 100;
      const animationDelay = Math.random() * 5;
      const animationDuration = 15 + Math.random() * 10;
      const size = 2 + Math.random() * 4;
      
      particle.style.left = `${left}%`;
      particle.style.animationDelay = `${animationDelay}s`;
      particle.style.animationDuration = `${animationDuration}s`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Diferentes tipos de partículas
      if (i % 3 === 0) {
        particle.style.background = 'radial-gradient(circle, var(--gold-400), transparent)';
      } else if (i % 3 === 1) {
        particle.style.background = 'radial-gradient(circle, var(--neon-cyan), transparent)';
      } else {
        particle.style.background = 'radial-gradient(circle, var(--platinum), transparent)';
      }
      
      particles.push(particle);
      containerRef.current.appendChild(particle);
    }

    // Cleanup
    return () => {
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, [count]);

  return (
    <div 
      ref={containerRef}
      className={`particles-container ${className}`}
      aria-hidden="true"
    />
  );
}

// Componente para partículas específicas de seções
export function SectionParticles({ section = 'default', intensity = 'normal' }) {
  const counts = {
    light: 6,
    normal: 12,
    intense: 20
  };
  
  const count = counts[intensity] || counts.normal;
  
  return (
    <FloatingParticles 
      count={count}
      className={`particles-${section}`}
    />
  );
}

// Componente para efeito de brilho ambiente
export function AmbientGlow({ color = 'gold', size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48', 
    lg: 'w-64 h-64',
    xl: 'w-80 h-80'
  };
  
  const colors = {
    gold: 'bg-gradient-radial from-gold-400/20 via-gold-400/10 to-transparent',
    cyan: 'bg-gradient-radial from-neon-cyan/20 via-neon-cyan/10 to-transparent',
    pink: 'bg-gradient-radial from-neon-pink/20 via-neon-pink/10 to-transparent'
  };
  
  return (
    <div 
      className={`
        absolute pointer-events-none blur-3xl animate-pulse
        ${sizes[size]} ${colors[color]} ${className}
      `}
      style={{
        animationDuration: '4s',
        animationTimingFunction: 'ease-in-out'
      }}
    />
  );
}