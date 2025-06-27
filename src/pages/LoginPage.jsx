import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/common/Logo'
import anime from 'animejs'
import PhotoUpload from '../components/PhotoUpload'


export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState('credentials') // 'credentials', 'face', 'register'
  const [formData, setFormData] = useState({
    cpf: '',
    password: '',
    name: '',
    photo: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginWithCredentials, loginWithFace, registerCustomer, isAuthenticated, user } = useAuth()
  
  const containerRef = useRef(null)
  const formRef = useRef(null)

  // Get table ID from URL params if coming from QR scan
  const tableId = searchParams.get('table')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin' :
                          user.role === 'staff' ? '/staff' :
                          '/customer'
      navigate(redirectPath)
    }
  }, [isAuthenticated, user, navigate])

  // Animate entrance
  useEffect(() => {
    if (containerRef.current) {
      anime({
        targets: containerRef.current,
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutCubic'
      })
    }
  }, [])

  // Animate form transitions
  useEffect(() => {
    if (formRef.current) {
      anime({
        targets: formRef.current,
        scale: [0.95, 1],
        opacity: [0.8, 1],
        duration: 400,
        easing: 'easeOutCubic'
      })
    }
  }, [loginMethod])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const formatCPF = (value) => {
    // Remove non-numeric characters
    const numbers = value.replace(/\D/g, '')
    
    // Apply CPF mask: 000.000.000-00
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    
    return value
  }

  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value)
    setFormData(prev => ({
      ...prev,
      cpf: formatted
    }))
  }

  const handleCredentialsLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const cpfNumbers = formData.cpf.replace(/\D/g, '')
      const result = await loginWithCredentials(cpfNumbers, formData.password)
      
      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setError('Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleFaceLogin = async () => {
    setLoading(true)
    setError('')

    try {
      // Mock face data for now
      const faceData = { mockFace: true }
      const result = await loginWithFace(faceData)
      
      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setError('Erro no reconhecimento facial. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const cpfNumbers = formData.cpf.replace(/\D/g, '')
      const result = await registerCustomer({
        cpf: cpfNumbers,
        name: formData.name,
        photo: formData.photo
      })
      
      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setError('Erro no cadastro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center animated-bg p-4">
      <div ref={containerRef} className="glass-card p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Logo size="lg" animated={true} />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            <span className="text-gold">It</span>
            <span className="text-green-400 text-3xl">$</span>
            <span className="text-gold">ell's</span>
          </h1>
          <p className="text-gold/80 text-sm">
            {tableId ? `Mesa ${tableId} - Faça seu login` : 'Acesse sua conta'}
          </p>
        </div>

        {/* Login Method Selector */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setLoginMethod('credentials')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              loginMethod === 'credentials'
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'bg-black/20 text-gold/60 border border-gold/10 hover:border-gold/20'
            }`}
          >
            CPF + Senha
          </button>
          <button
            onClick={() => setLoginMethod('face')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              loginMethod === 'face'
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : 'bg-black/20 text-gold/60 border border-gold/10 hover:border-gold/20'
            }`}
          >
            Reconhecimento Facial
          </button>
          <button
            onClick={() => setLoginMethod('register')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              loginMethod === 'register'
                ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'
                : 'bg-black/20 text-gold/60 border border-gold/10 hover:border-gold/20'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Forms */}
        <div ref={formRef}>
          {/* Credentials Login */}
          {loginMethod === 'credentials' && (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-gold text-sm font-medium mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  className="luxury-input w-full"
                  maxLength="14"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gold text-sm font-medium mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Digite sua senha"
                  className="luxury-input w-full"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-luxury"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {/* Face Recognition */}
          {loginMethod === 'face' && (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto rounded-full border-2 border-neon-cyan/30 flex items-center justify-center bg-neon-cyan/10">
                <svg className="w-16 h-16 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              
              <p className="text-neon-cyan text-sm">
                Posicione seu rosto na câmera
              </p>
              
              <button
                onClick={handleFaceLogin}
                disabled={loading}
                className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform bg-gradient-to-r from-neon-cyan to-neon-cyan/80 text-black hover:scale-105"
              >
                {loading ? 'Reconhecendo...' : 'Iniciar Reconhecimento'}
              </button>
            </div>
          )}

          {/* Customer Registration */}
          {loginMethod === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-gold text-sm font-medium mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  className="luxury-input w-full"
                  maxLength="14"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gold text-sm font-medium mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Digite seu nome completo"
                  className="luxury-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-gold text-sm font-medium mb-2">
                  Identificação Facial
                </label>
                <PhotoUpload
                  onPhotoSelect={(file, url) => {
                    setFormData(prev => ({
                      ...prev,
                      photo: file,
                      photoUrl: url
                    }))
                  }}
                  currentPhoto={formData.photoUrl}
                  label="Upload Identificação Facial"
                />
                <p className="text-gold/60 text-xs mt-1">
                  Para reconhecimento facial futuro
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform bg-gradient-to-r from-neon-pink to-neon-pink/80 text-black hover:scale-105"
              >
                {loading ? 'Cadastrando...' : 'Criar Conta'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gold/60 hover:text-gold text-sm transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  )
}
