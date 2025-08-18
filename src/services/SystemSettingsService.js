import { supabase } from '../lib/supabase'

class SystemSettingsService {
  // =============================================================================
  // SYSTEM SETTINGS MANAGEMENT
  // =============================================================================

  /**
   * Busca todas as configurações do sistema
   */
  static async getAllSettings() {
    try {
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key')

      if (error) throw error

      // Converter para objeto para facilitar o uso
      const settingsObject = settings.reduce((acc, setting) => {
        acc[setting.setting_key] = {
          value: setting.setting_value,
          description: setting.description,
          isPublic: setting.is_public,
          updatedAt: setting.updated_at
        }
        return acc
      }, {})

      return { success: true, data: settingsObject }
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Busca configuração específica
   */
  static async getSetting(key) {
    try {
      const { data: setting, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', key)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found

      return {
        success: true,
        data: setting ? setting.setting_value : null
      }
    } catch (error) {
      console.error('❌ Erro ao buscar configuração:', key, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Salva/atualiza configuração
   */
  static async setSetting(key, value, description = null, isPublic = false) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          description,
          is_public: isPublic
        })
        .select()
        .single()

      if (error) throw error

      console.log('⚙️ Configuração salva:', key)

      return { success: true, data }
    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', key, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Deleta configuração
   */
  static async deleteSetting(key) {
    try {
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('setting_key', key)

      if (error) throw error

      console.log('🗑️ Configuração deletada:', key)

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao deletar configuração:', key, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Busca apenas configurações públicas
   */
  static async getPublicSettings() {
    try {
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .eq('is_public', true)

      if (error) throw error

      const settingsObject = settings.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value
        return acc
      }, {})

      return { success: true, data: settingsObject }
    } catch (error) {
      console.error('❌ Erro ao buscar configurações públicas:', error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // CONFIGURAÇÕES ESPECÍFICAS
  // =============================================================================

  /**
   * Configurações de tema
   */
  static async getThemeSettings() {
    const result = await this.getSetting('theme')
    return result.success ? result.data || 'dark' : 'dark'
  }

  static async setThemeSettings(theme) {
    return await this.setSetting('theme', JSON.stringify(theme), 'Tema da aplicação', true)
  }

  /**
   * Configurações de backup
   */
  static async getBackupSettings() {
    const result = await this.getSetting('backup_schedule')
    return result.success ? result.data || { enabled: false, frequency: 'daily' } : { enabled: false, frequency: 'daily' }
  }

  static async setBackupSettings(settings) {
    return await this.setSetting('backup_schedule', settings, 'Configurações de backup automático', false)
  }

  /**
   * Configurações de segurança
   */
  static async getSecuritySettings() {
    try {
      const maxAttempts = await this.getSetting('max_login_attempts')
      const sessionTimeout = await this.getSetting('session_timeout')
      const enableAudit = await this.getSetting('enable_audit_logs')

      return {
        success: true,
        data: {
          maxLoginAttempts: maxAttempts.data || 5,
          sessionTimeout: sessionTimeout.data || 3600,
          enableAuditLogs: enableAudit.data || true
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar configurações de segurança:', error)
      return { success: false, error: error.message }
    }
  }

  static async setSecuritySettings(settings) {
    try {
      const promises = []

      if (settings.maxLoginAttempts !== undefined) {
        promises.push(this.setSetting('max_login_attempts', settings.maxLoginAttempts, 'Máximo de tentativas de login'))
      }

      if (settings.sessionTimeout !== undefined) {
        promises.push(this.setSetting('session_timeout', settings.sessionTimeout, 'Timeout da sessão em segundos'))
      }

      if (settings.enableAuditLogs !== undefined) {
        promises.push(this.setSetting('enable_audit_logs', settings.enableAuditLogs, 'Habilitar logs de auditoria'))
      }

      await Promise.all(promises)

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao salvar configurações de segurança:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Configurações de notificação
   */
  static async getNotificationSettings() {
    try {
      const enableNotifications = await this.getSetting('enable_notifications')
      const emailNotifications = await this.getSetting('enable_email_notifications')
      const pushNotifications = await this.getSetting('enable_push_notifications')

      return {
        success: true,
        data: {
          enableNotifications: enableNotifications.data || true,
          enableEmailNotifications: emailNotifications.data || false,
          enablePushNotifications: pushNotifications.data || false
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar configurações de notificação:', error)
      return { success: false, error: error.message }
    }
  }

  static async setNotificationSettings(settings) {
    try {
      const promises = []

      if (settings.enableNotifications !== undefined) {
        promises.push(this.setSetting('enable_notifications', settings.enableNotifications, 'Habilitar sistema de notificações'))
      }

      if (settings.enableEmailNotifications !== undefined) {
        promises.push(this.setSetting('enable_email_notifications', settings.enableEmailNotifications, 'Habilitar notificações por email'))
      }

      if (settings.enablePushNotifications !== undefined) {
        promises.push(this.setSetting('enable_push_notifications', settings.enablePushNotifications, 'Habilitar notificações push'))
      }

      await Promise.all(promises)

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao salvar configurações de notificação:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Configurações da aplicação
   */
  static async getAppSettings() {
    try {
      const appName = await this.getSetting('app_name')
      const appVersion = await this.getSetting('app_version')
      const timezone = await this.getSetting('timezone')
      const currency = await this.getSetting('currency')

      return {
        success: true,
        data: {
          appName: appName.data || 'ItSells',
          appVersion: appVersion.data || '1.0.0',
          timezone: timezone.data || 'America/Sao_Paulo',
          currency: currency.data || 'BRL'
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar configurações da aplicação:', error)
      return { success: false, error: error.message }
    }
  }

  static async setAppSettings(settings) {
    try {
      const promises = []

      if (settings.appName !== undefined) {
        promises.push(this.setSetting('app_name', JSON.stringify(settings.appName), 'Nome da aplicação', true))
      }

      if (settings.appVersion !== undefined) {
        promises.push(this.setSetting('app_version', JSON.stringify(settings.appVersion), 'Versão da aplicação', true))
      }

      if (settings.timezone !== undefined) {
        promises.push(this.setSetting('timezone', JSON.stringify(settings.timezone), 'Fuso horário do sistema'))
      }

      if (settings.currency !== undefined) {
        promises.push(this.setSetting('currency', JSON.stringify(settings.currency), 'Moeda padrão', true))
      }

      await Promise.all(promises)

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao salvar configurações da aplicação:', error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // CONFIGURAÇÕES AVANÇADAS
  // =============================================================================

  /**
   * Configurações de performance
   */
  static async getPerformanceSettings() {
    try {
      const cacheTimeout = await this.getSetting('cache_timeout')
      const maxCacheSize = await this.getSetting('max_cache_size')
      const enableCompression = await this.getSetting('enable_compression')

      return {
        success: true,
        data: {
          cacheTimeout: cacheTimeout.data || 1800, // 30 minutos
          maxCacheSize: maxCacheSize.data || 100, // 100MB
          enableCompression: enableCompression.data || true
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar configurações de performance:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Configurações de integração
   */
  static async getIntegrationSettings() {
    try {
      const pixEnabled = await this.getSetting('pix_enabled')
      const cardEnabled = await this.getSetting('card_enabled')
      const cashEnabled = await this.getSetting('cash_enabled')

      return {
        success: true,
        data: {
          pixEnabled: pixEnabled.data || true,
          cardEnabled: cardEnabled.data || true,
          cashEnabled: cashEnabled.data || true
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar configurações de integração:', error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // FUNÇÕES AUXILIARES
  // =============================================================================

  /**
   * Exporta todas as configurações para backup
   */
  static async exportSettings() {
    try {
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('*')

      if (error) throw error

      const exportData = {
        exported_at: new Date().toISOString(),
        version: '1.0.0',
        settings: settings
      }

      return { success: true, data: exportData }
    } catch (error) {
      console.error('❌ Erro ao exportar configurações:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Importa configurações de backup
   */
  static async importSettings(settingsData) {
    try {
      if (!settingsData.settings || !Array.isArray(settingsData.settings)) {
        throw new Error('Formato de dados inválido')
      }

      const promises = settingsData.settings.map(setting => 
        this.setSetting(
          setting.setting_key,
          setting.setting_value,
          setting.description,
          setting.is_public
        )
      )

      await Promise.all(promises)

      console.log('📥 Configurações importadas com sucesso')

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao importar configurações:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Reseta configurações para padrão
   */
  static async resetToDefaults() {
    try {
      // Deletar todas as configurações existentes
      const { error: deleteError } = await supabase
        .from('system_settings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Deletar todas

      if (deleteError) throw deleteError

      // Recriar configurações padrão
      const defaultSettings = [
        { key: 'app_name', value: '"ItSells"', description: 'Nome da aplicação', isPublic: true },
        { key: 'app_version', value: '"1.0.0"', description: 'Versão da aplicação', isPublic: true },
        { key: 'theme', value: '"dark"', description: 'Tema padrão da aplicação', isPublic: true },
        { key: 'timezone', value: '"America/Sao_Paulo"', description: 'Fuso horário do sistema', isPublic: false },
        { key: 'currency', value: '"BRL"', description: 'Moeda padrão', isPublic: true },
        { key: 'backup_frequency', value: '"daily"', description: 'Frequência de backup automático', isPublic: false },
        { key: 'max_login_attempts', value: '5', description: 'Máximo de tentativas de login', isPublic: false },
        { key: 'session_timeout', value: '3600', description: 'Timeout da sessão em segundos', isPublic: false },
        { key: 'enable_notifications', value: 'true', description: 'Habilitar sistema de notificações', isPublic: false },
        { key: 'enable_audit_logs', value: 'true', description: 'Habilitar logs de auditoria', isPublic: false }
      ]

      const promises = defaultSettings.map(setting => 
        this.setSetting(setting.key, setting.value, setting.description, setting.isPublic)
      )

      await Promise.all(promises)

      console.log('🔄 Configurações resetadas para padrão')

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao resetar configurações:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Valida configuração antes de salvar
   */
  static validateSetting(key, value) {
    const validators = {
      max_login_attempts: (val) => Number.isInteger(val) && val > 0 && val <= 10,
      session_timeout: (val) => Number.isInteger(val) && val >= 300 && val <= 86400, // 5 min a 24h
      theme: (val) => ['light', 'dark'].includes(val),
      currency: (val) => ['BRL', 'USD', 'EUR'].includes(val),
      timezone: (val) => typeof val === 'string' && val.length > 0
    }

    const validator = validators[key]
    if (validator && !validator(value)) {
      throw new Error(`Valor inválido para ${key}: ${value}`)
    }

    return true
  }
}

export default SystemSettingsService
