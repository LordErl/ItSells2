import { supabase } from '../lib/supabase'

class NotificationService {
  // =============================================================================
  // NOTIFICATION MANAGEMENT
  // =============================================================================

  /**
   * Cria nova notificação
   */
  static async createNotification(notification) {
    try {
      const {
        userId,
        title,
        message,
        type = 'info',
        priority = 'normal',
        actionUrl = null,
        expiresAt = null
      } = notification

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          priority,
          action_url: actionUrl,
          expires_at: expiresAt
        })
        .select()
        .single()

      if (error) throw error

      console.log('📢 Notificação criada:', title)

      return { success: true, data }
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Busca notificações do usuário
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        limit = 50,
        onlyUnread = false,
        type = null,
        priority = null
      } = options

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      // Filtros opcionais
      if (onlyUnread) {
        query = query.eq('is_read', false)
      }

      if (type) {
        query = query.eq('type', type)
      }

      if (priority) {
        query = query.eq('priority', priority)
      }

      // Filtrar notificações não expiradas
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

      const { data: notifications, error } = await query

      if (error) throw error

      return {
        success: true,
        data: notifications.map(this.formatNotification)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Marca notificação como lida
   */
  static async markAsRead(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error

      console.log('✅ Notificação marcada como lida:', notificationId)

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  static async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error

      console.log('✅ Todas as notificações marcadas como lidas para usuário:', userId)

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Deleta notificação
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error

      console.log('🗑️ Notificação deletada:', notificationId)

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao deletar notificação:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Conta notificações não lidas
   */
  static async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

      if (error) throw error

      return { success: true, data: { count: count || 0 } }
    } catch (error) {
      console.error('❌ Erro ao contar notificações não lidas:', error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // NOTIFICAÇÕES AUTOMÁTICAS DO SISTEMA
  // =============================================================================

  /**
   * Notifica sobre estoque baixo
   */
  static async notifyLowStock(adminUsers, ingredient) {
    const title = '⚠️ Estoque Baixo'
    const message = `O ingrediente "${ingredient.name}" está com estoque baixo (${ingredient.current_stock}/${ingredient.min_stock})`
    
    for (const admin of adminUsers) {
      await this.createNotification({
        userId: admin.id,
        title,
        message,
        type: 'warning',
        priority: 'high',
        actionUrl: '/ingredients'
      })
    }
  }

  /**
   * Notifica sobre vencimento próximo
   */
  static async notifyExpiringItems(adminUsers, items) {
    const title = '📅 Itens Próximos ao Vencimento'
    const message = `${items.length} item(ns) vencem em breve. Verifique o controle de vencimentos.`
    
    for (const admin of adminUsers) {
      await this.createNotification({
        userId: admin.id,
        title,
        message,
        type: 'warning',
        priority: 'high',
        actionUrl: '/expiration-control'
      })
    }
  }

  /**
   * Notifica sobre novo funcionário
   */
  static async notifyNewEmployee(adminUsers, employee) {
    const title = '👥 Novo Funcionário'
    const message = `${employee.name} foi adicionado como ${employee.role}`
    
    for (const admin of adminUsers) {
      await this.createNotification({
        userId: admin.id,
        title,
        message,
        type: 'info',
        priority: 'normal',
        actionUrl: '/employee-management'
      })
    }
  }

  /**
   * Notifica sobre backup concluído
   */
  static async notifyBackupCompleted(adminUsers, backup) {
    const title = '💾 Backup Concluído'
    const message = `Backup ${backup.type} realizado com sucesso`
    
    for (const admin of adminUsers) {
      await this.createNotification({
        userId: admin.id,
        title,
        message,
        type: 'success',
        priority: 'normal'
      })
    }
  }

  /**
   * Notifica sobre erro no sistema
   */
  static async notifySystemError(adminUsers, error) {
    const title = '🚨 Erro no Sistema'
    const message = `Erro detectado: ${error.message}`
    
    for (const admin of adminUsers) {
      await this.createNotification({
        userId: admin.id,
        title,
        message,
        type: 'error',
        priority: 'urgent'
      })
    }
  }

  /**
   * Notifica sobre vendas do dia
   */
  static async notifyDailySales(adminUsers, salesData) {
    const title = '📊 Resumo de Vendas'
    const message = `Vendas do dia: R$ ${salesData.total.toFixed(2)} (${salesData.count} pedidos)`
    
    for (const admin of adminUsers) {
      await this.createNotification({
        userId: admin.id,
        title,
        message,
        type: 'info',
        priority: 'normal',
        actionUrl: '/daily-report'
      })
    }
  }

  // =============================================================================
  // FUNÇÕES AUXILIARES
  // =============================================================================

  /**
   * Formata notificação para exibição
   */
  static formatNotification(notification) {
    return {
      ...notification,
      timeAgo: this.getTimeAgo(notification.created_at),
      isExpired: notification.expires_at ? new Date(notification.expires_at) < new Date() : false,
      priorityColor: this.getPriorityColor(notification.priority),
      typeIcon: this.getTypeIcon(notification.type)
    }
  }

  /**
   * Calcula tempo relativo
   */
  static getTimeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d atrás`
    
    return date.toLocaleDateString('pt-BR')
  }

  /**
   * Retorna cor baseada na prioridade
   */
  static getPriorityColor(priority) {
    const colors = {
      low: 'text-gray-400',
      normal: 'text-blue-400',
      high: 'text-yellow-400',
      urgent: 'text-red-400'
    }
    return colors[priority] || colors.normal
  }

  /**
   * Retorna ícone baseado no tipo
   */
  static getTypeIcon(type) {
    const icons = {
      info: '📢',
      warning: '⚠️',
      error: '🚨',
      success: '✅'
    }
    return icons[type] || icons.info
  }

  /**
   * Busca usuários admin para notificações
   */
  static async getAdminUsers() {
    try {
      const { data: adminUsers, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'admin')
        .eq('status', 'active')

      if (error) throw error

      return adminUsers || []
    } catch (error) {
      console.error('❌ Erro ao buscar usuários admin:', error)
      return []
    }
  }

  /**
   * Limpa notificações expiradas
   */
  static async cleanExpiredNotifications() {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (error) throw error

      console.log('🧹 Notificações expiradas limpas')

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao limpar notificações expiradas:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Limpa notificações antigas (mais de 30 dias)
   */
  static async cleanOldNotifications(daysToKeep = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('is_read', true)

      if (error) throw error

      console.log(`🧹 Notificações antigas (>${daysToKeep} dias) limpas`)

      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao limpar notificações antigas:', error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // SUBSCRIPTION PARA NOTIFICAÇÕES EM TEMPO REAL
  // =============================================================================

  /**
   * Inscreve-se para receber notificações em tempo real
   */
  static subscribeToNotifications(userId, callback) {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('📢 Nova notificação recebida:', payload.new)
          callback(this.formatNotification(payload.new))
        }
      )
      .subscribe()

    return subscription
  }

  /**
   * Cancela inscrição de notificações
   */
  static unsubscribeFromNotifications(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription)
      console.log('🔕 Inscrição de notificações cancelada')
    }
  }
}

export default NotificationService
