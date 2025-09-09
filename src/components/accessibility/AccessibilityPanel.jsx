import React, { useState } from 'react';
import { useAccessibility, usePerformance } from '../../hooks/useAccessibility';
import { useTheme } from '../../contexts/ThemeContext';

export default function AccessibilityPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('visual');
  
  const {
    preferences,
    toggleReducedMotion,
    toggleHighContrast,
    setFontSize,
    setTheme: setAccessibilityTheme,
    announceToScreenReader
  } = useAccessibility();
  
  const {
    isLowPerformance,
    connectionType,
    optimizeForPerformance
  } = usePerformance();
  
  const { 
    themes, 
    currentTheme, 
    changeTheme,
    animations,
    particles,
    glowEffects,
    toggleAnimations,
    toggleParticles,
    toggleGlowEffects
  } = useTheme();

  if (!isOpen) return null;

  const tabs = [
    { id: 'visual', label: 'Visual', icon: '👁️' },
    { id: 'motion', label: 'Movimento', icon: '🎬' },
    { id: 'theme', label: 'Temas', icon: '🎨' },
    { id: 'performance', label: 'Performance', icon: '⚡' }
  ];

  const fontSizes = [
    { id: 'small', label: 'Pequeno', class: 'text-sm' },
    { id: 'normal', label: 'Normal', class: 'text-base' },
    { id: 'large', label: 'Grande', class: 'text-lg' },
    { id: 'extra-large', label: 'Extra Grande', class: 'text-xl' }
  ];

  const handleSettingChange = (setting, value, message) => {
    setting(value);
    announceToScreenReader(message, 'polite');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="glass-advanced w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gold-400/20">
          <h2 className="text-2xl font-display font-bold gradient-text-animated">
            Configurações de Acessibilidade
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gold-400/10 rounded-lg transition-colors"
            aria-label="Fechar configurações"
          >
            <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-64 border-r border-gold-400/20">
            <nav className="p-4 space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                    ${activeTab === tab.id 
                      ? 'bg-gold-400/20 text-gold-300 border border-gold-400/30' 
                      : 'text-gold/70 hover:bg-gold-400/10 hover:text-gold-300'
                    }
                  `}
                  aria-pressed={activeTab === tab.id}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 custom-scrollbar overflow-y-auto max-h-[60vh]">
            {/* Visual Settings */}
            {activeTab === 'visual' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-4">
                    Configurações Visuais
                  </h3>
                  
                  {/* Font Size */}
                  <div className="mb-6">
                    <label className="block text-gold/90 font-medium mb-3">
                      Tamanho da Fonte
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {fontSizes.map(size => (
                        <button
                          key={size.id}
                          onClick={() => handleSettingChange(
                            setFontSize, 
                            size.id, 
                            `Tamanho da fonte alterado para ${size.label}`
                          )}
                          className={`
                            p-3 rounded-lg border transition-all
                            ${preferences.fontSize === size.id
                              ? 'border-gold-400 bg-gold-400/20 text-gold-300'
                              : 'border-gold-400/30 bg-black/20 text-gold/70 hover:border-gold-400/50'
                            }
                          `}
                        >
                          <div className={`${size.class} font-medium`}>Aa</div>
                          <div className="text-xs mt-1">{size.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* High Contrast */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-gold-400/20">
                    <div>
                      <h4 className="font-medium text-gold/90 mb-1">Alto Contraste</h4>
                      <p className="text-sm text-gold/60">Aumenta o contraste para melhor visibilidade</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange(
                        toggleHighContrast, 
                        null, 
                        `Alto contraste ${preferences.highContrast ? 'desativado' : 'ativado'}`
                      )}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                        ${preferences.highContrast ? 'bg-gold-400' : 'bg-gray-600'}
                      `}
                      role="switch"
                      aria-checked={preferences.highContrast}
                    >
                      <div className={`
                        absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                        ${preferences.highContrast ? 'translate-x-7' : 'translate-x-1'}
                      `} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Motion Settings */}
            {activeTab === 'motion' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gold-300 mb-4">
                  Configurações de Movimento
                </h3>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-gold-400/20">
                  <div>
                    <h4 className="font-medium text-gold/90 mb-1">Reduzir Movimento</h4>
                    <p className="text-sm text-gold/60">Minimiza animações e transições</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange(
                      toggleReducedMotion,
                      null,
                      `Movimento ${preferences.reducedMotion ? 'normalizado' : 'reduzido'}`
                    )}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors
                      ${preferences.reducedMotion ? 'bg-gold-400' : 'bg-gray-600'}
                    `}
                    role="switch"
                    aria-checked={preferences.reducedMotion}
                  >
                    <div className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${preferences.reducedMotion ? 'translate-x-7' : 'translate-x-1'}
                    `} />
                  </button>
                </div>

                {/* Animations */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-gold-400/20">
                  <div>
                    <h4 className="font-medium text-gold/90 mb-1">Animações</h4>
                    <p className="text-sm text-gold/60">Ativar efeitos de transição</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange(
                      toggleAnimations,
                      null,
                      `Animações ${animations ? 'desativadas' : 'ativadas'}`
                    )}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors
                      ${animations ? 'bg-gold-400' : 'bg-gray-600'}
                    `}
                    role="switch"
                    aria-checked={animations}
                  >
                    <div className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${animations ? 'translate-x-7' : 'translate-x-1'}
                    `} />
                  </button>
                </div>

                {/* Particles */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-gold-400/20">
                  <div>
                    <h4 className="font-medium text-gold/90 mb-1">Partículas</h4>
                    <p className="text-sm text-gold/60">Mostrar partículas flutuantes</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange(
                      toggleParticles,
                      null,
                      `Partículas ${particles ? 'desativadas' : 'ativadas'}`
                    )}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors
                      ${particles ? 'bg-gold-400' : 'bg-gray-600'}
                    `}
                    role="switch"
                    aria-checked={particles}
                  >
                    <div className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${particles ? 'translate-x-7' : 'translate-x-1'}
                    `} />
                  </button>
                </div>

                {/* Glow Effects */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-gold-400/20">
                  <div>
                    <h4 className="font-medium text-gold/90 mb-1">Efeitos de Brilho</h4>
                    <p className="text-sm text-gold/60">Ativar efeitos luminosos</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange(
                      toggleGlowEffects,
                      null,
                      `Efeitos de brilho ${glowEffects ? 'desativados' : 'ativados'}`
                    )}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors
                      ${glowEffects ? 'bg-gold-400' : 'bg-gray-600'}
                    `}
                    role="switch"
                    aria-checked={glowEffects}
                  >
                    <div className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${glowEffects ? 'translate-x-7' : 'translate-x-1'}
                    `} />
                  </button>
                </div>
              </div>
            )}

            {/* Theme Settings */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gold-300 mb-4">
                  Seleção de Tema
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => handleSettingChange(
                        changeTheme,
                        key,
                        `Tema alterado para ${theme.name}`
                      )}
                      className={`
                        p-4 rounded-lg border transition-all text-left
                        ${currentTheme === key 
                          ? 'border-gold-400 bg-gold-400/20 text-gold-300' 
                          : 'border-gold-400/30 bg-black/20 text-gold/70 hover:border-gold-400/50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium mb-1">{theme.name}</h4>
                          <p className="text-sm opacity-70">{theme.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white/20"
                            style={{ backgroundColor: theme.primary }}
                            aria-hidden="true"
                          />
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white/20"
                            style={{ backgroundColor: theme.secondary }}
                            aria-hidden="true"
                          />
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white/20"
                            style={{ backgroundColor: theme.accent }}
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Settings */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gold-300 mb-4">
                  Configurações de Performance
                </h3>

                {/* Performance Info */}
                <div className="p-4 rounded-lg bg-black/20 border border-gold-400/20">
                  <h4 className="font-medium text-gold/90 mb-2">Status da Conexão</h4>
                  <p className="text-sm text-gold/60 mb-1">
                    <span className="font-medium">Tipo:</span> {connectionType}
                  </p>
                  <p className="text-sm text-gold/60">
                    <span className="font-medium">Performance:</span> {isLowPerformance ? 'Limitada' : 'Normal'}
                  </p>
                </div>

                {/* Performance Optimization */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-gold-400/20">
                  <div>
                    <h4 className="font-medium text-gold/90 mb-1">Otimização Automática</h4>
                    <p className="text-sm text-gold/60">Ajustar interface baseado na performance</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange(
                      optimizeForPerformance,
                      !isLowPerformance,
                      `Otimização ${isLowPerformance ? 'desativada' : 'ativada'}`
                    )}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors
                      ${isLowPerformance ? 'bg-gold-400' : 'bg-gray-600'}
                    `}
                    role="switch"
                    aria-checked={isLowPerformance}
                  >
                    <div className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${isLowPerformance ? 'translate-x-7' : 'translate-x-1'}
                    `} />
                  </button>
                </div>

                {/* Performance Tips */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="font-medium text-blue-400 mb-2">💡 Dicas de Performance</h4>
                  <ul className="text-sm text-blue-300/80 space-y-1">
                    <li>• Desative animações em dispositivos lentos</li>
                    <li>• Reduza partículas para economizar recursos</li>
                    <li>• Use alto contraste para melhor legibilidade</li>
                    <li>• Ative otimização automática para ajustes inteligentes</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gold-400/20">
          <p className="text-sm text-gold/60">
            As configurações são salvas automaticamente
          </p>
          <button
            onClick={onClose}
            className="btn-luxury"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}