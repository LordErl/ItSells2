import { supabase } from '../lib/supabase'

class BackupService {
  // =============================================================================
  // BACKUP MANAGEMENT
  // =============================================================================

  /**
   * Cria backup manual do sistema
   */
  static async createManualBackup(userId, options = {}) {
    try {
      const {
        includeTables = ['all'],
        description = 'Backup manual',
        compress = true
      } = options

      // Registrar início do backup
      const { data: backupLog, error: logError } = await supabase
        .from('backup_logs')
        .insert({
          backup_type: 'manual',
          status: 'running',
          tables_included: includeTables,
          created_by: userId,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (logError) throw logError

      console.log('🔄 Iniciando backup manual...')

      // Simular processo de backup (em produção, seria integração com serviço real)
      const backupData = await this.generateBackupData(includeTables)
      const filePath = await this.saveBackupFile(backupData, compress)
      const fileSize = this.calculateFileSize(backupData)

      // Atualizar log de sucesso
      await supabase
        .from('backup_logs')
        .update({
          status: 'completed',
          file_path: filePath,
          file_size: fileSize,
          completed_at: new Date().toISOString()
        })
        .eq('id', backupLog.id)

      console.log('✅ Backup manual concluído:', filePath)

      return {
        success: true,
        data: {
          backupId: backupLog.id,
          filePath,
          fileSize,
          tablesIncluded: includeTables
        }
      }
    } catch (error) {
      console.error('❌ Erro no backup manual:', error)
      
      // Atualizar log de erro se possível
      if (backupLog?.id) {
        await supabase
          .from('backup_logs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', backupLog.id)
      }

      return { success: false, error: error.message }
    }
  }

  /**
   * Configura backup automático
   */
  static async configureAutomaticBackup(userId, schedule = 'daily') {
    try {
      // Salvar configuração no system_settings
      await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'backup_schedule',
          setting_value: JSON.stringify({
            enabled: true,
            frequency: schedule,
            configured_by: userId,
            configured_at: new Date().toISOString()
          }),
          description: 'Configuração de backup automático'
        })

      console.log('⚙️ Backup automático configurado:', schedule)

      return {
        success: true,
        data: { schedule, configuredBy: userId }
      }
    } catch (error) {
      console.error('❌ Erro ao configurar backup automático:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Lista histórico de backups
   */
  static async getBackupHistory(limit = 50) {
    try {
      const { data: backups, error } = await supabase
        .from('backup_logs')
        .select(`
          *,
          users!backup_logs_created_by_fkey(name, email)
        `)
        .order('started_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return {
        success: true,
        data: backups.map(backup => ({
          ...backup,
          createdBy: backup.users?.name || 'Sistema',
          fileSizeFormatted: this.formatFileSize(backup.file_size),
          durationFormatted: this.formatDuration(backup.started_at, backup.completed_at)
        }))
      }
    } catch (error) {
      console.error('❌ Erro ao buscar histórico de backups:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Restaura backup
   */
  static async restoreBackup(backupId, userId) {
    try {
      // Buscar informações do backup
      const { data: backup, error: backupError } = await supabase
        .from('backup_logs')
        .select('*')
        .eq('id', backupId)
        .single()

      if (backupError) throw backupError
      if (!backup) throw new Error('Backup não encontrado')
      if (backup.status !== 'completed') throw new Error('Backup não está completo')

      console.log('🔄 Iniciando restauração do backup:', backup.file_path)

      // Registrar ação de auditoria
      await this.createAuditLog(userId, 'RESTORE_BACKUP', 'backup_logs', backupId, null, {
        file_path: backup.file_path,
        restored_at: new Date().toISOString()
      })

      // Simular processo de restauração
      // Em produção, seria integração com serviço real de restauração
      await this.simulateRestore(backup)

      console.log('✅ Backup restaurado com sucesso')

      return {
        success: true,
        data: {
          backupId,
          filePath: backup.file_path,
          restoredAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('❌ Erro na restauração do backup:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Deleta backup antigo
   */
  static async deleteBackup(backupId, userId) {
    try {
      const { data: backup, error: fetchError } = await supabase
        .from('backup_logs')
        .select('file_path')
        .eq('id', backupId)
        .single()

      if (fetchError) throw fetchError

      // Deletar arquivo (simulado)
      await this.deleteBackupFile(backup.file_path)

      // Deletar registro
      const { error: deleteError } = await supabase
        .from('backup_logs')
        .delete()
        .eq('id', backupId)

      if (deleteError) throw deleteError

      // Registrar ação de auditoria
      await this.createAuditLog(userId, 'DELETE_BACKUP', 'backup_logs', backupId, backup, null)

      console.log('🗑️ Backup deletado:', backup.file_path)

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao deletar backup:', error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // FUNÇÕES AUXILIARES
  // =============================================================================

  /**
   * Gera dados do backup
   */
  static async generateBackupData(includeTables) {
    const backupData = {
      metadata: {
        version: '1.0.0',
        created_at: new Date().toISOString(),
        tables: includeTables
      },
      data: {}
    }

    try {
      if (includeTables.includes('all') || includeTables.includes('users')) {
        const { data: users } = await supabase.from('users').select('*')
        backupData.data.users = users
      }

      if (includeTables.includes('all') || includeTables.includes('products')) {
        const { data: products } = await supabase.from('products').select('*')
        backupData.data.products = products
      }

      if (includeTables.includes('all') || includeTables.includes('orders')) {
        const { data: orders } = await supabase.from('orders').select('*')
        backupData.data.orders = orders
      }

      if (includeTables.includes('all') || includeTables.includes('payments')) {
        const { data: payments } = await supabase.from('payments').select('*')
        backupData.data.payments = payments
      }

      if (includeTables.includes('all') || includeTables.includes('ingredients')) {
        const { data: ingredients } = await supabase.from('ingredients').select('*')
        backupData.data.ingredients = ingredients
      }

      // Adicionar outras tabelas conforme necessário

      return backupData
    } catch (error) {
      console.error('❌ Erro ao gerar dados do backup:', error)
      throw error
    }
  }

  /**
   * Salva arquivo de backup (simulado)
   */
  static async saveBackupFile(backupData, compress = true) {
    // Em produção, salvaria em storage real (AWS S3, Google Cloud, etc.)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup_${timestamp}.json${compress ? '.gz' : ''}`
    const filePath = `/backups/${fileName}`

    console.log('💾 Salvando backup:', filePath)
    
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000))

    return filePath
  }

  /**
   * Calcula tamanho do arquivo
   */
  static calculateFileSize(data) {
    const jsonString = JSON.stringify(data)
    return new Blob([jsonString]).size
  }

  /**
   * Formata tamanho do arquivo
   */
  static formatFileSize(bytes) {
    if (!bytes) return '0 B'
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  /**
   * Formata duração
   */
  static formatDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A'
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = end - start
    
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    
    return `${minutes}m ${seconds}s`
  }

  /**
   * Simula processo de restauração
   */
  static async simulateRestore(backup) {
    console.log('🔄 Simulando restauração...')
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('✅ Restauração simulada concluída')
  }

  /**
   * Deleta arquivo de backup (simulado)
   */
  static async deleteBackupFile(filePath) {
    console.log('🗑️ Deletando arquivo:', filePath)
    
    // Em produção, deletaria do storage real
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  /**
   * Cria log de auditoria
   */
  static async createAuditLog(userId, action, tableName, recordId, oldValues, newValues) {
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues,
        new_values: newValues
      })
    } catch (error) {
      console.error('❌ Erro ao criar log de auditoria:', error)
    }
  }

  /**
   * Verifica espaço disponível (simulado)
   */
  static async checkStorageSpace() {
    // Em produção, verificaria espaço real do storage
    return {
      total: 100 * 1024 * 1024 * 1024, // 100GB
      used: 25 * 1024 * 1024 * 1024,   // 25GB
      available: 75 * 1024 * 1024 * 1024 // 75GB
    }
  }

  /**
   * Limpa backups antigos automaticamente
   */
  static async cleanOldBackups(retentionDays = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const { data: oldBackups, error: fetchError } = await supabase
        .from('backup_logs')
        .select('id, file_path')
        .lt('started_at', cutoffDate.toISOString())
        .eq('status', 'completed')

      if (fetchError) throw fetchError

      let deletedCount = 0
      for (const backup of oldBackups) {
        try {
          await this.deleteBackupFile(backup.file_path)
          await supabase.from('backup_logs').delete().eq('id', backup.id)
          deletedCount++
        } catch (error) {
          console.error('❌ Erro ao deletar backup antigo:', backup.id, error)
        }
      }

      console.log(`🧹 Limpeza concluída: ${deletedCount} backups antigos removidos`)

      return {
        success: true,
        data: { deletedCount, retentionDays }
      }
    } catch (error) {
      console.error('❌ Erro na limpeza de backups antigos:', error)
      return { success: false, error: error.message }
    }
  }
}

export default BackupService
