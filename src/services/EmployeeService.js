import { supabase } from '../lib/supabase'

/**
 * Serviço para gestão de funcionários
 */
class EmployeeService {
  /**
   * Busca todos os funcionários
   */
  async getAllEmployees() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          phone,
          document,
          hire_date,
          salary,
          status,
          created_at,
          updated_at
        `)
        .neq('role', 'customer')
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar funcionários:', error)
      throw error
    }
  }

  /**
   * Busca funcionário por ID
   */
  async getEmployeeById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          phone,
          document,
          hire_date,
          salary,
          status,
          created_at,
          updated_at
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Erro ao buscar funcionário:', error)
      throw error
    }
  }

  /**
   * Cria novo funcionário
   */
  async createEmployee(employeeData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: employeeData.name,
          email: employeeData.email,
          role: employeeData.role,
          phone: employeeData.phone || null,
          document: employeeData.document || null,
          hire_date: employeeData.hire_date || new Date().toISOString().split('T')[0],
          salary: employeeData.salary || null,
          status: employeeData.status || 'active'
        }])
        .select()
        .single()

      if (error) throw error

      console.log('✅ Funcionário criado:', data)
      return data
    } catch (error) {
      console.error('❌ Erro ao criar funcionário:', error)
      throw error
    }
  }

  /**
   * Atualiza funcionário
   */
  async updateEmployee(id, employeeData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: employeeData.name,
          email: employeeData.email,
          role: employeeData.role,
          phone: employeeData.phone,
          document: employeeData.document,
          hire_date: employeeData.hire_date,
          salary: employeeData.salary,
          status: employeeData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Funcionário atualizado:', data)
      return data
    } catch (error) {
      console.error('❌ Erro ao atualizar funcionário:', error)
      throw error
    }
  }

  /**
   * Remove funcionário (soft delete)
   */
  async deleteEmployee(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Funcionário desativado:', data)
      return data
    } catch (error) {
      console.error('❌ Erro ao desativar funcionário:', error)
      throw error
    }
  }

  /**
   * Busca estatísticas dos funcionários
   */
  async getEmployeeStats() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, status')
        .neq('role', 'customer')

      if (error) throw error

      const stats = {
        total: data.length,
        active: data.filter(emp => emp.status === 'active').length,
        inactive: data.filter(emp => emp.status === 'inactive').length,
        byRole: {
          admin: data.filter(emp => emp.role === 'admin').length,
          staff: data.filter(emp => emp.role === 'staff').length,
          cashier: data.filter(emp => emp.role === 'cashier').length
        }
      }

      return stats
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error)
      throw error
    }
  }

  /**
   * Busca funcionários por role
   */
  async getEmployeesByRole(role) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          status,
          hire_date
        `)
        .eq('role', role)
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar funcionários por role:', error)
      throw error
    }
  }
}

export default new EmployeeService()
