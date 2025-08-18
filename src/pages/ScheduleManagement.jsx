import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import ScheduleService from '../services/ScheduleService'
import EmployeeService from '../services/EmployeeService'

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState({
    total: 0,
    byStatus: { scheduled: 0, completed: 0, absent: 0, late: 0 },
    byShift: { morning: 0, afternoon: 0, night: 0, full: 0 },
    uniqueEmployees: 0
  })

  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    shift_type: 'morning',
    start_time: '08:00',
    end_time: '17:00',
    break_start: '12:00',
    break_end: '13:00',
    status: 'scheduled',
    notes: ''
  })

  useEffect(() => {
    loadEmployees()
    loadSchedulesForDate()
    loadStats()
  }, [selectedDate])

  const loadEmployees = async () => {
    try {
      const data = await EmployeeService.getAllEmployees()
      setEmployees(data.filter(emp => emp.status === 'active'))
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
    }
  }

  const loadSchedulesForDate = async () => {
    try {
      setLoading(true)
      const data = await ScheduleService.getSchedulesByDateRange(selectedDate, selectedDate)
      setSchedules(data)
    } catch (error) {
      toast.error('Erro ao carregar horários')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const startOfWeek = new Date(selectedDate)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)

      const statsData = await ScheduleService.getScheduleStats(
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0]
      )
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.employee_id || !formData.date) {
      toast.error('Funcionário e data são obrigatórios')
      return
    }

    try {
      // Verificar conflitos
      const conflicts = await ScheduleService.checkScheduleConflicts(
        formData.employee_id,
        formData.date,
        formData.start_time,
        formData.end_time,
        editingSchedule?.id
      )

      if (conflicts.length > 0) {
        toast.error('Conflito de horário detectado!')
        return
      }

      if (editingSchedule) {
        await ScheduleService.updateSchedule(editingSchedule.id, formData)
        toast.success('Horário atualizado com sucesso!')
      } else {
        await ScheduleService.createSchedule(formData)
        toast.success('Horário criado com sucesso!')
      }
      
      setShowModal(false)
      resetForm()
      loadSchedulesForDate()
      loadStats()
    } catch (error) {
      toast.error('Erro ao salvar horário')
      console.error(error)
    }
  }

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      employee_id: schedule.employee_id,
      date: schedule.date,
      shift_type: schedule.shift_type,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      break_start: schedule.break_start || '',
      break_end: schedule.break_end || '',
      status: schedule.status,
      notes: schedule.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (schedule) => {
    if (!confirm(`Tem certeza que deseja remover este horário?`)) {
      return
    }

    try {
      await ScheduleService.deleteSchedule(schedule.id)
      toast.success('Horário removido com sucesso!')
      loadSchedulesForDate()
      loadStats()
    } catch (error) {
      toast.error('Erro ao remover horário')
      console.error(error)
    }
  }

  const handleMarkAttendance = async (schedule, status) => {
    try {
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5)
      
      const attendanceData = {
        status: status,
        actual_start_time: status === 'completed' ? currentTime : null,
        actual_end_time: status === 'completed' ? currentTime : null,
        notes: `Marcado às ${currentTime}`
      }

      await ScheduleService.markAttendance(schedule.id, attendanceData)
      toast.success(`Presença marcada: ${status === 'completed' ? 'Presente' : 'Ausente'}`)
      loadSchedulesForDate()
      loadStats()
    } catch (error) {
      toast.error('Erro ao marcar presença')
      console.error(error)
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: '',
      date: selectedDate,
      shift_type: 'morning',
      start_time: '08:00',
      end_time: '17:00',
      break_start: '12:00',
      break_end: '13:00',
      status: 'scheduled',
      notes: ''
    })
    setEditingSchedule(null)
  }

  const getShiftLabel = (shift) => {
    const labels = {
      morning: 'Manhã',
      afternoon: 'Tarde',
      night: 'Noite',
      full: 'Integral'
    }
    return labels[shift] || shift
  }

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'text-yellow-400',
      completed: 'text-green-400',
      absent: 'text-red-400',
      late: 'text-orange-400'
    }
    return colors[status] || 'text-gray-400'
  }

  const getStatusLabel = (status) => {
    const labels = {
      scheduled: 'Agendado',
      completed: 'Presente',
      absent: 'Ausente',
      late: 'Atrasado'
    }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">📅 Gestão de Horários</h1>
            <p className="text-gray-400">Gerencie turnos e controle de presença</p>
          </div>
          <div className="flex space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-luxury"
            />
            <button
              onClick={() => setShowModal(true)}
              className="btn-luxury"
            >
              ➕ Novo Horário
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Semanal</p>
                <p className="text-2xl font-bold text-gold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Presentes</p>
                <p className="text-2xl font-bold text-green-400">{stats.byStatus.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-400/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Ausentes</p>
                <p className="text-2xl font-bold text-red-400">{stats.byStatus.absent}</p>
              </div>
              <div className="w-12 h-12 bg-red-400/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Funcionários</p>
                <p className="text-2xl font-bold text-neon-cyan">{stats.uniqueEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gold">
              Horários - {new Date(selectedDate).toLocaleDateString('pt-BR')}
            </h2>
            <div className="text-sm text-gray-400">
              {schedules.length} horário(s) agendado(s)
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Carregando horários...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Nenhum horário agendado para esta data</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-luxury"
              >
                Agendar Primeiro Horário
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gold">Funcionário</th>
                    <th className="text-left py-3 px-4 text-gold">Turno</th>
                    <th className="text-left py-3 px-4 text-gold">Horário</th>
                    <th className="text-left py-3 px-4 text-gold">Intervalo</th>
                    <th className="text-left py-3 px-4 text-gold">Status</th>
                    <th className="text-left py-3 px-4 text-gold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm">👤</span>
                          </div>
                          <span className="font-medium">{schedule.employee?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan rounded text-sm">
                          {getShiftLabel(schedule.shift_type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {schedule.start_time} - {schedule.end_time}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {schedule.break_start && schedule.break_end ? 
                          `${schedule.break_start} - ${schedule.break_end}` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${getStatusColor(schedule.status)}`}>
                          {getStatusLabel(schedule.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {schedule.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => handleMarkAttendance(schedule, 'completed')}
                                className="px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-xs"
                              >
                                ✅ Presente
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(schedule, 'absent')}
                                className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs"
                              >
                                ❌ Ausente
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan rounded hover:bg-neon-cyan/30 transition-colors text-xs"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(schedule)}
                            className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs"
                          >
                            🗑️ Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-gray rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gold">
                {editingSchedule ? 'Editar Horário' : 'Novo Horário'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Funcionário *
                </label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  className="input-luxury w-full"
                  required
                >
                  <option value="">Selecione um funcionário</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="input-luxury w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Turno
                </label>
                <select
                  value={formData.shift_type}
                  onChange={(e) => setFormData({...formData, shift_type: e.target.value})}
                  className="input-luxury w-full"
                >
                  <option value="morning">Manhã</option>
                  <option value="afternoon">Tarde</option>
                  <option value="night">Noite</option>
                  <option value="full">Integral</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Início
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="input-luxury w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Fim
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="input-luxury w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Intervalo Início
                  </label>
                  <input
                    type="time"
                    value={formData.break_start}
                    onChange={(e) => setFormData({...formData, break_start: e.target.value})}
                    className="input-luxury w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Intervalo Fim
                  </label>
                  <input
                    type="time"
                    value={formData.break_end}
                    onChange={(e) => setFormData({...formData, break_end: e.target.value})}
                    className="input-luxury w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="input-luxury w-full"
                >
                  <option value="scheduled">Agendado</option>
                  <option value="completed">Presente</option>
                  <option value="absent">Ausente</option>
                  <option value="late">Atrasado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input-luxury w-full"
                  rows="3"
                  placeholder="Observações sobre o horário..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-luxury"
                >
                  {editingSchedule ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleManagement
