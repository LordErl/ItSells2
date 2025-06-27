import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'  // ← IMPORT CORRETO
import Logo from '../components/common/Logo'
import PhotoUpload from '../components/PhotoUpload'
import { Eye, EyeOff, User, Mail, Camera, ArrowLeft } from 'lucide-react'
import anime from 'animejs'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    cpf: '',
    name: '',
    email: '',
    password: '',
    photo: null,
    photoUrl: null
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState(1) // 1: dados básicos, 2: dados opcionais, 3: foto
  
  // ← DESTRUCTURING CORRETO DO useAuth
  const { registerWithPhoto, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const formRef = useRef(null)
  const containerRef = useRef(null)

  // Debug: Verificar se registerWithPhoto está disponível
  useEffect(() => {
    console.log('RegisterPage: registerWithPhoto available?', typeof registerWithPhoto)
    if (typeof registerWithPhoto !== 'function') {
      console.error('RegisterPage: registerWithPhoto is not a function!')
    }
  }, [registerWithPhoto])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin' :
                          user.role === 'staff' ? '/staff' :
                          '/customer'
      navigate(redirectPath)
    }
  }, [isAuthenticated, user, navigate])

  // Animation on mount
  useEffect(() => {
    if (containerRef.current) {
      anime({
        targets: containerRef.current,
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutExpo'
      })
    }
  }, [])

  // Animation on step change
  useEffect(() => {
    if (formRef.current) {
      anime({
        targets: formRef.current.children,
        translateX: [30, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 600,
        easing: 'easeOutExpo'
      })
    }
  }, [step])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Format CPF input
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  // Handle CPF input
  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value)
    setFormData(prev => ({
      ...prev,
      cpf: formatted
    }))
  }

  // Handle photo selection
  const handlePhotoSelect = (file, url) => {
    console.log('Photo selected:', { file, url })
    setFormData(prev => ({
      ...prev,
      photo: file,
      photoUrl: url
    }))
  }

  // Validate CPF
  const validateCPF = (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, '')
    if (cleanCPF.length !== 11) return false
    
    // Basic CPF validation logic
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false
    
    return true
  }

  // Validate email
  const validateEmail = (email) => {
    if (!email) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle next step
  const handleNextStep = () => {
    setError('')
    
    if (step === 1) {
      // Validate required fields
      if (!formData.cpf || !formData.name) {
        setError('CPF e nome são obrigatórios')
        return
      }

      // Validate CPF format
      if (!validateCPF(formData.cpf)) {
        setError('CPF inválido')
        return
      }

      setStep(2)
    } else if (step === 2) {
      // Validate optional fields if provided
      if (formData.email && !validateEmail(formData.email)) {
        setError('Email inválido')
        return
      }

      if (formData.password && formData.password.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres')
        return
      }

      setStep(3)
    }
  }

  // Handle previous step
  const handlePrevStep = () => {
    setError('')
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // Verificar se registerWithPhoto está disponível
      if (typeof registerWithPhoto !== 'function') {
        throw new Error('Função de registro não está disponível. Recarregue a página.')
      }

      // Prepare data for registration
      const userData = {
        cpf: formData.cpf.replace(/\D/g, ''),
        name: formData.name.trim()
      }

      // Add optional fields if provided
      if (formData.email && formData.email.trim()) {
        userData.email = formData.email.trim()
      }

      if (formData.password && formData.password.trim()) {
        userData.password = formData.password.trim()
      }

      console.log('Registering user with data:', userData)
      console.log('Photo file:', formData.photo)

      // Register user
      const result = await registerWithPhoto(userData, formData.photo)
      
      console.log('Registration result:', result)
      
      if (result.success) {
        setSuccess('Conta criada com sucesso!')
        
        // Success animation
        anime({
          targets: formRef.current,
          scale: [1, 1.05, 1],
          duration: 600,
          easing: 'easeInOutQuad'
        })

        // Redirect to login with success message
        setTimeout(() => {
          navigate('/login?registered=true')
        }, 2000)
      } else {
        throw new Error(result.error || 'Erro ao criar conta')
      }

    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'Erro ao criar conta')
      
      // Error shake animation
      anime({
        targets: formRef.current,
        translateX: [-10, 10, -10, 10, 0],
        duration: 500,
        easing: 'easeInOutQuad'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div ref={containerRef} className="glass-panel w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center p-6 border-b border-gold/20">
          <div className="mb-4">
            <Logo size="lg" animated={true} />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            <span className="text-gold">It</span>
            <span className="text-green-400 text-3xl">$</span>
            <span className="text-gold">ell's</span>
          </h1>
          <p className="text-gold/80">Criar Nova Conta</p>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {[1, 2, 3].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  stepNum <= step 
                    ? 'bg-gold' 
                    : 'bg-gold/20'
                }`}
              />
            ))}
          </div>
          <p className="text-gold/60 text-xs mt-2">
            Passo {step} de 3
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} ref={formRef}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <User className="w-12 h-12 text-gold mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-gold">Dados Básicos</h3>
                  <p className="text-gold/60 text-sm">Informações obrigatórias</p>
                </div>

                {/* CPF Field */}
                <div>
                  <label className="block text-sm font-medium text-gold mb-2">
                    CPF *
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="luxury-input w-full"
                    required
                  />
                </div>

                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gold mb-2">
                    Nome Completo *
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

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn-luxury w-full"
                >
                  Continuar
                </button>
              </div>
            )}

            {/* Step 2: Optional Information */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Mail className="w-12 h-12 text-neon-cyan mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-gold">Dados Opcionais</h3>
                  <p className="text-gold/60 text-sm">Para recuperação e notificações</p>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gold mb-2">
                    Email (Opcional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="seu@email.com"
                    className="luxury-input w-full"
                  />
                  <p className="text-gold/60 text-xs mt-1">
                    Para recuperação de conta e notificações
                  </p>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gold mb-2">
                    Senha (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Mínimo 6 caracteres"
                      className="luxury-input w-full pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gold/60 hover:text-gold"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-gold/60 text-xs mt-1">
                    Ou use apenas reconhecimento facial
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="btn-luxury-outline flex-1"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="btn-luxury flex-1"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Photo */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Camera className="w-12 h-12 text-neon-pink mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-gold">Identificação Facial</h3>
                  <p className="text-gold/60 text-sm">Para reconhecimento futuro</p>
                </div>

                {/* Photo Upload */}
                <PhotoUpload
                  onPhotoSelect={handlePhotoSelect}
                  currentPhoto={formData.photoUrl}
                  label="Tire uma selfie ou escolha uma foto"
                />

                <p className="text-gold/60 text-xs text-center">
                  A foto é opcional, mas recomendada para usar o reconhecimento facial
                </p>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="btn-luxury-outline flex-1"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-luxury flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="luxury-spinner"></div>
                        <span>Criando...</span>
                      </>
                    ) : (
                      <span>Criar Conta</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="text-center mt-6 pt-6 border-t border-gold/20">
            <button
              onClick={() => navigate('/login')}
              className="text-gold/80 hover:text-gold text-sm underline flex items-center justify-center space-x-1 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Já tem conta? Fazer login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

