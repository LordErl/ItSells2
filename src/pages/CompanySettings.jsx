import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { CompanyService } from '../services/companyService'
import { useAuth } from '../contexts/AuthContext'

export default function CompanySettings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_document: '',
    address_street: '',
    address_number: '',
    address_district: '',
    address_city: '',
    address_state: '',
    address_complement: '',
    address_zip_code: '',
    pix_enabled: true,
    card_enabled: true,
    cash_enabled: true
  })

  // Debug: Verificar autenticação e role
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/unauthorized')
    }
  }, [user, navigate])

  // Verificar se é admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Carregar dados da empresa
  useEffect(() => {
    loadCompanyData()
  }, [])

  const loadCompanyData = async () => {
    try {
      setLoading(true)
      const data = await CompanyService.getCompanyData()
      setFormData(data)
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error)
      toast.error('Erro ao carregar dados da empresa')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      await CompanyService.saveCompanyData(formData)
      toast.success('Dados da empresa salvos com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error)
      toast.error('Erro ao salvar dados da empresa')
    } finally {
      setSaving(false)
    }
  }

  const formatPhone = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica máscara +55 (11) 99999-9999
    if (numbers.length <= 2) return `+${numbers}`
    if (numbers.length <= 4) return `+${numbers.slice(0, 2)} (${numbers.slice(2)}`
    if (numbers.length <= 6) return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 10) return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9)}`
    return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`
  }

  const formatCEP = (value) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const formatDocument = (value) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-white mt-4">Carregando dados da empresa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Configurações da Empresa</h1>
            <p className="text-black/80 mt-1">Dados utilizados para pagamentos PIX</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-black/20 hover:bg-black/30 text-black px-4 py-2 rounded-lg transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados da Empresa */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
              🏢 Dados da Empresa
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome da Empresa</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">E-mail</label>
                <input
                  type="email"
                  name="company_email"
                  value={formData.company_email}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Telefone</label>
                <input
                  type="text"
                  name="company_phone"
                  value={formatPhone(formData.company_phone)}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_phone: e.target.value.replace(/\D/g, '') }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-400 focus:outline-none"
                  placeholder="+55 (11) 99999-9999"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">CPF/CNPJ</label>
                <input
                  type="text"
                  name="company_document"
                  value={formatDocument(formData.company_document)}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_document: e.target.value.replace(/\D/g, '') }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-400 focus:outline-none"
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
              📍 Endereço
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Rua</label>
                <input
                  type="text"
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Número</label>
                <input
                  type="text"
                  name="address_number"
                  value={formData.address_number}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Bairro</label>
                <input
                  type="text"
                  name="address_district"
                  value={formData.address_district}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Cidade</label>
                <input
                  type="text"
                  name="address_city"
                  value={formData.address_city}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <select
                  name="address_state"
                  value={formData.address_state}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-400 focus:outline-none"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">CEP</label>
                <input
                  type="text"
                  name="address_zip_code"
                  value={formatCEP(formData.address_zip_code)}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_zip_code: e.target.value.replace(/\D/g, '') }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-400 focus:outline-none"
                  placeholder="00000-000"
                  required
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium mb-2">Complemento</label>
                <input
                  type="text"
                  name="address_complement"
                  value={formData.address_complement}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-yellow-400 focus:outline-none"
                  placeholder="Apartamento, sala, etc."
                />
              </div>
            </div>
          </div>

          {/* Métodos de Pagamento */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
              💳 Métodos de Pagamento
            </h2>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="pix_enabled"
                  checked={formData.pix_enabled}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                />
                <span>PIX habilitado</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="card_enabled"
                  checked={formData.card_enabled}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                />
                <span>Cartão de crédito habilitado</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="cash_enabled"
                  checked={formData.cash_enabled}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                />
                <span>Dinheiro habilitado</span>
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
