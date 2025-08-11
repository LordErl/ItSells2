import { supabase } from '../lib/supabase'

export class CompanyService {
  /**
   * Busca dados da empresa para pagamentos PIX
   */
  static async getCompanyData() {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      // Retorna dados padrão se não houver cadastro
      return data || {
        company_name: 'ItSells Restaurante',
        company_email: 'contato@itsells.com',
        company_phone: '+5511999999999',
        company_document: '12345678000100',
        address_street: 'Rua Principal',
        address_number: '123',
        address_district: 'Centro',
        address_city: 'São Paulo',
        address_state: 'SP',
        address_complement: '',
        address_zip_code: '01000000'
      }
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error)
      throw error
    }
  }

  /**
   * Salva ou atualiza dados da empresa
   */
  static async saveCompanyData(companyData) {
    try {
      // Verifica se já existe um registro
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .single()

      let result
      if (existing) {
        // Atualiza registro existente
        result = await supabase
          .from('company_settings')
          .update({
            ...companyData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single()
      } else {
        // Cria novo registro
        result = await supabase
          .from('company_settings')
          .insert({
            ...companyData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
      }

      if (result.error) {
        throw result.error
      }

      return result.data
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error)
      throw error
    }
  }

  /**
   * Formata dados da empresa para payload PIX
   */
  static formatForPixPayment(companyData, customerData) {
    return {
      // Dados do cliente (obrigatórios)
      nome: customerData.customerName,
      email: customerData.customerEmail || companyData.company_email,
      documento: customerData.customerDocument.replace(/\D/g, ''),
      telefone: customerData.customerPhone || companyData.company_phone,
      
      // Endereço da empresa (usado como padrão)
      endereco: {
        street: companyData.address_street,
        number: companyData.address_number,
        district: companyData.address_district,
        city: companyData.address_city,
        state: companyData.address_state,
        complement: companyData.address_complement || '',
        zip_code: companyData.address_zip_code.replace(/\D/g, '')
      },
      
      // Dados do pagamento
      amount: Math.round(customerData.amount * 100),
      descricao: `Pagamento Mesa ${customerData.tableNumber} - ${companyData.company_name}`,
      referencia: customerData.reference,
      vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tipo: "pix",
      
      // Notificações (opcionais)
      notification_name: null,
      notification_email: null,
      notification_sms: null
    }
  }
}
