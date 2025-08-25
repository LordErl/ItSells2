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
          cpf,
          active,
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
          cpf,
          active,
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
          cpf: employeeData.cpf || null,
          password: employeeData.password || 'temp123',
          active: employeeData.active !== undefined ? employeeData.active : true
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
          cpf: employeeData.cpf,
          active: employeeData.active,
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
          active: false,
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
        .select('role, active')
        .neq('role', 'customer')

      if (error) throw error

      const stats = {
        total: data.length,
        active: data.filter(emp => emp.active === true).length,
        inactive: data.filter(emp => emp.active === false).length,
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
          cpf,
          active,
          created_at
        `)
        .eq('role', role)
        .eq('active', true)
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
