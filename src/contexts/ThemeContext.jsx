import React, { createContext, useContext, useState, useEffect } from 'react';

// Temas disponíveis
const themes = {
  luxury: {
    name: 'Luxury Gold',
    primary: 'var(--gold-400)',
    secondary: 'var(--neon-cyan)',
    accent: 'var(--neon-pink)',
    background: 'var(--gray-950)',
    surface: 'rgba(0, 0, 0, 0.8)',
    text: 'var(--gold-400)',
    description: 'Tema principal com dourado premium'
  },
  platinum: {
    name: 'Platinum Elite',
    primary: 'var(--platinum)',
    secondary: 'var(--neon-cyan)',
    accent: 'var(--champagne)',
    background: 'var(--gray-900)',
    surface: 'rgba(26, 26, 26, 0.8)',
    text: 'var(--platinum)',
    description: 'Tema elegante com tons de platina'
  },
  emerald: {
    name: 'Emerald Professional',
    primary: 'var(--emerald)',
    secondary: 'var(--neon-green)',
    accent: 'var(--gold-400)',
    background: 'var(--gray-950)',
    surface: 'rgba(0, 0, 0, 0.8)',
    text: 'var(--emerald)',
    description: 'Tema profissional com verde esmeralda'
  },
  sapphire: {
    name: 'Sapphire Tech',
    primary: 'var(--sapphire)',
    secondary: 'var(--neon-cyan)',
    accent: 'var(--neon-purple)',
    background: 'var(--gray-950)',
    surface: 'rgba(0, 0, 0, 0.8)',
    text: 'var(--sapphire)',
    description: 'Tema tecnológico com azul safira'
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('luxury');
  const [animations, setAnimations] = useState(true);
  const [particles, setParticles] = useState(true);
  const [glowEffects, setGlowEffects] = useState(true);

  // Carregar tema salvo
  useEffect(() => {
    const savedTheme = localStorage.getItem('itsells_theme');
    const savedAnimations = localStorage.getItem('itsells_animations');
    const savedParticles = localStorage.getItem('itsells_particles');
    const savedGlow = localStorage.getItem('itsells_glow');

    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    if (savedAnimations !== null) {
      setAnimations(JSON.parse(savedAnimations));
    }
    if (savedParticles !== null) {
      setParticles(JSON.parse(savedParticles));
    }
    if (savedGlow !== null) {
      setGlowEffects(JSON.parse(savedGlow));
    }
  }, []);

  // Aplicar tema ao documento
  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;

    // Aplicar variáveis do tema
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-background', theme.background);
    root.style.setProperty('--theme-surface', theme.surface);
    root.style.setProperty('--theme-text', theme.text);

    // Classes de controle
    root.classList.toggle('animations-disabled', !animations);
    root.classList.toggle('particles-disabled', !particles);
    root.classList.toggle('glow-disabled', !glowEffects);

    // Salvar preferências
    localStorage.setItem('itsells_theme', currentTheme);
    localStorage.setItem('itsells_animations', JSON.stringify(animations));
    localStorage.setItem('itsells_particles', JSON.stringify(particles));
    localStorage.setItem('itsells_glow', JSON.stringify(glowEffects));
  }, [currentTheme, animations, particles, glowEffects]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const toggleAnimations = () => {
    setAnimations(!animations);
  };

  const toggleParticles = () => {
    setParticles(!particles);
  };

  const toggleGlowEffects = () => {
    setGlowEffects(!glowEffects);
  };

  const resetToDefaults = () => {
    setCurrentTheme('luxury');
    setAnimations(true);
    setParticles(true);
    setGlowEffects(true);
  };

  const value = {
    // Estado atual
    currentTheme,
    theme: themes[currentTheme],
    themes,
    animations,
    particles,
    glowEffects,

    // Ações
    changeTheme,
    toggleAnimations,
    toggleParticles,
    toggleGlowEffects,
    resetToDefaults,

    // Utilitários
    getThemeClass: (element) => `theme-${currentTheme}-${element}`,
    isTheme: (themeName) => currentTheme === themeName
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook para aplicar classes de tema automaticamente
export function useThemeClasses(baseClasses = '') {
  const { currentTheme, animations, glowEffects } = useTheme();
  
  const themeClasses = [
    baseClasses,
    `theme-${currentTheme}`,
    !animations && 'no-animations',
    !glowEffects && 'no-glow'
  ].filter(Boolean).join(' ');

  return themeClasses;
}

// Componente para seletor de tema
export function ThemeSelector({ className = '' }) {
  const { currentTheme, themes, changeTheme } = useTheme();

  return (
    <div className={`theme-selector ${className}`}>
      <h3 className="text-lg font-semibold text-gold/90 mb-4">
        Selecionar Tema
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {Object.entries(themes).map(([key, theme]) => (
          <button
            key={key}
            onClick={() => changeTheme(key)}
            className={`
              p-4 rounded-lg border transition-all duration-300 text-left
              ${currentTheme === key 
                ? 'border-gold-400 bg-gold-400/10 text-gold-300' 
                : 'border-gold-400/30 bg-black/20 text-gold/70 hover:border-gold-400/50 hover:bg-gold-400/5'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium mb-1">{theme.name}</h4>
                <p className="text-xs opacity-70">{theme.description}</p>
              </div>
              <div className="flex gap-1">
                <div 
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: theme.primary }}
                />
                <div 
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: theme.secondary }}
                />
                <div 
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: theme.accent }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Componente para configurações visuais
export function VisualSettings({ className = '' }) {
  const { 
    animations, 
    particles, 
    glowEffects,
    toggleAnimations,
    toggleParticles,
    toggleGlowEffects,
    resetToDefaults
  } = useTheme();

  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-gold-400/20">
      <div>
        <h4 className="font-medium text-gold/90 mb-1">{label}</h4>
        <p className="text-xs text-gold/60">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`
          relative w-12 h-6 rounded-full transition-colors duration-300
          ${checked ? 'bg-gold-400' : 'bg-gray-600'}
        `}
      >
        <div className={`
          absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300
          ${checked ? 'translate-x-7' : 'translate-x-1'}
        `} />
      </button>
    </div>
  );

  return (
    <div className={`visual-settings ${className}`}>
      <h3 className="text-lg font-semibold text-gold/90 mb-4">
        Configurações Visuais
      </h3>
      
      <div className="space-y-3">
        <ToggleSwitch
          checked={animations}
          onChange={toggleAnimations}
          label="Animações"
          description="Ativar efeitos de transição e animações"
        />
        
        <ToggleSwitch
          checked={particles}
          onChange={toggleParticles}
          label="Partículas"
          description="Mostrar partículas flutuantes no fundo"
        />
        
        <ToggleSwitch
          checked={glowEffects}
          onChange={toggleGlowEffects}
          label="Efeitos de Brilho"
          description="Ativar efeitos de brilho e hover"
        />
      </div>

      <button
        onClick={resetToDefaults}
        className="mt-6 w-full py-2 px-4 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-colors border border-gray-500/30"
      >
        Restaurar Padrões
      </button>
    </div>
  );
}