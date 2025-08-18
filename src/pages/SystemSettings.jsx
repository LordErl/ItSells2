import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import SystemSettingsService from '../services/SystemSettingsService'
import BackupService from '../services/BackupService'
import NotificationService from '../services/NotificationService'
import { toast } from 'react-hot-toast'

const SystemSettings = () => {
  const { user } = useAuth()
  const permissions = usePermissions()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('app')
  const [settings, setSettings] = useState({
    app: {},
    security: {},
    notifications: {},
    backup: {},
    performance: {}
  })
  const [backupHistory, setBackupHistory] = useState([])
  const [loadingBackup, setLoadingBackup] = useState(false)

  // Verificar permissões
  if (!permissions.manageSettings) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Acesso Negado</h1>
          <p className="text-gray-400">Você não tem permissão para acessar configurações do sistema.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    loadSettings()
    loadBackupHistory()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const [appResult, securityResult, notificationResult, backupResult, performanceResult] = await Promise.all([
        SystemSettingsService.getAppSettings(),
        SystemSettingsService.getSecuritySettings(),
        SystemSettingsService.getNotificationSettings(),
        SystemSettingsService.getBackupSettings(),
        SystemSettingsService.getPerformanceSettings()
      ])

      setSettings({
        app: appResult.success ? appResult.data : {},
        security: securityResult.success ? securityResult.data : {},
        notifications: notificationResult.success ? notificationResult.data : {},
        backup: backupResult.success ? backupResult.data : {},
        performance: performanceResult.success ? performanceResult.data : {}
      })
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const loadBackupHistory = async () => {
    try {
      const result = await BackupService.getBackupHistory(20)
      if (result.success) {
        setBackupHistory(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de backup:', error)
    }
  }

  const saveAppSettings = async (newSettings) => {
    try {
      const result = await SystemSettingsService.setAppSettings(newSettings)
      if (result.success) {
        setSettings(prev => ({ ...prev, app: { ...prev.app, ...newSettings } }))
        toast.success('Configurações da aplicação salvas!')
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações da app:', error)
      toast.error('Erro ao salvar configurações')
    }
  }

  const saveSecuritySettings = async (newSettings) => {
    try {
      const result = await SystemSettingsService.setSecuritySettings(newSettings)
      if (result.success) {
        setSettings(prev => ({ ...prev, security: { ...prev.security, ...newSettings } }))
        toast.success('Configurações de segurança salvas!')
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações de segurança:', error)
      toast.error('Erro ao salvar configurações')
    }
  }

  const saveNotificationSettings = async (newSettings) => {
    try {
      const result = await SystemSettingsService.setNotificationSettings(newSettings)
      if (result.success) {
        setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, ...newSettings } }))
        toast.success('Configurações de notificação salvas!')
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações de notificação:', error)
      toast.error('Erro ao salvar configurações')
    }
  }

  const createBackup = async () => {
    setLoadingBackup(true)
    try {
      const result = await BackupService.createManualBackup(user.id, {
        includeTables: ['all'],
        description: 'Backup manual via configurações'
      })

      if (result.success) {
        toast.success('Backup criado com sucesso!')
        loadBackupHistory()
      } else {
        toast.error('Erro ao criar backup')
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error)
      toast.error('Erro ao criar backup')
    } finally {
      setLoadingBackup(false)
    }
  }

  const configureAutoBackup = async (schedule) => {
    try {
      const result = await BackupService.configureAutomaticBackup(user.id, schedule)
      if (result.success) {
        setSettings(prev => ({ 
          ...prev, 
          backup: { ...prev.backup, enabled: true, frequency: schedule } 
        }))
        toast.success('Backup automático configurado!')
      } else {
        toast.error('Erro ao configurar backup automático')
      }
    } catch (error) {
      console.error('Erro ao configurar backup automático:', error)
      toast.error('Erro ao configurar backup automático')
    }
  }

  const resetToDefaults = async () => {
    if (!confirm('Tem certeza que deseja resetar todas as configurações para o padrão? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const result = await SystemSettingsService.resetToDefaults()
      if (result.success) {
        toast.success('Configurações resetadas para padrão!')
        loadSettings()
      } else {
        toast.error('Erro ao resetar configurações')
      }
    } catch (error) {
      console.error('Erro ao resetar configurações:', error)
      toast.error('Erro ao resetar configurações')
    }
  }

  const exportSettings = async () => {
    try {
      const result = await SystemSettingsService.exportSettings()
      if (result.success) {
        // Simular download do arquivo
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `itsells-settings-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
        
        toast.success('Configurações exportadas!')
      } else {
        toast.error('Erro ao exportar configurações')
      }
    } catch (error) {
      console.error('Erro ao exportar configurações:', error)
      toast.error('Erro ao exportar configurações')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">⚙️ Configurações do Sistema</h1>
            <p className="text-gray-400">Gerencie configurações globais da aplicação</p>
          </div>
          
          <div className="flex gap-4 mt-4 md:mt-0">
            <button
              onClick={exportSettings}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              📤 Exportar
            </button>
            <button
              onClick={resetToDefaults}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Resetar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-800">
          {[
            { id: 'app', label: '🏢 Aplicação', icon: '🏢' },
            { id: 'security', label: '🔒 Segurança', icon: '🔒' },
            { id: 'notifications', label: '📢 Notificações', icon: '📢' },
            { id: 'backup', label: '💾 Backup', icon: '💾' },
            { id: 'performance', label: '⚡ Performance', icon: '⚡' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das tabs */}
        <div className="space-y-8">
          {/* Tab Aplicação */}
          {activeTab === 'app' && (
            <div className="space-y-6">
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-4">Configurações da Aplicação</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome da Aplicação
                    </label>
                    <input
                      type="text"
                      value={settings.app.appName || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        app: { ...prev.app, appName: e.target.value } 
                      }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Versão
                    </label>
                    <input
                      type="text"
                      value={settings.app.appVersion || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        app: { ...prev.app, appVersion: e.target.value } 
                      }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fuso Horário
                    </label>
                    <select
                      value={settings.app.timezone || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        app: { ...prev.app, timezone: e.target.value } 
                      }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                      <option value="America/New_York">New York (UTC-5)</option>
                      <option value="Europe/London">London (UTC+0)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Moeda
                    </label>
                    <select
                      value={settings.app.currency || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        app: { ...prev.app, currency: e.target.value } 
                      }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      <option value="BRL">Real (BRL)</option>
                      <option value="USD">Dólar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => saveAppSettings(settings.app)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    💾 Salvar Configurações da Aplicação
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Segurança */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-4">Configurações de Segurança</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Máximo de Tentativas de Login
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.security.maxLoginAttempts || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) } 
                      }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Timeout da Sessão (segundos)
                    </label>
                    <input
                      type="number"
                      min="300"
                      max="86400"
                      value={settings.security.sessionTimeout || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        security: { ...prev.security, sessionTimeout: parseInt(e.target.value) } 
                      }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.security.enableAuditLogs || false}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          security: { ...prev.security, enableAuditLogs: e.target.checked } 
                        }))}
                        className="w-5 h-5 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                      />
                      <span className="text-gray-300">Habilitar Logs de Auditoria</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => saveSecuritySettings(settings.security)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    🔒 Salvar Configurações de Segurança
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Notificações */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-4">Configurações de Notificação</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.notifications.enableNotifications || false}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, enableNotifications: e.target.checked } 
                      }))}
                      className="w-5 h-5 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                    />
                    <span className="text-gray-300">Habilitar Sistema de Notificações</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.notifications.enableEmailNotifications || false}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, enableEmailNotifications: e.target.checked } 
                      }))}
                      className="w-5 h-5 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                    />
                    <span className="text-gray-300">Habilitar Notificações por Email</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.notifications.enablePushNotifications || false}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, enablePushNotifications: e.target.checked } 
                      }))}
                      className="w-5 h-5 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                    />
                    <span className="text-gray-300">Habilitar Notificações Push</span>
                  </label>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => saveNotificationSettings(settings.notifications)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    📢 Salvar Configurações de Notificação
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Backup */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Configurações de backup */}
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-4">Configurações de Backup</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Backup Automático
                    </label>
                    <select
                      value={settings.backup.frequency || 'disabled'}
                      onChange={(e) => {
                        const frequency = e.target.value
                        if (frequency === 'disabled') {
                          setSettings(prev => ({ 
                            ...prev, 
                            backup: { ...prev.backup, enabled: false, frequency } 
                          }))
                        } else {
                          configureAutoBackup(frequency)
                        }
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      <option value="disabled">Desabilitado</option>
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Backup Manual
                    </label>
                    <button
                      onClick={createBackup}
                      disabled={loadingBackup}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                    >
                      {loadingBackup ? '⏳ Criando...' : '💾 Criar Backup Agora'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Histórico de backups */}
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-4">Histórico de Backups</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="pb-3 text-yellow-400">Data</th>
                        <th className="pb-3 text-yellow-400">Tipo</th>
                        <th className="pb-3 text-yellow-400">Status</th>
                        <th className="pb-3 text-yellow-400">Tamanho</th>
                        <th className="pb-3 text-yellow-400">Criado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backupHistory.map((backup, index) => (
                        <tr key={index} className="border-b border-gray-800">
                          <td className="py-3 text-white">
                            {new Date(backup.started_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-3 text-gray-300">
                            <span className={`px-2 py-1 rounded text-xs ${
                              backup.backup_type === 'manual' ? 'bg-blue-900 text-blue-300' :
                              backup.backup_type === 'scheduled' ? 'bg-green-900 text-green-300' :
                              'bg-purple-900 text-purple-300'
                            }`}>
                              {backup.backup_type}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              backup.status === 'completed' ? 'bg-green-900 text-green-300' :
                              backup.status === 'failed' ? 'bg-red-900 text-red-300' :
                              backup.status === 'running' ? 'bg-yellow-900 text-yellow-300' :
                              'bg-gray-900 text-gray-300'
                            }`}>
                              {backup.status}
                            </span>
                          </td>
                          <td className="py-3 text-gray-300">{backup.fileSizeFormatted}</td>
                          <td className="py-3 text-gray-300">{backup.createdBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab Performance */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-4">Configurações de Performance</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Timeout do Cache (segundos)
                    </label>
                    <input
                      type="number"
                      min="300"
                      max="7200"
                      value={settings.performance.cacheTimeout || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        performance: { ...prev.performance, cacheTimeout: parseInt(e.target.value) } 
                      }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tamanho Máximo do Cache (MB)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      value={settings.performance.maxCacheSize || ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        performance: { ...prev.performance, maxCacheSize: parseInt(e.target.value) } 
                      }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.performance.enableCompression || false}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          performance: { ...prev.performance, enableCompression: e.target.checked } 
                        }))}
                        className="w-5 h-5 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                      />
                      <span className="text-gray-300">Habilitar Compressão</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => toast.success('Configurações de performance salvas!')}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    ⚡ Salvar Configurações de Performance
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SystemSettings
