import { supabase } from '../lib/supabase'

/**
 * Serviço para gestão de horários e turnos
 */
class ScheduleService {
  /**
   * Busca todos os horários
   */
  async getAllSchedules() {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .select(`
          *,
          employee:users(id, name, role)
        `)
        .order('date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar horários:', error)
      throw error
    }
  }

  /**
   * Busca horários por funcionário
   */
  async getSchedulesByEmployee(employeeId) {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .select(`
          *,
          employee:users(id, name, role)
        `)
        .eq('employee_id', employeeId)
        .order('date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar horários do funcionário:', error)
      throw error
    }
  }

  /**
   * Busca horários por período
   */
  async getSchedulesByDateRange(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .select(`
          *,
          employee:users(id, name, role)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar horários por período:', error)
      throw error
    }
  }

  /**
   * Cria novo horário
   */
  async createSchedule(scheduleData) {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .insert([{
          employee_id: scheduleData.employee_id,
          date: scheduleData.date,
          shift_type: scheduleData.shift_type,
          start_time: scheduleData.start_time,
          end_time: scheduleData.end_time,
          break_start: scheduleData.break_start || null,
          break_end: scheduleData.break_end || null,
          status: scheduleData.status || 'scheduled',
          notes: scheduleData.notes || null
        }])
        .select(`
          *,
          employee:users(id, name, role)
        `)
        .single()

      if (error) throw error

      console.log('✅ Horário criado:', data)
      return data
    } catch (error) {
      console.error('❌ Erro ao criar horário:', error)
      throw error
    }
  }

  /**
   * Atualiza horário
   */
  async updateSchedule(id, scheduleData) {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .update({
          employee_id: scheduleData.employee_id,
          date: scheduleData.date,
          shift_type: scheduleData.shift_type,
          start_time: scheduleData.start_time,
          end_time: scheduleData.end_time,
          break_start: scheduleData.break_start,
          break_end: scheduleData.break_end,
          status: scheduleData.status,
          notes: scheduleData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          employee:users(id, name, role)
        `)
        .single()

      if (error) throw error

      console.log('✅ Horário atualizado:', data)
      return data
    } catch (error) {
      console.error('❌ Erro ao atualizar horário:', error)
      throw error
    }
  }

  /**
   * Remove horário
   */
  async deleteSchedule(id) {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .delete()
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Horário removido:', data)
      return data
    } catch (error) {
      console.error('❌ Erro ao remover horário:', error)
      throw error
    }
  }

  /**
   * Marca presença
   */
  async markAttendance(scheduleId, attendanceData) {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .update({
          actual_start_time: attendanceData.actual_start_time,
          actual_end_time: attendanceData.actual_end_time,
          status: attendanceData.status,
          notes: attendanceData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleId)
        .select(`
          *,
          employee:users(id, name, role)
        `)
        .single()

      if (error) throw error

      console.log('✅ Presença marcada:', data)
      return data
    } catch (error) {
      console.error('❌ Erro ao marcar presença:', error)
      throw error
    }
  }

  /**
   * Busca estatísticas de horários
   */
  async getScheduleStats(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .select('status, shift_type, employee_id')
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) throw error

      const stats = {
        total: data.length,
        byStatus: {
          scheduled: data.filter(s => s.status === 'scheduled').length,
          completed: data.filter(s => s.status === 'completed').length,
          absent: data.filter(s => s.status === 'absent').length,
          late: data.filter(s => s.status === 'late').length
        },
        byShift: {
          morning: data.filter(s => s.shift_type === 'morning').length,
          afternoon: data.filter(s => s.shift_type === 'afternoon').length,
          night: data.filter(s => s.shift_type === 'night').length,
          full: data.filter(s => s.shift_type === 'full').length
        },
        uniqueEmployees: new Set(data.map(s => s.employee_id)).size
      }

      return stats
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error)
      throw error
    }
  }

  /**
   * Verifica conflitos de horário
   */
  async checkScheduleConflicts(employeeId, date, startTime, endTime, excludeId = null) {
    try {
      let query = supabase
        .from('employee_schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', date)
        .or(`start_time.lte.${endTime},end_time.gte.${startTime}`)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao verificar conflitos:', error)
      throw error
    }
  }

  /**
   * Gera relatório de frequência
   */
  async getAttendanceReport(employeeId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .select(`
          *,
          employee:users(id, name, role)
        `)
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) throw error

      const report = {
        employee: data[0]?.employee,
        period: { startDate, endDate },
        totalScheduled: data.length,
        completed: data.filter(s => s.status === 'completed').length,
        absent: data.filter(s => s.status === 'absent').length,
        late: data.filter(s => s.status === 'late').length,
        attendanceRate: data.length > 0 ? 
          (data.filter(s => s.status === 'completed').length / data.length * 100).toFixed(1) : 0,
        schedules: data
      }

      return report
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error)
      throw error
    }
  }
}

export default new ScheduleService()
