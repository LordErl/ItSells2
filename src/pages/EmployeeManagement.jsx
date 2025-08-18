import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import EmployeeService from '../services/EmployeeService'
import { USER_ROLES } from '../lib/constants'

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: { admin: 0, staff: 0, cashier: 0 }
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff',
    phone: '',
    document: '',
    hire_date: new Date().toISOString().split('T')[0],
    salary: '',
    status: 'active'
  })

  useEffect(() => {
    loadEmployees()
    loadStats()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await EmployeeService.getAllEmployees()
      setEmployees(data)
    } catch (error) {
      toast.error('Erro ao carregar funcionários')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await EmployeeService.getEmployeeStats()
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios')
      return
    }

    try {
      if (editingEmployee) {
        await EmployeeService.updateEmployee(editingEmployee.id, formData)
        toast.success('Funcionário atualizado com sucesso!')
      } else {
        await EmployeeService.createEmployee(formData)
        toast.success('Funcionário criado com sucesso!')
      }
      
      setShowModal(false)
      resetForm()
      loadEmployees()
      loadStats()
    } catch (error) {
      toast.error('Erro ao salvar funcionário')
      console.error(error)
    }
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name || '',
      email: employee.email || '',
      role: employee.role || 'staff',
      phone: employee.phone || '',
      document: employee.document || '',
      hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
      salary: employee.salary || '',
      status: employee.status || 'active'
    })
    setShowModal(true)
  }

  const handleDelete = async (employee) => {
    if (!confirm(`Tem certeza que deseja desativar ${employee.name}?`)) {
      return
    }

    try {
      await EmployeeService.deleteEmployee(employee.id)
      toast.success('Funcionário desativado com sucesso!')
      loadEmployees()
      loadStats()
    } catch (error) {
      toast.error('Erro ao desativar funcionário')
      console.error(error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'staff',
      phone: '',
      document: '',
      hire_date: new Date().toISOString().split('T')[0],
      salary: '',
      status: 'active'
    })
    setEditingEmployee(null)
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      staff: 'Funcionário',
      cashier: 'Caixa'
    }
    return labels[role] || role
  }

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-400' : 'text-red-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gold text-xl">Carregando funcionários...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">👥 Gestão de Funcionários</h1>
            <p className="text-gray-400">Gerencie sua equipe e permissões</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-luxury"
          >
            ➕ Novo Funcionário
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-gold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Ativos</p>
                <p className="text-2xl font-bold text-green-400">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-400/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Administradores</p>
                <p className="text-2xl font-bold text-neon-purple">{stats.byRole.admin}</p>
              </div>
              <div className="w-12 h-12 bg-neon-purple/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Funcionários</p>
                <p className="text-2xl font-bold text-neon-cyan">{stats.byRole.staff + stats.byRole.cashier}</p>
              </div>
              <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍💼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee List */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-gold mb-4">Lista de Funcionários</h2>
          
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Nenhum funcionário cadastrado</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-luxury"
              >
                Cadastrar Primeiro Funcionário
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gold">Nome</th>
                    <th className="text-left py-3 px-4 text-gold">Email</th>
                    <th className="text-left py-3 px-4 text-gold">Cargo</th>
                    <th className="text-left py-3 px-4 text-gold">Telefone</th>
                    <th className="text-left py-3 px-4 text-gold">Status</th>
                    <th className="text-left py-3 px-4 text-gold">Contratação</th>
                    <th className="text-left py-3 px-4 text-gold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm">👤</span>
                          </div>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{employee.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan rounded text-sm">
                          {getRoleLabel(employee.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{employee.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${getStatusColor(employee.status)}`}>
                          {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="px-3 py-1 bg-neon-cyan/20 text-neon-cyan rounded hover:bg-neon-cyan/30 transition-colors text-sm"
                          >
                            ✏️ Editar
                          </button>
                          {employee.status === 'active' && (
                            <button
                              onClick={() => handleDelete(employee)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                            >
                              🚫 Desativar
                            </button>
                          )}
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
                {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
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
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-luxury w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-luxury w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Cargo
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="input-luxury w-full"
                >
                  <option value="staff">Funcionário</option>
                  <option value="cashier">Caixa</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="input-luxury w-full"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={formData.document}
                  onChange={(e) => setFormData({...formData, document: e.target.value})}
                  className="input-luxury w-full"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Data de Contratação
                </label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  className="input-luxury w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Salário
                </label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  className="input-luxury w-full"
                  placeholder="0.00"
                  step="0.01"
                />
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
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
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
                  {editingEmployee ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeManagement
