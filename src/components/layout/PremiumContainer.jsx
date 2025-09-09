import React from 'react';

// Container principal premium
export default function PremiumContainer({ 
  children, 
  className = '', 
  variant = 'default',
  animated = true,
  glowEffect = false 
}) {
  const variants = {
    default: 'glass-advanced',
    card: 'metric-card-premium',
    modal: 'modal-premium',
    panel: 'glass-panel'
  };
  
  const animationClass = animated ? 'slide-in-elegant' : '';
  const glowClass = glowEffect ? 'hover-glow' : '';
  
  return (
    <div className={`
      ${variants[variant]}
      ${animationClass}
      ${glowClass}
      ${className}
    `}>
      {children}
    </div>
  );
}

// Grid system premium
export function PremiumGrid({ 
  children, 
  cols = 'auto-fit', 
  gap = 'lg',
  className = '' 
}) {
  const gaps = {
    sm: 'gap-4',
    md: 'gap-6', 
    lg: 'gap-8',
    xl: 'gap-10'
  };
  
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    'auto-fit': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };
  
  return (
    <div className={`
      grid ${gridCols[cols]} ${gaps[gap]}
      ${className}
    `}>
      {children}
    </div>
  );
}

// Card de métrica premium
export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'gold',
  trend,
  onClick,
  loading = false,
  className = ''
}) {
  const colors = {
    gold: 'text-gold-400',
    cyan: 'text-neon-cyan',
    pink: 'text-neon-pink', 
    green: 'text-neon-green',
    purple: 'text-neon-purple'
  };
  
  const bgColors = {
    gold: 'bg-gold-400/20',
    cyan: 'bg-neon-cyan/20',
    pink: 'bg-neon-pink/20',
    green: 'bg-neon-green/20', 
    purple: 'bg-neon-purple/20'
  };
  
  if (loading) {
    return (
      <div className={`metric-card-premium animate-pulse ${className}`}>
        <div className="flex items-center justify-between p-6">
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded mb-3"></div>
            <div className="h-8 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
          </div>
          <div className="w-14 h-14 bg-gray-700 rounded-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`
        metric-card-premium ripple-effect
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gold/80 text-sm font-medium mb-1">
            {title}
          </p>
          <p className={`text-3xl font-bold ${colors[color]} mb-1`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gold/60 flex items-center gap-1">
              {trend && (
                <span className={trend > 0 ? 'text-green-400' : 'text-red-400'}>
                  {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
                </span>
              )}
              {subtitle}
            </p>
          )}
        </div>
        
        {icon && (
          <div className={`
            w-14 h-14 ${bgColors[color]} rounded-full 
            flex items-center justify-center
            transition-all duration-300 group-hover:scale-110
          `}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Seção premium com espaçamento otimizado
export function PremiumSection({ 
  children, 
  title, 
  subtitle,
  className = '',
  spacing = 'normal',
  background = 'transparent'
}) {
  const spacings = {
    tight: 'py-8 px-4',
    normal: 'py-12 px-6',
    loose: 'py-16 px-8',
    xl: 'py-20 px-10'
  };
  
  const backgrounds = {
    transparent: '',
    subtle: 'bg-gradient-to-b from-transparent via-black/20 to-transparent',
    panel: 'glass-advanced'
  };
  
  return (
    <section className={`
      ${spacings[spacing]} ${backgrounds[background]}
      ${className}
    `}>
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && (
            <h2 className="text-3xl font-display font-bold gradient-text-animated mb-4">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gold/80 text-lg max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

// Loading state premium
export function PremiumLoading({ text = 'Carregando...', size = 'md' }) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className="loading-luxury">
        <div className="loading-dots">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
        <span className={`text-gold/80 ml-3 ${sizes[size]}`}>
          {text}
        </span>
      </div>
    </div>
  );
}

// Button premium com efeitos avançados
export function PremiumButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  glowEffect = false,
  rippleEffect = true,
  className = '',
  ...props 
}) {
  const variants = {
    primary: 'btn-luxury',
    secondary: 'btn-secondary', 
    ghost: 'btn-ghost',
    danger: 'btn-danger'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  const effectClasses = [
    variants[variant],
    sizes[size],
    glowEffect ? 'hover-glow' : '',
    rippleEffect ? 'ripple-effect' : '',
    loading || disabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button 
      className={effectClasses}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="loading-dots mr-2">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
          Carregando...
        </div>
      ) : (
        children
      )}
    </button>
  );
}