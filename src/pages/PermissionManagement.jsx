import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import EmployeeService from '../services/EmployeeService'
import { USER_ROLES } from '../lib/constants'

const PermissionManagement = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Definição de permissões por módulo
  const permissionModules = {
    dashboard: {
      name: 'Dashboard',
      icon: '📊',
      permissions: [
        { key: 'view_stats', label: 'Ver Estatísticas', description: 'Visualizar cards de estatísticas do dashboard' },
        { key: 'view_sales', label: 'Ver Vendas', description: 'Visualizar dados de vendas e faturamento' },
        { key: 'view_reports', label: 'Ver Relatórios', description: 'Acessar relatórios gerenciais' }
      ]
    },
    products: {
      name: 'Produtos',
      icon: '🍽️',
      permissions: [
        { key: 'view_products', label: 'Ver Produtos', description: 'Visualizar lista de produtos' },
        { key: 'create_products', label: 'Criar Produtos', description: 'Adicionar novos produtos' },
        { key: 'edit_products', label: 'Editar Produtos', description: 'Modificar produtos existentes' },
        { key: 'delete_products', label: 'Excluir Produtos', description: 'Remover produtos do sistema' }
      ]
    },
    orders: {
      name: 'Pedidos',
      icon: '📋',
      permissions: [
        { key: 'view_orders', label: 'Ver Pedidos', description: 'Visualizar pedidos dos clientes' },
        { key: 'manage_orders', label: 'Gerenciar Pedidos', description: 'Alterar status e gerenciar pedidos' },
        { key: 'cancel_orders', label: 'Cancelar Pedidos', description: 'Cancelar pedidos de clientes' }
      ]
    },
    inventory: {
      name: 'Estoque',
      icon: '📦',
      permissions: [
        { key: 'view_inventory', label: 'Ver Estoque', description: 'Visualizar níveis de estoque' },
        { key: 'manage_inventory', label: 'Gerenciar Estoque', description: 'Adicionar/remover itens do estoque' },
        { key: 'view_expiration', label: 'Ver Vencimentos', description: 'Visualizar itens próximos ao vencimento' },
        { key: 'manage_batches', label: 'Gerenciar Lotes', description: 'Controlar lotes de produtos' }
      ]
    },
    employees: {
      name: 'Funcionários',
      icon: '👥',
      permissions: [
        { key: 'view_employees', label: 'Ver Funcionários', description: 'Visualizar lista de funcionários' },
        { key: 'create_employees', label: 'Criar Funcionários', description: 'Adicionar novos funcionários' },
        { key: 'edit_employees', label: 'Editar Funcionários', description: 'Modificar dados de funcionários' },
        { key: 'delete_employees', label: 'Excluir Funcionários', description: 'Remover funcionários do sistema' },
        { key: 'manage_schedules', label: 'Gerenciar Horários', description: 'Controlar horários e turnos' },
        { key: 'manage_permissions', label: 'Gerenciar Permissões', description: 'Alterar permissões de usuários' }
      ]
    },
    financial: {
      name: 'Financeiro',
      icon: '💰',
      permissions: [
        { key: 'view_financial', label: 'Ver Financeiro', description: 'Visualizar dados financeiros' },
        { key: 'manage_payments', label: 'Gerenciar Pagamentos', description: 'Processar pagamentos e cobranças' },
        { key: 'view_daily_reports', label: 'Relatórios Diários', description: 'Acessar relatórios diários' },
        { key: 'manage_cashier', label: 'Gerenciar Caixa', description: 'Controlar operações de caixa' }
      ]
    },
    settings: {
      name: 'Configurações',
      icon: '⚙️',
      permissions: [
        { key: 'view_settings', label: 'Ver Configurações', description: 'Visualizar configurações do sistema' },
        { key: 'edit_company', label: 'Editar Empresa', description: 'Modificar dados da empresa' },
        { key: 'manage_system', label: 'Gerenciar Sistema', description: 'Configurações avançadas do sistema' }
      ]
    }
  }

  // Permissões padrão por role
  const defaultPermissions = {
    admin: Object.values(permissionModules).flatMap(module => 
      module.permissions.map(p => p.key)
    ),
    staff: [
      'view_stats', 'view_products', 'create_products', 'edit_products',
      'view_orders', 'manage_orders', 'view_inventory', 'manage_inventory',
      'view_expiration', 'manage_batches'
    ],
    cashier: [
      'view_stats', 'view_products', 'view_orders', 'manage_orders',
      'view_financial', 'manage_payments', 'manage_cashier'
    ]
  }

  const [employeePermissions, setEmployeePermissions] = useState({})

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await EmployeeService.getAllEmployees()
      setEmployees(data.filter(emp => emp.role !== 'customer'))
      
      // Inicializar permissões baseadas no role
      const permissions = {}
      data.forEach(emp => {
        if (emp.role !== 'customer') {
          permissions[emp.id] = emp.custom_permissions || defaultPermissions[emp.role] || []
        }
      })
      setEmployeePermissions(permissions)
    } catch (error) {
      toast.error('Erro ao carregar funcionários')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee)
    setShowModal(true)
  }

  const handlePermissionToggle = (employeeId, permissionKey) => {
    setEmployeePermissions(prev => {
      const currentPermissions = prev[employeeId] || []
      const hasPermission = currentPermissions.includes(permissionKey)
      
      const newPermissions = hasPermission
        ? currentPermissions.filter(p => p !== permissionKey)
        : [...currentPermissions, permissionKey]
      
      return {
        ...prev,
        [employeeId]: newPermissions
      }
    })
  }

  const handleSavePermissions = async () => {
    if (!selectedEmployee) return

    try {
      const permissions = employeePermissions[selectedEmployee.id] || []
      
      await EmployeeService.updateEmployee(selectedEmployee.id, {
        custom_permissions: permissions
      })

      toast.success('Permissões atualizadas com sucesso!')
      setShowModal(false)
      setSelectedEmployee(null)
    } catch (error) {
      toast.error('Erro ao salvar permissões')
      console.error(error)
    }
  }

  const handleResetToDefault = () => {
    if (!selectedEmployee) return
    
    const defaultPerms = defaultPermissions[selectedEmployee.role] || []
    setEmployeePermissions(prev => ({
      ...prev,
      [selectedEmployee.id]: [...defaultPerms]
    }))
    
    toast.success('Permissões resetadas para o padrão do cargo')
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      staff: 'Funcionário',
      cashier: 'Caixa'
    }
    return labels[role] || role
  }

  const getRoleColor = (role) => {
    const colors = {
      admin: 'text-neon-purple',
      staff: 'text-neon-cyan',
      cashier: 'text-gold'
    }
    return colors[role] || 'text-gray-400'
  }

  const getPermissionCount = (employeeId) => {
    return employeePermissions[employeeId]?.length || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-gold text-xl">Carregando permissões...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">🔐 Gestão de Permissões</h1>
            <p className="text-gray-400">Controle o acesso às funcionalidades do sistema</p>
          </div>
        </div>

        {/* Employees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <div key={employee.id} className="glass-card p-6 hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{employee.name}</h3>
                    <p className="text-gray-400 text-sm">{employee.email}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Cargo:</span>
                  <span className={`font-medium ${getRoleColor(employee.role)}`}>
                    {getRoleLabel(employee.role)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Permissões:</span>
                  <span className="text-gold font-bold">
                    {getPermissionCount(employee.id)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleEmployeeSelect(employee)}
                className="w-full btn-luxury text-sm"
              >
                🔧 Gerenciar Permissões
              </button>
            </div>
          ))}
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">Nenhum funcionário encontrado</p>
            <p className="text-gray-500">Cadastre funcionários para gerenciar suas permissões</p>
          </div>
        )}
      </div>

      {/* Permission Modal */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-gray rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gold">
                  Permissões - {selectedEmployee.name}
                </h3>
                <p className="text-gray-400">
                  {getRoleLabel(selectedEmployee.role)} • {selectedEmployee.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedEmployee(null)
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 flex space-x-4">
              <button
                onClick={handleResetToDefault}
                className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors"
              >
                🔄 Resetar para Padrão
              </button>
              <div className="text-sm text-gray-400 flex items-center">
                Total de permissões: <span className="text-gold ml-2 font-bold">
                  {getPermissionCount(selectedEmployee.id)}
                </span>
              </div>
            </div>

            {/* Permission Modules */}
            <div className="space-y-6">
              {Object.entries(permissionModules).map(([moduleKey, module]) => (
                <div key={moduleKey} className="glass-card p-4">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">{module.icon}</span>
                    <h4 className="text-xl font-bold text-gold">{module.name}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {module.permissions.map((permission) => {
                      const isChecked = employeePermissions[selectedEmployee.id]?.includes(permission.key) || false
                      
                      return (
                        <div
                          key={permission.key}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isChecked 
                              ? 'border-gold bg-gold/10' 
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                          onClick={() => handlePermissionToggle(selectedEmployee.id, permission.key)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="mr-3 accent-gold"
                                />
                                <span className="font-medium">{permission.label}</span>
                              </div>
                              <p className="text-sm text-gray-400 mt-1 ml-6">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedEmployee(null)
                }}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermissions}
                className="flex-1 btn-luxury py-3"
              >
                💾 Salvar Permissões
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PermissionManagement
