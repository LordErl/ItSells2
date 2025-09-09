import { useState, useEffect, useCallback } from 'react';

// Hook para gerenciar configurações de acessibilidade
export function useAccessibility() {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    keyboardNavigation: false,
    screenReader: false,
    fontSize: 'normal', // small, normal, large, extra-large
    theme: 'auto' // auto, light, dark
  });

  // Detectar preferências do sistema
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      darkMode: window.matchMedia('(prefers-color-scheme: dark)')
    };

    const updatePreferences = () => {
      setPreferences(prev => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
        theme: mediaQueries.darkMode.matches ? 'dark' : 'light'
      }));
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    // Cleanup
    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  // Detectar navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setPreferences(prev => ({ ...prev, keyboardNavigation: true }));
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      setPreferences(prev => ({ ...prev, keyboardNavigation: false }));
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Aplicar configurações ao documento
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // High contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font size
    root.classList.remove('font-small', 'font-normal', 'font-large', 'font-extra-large');
    root.classList.add(`font-${preferences.fontSize}`);

    // Theme
    if (preferences.theme !== 'auto') {
      root.classList.add(`theme-${preferences.theme}`);
    }

    // Keyboard navigation
    if (preferences.keyboardNavigation) {
      body.classList.add('keyboard-navigation');
    }

  }, [preferences]);

  // Métodos para alterar configurações
  const toggleReducedMotion = useCallback(() => {
    setPreferences(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setPreferences(prev => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const setFontSize = useCallback((size) => {
    setPreferences(prev => ({ ...prev, fontSize: size }));
  }, []);

  const setTheme = useCallback((theme) => {
    setPreferences(prev => ({ ...prev, theme }));
  }, []);

  const announceToScreenReader = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return {
    preferences,
    toggleReducedMotion,
    toggleHighContrast,
    setFontSize,
    setTheme,
    announceToScreenReader,
    
    // Utility functions
    shouldReduceMotion: preferences.reducedMotion,
    shouldUseHighContrast: preferences.highContrast,
    isUsingKeyboard: preferences.keyboardNavigation,
    currentFontSize: preferences.fontSize,
    currentTheme: preferences.theme
  };
}

// Hook para performance otimizada
export function usePerformance() {
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    // Detectar tipo de conexão
    if ('connection' in navigator) {
      const connection = navigator.connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      const updateConnection = () => {
        setConnectionType(connection.effectiveType || 'unknown');
        
        // Considerar low performance para conexões lentas
        const slowConnections = ['slow-2g', '2g'];
        setIsLowPerformance(slowConnections.includes(connection.effectiveType));
      };

      connection.addEventListener('change', updateConnection);
      updateConnection();

      return () => {
        connection.removeEventListener('change', updateConnection);
      };
    }

    // Detectar performance do dispositivo
    if ('deviceMemory' in navigator) {
      const deviceMemory = navigator.deviceMemory;
      if (deviceMemory < 4) {
        setIsLowPerformance(true);
      }
    }

    // Detectar hardware acceleration
    if ('hardwareConcurrency' in navigator) {
      const cores = navigator.hardwareConcurrency;
      if (cores < 4) {
        setIsLowPerformance(true);
      }
    }
  }, []);

  // Aplicar otimizações baseadas na performance
  useEffect(() => {
    const root = document.documentElement;

    if (isLowPerformance) {
      root.classList.add('low-performance');
      // Desabilitar efeitos custosos
      root.style.setProperty('--animation-duration', '0.1s');
      root.style.setProperty('--particles-enabled', '0');
    } else {
      root.classList.remove('low-performance');
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--particles-enabled');
    }
  }, [isLowPerformance]);

  const optimizeForPerformance = useCallback((enabled = true) => {
    setIsLowPerformance(enabled);
  }, []);

  return {
    isLowPerformance,
    connectionType,
    optimizeForPerformance,
    
    // Performance recommendations
    shouldDisableAnimations: isLowPerformance || connectionType === 'slow-2g',
    shouldDisableParticles: isLowPerformance,
    shouldUseWebP: 'webp' in document.createElement('canvas').getContext('2d'),
    shouldPreloadCritical: connectionType !== 'slow-2g'
  };
}

// Hook para Intersection Observer
export function useIntersectionObserver(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  const elementRef = useCallback(node => {
    if (node !== null) {
      const observer = new IntersectionObserver(([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      }, {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      });

      observer.observe(node);

      return () => observer.disconnect();
    }
  }, [hasBeenVisible, options]);

  return { elementRef, isVisible, hasBeenVisible };
}

// Hook para lazy loading de componentes
export function useLazyLoad(shouldLoad = true) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { elementRef, isVisible } = useIntersectionObserver();

  useEffect(() => {
    if (isVisible && shouldLoad && !isLoaded) {
      setIsLoaded(true);
    }
  }, [isVisible, shouldLoad, isLoaded]);

  return { elementRef, isLoaded, isVisible };
}

// Hook para gerenciar focus trap
export function useFocusTrap(isActive = false) {
  const containerRef = useCallback(node => {
    if (node && isActive) {
      const focusableElements = node.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      node.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        node.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isActive]);

  return containerRef;
}